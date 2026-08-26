using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models.Enums;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/debts")]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly PulseDbContext _db;

    public DebtsController(PulseDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<DebtItemDto>>> GetAll()
    {
        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();

        var debts = new List<DebtItemDto>();

        foreach (var loan in loans)
        {
            debts.Add(new DebtItemDto
            {
                Key = $"{DebtType.PersonalLoan}:{loan.Id}",
                Id = loan.Id,
                Type = DebtType.PersonalLoan.ToString(),
                Name = loan.LenderName,
                CurrentBalance = loan.CurrentBalance,
                MonthlyPayment = loan.MonthlyPayment,
                AprPercent = loan.AprPercent,
                DueDay = loan.DueDay,
                IsAutopay = loan.IsAutopay,
                SubType = loan.LoanType.ToString()
            });
        }

        foreach (var card in cards)
        {
            debts.Add(new DebtItemDto
            {
                Key = $"{DebtType.CreditCard}:{card.Id}",
                Id = card.Id,
                Type = DebtType.CreditCard.ToString(),
                Name = card.CardName,
                CurrentBalance = card.CurrentBalance,
                MonthlyPayment = card.MinimumPayment,
                AprPercent = card.AprPercent,
                DueDay = card.DueDay,
                IsAutopay = card.IsAutopay,
                SubType = null,
                PromoAprPercent = card.PromoAprPercent,
                PromoEndDate = card.PromoEndDate
            });
        }

        return Ok(debts.OrderBy(d => d.Name).ToList());
    }
}
