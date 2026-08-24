using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models.Enums;
using FinPulse.Core.Services;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/simulator")]
// [Authorize] // TODO: Uncomment when Entra ID is configured
public class SimulatorController : ControllerBase
{
    private readonly FinPulseDbContext _db;
    private readonly IWhatIfSimulatorService _simulatorService;

    public SimulatorController(FinPulseDbContext db, IWhatIfSimulatorService simulatorService)
    {
        _db = db;
        _simulatorService = simulatorService;
    }

    [HttpPost("what-if")]
    public async Task<ActionResult<WhatIfResultDto>> WhatIf(WhatIfRequestDto request)
    {
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

        var result = _simulatorService.Simulate(snapshots, request);

        return Ok(result);
    }
}
