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

    public StrategiesController(PulseDbContext db, IPayoffStrategyService strategyService)
    {
        _db = db;
        _strategyService = strategyService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("comparison")]
    public async Task<ActionResult<StrategyComparisonDto>> GetComparison([FromQuery] decimal extraPayment = 0)
    {
        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == UserId);

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

        snapshots = snapshots.Where(s => s.Balance > 0).ToList();

        var totalMinimumPayments = snapshots.Sum(s => s.MinimumPayment);
        var extraFromProfile = profile?.MonthlyIncome * 0.2m ?? 0m;
        var totalMonthlyBudget = totalMinimumPayments + extraFromProfile + extraPayment;

        var comparison = _strategyService.CompareStrategies(snapshots, totalMonthlyBudget);
        comparison.TotalDebt = snapshots.Sum(s => s.Balance);
        comparison.MonthlyIncome = profile?.MonthlyIncome ?? 0;
        comparison.NetPayPerCheck = profile?.NetPayPerCheck ?? 0;
        comparison.PayFrequency = profile?.PayFrequency.ToString() ?? "Monthly";

        if (profile?.NextPayDate != null)
        {
            var now = DateTime.Today;
            var paychecks = GetPayDatesInMonth(profile.NextPayDate.Value, profile.PayFrequency, now.Year, now.Month);
            comparison.Paychecks = paychecks.Select(d => new PaycheckInfoDto
            {
                Date = d.ToString("yyyy-MM-dd"),
                Amount = profile.NetPayPerCheck
            }).ToList();

            AssignPaycheckDates(comparison.Avalanche.MonthlyPlan, paychecks);
            AssignPaycheckDates(comparison.Snowball.MonthlyPlan, paychecks);
        }

        return Ok(comparison);
    }

    private void AssignPaycheckDates(List<MonthlyActionStepDto> steps, List<DateTime> paychecks)
    {
        if (paychecks.Count == 0) return;
        foreach (var step in steps)
        {
            var dueDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month,
                Math.Min(step.DueDay > 0 ? step.DueDay : 1, DateTime.DaysInMonth(DateTime.Today.Year, DateTime.Today.Month)));
            var bestPaycheck = paychecks.Where(p => p <= dueDate).OrderByDescending(p => p).FirstOrDefault();
            if (bestPaycheck == default)
                bestPaycheck = paychecks.First();
            step.PaycheckDate = bestPaycheck.ToString("yyyy-MM-dd");
        }
    }

    private static List<DateTime> GetPayDatesInMonth(DateTime anchor, PaymentFrequency freq, int year, int month)
    {
        if (freq == PaymentFrequency.Monthly)
        {
            var day = Math.Min(anchor.Day, DateTime.DaysInMonth(year, month));
            return new List<DateTime> { new DateTime(year, month, day) };
        }

        var interval = freq == PaymentFrequency.Biweekly ? 14 : 7;
        var monthStart = new DateTime(year, month, 1);
        var monthEnd = new DateTime(year, month, DateTime.DaysInMonth(year, month));
        var results = new List<DateTime>();

        var current = anchor.Date;
        while (current <= monthEnd)
        {
            if (current >= monthStart)
                results.Add(current);
            current = current.AddDays(interval);
        }
        current = anchor.Date.AddDays(-interval);
        while (current >= monthStart)
        {
            results.Add(current);
            current = current.AddDays(-interval);
        }

        return results.Distinct().OrderBy(d => d).ToList();
    }
}
