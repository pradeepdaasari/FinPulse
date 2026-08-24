using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models.Enums;
using FinPulse.Core.Services;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/budget")]
[Authorize]
public class BudgetController : ControllerBase
{
    private readonly FinPulseDbContext _db;
    private readonly IBudgetService _budgetService;

    public BudgetController(FinPulseDbContext db, IBudgetService budgetService)
    {
        _db = db;
        _budgetService = budgetService;
    }

    [HttpGet("allocation")]
    public async Task<ActionResult<BudgetAllocationDto>> GetAllocation()
    {
        var profile = await _db.UserProfiles.FirstOrDefaultAsync();
        if (profile is null)
            return BadRequest("User profile with monthly income is required. Please create a profile first.");

        var loans = await _db.PersonalLoans.ToListAsync();
        var cards = await _db.CreditCards.ToListAsync();

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

        var allocation = _budgetService.GenerateAllocation(profile.MonthlyIncome, snapshots);

        return Ok(allocation);
    }
}
