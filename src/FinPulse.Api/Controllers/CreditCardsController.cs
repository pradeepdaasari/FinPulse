using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models;
using FinPulse.Core.Models.Enums;
using FinPulse.Core.Services;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/creditcards")]
[Authorize]
public class CreditCardsController : ControllerBase
{
    private readonly FinPulseDbContext _db;
    private readonly IFinancialCalculationService _calcService;

    public CreditCardsController(FinPulseDbContext db, IFinancialCalculationService calcService)
    {
        _db = db;
        _calcService = calcService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<CreditCard>>> GetAll()
    {
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();
        return Ok(cards);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CreditCard>> GetById(int id)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();
        return Ok(card);
    }

    [HttpPost]
    public async Task<ActionResult<CreditCard>> Create(CreditCardCreateDto dto)
    {
        var exists = await _db.CreditCards.AnyAsync(c => c.UserId == UserId && c.CardName == dto.CardName.Trim());
        if (exists)
            return Conflict(new { message = $"A credit card named '{dto.CardName.Trim()}' already exists." });

        var card = new CreditCard
        {
            CardName = dto.CardName,
            CurrentBalance = dto.CurrentBalance,
            CreditLimit = dto.CreditLimit,
            AprPercent = dto.AprPercent,
            MinimumPayment = dto.MinimumPayment,
            DueDay = dto.DueDay,
            IsAutopay = dto.IsAutopay,
            PromoAprPercent = dto.PromoAprPercent,
            PromoEndDate = dto.PromoEndDate,
            UserId = UserId
        };

        _db.CreditCards.Add(card);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = card.Id }, card);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CreditCard>> Update(int id, CreditCardCreateDto dto)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var duplicate = await _db.CreditCards.AnyAsync(c => c.UserId == UserId && c.Id != id && c.CardName == dto.CardName.Trim());
        if (duplicate)
            return Conflict(new { message = $"A credit card named '{dto.CardName.Trim()}' already exists." });

        card.CardName = dto.CardName;
        card.CurrentBalance = dto.CurrentBalance;
        card.CreditLimit = dto.CreditLimit;
        card.AprPercent = dto.AprPercent;
        card.MinimumPayment = dto.MinimumPayment;
        card.DueDay = dto.DueDay;
        card.IsAutopay = dto.IsAutopay;
        card.PromoAprPercent = dto.PromoAprPercent;
        card.PromoEndDate = dto.PromoEndDate;

        await _db.SaveChangesAsync();

        return Ok(card);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        _db.CreditCards.Remove(card);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/payoff-timeline")]
    public async Task<ActionResult<List<PayoffEntryDto>>> GetPayoffTimeline(int id)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var schedule = _calcService.GenerateCardPayoffSchedule(
            card.CurrentBalance,
            card.AprPercent,
            card.MinimumPayment,
            card.PromoAprPercent,
            card.PromoEndDate);

        return Ok(schedule);
    }

    [HttpPost("{id}/payments")]
    public async Task<ActionResult<PaymentHistory>> RecordPayment(int id, PaymentCreateDto dto)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var payment = new PaymentHistory
        {
            DebtType = DebtType.CreditCard,
            DebtId = id,
            AmountPaid = dto.AmountPaid,
            PaymentDate = dto.PaymentDate,
            Notes = dto.Notes,
            UserId = UserId,
            FromAccountId = dto.FromAccountId
        };

        card.CurrentBalance = Math.Max(0, card.CurrentBalance - dto.AmountPaid);

        if (dto.FromAccountId.HasValue)
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == dto.FromAccountId && a.UserId == UserId);
            if (account != null)
                account.CurrentBalance -= dto.AmountPaid;
        }

        _db.PaymentHistories.Add(payment);
        await _db.SaveChangesAsync();

        return Ok(payment);
    }

    [HttpGet("{id}/payments")]
    public async Task<ActionResult<List<PaymentHistory>>> GetPayments(int id)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var payments = await _db.PaymentHistories
            .Where(p => p.DebtType == DebtType.CreditCard && p.DebtId == id && p.UserId == UserId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        return Ok(payments);
    }
}
