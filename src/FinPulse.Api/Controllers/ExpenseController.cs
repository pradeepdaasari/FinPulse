using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/expenses")]
[Authorize]
public class ExpenseController : ControllerBase
{
    private readonly FinPulseDbContext _db;

    public ExpenseController(FinPulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<object>>> GetExpenses([FromQuery] int? year, [FromQuery] int? month)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;
        var startDate = new DateTime(targetYear, targetMonth, 1);
        var endDate = startDate.AddMonths(1);

        var expenses = await _db.DailyExpenses
            .Include(e => e.Category)
            .ThenInclude(c => c.Parent)
            .Where(e => e.UserId == UserId && e.Date >= startDate && e.Date < endDate)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();

        var bankAccountIds = expenses
            .Where(e => e.FundingSourceType == FundingSourceType.BankAccount && e.FundingSourceId.HasValue)
            .Select(e => e.FundingSourceId!.Value)
            .Union(expenses.Where(e => e.ToFundingSourceId.HasValue).Select(e => e.ToFundingSourceId!.Value))
            .Distinct();
        var creditCardIds = expenses.Where(e => e.FundingSourceType == FundingSourceType.CreditCard && e.FundingSourceId.HasValue).Select(e => e.FundingSourceId!.Value).Distinct();

        var bankNames = await _db.BankAccounts.Where(a => bankAccountIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id, a => a.AccountName);
        var cardNames = await _db.CreditCards.Where(c => creditCardIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, c => c.CardName);

        var result = expenses.Select(e => new
        {
            e.Id,
            e.Date,
            e.CategoryId,
            CategoryName = e.Category.Name,
            CategoryIcon = e.Category.Icon,
            ParentCategoryName = e.Category.Parent?.Name,
            e.Amount,
            e.Description,
            e.Merchant,
            TransactionType = e.TransactionType?.ToString(),
            FundingSourceType = e.FundingSourceType?.ToString(),
            e.FundingSourceId,
            FundingSourceName = ResolveFundingSourceName(e, bankNames, cardNames),
            e.ToFundingSourceId,
            ToFundingSourceName = e.ToFundingSourceId.HasValue ? bankNames.GetValueOrDefault(e.ToFundingSourceId.Value) : null,
            e.CreatedAt,
            e.UpdatedAt
        });

        return Ok(result);
    }

    private static string? ResolveFundingSourceName(DailyExpense e, Dictionary<int, string> bankNames, Dictionary<int, string> cardNames)
    {
        if (e.FundingSourceType == null || e.FundingSourceId == null) return null;
        return e.FundingSourceType switch
        {
            FundingSourceType.BankAccount => bankNames.GetValueOrDefault(e.FundingSourceId.Value),
            FundingSourceType.CreditCard => cardNames.GetValueOrDefault(e.FundingSourceId.Value),
            _ => null
        };
    }

    [HttpGet("summary")]
    public async Task<ActionResult<List<SpendingSummaryDto>>> GetSummary([FromQuery] int? year, [FromQuery] int? month)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;
        var startDate = new DateTime(targetYear, targetMonth, 1);
        var endDate = startDate.AddMonths(1);

        var dailyExpenses = await _db.DailyExpenses
            .Include(e => e.Category)
            .Where(e => e.UserId == UserId && e.Date >= startDate && e.Date < endDate && e.TransactionType != TransactionType.Income && e.TransactionType != TransactionType.Transfer)
            .ToListAsync();

        var budgets = await _db.BudgetExpenses
            .Include(e => e.Category)
            .Where(e => e.UserId == UserId && !e.IsFixed)
            .ToListAsync();

        var summaries = new List<SpendingSummaryDto>();

        foreach (var budget in budgets)
        {
            var categorySpent = dailyExpenses
                .Where(e => e.CategoryId == budget.CategoryId)
                .Sum(e => e.Amount);

            summaries.Add(new SpendingSummaryDto
            {
                CategoryId = budget.CategoryId,
                CategoryName = budget.Category?.Name ?? budget.Name,
                CategoryIcon = budget.Category?.Icon,
                Budgeted = budget.Amount,
                Spent = categorySpent,
                Remaining = budget.Amount - categorySpent,
                PercentUsed = budget.Amount > 0 ? Math.Round(categorySpent / budget.Amount * 100, 1) : 0
            });
        }

