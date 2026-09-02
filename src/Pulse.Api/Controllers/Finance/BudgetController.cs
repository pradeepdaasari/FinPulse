using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;
using Pulse.Core.Services;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/budget")]
[Authorize]
public class BudgetController : ControllerBase
{
    private readonly PulseDbContext _db;
    private readonly IBudgetService _budgetService;
    private readonly IBudgetPlanService _budgetPlanService;

    public BudgetController(PulseDbContext db, IBudgetService budgetService, IBudgetPlanService budgetPlanService)
    {
        _db = db;
        _budgetService = budgetService;
        _budgetPlanService = budgetPlanService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("allocation")]
    public async Task<ActionResult<BudgetAllocationDto>> GetAllocation()
    {
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == UserId);
        if (profile is null)
            return BadRequest("User profile with monthly income is required.");

        var snapshots = await GetDebtSnapshots();
        var allocation = _budgetService.GenerateAllocation(profile.MonthlyIncome, snapshots);
        return Ok(allocation);
    }

    [HttpGet("plan")]
    public async Task<ActionResult<BudgetPlanDto>> GetPlan([FromQuery] int? year, [FromQuery] int? month)
    {
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == UserId);
        if (profile is null)
            return BadRequest("User profile is required.");

        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;

        var expenses = await _db.BudgetExpenses.Include(e => e.Category).Where(e => e.UserId == UserId).ToListAsync();
        var debts = await GetDebtSnapshots();
        var recurring = await _db.RecurringTransactions
            .Include(r => r.Category)
            .Where(r => r.UserId == UserId && r.IsActive)
            .ToListAsync();
        var plan = _budgetPlanService.GeneratePlan(profile, expenses, debts, recurring, targetYear, targetMonth);

        // Enrich with actual spending
        var startDate = new DateTime(targetYear, targetMonth, 1);
        var endDate = startDate.AddMonths(1);
        var dailyExpenses = await _db.DailyExpenses
            .Where(e => e.UserId == UserId && e.Date >= startDate && e.Date < endDate
                   && e.TransactionType == TransactionType.Expense && e.CategoryId != null)
            .Select(e => new { e.CategoryId, e.Amount })
            .ToListAsync();

        var parentLookup = await _db.CustomCategories
            .Where(c => c.UserId == UserId && c.ParentId != null)
            .ToDictionaryAsync(c => c.Id, c => c.ParentId!.Value);

        // Build set of children for each category in the plan
        var planCategoryIds = plan.MonthlyOverview.ByCategory
            .Where(c => !c.IsDebt)
            .Select(c => c.CategoryId)
            .ToHashSet();

        var childrenOf = new Dictionary<int, HashSet<int>>();
        foreach (var (childId, parentId) in parentLookup)
        {
            if (planCategoryIds.Contains(parentId))
            {
                if (!childrenOf.ContainsKey(parentId))
                    childrenOf[parentId] = new HashSet<int> { parentId };
                childrenOf[parentId].Add(childId);
            }
        }

        foreach (var cat in plan.MonthlyOverview.ByCategory)
        {
            if (cat.IsDebt) continue;

            var matchIds = childrenOf.GetValueOrDefault(cat.CategoryId) ?? new HashSet<int> { cat.CategoryId };
            var spent = dailyExpenses
                .Where(e => matchIds.Contains(e.CategoryId!.Value))
                .Sum(e => e.Amount);

            cat.Spent = spent;
            cat.Remaining = cat.Amount - spent;
            cat.PercentUsed = cat.Amount > 0
                ? Math.Round(spent / cat.Amount * 100, 1)
                : (spent > 0 ? 100 : 0);
        }

        var budgetable = plan.MonthlyOverview.ByCategory.Where(c => !c.IsDebt).ToList();
        plan.MonthlyOverview.TotalSpent = budgetable.Sum(c => c.Spent);
        plan.MonthlyOverview.TotalRemaining = budgetable.Sum(c => c.Remaining);

        return Ok(plan);
    }

    [HttpGet("expenses")]
    public async Task<ActionResult<List<object>>> GetExpenses()
    {
        var expenses = await _db.BudgetExpenses
            .Include(e => e.Category)
            .ThenInclude(c => c.Parent)
            .Where(e => e.UserId == UserId)
            .OrderByDescending(e => e.IsFixed)
            .ThenBy(e => e.DueDay)
            .ThenBy(e => e.Name)
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.CategoryId,
                CategoryName = e.Category.Name,
                ParentCategoryName = e.Category.Parent != null ? e.Category.Parent.Name : null,
                e.Amount,
                e.IsFixed,
                e.DueDay,
                e.Frequency,
                e.IsAutopay,
                e.CreatedAt,
                e.UpdatedAt
            })
            .ToListAsync();
        return Ok(expenses);
    }

    [HttpPost("expenses")]
    public async Task<ActionResult> CreateExpense(BudgetExpenseCreateDto dto)
    {
        var expense = new BudgetExpense
        {
            Name = dto.Name,
            CategoryId = dto.CategoryId,
            Amount = dto.Amount,
            IsFixed = dto.IsFixed,
            DueDay = dto.DueDay,
            Frequency = dto.Frequency,
            IsAutopay = dto.IsAutopay,
            UserId = UserId
        };

        _db.BudgetExpenses.Add(expense);
        await _db.SaveChangesAsync();

        var created = await _db.BudgetExpenses
            .Include(e => e.Category).ThenInclude(c => c.Parent)
            .FirstAsync(e => e.Id == expense.Id);

        return Ok(new
        {
            created.Id,
            created.Name,
            created.CategoryId,
            CategoryName = created.Category.Name,
            ParentCategoryName = created.Category.Parent?.Name,
            created.Amount,
            created.IsFixed,
            created.DueDay,
            created.Frequency,
            created.IsAutopay,
            created.CreatedAt,
            created.UpdatedAt
        });
    }

    [HttpPut("expenses/{id}")]
    public async Task<ActionResult> UpdateExpense(int id, BudgetExpenseCreateDto dto)
    {
        var expense = await _db.BudgetExpenses.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (expense is null) return NotFound();

        expense.Name = dto.Name;
        expense.CategoryId = dto.CategoryId;
        expense.Amount = dto.Amount;
        expense.IsFixed = dto.IsFixed;
        expense.DueDay = dto.DueDay;
        expense.Frequency = dto.Frequency;
        expense.IsAutopay = dto.IsAutopay;

        await _db.SaveChangesAsync();

        var updated = await _db.BudgetExpenses
            .Include(e => e.Category).ThenInclude(c => c.Parent)
            .FirstAsync(e => e.Id == expense.Id);

        return Ok(new
        {
            updated.Id,
            updated.Name,
            updated.CategoryId,
            CategoryName = updated.Category.Name,
            ParentCategoryName = updated.Category.Parent?.Name,
            updated.Amount,
            updated.IsFixed,
            updated.DueDay,
            updated.Frequency,
            updated.IsAutopay,
            updated.CreatedAt,
            updated.UpdatedAt
        });
    }

    [HttpDelete("expenses/{id}")]
    public async Task<ActionResult> DeleteExpense(int id)
    {
        var expense = await _db.BudgetExpenses.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (expense is null) return NotFound();

        _db.BudgetExpenses.Remove(expense);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<List<DebtSnapshotDto>> GetDebtSnapshots()
    {
        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();
        var snapshots = new List<DebtSnapshotDto>();

        foreach (var loan in loans)
        {
            snapshots.Add(new DebtSnapshotDto
            {
                Id = loan.Id,
                DebtType = DebtType.PersonalLoan,
                Name = loan.LenderName,
                Balance = loan.CurrentBalance,
                AprPercent = loan.AprPercent,
                MinimumPayment = loan.MonthlyPayment,
                EffectiveApr = loan.AprPercent,
                PromoEndDate = null,
                DueDay = loan.DueDay
            });
        }

        foreach (var card in cards)
        {
            snapshots.Add(new DebtSnapshotDto
            {
                Id = card.Id,
                DebtType = DebtType.CreditCard,
                Name = card.CardName,
                Balance = card.CurrentBalance,
                AprPercent = card.AprPercent,
                MinimumPayment = card.MinimumPayment,
                EffectiveApr = card.PromoEndDate.HasValue && card.PromoEndDate > DateTime.UtcNow
                    ? card.PromoAprPercent ?? card.AprPercent
                    : card.AprPercent,
                PromoEndDate = card.PromoEndDate,
                DueDay = card.DueDay
            });
        }

        return snapshots;
    }
}
