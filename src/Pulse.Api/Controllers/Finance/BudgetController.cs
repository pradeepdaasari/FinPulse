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
    private readonly IDebtSnapshotHelper _snapshotHelper;

    public BudgetController(PulseDbContext db, IBudgetService budgetService, IBudgetPlanService budgetPlanService, IDebtSnapshotHelper snapshotHelper)
    {
        _db = db;
        _budgetService = budgetService;
        _budgetPlanService = budgetPlanService;
        _snapshotHelper = snapshotHelper;
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

        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var now = TimeZoneHelper.UserNow(tz);
        var targetYear = year ?? now.Year;
        var targetMonth = month ?? now.Month;

        var expenses = await _db.BudgetExpenses.Include(e => e.Category).Where(e => e.UserId == UserId).ToListAsync();
        var debts = await GetDebtSnapshots();
        var recurring = await _db.RecurringTransactions
            .Include(r => r.Category)
            .Where(r => r.UserId == UserId && r.IsActive)
            .ToListAsync();
        // Convert anchor to user's timezone date so biweekly hops land on the correct day
        if (profile.NextPayDate.HasValue)
            profile.NextPayDate = TimeZoneHelper.ToLocalDate(profile.NextPayDate.Value, tz);
        var today = TimeZoneHelper.UserToday(tz);
        var plan = _budgetPlanService.GeneratePlan(profile, expenses, debts, recurring, targetYear, targetMonth, today);

        // Convert local dates to UTC so UtcDateTimeConverter round-trips them correctly
        foreach (var bd in plan.PaycheckBreakdowns)
        {
            bd.PayDate = TimeZoneHelper.ToUtc(bd.PayDate, tz);
            bd.WindowStart = TimeZoneHelper.ToUtc(bd.WindowStart, tz);
            bd.WindowEnd = TimeZoneHelper.ToUtc(bd.WindowEnd, tz);
            foreach (var exp in bd.Expenses.Where(e => e.DueDate.HasValue))
                exp.DueDate = TimeZoneHelper.ToUtc(exp.DueDate!.Value, tz);
        }

        // Enrich with actual spending
        var (startDate, endDate) = TimeZoneHelper.MonthRangeUtc(targetYear, targetMonth, tz);
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

        // Enrich debt categories with actual payments this month
        var payments = await _db.PaymentHistories
            .Where(p => p.UserId == UserId && p.PaymentDate >= startDate && p.PaymentDate < endDate)
            .Select(p => new { p.DebtId, p.DebtType, p.AmountPaid })
            .ToListAsync();

        foreach (var cat in plan.MonthlyOverview.ByCategory.Where(c => c.IsDebt && c.DebtId.HasValue))
        {
            var paid = payments
                .Where(p => p.DebtId == cat.DebtId!.Value && p.DebtType == cat.DebtType!.Value)
                .Sum(p => p.AmountPaid);

            cat.Spent = paid;
            cat.Remaining = cat.Amount - paid;
            cat.PercentUsed = cat.Amount > 0
                ? Math.Round(paid / cat.Amount * 100, 1)
                : (paid > 0 ? 100 : 0);
        }

        var allItems = plan.MonthlyOverview.ByCategory;
        plan.MonthlyOverview.TotalSpent = allItems.Sum(c => c.Spent);
        plan.MonthlyOverview.TotalRemaining = allItems.Sum(c => c.Remaining);
        plan.MonthlyOverview.AbsRemaining = Math.Abs(plan.MonthlyOverview.TotalRemaining);
        plan.MonthlyOverview.IsOverBudget = plan.MonthlyOverview.TotalRemaining < 0;

        plan.MonthlyOverview.RecurringTotal = allItems.Where(c => c.IsRecurring).Sum(c => c.Amount);
        plan.MonthlyOverview.LoanTotal = allItems.Where(c => c.IsLoan).Sum(c => c.Amount);
        plan.MonthlyOverview.DebtTotal = allItems.Where(c => c.IsDebt && !c.IsLoan).Sum(c => c.Amount);
        plan.MonthlyOverview.BillsTotal = allItems.Where(c => !c.IsDebt && !c.IsRecurring).Sum(c => c.Amount);
        plan.MonthlyOverview.OverallPercent = plan.MonthlyOverview.TotalExpenses > 0
            ? Math.Round(plan.MonthlyOverview.TotalSpent / plan.MonthlyOverview.TotalExpenses * 100m)
            : 0;

        // Enrich paycheck expenses with paid/unpaid status
        var windowMin = plan.PaycheckBreakdowns.Min(b => b.WindowStart);
        var windowMax = plan.PaycheckBreakdowns.Max(b => b.WindowEnd);
        var windowPayments = await _db.PaymentHistories
            .Where(p => p.UserId == UserId && p.PaymentDate >= windowMin && p.PaymentDate <= windowMax)
            .Select(p => new { p.DebtId, p.DebtType, p.AmountPaid, p.PaymentDate })
            .ToListAsync();

        var windowExpenses = await _db.DailyExpenses
            .Where(e => e.UserId == UserId && e.Date >= windowMin && e.Date <= windowMax
                   && e.TransactionType == TransactionType.Expense && e.CategoryId != null)
            .Select(e => new { e.CategoryId, e.Amount, e.Date })
            .ToListAsync();

        foreach (var bd in plan.PaycheckBreakdowns)
        {
            foreach (var exp in bd.Expenses)
            {
                if (exp.DueDate == null || !exp.IsFixed) continue;

                if (exp.IsDebtPayment)
                {
                    var paid = windowPayments
                        .Where(p => p.DebtId == exp.ExpenseId && p.PaymentDate >= bd.WindowStart && p.PaymentDate <= bd.WindowEnd)
                        .Sum(p => p.AmountPaid);
                    exp.IsPaid = paid >= exp.Amount;
                }
                else
                {
                    var matchIds = parentLookup.ContainsKey(exp.CategoryId)
                        ? new HashSet<int> { exp.CategoryId, parentLookup[exp.CategoryId] }
                        : new HashSet<int> { exp.CategoryId };
                    var catIds = childrenOf.GetValueOrDefault(exp.CategoryId) ?? matchIds;
                    var spent = windowExpenses
                        .Where(e => catIds.Contains(e.CategoryId!.Value) && e.Date >= bd.WindowStart && e.Date <= bd.WindowEnd)
                        .Sum(e => e.Amount);
                    exp.IsPaid = spent >= exp.Amount;
                }

                if (exp.IsPaid)
                {
                    exp.Status = "paid";
                    exp.StatusLabel = "Paid";
                }
                else if (exp.DueDate.Value.Date < today)
                {
                    exp.Status = "overdue";
                    exp.StatusLabel = "Overdue";
                }
                else if (exp.DueDate.Value.Date == today)
                {
                    exp.Status = "due-today";
                    exp.StatusLabel = "Due today";
                }
                else if ((exp.DueDate.Value.Date - today).TotalDays <= 3)
                {
                    exp.Status = "due-soon";
                    exp.StatusLabel = "Due " + exp.DueDate.Value.ToString("MMM d");
                }
                else
                {
                    exp.Status = "upcoming";
                    exp.StatusLabel = exp.DueDate.Value.ToString("MMM d");
                }
            }

            var billExpenses = bd.Expenses.Where(e => e.DueDate != null && e.IsFixed).ToList();
            bd.TotalBillCount = billExpenses.Count;
            bd.PaidCount = billExpenses.Count(e => e.IsPaid);
        }

        // Paycheck info
        if (profile.NextPayDate != null)
        {
            var nextPay = FinanceCalculationHelper.ComputeNextPaycheck(profile.NextPayDate.Value.Date, profile.PayFrequency, today);
            plan.DaysUntilPaycheck = (int)Math.Ceiling((nextPay - today).TotalDays);
        }

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
        if (dto.CategoryId > 0)
        {
            var catExists = await _db.CustomCategories.AnyAsync(c => c.Id == dto.CategoryId && (c.UserId == null || c.UserId == UserId));
            if (!catExists) return BadRequest(new { message = "Invalid category." });
        }

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
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userNow = TimeZoneHelper.UserNow(tz);
        return await _snapshotHelper.GetDebtSnapshots(UserId, userNow);
    }
}
