using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models.Enums;
using Pulse.Core.Services;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/strategies")]
[Authorize]
public class StrategiesController : ControllerBase
{
    private readonly PulseDbContext _db;
    private readonly IPayoffStrategyService _strategyService;
    private readonly IDebtSnapshotHelper _snapshotHelper;

    public StrategiesController(PulseDbContext db, IPayoffStrategyService strategyService, IDebtSnapshotHelper snapshotHelper)
    {
        _db = db;
        _strategyService = strategyService;
        _snapshotHelper = snapshotHelper;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("comparison")]
    public async Task<ActionResult<StrategyComparisonDto>> GetComparison([FromQuery] decimal extraPayment = 0)
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == UserId);

        var userNow = TimeZoneHelper.UserNow(tz);
        var snapshots = (await _snapshotHelper.GetDebtSnapshots(UserId, userNow))
            .Where(s => s.Balance > 0).ToList();

        var totalMinimumPayments = snapshots.Sum(s => s.MinimumPayment);

        var recurringExpenses = await _db.RecurringTransactions
            .Where(r => r.UserId == UserId && r.IsActive)
            .SumAsync(r => r.Amount);

        var today = TimeZoneHelper.UserToday(tz);

        var monthlyIncome = profile?.MonthlyIncome ?? 0;
        if (profile?.NextPayDate != null && profile.NetPayPerCheck > 0)
        {
            var payDates = FinanceCalculationHelper.GetDatesInMonth(profile.NextPayDate.Value, profile.PayFrequency, today.Year, today.Month);
            monthlyIncome = payDates.Count * profile.NetPayPerCheck;
        }

        var availableAfterBills = Math.Max(monthlyIncome - recurringExpenses - totalMinimumPayments, 0);
        var totalMonthlyBudget = totalMinimumPayments + availableAfterBills + extraPayment;

        var comparison = _strategyService.CompareStrategies(snapshots, totalMonthlyBudget);
        comparison.TotalDebt = snapshots.Sum(s => s.Balance);
        comparison.MonthlyIncome = monthlyIncome;
        comparison.NetPayPerCheck = profile?.NetPayPerCheck ?? 0;
        comparison.RecurringExpenses = recurringExpenses;
        comparison.PayFrequency = profile?.PayFrequency.ToString() ?? "Monthly";

        if (profile?.NextPayDate != null)
        {
            var paychecks = FinanceCalculationHelper.GetDatesInMonth(profile.NextPayDate.Value, profile.PayFrequency, today.Year, today.Month);
            comparison.Paychecks = paychecks.Select(d => new PaycheckInfoDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                Amount = profile.NetPayPerCheck
            }).ToList();

            AssignPaycheckDates(comparison.Avalanche.MonthlyPlan, paychecks, today);
            AssignPaycheckDates(comparison.Snowball.MonthlyPlan, paychecks, today);
        }

        return Ok(comparison);
    }

    private static void AssignPaycheckDates(List<MonthlyActionStepDto> steps, List<DateTime> paychecks, DateTime today)
    {
        if (paychecks.Count == 0) return;
        foreach (var step in steps)
        {
            var dueDate = new DateTime(today.Year, today.Month,
                Math.Min(step.DueDay > 0 ? step.DueDay : 1, DateTime.DaysInMonth(today.Year, today.Month)));
            var bestPaycheck = paychecks.OrderBy(p => Math.Abs((p - dueDate).TotalDays)).First();
            step.PaycheckDate = bestPaycheck.ToString("yyyy-MM-dd");
        }
    }
}