        // Add categories that have spending but no budget
        var budgetedCategoryIds = budgets.Select(b => b.CategoryId).ToHashSet();
        var unbudgeted = dailyExpenses
            .Where(e => !budgetedCategoryIds.Contains(e.CategoryId))
            .GroupBy(e => e.CategoryId);

        foreach (var group in unbudgeted)
        {
            summaries.Add(new SpendingSummaryDto
            {
                CategoryId = group.Key,
                CategoryName = group.First().Category?.Name ?? "Unknown",
                CategoryIcon = group.First().Category?.Icon,
                Budgeted = 0,
                Spent = group.Sum(e => e.Amount),
                Remaining = -group.Sum(e => e.Amount),
                PercentUsed = 100
            });
        }

        return Ok(summaries.OrderByDescending(s => s.PercentUsed).ToList());
    }

    [HttpPost]
    public async Task<ActionResult> Create(DailyExpenseCreateDto dto)
    {
        if (dto.FundingSourceType.HasValue && dto.FundingSourceId.HasValue)
        {
            var valid = await ValidateFundingSource(dto.FundingSourceType.Value, dto.FundingSourceId.Value);
            if (!valid) return BadRequest(new { message = "Invalid funding source." });
        }

        if (dto.TransactionType == TransactionType.Income && dto.FundingSourceType == FundingSourceType.CreditCard)
            return BadRequest(new { message = "Income cannot be received into a credit card." });

        if (dto.TransactionType == TransactionType.Transfer)
        {
            if (dto.FundingSourceId == null || dto.ToFundingSourceId == null)
                return BadRequest(new { message = "Transfer requires both source and destination accounts." });
            if (dto.FundingSourceType != FundingSourceType.BankAccount)
                return BadRequest(new { message = "Transfers are only between bank accounts." });
            var destValid = await _db.BankAccounts.AnyAsync(a => a.Id == dto.ToFundingSourceId && a.UserId == UserId);
            if (!destValid) return BadRequest(new { message = "Invalid destination account." });
        }

        var expense = new DailyExpense
        {
            Date = dto.Date,
            CategoryId = dto.CategoryId,
            Amount = dto.Amount,
            Description = dto.Description,
            Merchant = dto.Merchant,
            TransactionType = dto.TransactionType,
            FundingSourceType = dto.FundingSourceType,
            FundingSourceId = dto.FundingSourceId,
            ToFundingSourceId = dto.ToFundingSourceId,
            UserId = UserId
        };

        _db.DailyExpenses.Add(expense);

        if (dto.TransactionType == TransactionType.Transfer)
            await AdjustTransfer(dto.FundingSourceId!.Value, dto.ToFundingSourceId!.Value, dto.Amount);
        else
            await AdjustBalance(dto.TransactionType, dto.FundingSourceType, dto.FundingSourceId, dto.Amount);

        await _db.SaveChangesAsync();

        var created = await _db.DailyExpenses
            .Include(e => e.Category).ThenInclude(c => c.Parent)
            .FirstAsync(e => e.Id == expense.Id);

        return Ok(new
        {
            created.Id,
            created.Date,
            created.CategoryId,
            CategoryName = created.Category.Name,
            ParentCategoryName = created.Category.Parent?.Name,
            created.Amount,
            created.Description,
            created.Merchant,
            TransactionType = created.TransactionType?.ToString(),
            FundingSourceType = created.FundingSourceType?.ToString(),
            created.FundingSourceId,
            created.ToFundingSourceId,
            created.CreatedAt,
            created.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, DailyExpenseCreateDto dto)
    {
        var expense = await _db.DailyExpenses.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (expense is null) return NotFound();

        if (dto.FundingSourceType.HasValue && dto.FundingSourceId.HasValue)
        {
            var valid = await ValidateFundingSource(dto.FundingSourceType.Value, dto.FundingSourceId.Value);
            if (!valid) return BadRequest(new { message = "Invalid funding source." });
        }

        if (dto.TransactionType == TransactionType.Income && dto.FundingSourceType == FundingSourceType.CreditCard)
            return BadRequest(new { message = "Income cannot be received into a credit card." });

        // Reverse old balance adjustment
        if (expense.TransactionType == TransactionType.Transfer && expense.FundingSourceId.HasValue && expense.ToFundingSourceId.HasValue)
            await ReverseTransfer(expense.FundingSourceId.Value, expense.ToFundingSourceId.Value, expense.Amount);
        else
            await ReverseBalance(expense.TransactionType, expense.FundingSourceType, expense.FundingSourceId, expense.Amount);

        expense.Date = dto.Date;
        expense.CategoryId = dto.CategoryId;
        expense.Amount = dto.Amount;
        expense.Description = dto.Description;
        expense.Merchant = dto.Merchant;
        expense.TransactionType = dto.TransactionType;
        expense.FundingSourceType = dto.FundingSourceType;
        expense.FundingSourceId = dto.FundingSourceId;
        expense.ToFundingSourceId = dto.ToFundingSourceId;

        // Apply new balance adjustment
        if (dto.TransactionType == TransactionType.Transfer && dto.FundingSourceId.HasValue && dto.ToFundingSourceId.HasValue)
            await AdjustTransfer(dto.FundingSourceId.Value, dto.ToFundingSourceId.Value, dto.Amount);
        else
            await AdjustBalance(dto.TransactionType, dto.FundingSourceType, dto.FundingSourceId, dto.Amount);

        await _db.SaveChangesAsync();

        var updated = await _db.DailyExpenses
            .Include(e => e.Category).ThenInclude(c => c.Parent)
            .FirstAsync(e => e.Id == expense.Id);

        return Ok(new
        {
            updated.Id,
            updated.Date,
            updated.CategoryId,
            CategoryName = updated.Category.Name,
            ParentCategoryName = updated.Category.Parent?.Name,
            updated.Amount,
            updated.Description,
            updated.Merchant,
            TransactionType = updated.TransactionType?.ToString(),
            FundingSourceType = updated.FundingSourceType?.ToString(),
            updated.FundingSourceId,
            updated.ToFundingSourceId,
            updated.CreatedAt,
            updated.UpdatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var expense = await _db.DailyExpenses.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (expense is null) return NotFound();

        if (expense.TransactionType == TransactionType.Transfer && expense.FundingSourceId.HasValue && expense.ToFundingSourceId.HasValue)
            await ReverseTransfer(expense.FundingSourceId.Value, expense.ToFundingSourceId.Value, expense.Amount);
        else
            await ReverseBalance(expense.TransactionType, expense.FundingSourceType, expense.FundingSourceId, expense.Amount);

        _db.DailyExpenses.Remove(expense);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<bool> ValidateFundingSource(FundingSourceType type, int id)
    {
        return type switch
        {
            FundingSourceType.BankAccount => await _db.BankAccounts.AnyAsync(a => a.Id == id && a.UserId == UserId),
            FundingSourceType.CreditCard => await _db.CreditCards.AnyAsync(c => c.Id == id && c.UserId == UserId),
            _ => false
        };
    }

    private async Task AdjustBalance(TransactionType txnType, FundingSourceType? sourceType, int? sourceId, decimal amount)
    {
        if (sourceType == null || sourceId == null) return;

        if (sourceType == FundingSourceType.BankAccount)
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == sourceId && a.UserId == UserId);
            if (account != null)
                account.CurrentBalance += txnType == TransactionType.Income ? amount : -amount;
        }
        else if (sourceType == FundingSourceType.CreditCard)
        {
            var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == sourceId && c.UserId == UserId);
            if (card != null)
                card.CurrentBalance += amount; // expense increases CC balance
        }
    }

    private async Task ReverseBalance(TransactionType? txnType, FundingSourceType? sourceType, int? sourceId, decimal amount)
    {
        if (txnType == null || sourceType == null || sourceId == null) return;

        if (sourceType == FundingSourceType.BankAccount)
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == sourceId && a.UserId == UserId);
            if (account != null)
                account.CurrentBalance += txnType == TransactionType.Income ? -amount : amount;
        }
        else if (sourceType == FundingSourceType.CreditCard)
        {
            var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == sourceId && c.UserId == UserId);
            if (card != null)
                card.CurrentBalance -= amount;
        }
    }

    private async Task AdjustTransfer(int fromAccountId, int toAccountId, decimal amount)
    {
        var source = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == fromAccountId && a.UserId == UserId);
        var dest = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == toAccountId && a.UserId == UserId);
        if (source != null) source.CurrentBalance -= amount;
        if (dest != null) dest.CurrentBalance += amount;
    }

    private async Task ReverseTransfer(int fromAccountId, int toAccountId, decimal amount)
    {
        var source = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == fromAccountId && a.UserId == UserId);
        var dest = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == toAccountId && a.UserId == UserId);
        if (source != null) source.CurrentBalance += amount;
        if (dest != null) dest.CurrentBalance -= amount;
    }
}
