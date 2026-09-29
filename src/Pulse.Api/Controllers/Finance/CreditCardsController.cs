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
[Route("api/creditcards")]
[Authorize]
public class CreditCardsController : ControllerBase
{
    private readonly PulseDbContext _db;
    private readonly IFinancialCalculationService _calcService;

    public CreditCardsController(PulseDbContext db, IFinancialCalculationService calcService)
    {
        _db = db;
        _calcService = calcService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<CreditCard>>> GetAll()
    {
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).OrderBy(c => c.CardName).ToListAsync();
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
            CardName = dto.CardName.Trim(),
            CurrentBalance = dto.CurrentBalance,
            CreditLimit = dto.CreditLimit,
            AprPercent = dto.AprPercent,
            MinimumPayment = dto.MinimumPayment,
            DueDay = dto.DueDay,
            IsAutopay = dto.IsAutopay,
            PromoAprPercent = dto.PromoAprPercent,
            PromoEndDate = dto.PromoEndDate,
            LastStatementDate = dto.LastStatementDate,
            UserId = UserId
        };

        _db.CreditCards.Add(card);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = card.Id }, card);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CreditCard>> Update(int id, CreditCardCreateDto dto, [FromQuery] bool skipSnapshot = false)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var duplicate = await _db.CreditCards.AnyAsync(c => c.UserId == UserId && c.Id != id && c.CardName == dto.CardName.Trim());
        if (duplicate)
            return Conflict(new { message = $"A credit card named '{dto.CardName.Trim()}' already exists." });

        if (!skipSnapshot && card.LastStatementDate.HasValue &&
            (card.LastStatementDate != dto.LastStatementDate || card.CurrentBalance != dto.CurrentBalance))
        {
            _db.StatementHistories.Add(new StatementHistory
            {
                CreditCardId = card.Id,
                UserId = UserId,
                StatementDate = card.LastStatementDate.Value,
                StatementBalance = card.CurrentBalance,
                MinimumPayment = card.MinimumPayment,
                CreditLimit = card.CreditLimit
            });
        }

        card.CardName = dto.CardName.Trim();
        card.CurrentBalance = dto.CurrentBalance;
        card.CreditLimit = dto.CreditLimit;
        card.AprPercent = dto.AprPercent;
        card.MinimumPayment = dto.MinimumPayment;
        card.DueDay = dto.DueDay;
        card.IsAutopay = dto.IsAutopay;
        card.PromoAprPercent = dto.PromoAprPercent;
        card.PromoEndDate = dto.PromoEndDate;
        card.LastStatementDate = dto.LastStatementDate;

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

    [HttpGet("{id}/statements")]
    public async Task<ActionResult<List<StatementHistory>>> GetStatements(int id)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var statements = await _db.StatementHistories
            .Where(s => s.CreditCardId == id && s.UserId == UserId)
            .OrderByDescending(s => s.StatementDate)
            .ToListAsync();

        return Ok(statements);
    }

    [HttpPost("{id}/statements")]
    public async Task<ActionResult<StatementHistory>> AddStatement(int id, [FromBody] StatementHistory dto)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var statement = new StatementHistory
        {
            CreditCardId = id,
            UserId = UserId,
            StatementDate = dto.StatementDate,
            StatementBalance = dto.StatementBalance,
            MinimumPayment = dto.MinimumPayment,
            CreditLimit = dto.CreditLimit
        };

        _db.StatementHistories.Add(statement);
        await _db.SaveChangesAsync();

        return Ok(statement);
    }

    [HttpPut("{id}/statements/{stmtId}")]
    public async Task<ActionResult<StatementHistory>> UpdateStatement(int id, int stmtId, [FromBody] StatementHistory dto)
    {
        var stmt = await _db.StatementHistories.FirstOrDefaultAsync(s => s.Id == stmtId && s.CreditCardId == id && s.UserId == UserId);
        if (stmt is null) return NotFound();

        stmt.StatementDate = dto.StatementDate;
        stmt.StatementBalance = dto.StatementBalance;
        stmt.MinimumPayment = dto.MinimumPayment;
        stmt.CreditLimit = dto.CreditLimit;

        await _db.SaveChangesAsync();
        return Ok(stmt);
    }

    [HttpDelete("{id}/statements/{stmtId}")]
    public async Task<ActionResult> DeleteStatement(int id, int stmtId)
    {
        var stmt = await _db.StatementHistories.FirstOrDefaultAsync(s => s.Id == stmtId && s.CreditCardId == id && s.UserId == UserId);
        if (stmt is null) return NotFound();

        _db.StatementHistories.Remove(stmt);
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

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            PaymentHistory payment = null!;
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                await _db.Entry(card).ReloadAsync();

                payment = new PaymentHistory
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
                    {
                        await _db.Entry(account).ReloadAsync();
                        account.CurrentBalance -= dto.AmountPaid;
                    }
                }

                _db.PaymentHistories.Add(payment);
                await _db.SaveChangesAsync();

                var movement = new MoneyMovement
                {
                    SourceType = dto.FromAccountId.HasValue ? MoneyMovementEntityType.BankAccount : MoneyMovementEntityType.External,
                    SourceId = dto.FromAccountId,
                    DestinationType = MoneyMovementEntityType.CreditCard,
                    DestinationId = id,
                    Amount = dto.AmountPaid,
                    MovementDate = dto.PaymentDate,
                    MovementType = MovementType.CardPayment,
                    Note = dto.Notes,
                    IsAutoGenerated = true,
                    RelatedPaymentId = payment.Id,
                    UserId = UserId
                };
                _db.MoneyMovements.Add(movement);
                await _db.SaveChangesAsync();

                await transaction.CommitAsync();
            });
            return Ok(payment);
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to record payment. Please try again." });
        }
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
