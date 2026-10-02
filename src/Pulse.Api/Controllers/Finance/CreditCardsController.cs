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

        foreach (var card in cards)
        {
            var summary = await ComputeCardSummary(card);
            if (summary.BalanceChanged)
            {
                try { await _db.SaveChangesAsync(); }
                catch { _db.Entry(card).State = EntityState.Unchanged; }
            }
        }

        return Ok(cards);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var s = await ComputeCardSummary(card);
        if (s.BalanceChanged) await _db.SaveChangesAsync();

        return Ok(new
        {
            card.Id,
            card.CardName,
            card.CurrentBalance,
            card.CreditLimit,
            card.AprPercent,
            card.MinimumPayment,
            card.DueDay,
            card.BillingCycleDays,
            card.IsAutopay,
            card.PromoAprPercent,
            card.PromoEndDate,
            card.LastStatementDate,
            card.CreatedAt,
            card.UpdatedAt,
            s.PostStatementCharges,
            s.PostStatementRefunds,
            s.PostStatementPayments,
            s.RemainingStatementBalance,
            s.RemainingMinimumPayment,
            s.StatementBalance,
            s.StatementDate
        });
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

            await AutoAdvanceMatchingRecurring(card.CardName);

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

    private record CardSummary(
        decimal PostStatementCharges, decimal PostStatementRefunds, decimal PostStatementPayments,
        decimal RemainingStatementBalance, decimal RemainingMinimumPayment,
        decimal StatementBalance, DateTime? StatementDate, bool BalanceChanged);

    private async Task<CardSummary> ComputeCardSummary(CreditCard card)
    {
        var stmt = await _db.StatementHistories
            .Where(s => s.UserId == UserId && s.CreditCardId == card.Id)
            .OrderByDescending(s => s.StatementDate)
            .FirstOrDefaultAsync();

        if (stmt is null)
            return new(0, 0, 0, card.CurrentBalance, card.MinimumPayment,
                card.CurrentBalance, null, false);

        var stmtDate = stmt.StatementDate;
        var stmtBal = stmt.StatementBalance;
        var minPay = stmt.MinimumPayment;

        var postCharges = await _db.DailyExpenses
            .Where(e => e.UserId == UserId &&
                e.FundingSourceType == FundingSourceType.CreditCard &&
                e.FundingSourceId == card.Id &&
                e.Date > stmtDate &&
                e.TransactionType == TransactionType.Expense)
            .SumAsync(e => e.Amount);

        var postRefunds = await _db.DailyExpenses
            .Where(e => e.UserId == UserId &&
                e.FundingSourceType == FundingSourceType.CreditCard &&
                e.FundingSourceId == card.Id &&
                e.Date > stmtDate &&
                e.TransactionType == TransactionType.Refund)
            .SumAsync(e => e.Amount);

        var postPayments = await _db.PaymentHistories
            .Where(p => p.UserId == UserId &&
                p.DebtType == DebtType.CreditCard &&
                p.DebtId == card.Id &&
                p.PaymentDate > stmtDate)
            .SumAsync(p => p.AmountPaid);

        var computed = Math.Round(stmtBal + postCharges - postRefunds - postPayments, 2);
        var changed = computed != card.CurrentBalance;
        if (changed) card.CurrentBalance = computed;

        return new(
            Math.Round(postCharges, 2),
            Math.Round(postRefunds, 2),
            Math.Round(postPayments, 2),
            Math.Round(Math.Max(0, stmtBal - postPayments - postRefunds), 2),
            Math.Round(Math.Max(0, minPay - postPayments), 2),
            stmtBal,
            stmtDate,
            changed);
    }

    private async Task AutoAdvanceMatchingRecurring(string debtName)
    {
        var today = DateTime.UtcNow.Date;
        var name = debtName.ToLower();
        var dueRecurring = await _db.RecurringTransactions
            .Where(r => r.UserId == UserId && r.IsActive && r.NextRunDate <= today)
            .ToListAsync();

        var matched = false;
        foreach (var rec in dueRecurring)
        {
            var desc = rec.Description?.ToLower() ?? "";
            var merch = rec.Merchant?.ToLower() ?? "";
            if (desc == name || merch == name ||
                (desc.Length > 0 && (name.Contains(desc) || desc.Contains(name))) ||
                (merch.Length > 0 && (name.Contains(merch) || merch.Contains(name))))
            {
                rec.NextRunDate = rec.Frequency switch
                {
                    RecurrenceFrequency.Daily => rec.NextRunDate.AddDays(1),
                    RecurrenceFrequency.Weekly => rec.NextRunDate.AddDays(7),
                    RecurrenceFrequency.Biweekly => rec.NextRunDate.AddDays(14),
                    _ => rec.NextRunDate.AddMonths(1)
                };
                if (rec.EndDate.HasValue && rec.NextRunDate > rec.EndDate.Value)
                    rec.IsActive = false;
                matched = true;
            }
        }

        if (matched) await _db.SaveChangesAsync();
    }
}
