using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models.Enums;
using FinPulse.Core.Services;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/strategies")]
// [Authorize] // TODO: Uncomment when Entra ID is configured
public class StrategiesController : ControllerBase
{
    private readonly FinPulseDbContext _db;
    private readonly IPayoffStrategyService _strategyService;

    public StrategiesController(FinPulseDbContext db, IPayoffStrategyService strategyService)
    {
        _db = db;
        _strategyService = strategyService;
    }

    [HttpGet("comparison")]
    public async Task<ActionResult<StrategyComparisonDto>> GetComparison()
    {
        var loans = await _db.PersonalLoans.ToListAsync();
        var cards = await _db.CreditCards.ToListAsync();
        var profile = await _db.UserProfiles.FirstOrDefaultAsync();

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
                PromoEndDate = null
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
                PromoEndDate = card.PromoEndDate
            });
        }

        // Total monthly budget = sum of all minimum payments + any extra from profile
        var totalMinimumPayments = loans.Sum(l => l.MonthlyPayment) + cards.Sum(c => c.MinimumPayment);
        var extraFromProfile = profile?.MonthlyIncome * 0.2m ?? 0m; // Use 20% of income as debt budget if available
        var totalMonthlyBudget = totalMinimumPayments + extraFromProfile;

        var comparison = _strategyService.CompareStrategies(snapshots, totalMonthlyBudget);

        return Ok(comparison);
    }
}
