using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/debts")]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly FinPulseDbContext _db;

    public DebtsController(FinPulseDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<DebtItemDto>>> GetAll()
    {
        var loans = await _db.PersonalLoans.ToListAsync();
        var cards = await _db.CreditCards.ToListAsync();

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
                SubType = null
            });
        }

        return Ok(debts.OrderBy(d => d.Name).ToList());
    }
}
