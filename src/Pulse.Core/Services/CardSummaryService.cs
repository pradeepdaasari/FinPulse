using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public record CardSummary(
    decimal PostStatementCharges, decimal PostStatementRefunds, decimal PostStatementPayments,
    decimal RemainingStatementBalance, decimal RemainingMinimumPayment,
    decimal StatementBalance, DateTime? StatementDate, bool BalanceChanged);

public interface ICardSummaryService
{
    Task<CardSummary> ComputeCardSummary(string userId, CreditCard card);
}

public class CardSummaryService : ICardSummaryService
{
    private readonly PulseDbContext _db;

    public CardSummaryService(PulseDbContext db) => _db = db;

    public async Task<CardSummary> ComputeCardSummary(string userId, CreditCard card)
    {
        var stmt = await _db.StatementHistories
            .Where(s => s.UserId == userId && s.CreditCardId == card.Id)
            .OrderByDescending(s => s.StatementDate)
            .FirstOrDefaultAsync();

        if (stmt is null)
            return new(0, 0, 0, card.CurrentBalance, card.MinimumPayment,
                card.CurrentBalance, null, false);

        var stmtDate = stmt.StatementDate;
        var stmtBal = stmt.StatementBalance;
        var minPay = stmt.MinimumPayment;

        var postCharges = await _db.DailyExpenses
            .Where(e => e.UserId == userId &&
                e.FundingSourceType == FundingSourceType.CreditCard &&
                e.FundingSourceId == card.Id &&
                e.Date > stmtDate &&
                e.TransactionType == TransactionType.Expense)
            .SumAsync(e => e.Amount);

        var postRefunds = await _db.DailyExpenses
            .Where(e => e.UserId == userId &&
                e.FundingSourceType == FundingSourceType.CreditCard &&
                e.FundingSourceId == card.Id &&
                e.Date > stmtDate &&
                e.TransactionType == TransactionType.Refund)
            .SumAsync(e => e.Amount);

        var postPayments = await _db.PaymentHistories
            .Where(p => p.UserId == userId &&
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
}
