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
[Route("api/debts")]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly PulseDbContext _db;
    private readonly ICardSummaryService _cardSummaryService;

    public DebtsController(PulseDbContext db, ICardSummaryService cardSummaryService)
    {
        _db = db;
        _cardSummaryService = cardSummaryService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<DebtItemDto>>> GetAll()
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userToday = TimeZoneHelper.UserToday(tz);

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
                MonthlyPayment = loan.MonthlyEquivalentPayment,
                PerPaymentAmount = loan.MonthlyPayment,
                AprPercent = loan.AprPercent,
                DueDay = loan.DueDay,
                IsAutopay = loan.IsAutopay,
                SubType = loan.LoanType.ToString(),
                NextPaymentDate = FinanceCalculationHelper.AdvanceNextDueDate(loan.NextPaymentDate, loan.PaymentFrequency, loan.DueDay, userToday),
                PaymentFrequency = loan.PaymentFrequency.ToString(),
                StartDate = loan.StartDate
            });
        }

        foreach (var card in cards)
        {
            var summary = await _cardSummaryService.ComputeCardSummary(UserId, card);

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
                PromoEndDate = card.PromoEndDate,
                PerPaymentAmount = summary.RemainingMinimumPayment,
                PaymentFrequency = "Monthly",
                NextPaymentDate = FinanceCalculationHelper.AdvanceNextDueDate(null, PaymentFrequency.Monthly, card.DueDay, userToday)
            });
        }

        return Ok(debts.OrderBy(d => d.Name).ToList());
    }
}
