using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models;

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
            .Where(e => e.Date >= startDate && e.Date < endDate)
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .Select(e => new
            {
                e.Id,
                e.Date,
                e.CategoryId,
                CategoryName = e.Category.Name,
                ParentCategoryName = e.Category.Parent != null ? e.Category.Parent.Name : null,
                e.Amount,
                e.Description,
                e.Merchant,
                e.CreatedAt,
                e.UpdatedAt
            })
            .ToListAsync();

        return Ok(expenses);
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
            .Where(e => e.Date >= startDate && e.Date < endDate)
            .ToListAsync();

        var budgets = await _db.BudgetExpenses
            .Include(e => e.Category)
            .Where(e => !e.IsFixed)
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
        var expense = new DailyExpense
        {
            Date = dto.Date,
            CategoryId = dto.CategoryId,
            Amount = dto.Amount,
            Description = dto.Description,
            Merchant = dto.Merchant
        };

        _db.DailyExpenses.Add(expense);
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
            created.CreatedAt,
            created.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, DailyExpenseCreateDto dto)
    {
        var expense = await _db.DailyExpenses.FindAsync(id);
        if (expense is null) return NotFound();

        expense.Date = dto.Date;
        expense.CategoryId = dto.CategoryId;
        expense.Amount = dto.Amount;
        expense.Description = dto.Description;
        expense.Merchant = dto.Merchant;

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
            updated.CreatedAt,
            updated.UpdatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var expense = await _db.DailyExpenses.FindAsync(id);
        if (expense is null) return NotFound();

        _db.DailyExpenses.Remove(expense);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
