using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/recurring")]
[Authorize]
public class RecurringController : ControllerBase
{
    private readonly PulseDbContext _db;

    public RecurringController(PulseDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var items = await _db.RecurringTransactions
            .Include(r => r.Category)
            .Where(r => r.UserId == UserId)
            .OrderBy(r => r.NextRunDate)
            .ToListAsync();

        var result = items.Select(r => new
        {
            r.Id,
            r.Description,
            r.Merchant,
            r.Amount,
            r.CategoryId,
            CategoryName = r.Category.Name,
            CategoryIcon = r.Category.Icon,
            TransactionType = r.TransactionType.ToString(),
            FundingSourceType = r.FundingSourceType?.ToString(),
            r.FundingSourceId,
            Frequency = r.Frequency.ToString(),
            r.NextRunDate,
            r.EndDate,
            r.IsActive,
            r.CreatedAt
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult> Create(RecurringTransactionCreateDto dto)
    {
        var item = new RecurringTransaction
        {
            Description = dto.Description,
            Merchant = dto.Merchant,
            Amount = dto.Amount,
            CategoryId = dto.CategoryId,
            TransactionType = dto.TransactionType,
            FundingSourceType = dto.FundingSourceType,
            FundingSourceId = dto.FundingSourceId,
            Frequency = dto.Frequency,
            NextRunDate = dto.NextRunDate,
            EndDate = dto.EndDate,
            IsActive = dto.IsActive,
            UserId = UserId
        };

        _db.RecurringTransactions.Add(item);
        await _db.SaveChangesAsync();
        return Ok(new { item.Id });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, RecurringTransactionCreateDto dto)
    {
        var item = await _db.RecurringTransactions.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item is null) return NotFound();

        item.Description = dto.Description;
        item.Merchant = dto.Merchant;
        item.Amount = dto.Amount;
        item.CategoryId = dto.CategoryId;
        item.TransactionType = dto.TransactionType;
        item.FundingSourceType = dto.FundingSourceType;
        item.FundingSourceId = dto.FundingSourceId;
        item.Frequency = dto.Frequency;
        item.NextRunDate = dto.NextRunDate;
        item.EndDate = dto.EndDate;
        item.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var item = await _db.RecurringTransactions.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item is null) return NotFound();
        _db.RecurringTransactions.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/pay")]
    public async Task<ActionResult> MarkPaid(int id)
    {
        var item = await _db.RecurringTransactions.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item is null) return NotFound();

        var expense = new DailyExpense
        {
            Date = item.NextRunDate,
            CategoryId = item.CategoryId,
            Amount = item.Amount,
            Description = item.Description,
            Merchant = item.Merchant,
            TransactionType = item.TransactionType,
            FundingSourceType = item.FundingSourceType,
            FundingSourceId = item.FundingSourceId,
            UserId = UserId
        };
        _db.DailyExpenses.Add(expense);

        if (item.FundingSourceId != null)
        {
            if (item.FundingSourceType == FundingSourceType.BankAccount)
            {
                var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == item.FundingSourceId && a.UserId == UserId);
                if (account != null)
                {
                    if (item.TransactionType == TransactionType.Expense)
                        account.CurrentBalance -= item.Amount;
                    else if (item.TransactionType == TransactionType.Income)
                        account.CurrentBalance += item.Amount;
                }
            }
            else if (item.FundingSourceType == FundingSourceType.CreditCard)
            {
                var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == item.FundingSourceId && c.UserId == UserId);
                if (card != null)
                    card.CurrentBalance += item.Amount;
            }
        }

        item.NextRunDate = AdvanceDate(item.NextRunDate, item.Frequency);
        if (item.EndDate.HasValue && item.NextRunDate > item.EndDate.Value)
            item.IsActive = false;

        await _db.SaveChangesAsync();
        return Ok(new { expenseId = expense.Id, nextRunDate = item.NextRunDate });
    }

    [HttpPost("generate")]
    public async Task<ActionResult> Generate()
    {
        var today = DateTime.UtcNow.Date;
        var dueItems = await _db.RecurringTransactions
            .Where(r => r.UserId == UserId && r.IsActive && r.NextRunDate <= today)
            .ToListAsync();

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var generated = 0;
            foreach (var item in dueItems)
            {
                while (item.NextRunDate <= today)
                {
                    var expense = new DailyExpense
                    {
                        Date = item.NextRunDate,
                        CategoryId = item.CategoryId,
                        Amount = item.Amount,
                        Description = item.Description,
                        Merchant = item.Merchant,
                        TransactionType = item.TransactionType,
                        FundingSourceType = item.FundingSourceType,
                        FundingSourceId = item.FundingSourceId,
                        UserId = UserId
                    };
                    _db.DailyExpenses.Add(expense);
                    generated++;

                    item.NextRunDate = AdvanceDate(item.NextRunDate, item.Frequency);

                    if (item.EndDate.HasValue && item.NextRunDate > item.EndDate.Value)
                    {
                        item.IsActive = false;
                        break;
                    }
                }
            }

            if (generated > 0)
                await _db.SaveChangesAsync();

            await transaction.CommitAsync();
            return Ok(new { generated });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    private static DateTime AdvanceDate(DateTime date, RecurrenceFrequency frequency)
    {
        return frequency switch
        {
            RecurrenceFrequency.Daily => date.AddDays(1),
            RecurrenceFrequency.Weekly => date.AddDays(7),
            RecurrenceFrequency.Biweekly => date.AddDays(14),
            RecurrenceFrequency.Monthly => date.AddMonths(1),
            _ => date.AddMonths(1)
        };
    }
}
