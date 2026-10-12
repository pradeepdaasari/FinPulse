using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/debts")]
[Authorize]
public class DebtsController : ControllerBase
{
    private readonly PulseDbContext _db;

    public DebtsController(PulseDbContext db)
    {
        _db = db;
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
                NextPaymentDate = AdvanceNextDueDate(loan.NextPaymentDate, loan.PaymentFrequency, loan.DueDay, userToday),
                PaymentFrequency = loan.PaymentFrequency.ToString(),
                StartDate = loan.StartDate
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
                PromoEndDate = card.PromoEndDate,
                PerPaymentAmount = card.MinimumPayment,
                PaymentFrequency = "Monthly",
                NextPaymentDate = AdvanceNextDueDate(null, PaymentFrequency.Monthly, card.DueDay, userToday)
            });
        }

        return Ok(debts.OrderBy(d => d.Name).ToList());
    }


    private static DateTime? AdvanceNextDueDate(DateTime? anchor, PaymentFrequency frequency, int dueDay, DateTime today)
    {
        if (anchor.HasValue)
        {
            var d = anchor.Value.Date;
            while (d < today)
            {
                d = frequency switch
                {
                    PaymentFrequency.Weekly => d.AddDays(7),
                    PaymentFrequency.Biweekly => d.AddDays(14),
                    _ => d.AddMonths(1)
                };
            }
            return d;
        }

        if (frequency == PaymentFrequency.Monthly)
        {
            var day = Math.Min(dueDay, DateTime.DaysInMonth(today.Year, today.Month));
            var thisMonth = new DateTime(today.Year, today.Month, day);
            if (thisMonth >= today) return thisMonth;
            var next = today.AddMonths(1);
            day = Math.Min(dueDay, DateTime.DaysInMonth(next.Year, next.Month));
            return new DateTime(next.Year, next.Month, day);
        }

        if (frequency is PaymentFrequency.Biweekly or PaymentFrequency.Weekly)
        {
            var targetDow = (DayOfWeek)dueDay;
            var daysUntil = ((int)targetDow - (int)today.DayOfWeek + 7) % 7;
            if (daysUntil == 0) return today;
            return today.AddDays(daysUntil);
        }

        return null;
    }
}
