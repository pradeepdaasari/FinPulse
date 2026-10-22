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
    private readonly IDebtAggregationService _aggregationService;
    private readonly ICardSummaryService _cardSummaryService;

    public CreditCardsController(PulseDbContext db, IFinancialCalculationService calcService, IDebtAggregationService aggregationService, ICardSummaryService cardSummaryService)
    {
        _db = db;
        _calcService = calcService;
        _aggregationService = aggregationService;
        _cardSummaryService = cardSummaryService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<CreditCard>>> GetAll()
    {
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).OrderBy(c => c.CardName).ToListAsync();

        var summaries = new Dictionary<int, CardSummary>();
        foreach (var card in cards)
        {
            var summary = await _cardSummaryService.ComputeCardSummary(UserId, card);
            summaries[card.Id] = summary;
            if (summary.BalanceChanged)
            {
                try { await _db.SaveChangesAsync(); }
                catch { _db.Entry(card).State = EntityState.Unchanged; }
            }
        }

        var result = cards.Select(c => new
        {
            c.Id, c.CardName, c.CurrentBalance, c.CreditLimit, c.AprPercent,
            c.MinimumPayment, c.DueDay, c.BillingCycleDays, c.IsAutopay,
            c.PromoAprPercent, c.PromoEndDate, c.LastStatementDate,
            c.CreatedAt, c.UpdatedAt,
            Utilization = FinanceCalculationHelper.ComputeUtilization(c.CurrentBalance, c.CreditLimit),
            summaries[c.Id].RemainingMinimumPayment,
            summaries[c.Id].PostStatementPayments
        });
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetById(int id)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var s = await _cardSummaryService.ComputeCardSummary(UserId, card);
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

        var totalPaid = payments.Sum(p => p.AmountPaid);
        return Ok(new { Payments = payments, TotalPaid = totalPaid });
    }

    private async Task AutoAdvanceMatchingRecurring(string debtName)
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var today = TimeZoneHelper.UserToday(tz);
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
                if (rec.Frequency == RecurrenceFrequency.OneTime)
                {
                    rec.IsActive = false;
                }
                else
                {
                    rec.NextRunDate = rec.Frequency switch
                    {
                        RecurrenceFrequency.Daily => rec.NextRunDate.AddDays(rec.IntervalCount),
                        RecurrenceFrequency.Weekly => rec.NextRunDate.AddDays(7 * rec.IntervalCount),
                        RecurrenceFrequency.Biweekly => rec.NextRunDate.AddDays(14),
                        _ => rec.NextRunDate.AddMonths(rec.IntervalCount)
                    };
                    if (rec.EndDate.HasValue && rec.NextRunDate > rec.EndDate.Value)
                        rec.IsActive = false;
                }
                matched = true;
            }
        }

        if (matched) await _db.SaveChangesAsync();
    }

    [HttpGet("summary")]
    public async Task<ActionResult<CardSummaryDto>> GetSummary()
    {
        return Ok(await _aggregationService.GetCardSummaryAsync(UserId));
    }

    [HttpGet("{id}/activity-summary")]
    public async Task<ActionResult> GetActivitySummary(int id, [FromQuery] int? year, [FromQuery] int? month)
    {
        var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == id && c.UserId == UserId);
        if (card is null) return NotFound();

        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var now = TimeZoneHelper.UserNow(tz);
        var y = year ?? now.Year;
        var m = month ?? now.Month;

        IQueryable<DailyExpense> expenseQuery = _db.DailyExpenses
            .Where(e => e.UserId == UserId && e.FundingSourceType == FundingSourceType.CreditCard && e.FundingSourceId == id);

        IQueryable<PaymentHistory> paymentQuery = _db.PaymentHistories
            .Where(p => p.UserId == UserId && p.DebtType == DebtType.CreditCard && p.DebtId == id);

        if (year.HasValue || month.HasValue)
        {
            var (utcStart, utcEnd) = TimeZoneHelper.MonthRangeUtc(y, m, tz);
            expenseQuery = expenseQuery.Where(e => e.Date >= utcStart && e.Date < utcEnd);
            paymentQuery = paymentQuery.Where(p => p.PaymentDate >= utcStart && p.PaymentDate < utcEnd);
        }

        var totalCharges = await expenseQuery
            .Where(e => e.TransactionType == TransactionType.Expense || e.TransactionType == null)
            .SumAsync(e => e.Amount);
        var totalRefunds = await expenseQuery
            .Where(e => e.TransactionType == TransactionType.Refund)
            .SumAsync(e => e.Amount);
        var totalPayments = await paymentQuery.SumAsync(p => p.AmountPaid);

        var utilization = FinanceCalculationHelper.ComputeUtilization(card.CurrentBalance, card.CreditLimit);

        var today = now.Date;
        DateTime? nextDueDate = null;
        if (card.DueDay > 0)
        {
            var daysInMonth = DateTime.DaysInMonth(today.Year, today.Month);
            var dueDay = Math.Min(card.DueDay, daysInMonth);
            var thisMonth = new DateTime(today.Year, today.Month, dueDay);
            nextDueDate = thisMonth > today ? thisMonth : thisMonth.AddMonths(1);
        }

        return Ok(new
        {
            TotalCharges = Math.Round(totalCharges, 2),
            TotalRefunds = Math.Round(totalRefunds, 2),
            TotalPayments = Math.Round(totalPayments, 2),
            Utilization = utilization,
            NextDueDate = nextDueDate?.ToString("yyyy-MM-dd")
        });
    }
}
