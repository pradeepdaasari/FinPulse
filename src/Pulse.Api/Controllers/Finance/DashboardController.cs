using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models.Enums;
using Pulse.Core.Services;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly PulseDbContext _db;
    private readonly IFinancialCalculationService _calcService;
    private readonly ISnapshotService _snapshotService;
    private readonly IStreakService _streakService;

    public DashboardController(PulseDbContext db, IFinancialCalculationService calcService, ISnapshotService snapshotService, IStreakService streakService)
    {
        _db = db;
        _calcService = calcService;
        _snapshotService = snapshotService;
        _streakService = streakService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> GetSummary()
    {
        var allLoans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();
        var loans = allLoans.Where(l => l.NextPaymentDate == null || l.NextPaymentDate <= DateTime.UtcNow).ToList();

        var totalDebt = allLoans.Sum(l => l.CurrentBalance) + cards.Sum(c => c.CurrentBalance);
        var totalMonthlyPayment = loans.Sum(l => l.MonthlyEquivalentPayment) + cards.Sum(c => c.MinimumPayment);
        var numberOfDebts = allLoans.Count + cards.Count;

        // Calculate estimated debt-free date (max of all individual payoff dates)
        var payoffDates = new List<DateTime>();

        foreach (var loan in loans)
        {
            var remainingMonths = _calcService.CalculateRemainingMonths(loan);
            payoffDates.Add(DateTime.UtcNow.AddMonths(remainingMonths));
        }

        foreach (var card in cards)
        {
            var months = _calcService.CalculatePayoffMonths(
                card.CurrentBalance,
                card.AprPercent,
                card.MinimumPayment,
                card.PromoAprPercent,
                card.PromoEndDate);
            payoffDates.Add(DateTime.UtcNow.AddMonths(months));
        }

        var estimatedDebtFreeDate = payoffDates.Count > 0
            ? payoffDates.Max()
            : DateTime.UtcNow;

        // Upcoming payments within 7 days
        var today = DateTime.UtcNow.Date;
        var upcomingPayments = new List<UpcomingPaymentDto>();

        foreach (var loan in loans)
        {
            var dueDate = GetNextDueDate(loan.DueDay, today);
            var daysUntilDue = (dueDate - today).Days;

            if (daysUntilDue <= 7)
            {
                upcomingPayments.Add(new UpcomingPaymentDto
                {
                    DebtId = loan.Id,
                    DebtName = loan.LenderName,
                    DebtType = DebtType.PersonalLoan,
                    Amount = loan.MonthlyPayment,
                    DueDate = dueDate,
                    DaysUntilDue = daysUntilDue,
                    UrgencyLevel = GetUrgencyLevel(daysUntilDue)
                });
            }
        }

        foreach (var card in cards)
        {
            var dueDate = GetNextDueDate(card.DueDay, today);
            var daysUntilDue = (dueDate - today).Days;

            if (daysUntilDue <= 7)
            {
                upcomingPayments.Add(new UpcomingPaymentDto
                {
                    DebtId = card.Id,
                    DebtName = card.CardName,
                    DebtType = DebtType.CreditCard,
                    Amount = card.MinimumPayment,
                    DueDate = dueDate,
                    DaysUntilDue = daysUntilDue,
                    UrgencyLevel = GetUrgencyLevel(daysUntilDue)
                });
            }
        }

        var summary = new DashboardSummaryDto
        {
            TotalDebt = totalDebt,
            TotalMonthlyPayment = totalMonthlyPayment,
            EstimatedDebtFreeDate = estimatedDebtFreeDate,
            NumberOfDebts = numberOfDebts,
            UpcomingPayments = upcomingPayments.OrderBy(p => p.DaysUntilDue).ToList()
        };

        return Ok(summary);
    }

    [HttpGet("trends")]
    public async Task<ActionResult<TrendDataDto>> GetTrends([FromQuery] int months = 12)
    {
        var trends = await _snapshotService.GetTrendsAsync(UserId, months);
        return Ok(trends);
    }

    [HttpGet("streak")]
    public async Task<ActionResult<PaymentStreakDto>> GetStreak()
    {
        var streak = await _streakService.GetStreakAsync(UserId);
        return Ok(streak);
    }

    [HttpGet("countdown")]
    public async Task<ActionResult<DebtFreeCountdownDto>> GetCountdown()
    {
        var loans = await _db.PersonalLoans
            .Where(l => l.UserId == UserId)
            .Where(l => l.NextPaymentDate == null || l.NextPaymentDate <= DateTime.UtcNow)
            .ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();

        var projections = new List<DebtPayoffProjectionDto>();

        foreach (var loan in loans)
        {
            var remainingMonths = _calcService.CalculateRemainingMonths(loan);
            var payoffDate = DateTime.UtcNow.AddMonths(remainingMonths);
            var progress = loan.OriginalAmount > 0
                ? (1 - (loan.CurrentBalance / loan.OriginalAmount)) * 100
                : 0;

            projections.Add(new DebtPayoffProjectionDto
            {
                DebtName = loan.LenderName,
                DebtType = loan.LoanType.ToString(),
                CurrentBalance = loan.CurrentBalance,
                MonthlyPayment = loan.MonthlyEquivalentPayment,
                ProjectedPayoffDate = payoffDate,
                RemainingMonths = remainingMonths,
                ProgressPercent = Math.Round(Math.Max(0, Math.Min(100, progress)), 1)
            });
        }

        foreach (var card in cards)
        {
            var months = _calcService.CalculatePayoffMonths(
                card.CurrentBalance, card.AprPercent, card.MinimumPayment,
                card.PromoAprPercent, card.PromoEndDate);
            var payoffDate = DateTime.UtcNow.AddMonths(months);

            projections.Add(new DebtPayoffProjectionDto
            {
                DebtName = card.CardName,
                DebtType = "CreditCard",
                CurrentBalance = card.CurrentBalance,
                MonthlyPayment = card.MinimumPayment,
                ProjectedPayoffDate = payoffDate,
                RemainingMonths = months,
                ProgressPercent = 0
            });
        }

        projections = projections.OrderBy(p => p.ProjectedPayoffDate).ToList();
        var overallDate = projections.Count > 0 ? projections.Max(p => p.ProjectedPayoffDate) : DateTime.UtcNow;
        var overallMonths = projections.Count > 0 ? projections.Max(p => p.RemainingMonths) : 0;

        return Ok(new DebtFreeCountdownDto
        {
            OverallDebtFreeDate = overallDate,
            OverallRemainingMonths = overallMonths,
            Projections = projections
        });
    }

    [HttpGet("financial-summary")]
    public async Task<ActionResult> GetFinancialSummary([FromQuery] int? year, [FromQuery] int? month)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;
        var startDate = new DateTime(targetYear, targetMonth, 1);
        var endDate = startDate.AddMonths(1);

        var transactions = await _db.DailyExpenses
            .Include(e => e.Category)
            .Where(e => e.UserId == UserId && e.Date >= startDate && e.Date < endDate)
            .ToListAsync();

        var totalIncome = transactions.Where(t => t.TransactionType == TransactionType.Income).Sum(t => t.Amount);
        var totalExpenses = transactions.Where(t => t.TransactionType == TransactionType.Expense || t.TransactionType == null).Sum(t => t.Amount);

        var tradingGains = transactions
            .Where(t => t.TransactionType == TransactionType.Income && t.Category != null && t.Category.Name == "Trading Gains")
            .Sum(t => t.Amount);
        var tradingLosses = transactions
            .Where(t => t.TransactionType == TransactionType.Expense && t.Category != null && t.Category.Name == "Trading Losses")
            .Sum(t => t.Amount);

        var savingsRate = totalIncome > 0 ? Math.Round((totalIncome - totalExpenses) / totalIncome * 100, 1) : 0;

        var bankAccounts = await _db.BankAccounts.Where(a => a.UserId == UserId).ToListAsync();
        var creditCards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();
        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();

        var totalBankBalance = bankAccounts.Sum(a => a.CurrentBalance);
        var totalCreditCardDebt = creditCards.Sum(c => c.CurrentBalance);
        var totalLoanDebt = loans.Sum(l => l.CurrentBalance);

        return Ok(new
        {
            TotalIncome = totalIncome,
            TotalExpenses = totalExpenses,
            NetCashFlow = totalIncome - totalExpenses,
            SavingsRate = savingsRate,
            TradingGains = tradingGains,
            TradingLosses = tradingLosses,
            TradingNetPnL = tradingGains - tradingLosses,
            BankAccounts = bankAccounts.Select(a => new
            {
                a.Id,
                Name = a.AccountName,
                Type = a.AccountType.ToString(),
                Balance = a.CurrentBalance
            }),
            CreditCards = creditCards.Select(c => new
            {
                c.Id,
                Name = c.CardName,
                Balance = c.CurrentBalance
            }),
            Loans = loans.Select(l => new
            {
                l.Id,
                Name = l.LenderName,
                Balance = l.CurrentBalance
            }),
            TotalBankBalance = totalBankBalance,
            TotalCreditCardDebt = totalCreditCardDebt,
            TotalLoanDebt = totalLoanDebt,
            NetWorth = totalBankBalance - totalCreditCardDebt - totalLoanDebt
        });
    }

    [HttpGet("net-worth-history")]
    public async Task<ActionResult> GetNetWorthHistory([FromQuery] int weeks = 52)
    {
        var today = DateTime.UtcNow.Date;
        var bankBalance = await _db.BankAccounts.Where(a => a.UserId == UserId).SumAsync(a => a.CurrentBalance);
        var ccDebt = await _db.CreditCards.Where(c => c.UserId == UserId).SumAsync(c => c.CurrentBalance);
        var loanDebt = await _db.PersonalLoans.Where(l => l.UserId == UserId).SumAsync(l => l.CurrentBalance);

        // Auto-capture today's snapshot
        var existsToday = await _db.NetWorthSnapshots
            .AnyAsync(s => s.UserId == UserId && s.SnapshotDate == today);

        if (!existsToday)
        {
            _db.NetWorthSnapshots.Add(new Pulse.Core.Models.NetWorthSnapshot
            {
                UserId = UserId,
                SnapshotDate = today,
                TotalBankBalance = bankBalance,
                TotalCreditCardDebt = ccDebt,
                TotalLoanDebt = loanDebt,
                NetWorth = bankBalance - ccDebt - loanDebt
            });
            await _db.SaveChangesAsync();
        }

        // Backfill historical snapshots by reconstructing balances from transactions
        // Reconstruct if yesterday's snapshot is missing (means we haven't done a full backfill yet)
        var hasYesterday = await _db.NetWorthSnapshots
            .AnyAsync(s => s.UserId == UserId && s.SnapshotDate == today.AddDays(-1));
        if (!hasYesterday)
        {
            // Remove old interpolated/partial snapshots (keep today's real one)
            var oldSnapshots = await _db.NetWorthSnapshots
                .Where(s => s.UserId == UserId && s.SnapshotDate != today)
                .ToListAsync();
            _db.NetWorthSnapshots.RemoveRange(oldSnapshots);
            await _db.SaveChangesAsync();

            var existingDates = new HashSet<DateTime> { today };

            // Current balances per account
            var bankAccounts = await _db.BankAccounts
                .Where(a => a.UserId == UserId)
                .Select(a => new { a.Id, a.CurrentBalance })
                .ToListAsync();
            var creditCards = await _db.CreditCards
                .Where(c => c.UserId == UserId)
                .Select(c => new { c.Id, c.CurrentBalance })
                .ToListAsync();
            var personalLoans = await _db.PersonalLoans
                .Where(l => l.UserId == UserId)
                .Select(l => new { l.Id, l.CurrentBalance })
                .ToListAsync();

            // All payment history for debt reconstruction
            var payments = await _db.PaymentHistories
                .Where(p => p.UserId == UserId)
                .Select(p => new { p.DebtType, p.DebtId, p.AmountPaid, p.PaymentDate, p.FromAccountId })
                .ToListAsync();

            // All daily expenses for bank account reconstruction
            var expenses = await _db.DailyExpenses
                .Where(e => e.UserId == UserId)
                .Select(e => new { e.Date, e.Amount, e.TransactionType, e.FundingSourceType, e.FundingSourceId, e.ToFundingSourceId })
                .ToListAsync();

            var cutoffDate = today.AddDays(-weeks * 7);
            var snapshotsToAdd = new List<Pulse.Core.Models.NetWorthSnapshot>();

            for (var d = cutoffDate; d < today; d = d.AddDays(1))
            {
                if (existingDates.Contains(d)) continue;

                // Reconstruct bank balances: current - income after date + expenses after date
                var totalBank = 0m;
                foreach (var acct in bankAccounts)
                {
                    var bal = acct.CurrentBalance;
                    var acctExpenses = expenses.Where(e =>
                        e.Date > d &&
                        e.FundingSourceType == FundingSourceType.BankAccount &&
                        e.FundingSourceId == acct.Id);

                    foreach (var e in acctExpenses)
                    {
                        if (e.TransactionType == TransactionType.Income)
                            bal -= e.Amount; // remove income that came after this date
                        else if (e.TransactionType == TransactionType.Expense || e.TransactionType == null)
                            bal += e.Amount; // add back expenses that left after this date
                        else if (e.TransactionType == TransactionType.Transfer)
                            bal += e.Amount; // add back transfers out
                    }

                    // Transfers INTO this account after the date
                    var transfersIn = expenses.Where(e =>
                        e.Date > d &&
                        e.TransactionType == TransactionType.Transfer &&
                        e.ToFundingSourceId == acct.Id);
                    foreach (var t in transfersIn)
                        bal -= t.Amount;

                    // Payments made FROM this account reduce bank balance
                    var paymentsFrom = payments.Where(p =>
                        p.PaymentDate.Date > d && p.FromAccountId == acct.Id);
                    foreach (var p in paymentsFrom)
                        bal += p.AmountPaid; // add back payments that reduced balance after this date

                    // Refunds back to this account after the date
                    var refunds = expenses.Where(e =>
                        e.Date > d &&
                        e.TransactionType == TransactionType.Refund &&
                        e.FundingSourceType == FundingSourceType.BankAccount &&
                        e.FundingSourceId == acct.Id);
                    foreach (var r in refunds)
                        bal -= r.Amount;

                    totalBank += bal;
                }

                // Reconstruct credit card balances: current + payments after date
                var totalCC = 0m;
                foreach (var card in creditCards)
                {
                    var bal = card.CurrentBalance;
                    var cardPayments = payments.Where(p =>
                        p.PaymentDate.Date > d &&
                        p.DebtType == DebtType.CreditCard &&
                        p.DebtId == card.Id);
                    foreach (var p in cardPayments)
                        bal += p.AmountPaid; // balance was higher before these payments

                    // Charges on this card after the date
                    var charges = expenses.Where(e =>
                        e.Date > d &&
                        e.FundingSourceType == FundingSourceType.CreditCard &&
                        e.FundingSourceId == card.Id &&
                        (e.TransactionType == TransactionType.Expense || e.TransactionType == null));
                    foreach (var c in charges)
                        bal -= c.Amount; // these charges increased balance after the date

                    // Refunds to this card after the date
                    var ccRefunds = expenses.Where(e =>
                        e.Date > d &&
                        e.TransactionType == TransactionType.Refund &&
                        e.FundingSourceType == FundingSourceType.CreditCard &&
                        e.FundingSourceId == card.Id);
                    foreach (var r in ccRefunds)
                        bal += r.Amount; // refund decreased balance after date

                    totalCC += bal;
                }

                // Reconstruct loan balances: current + payments after date
                var totalLoan = 0m;
                foreach (var loan in personalLoans)
                {
                    var bal = loan.CurrentBalance;
                    var loanPayments = payments.Where(p =>
                        p.PaymentDate.Date > d &&
                        p.DebtType == DebtType.PersonalLoan &&
                        p.DebtId == loan.Id);
                    foreach (var p in loanPayments)
                        bal += p.AmountPaid;
                    totalLoan += bal;
                }

                snapshotsToAdd.Add(new Pulse.Core.Models.NetWorthSnapshot
                {
                    UserId = UserId,
                    SnapshotDate = d,
                    TotalBankBalance = totalBank,
                    TotalCreditCardDebt = totalCC,
                    TotalLoanDebt = totalLoan,
                    NetWorth = totalBank - totalCC - totalLoan
                });
            }

            if (snapshotsToAdd.Count > 0)
            {
                _db.NetWorthSnapshots.AddRange(snapshotsToAdd);
                await _db.SaveChangesAsync();
            }
        }

        var cutoff = today.AddDays(-weeks * 7);
        var snapshots = await _db.NetWorthSnapshots
            .Where(s => s.UserId == UserId && s.SnapshotDate >= cutoff)
            .OrderBy(s => s.SnapshotDate)
            .Select(s => new
            {
                Date = s.SnapshotDate,
                s.TotalBankBalance,
                s.TotalCreditCardDebt,
                s.TotalLoanDebt,
                s.NetWorth
            })
            .ToListAsync();

        return Ok(snapshots);
    }

    private static DateTime GetNextDueDate(int dueDay, DateTime today)
    {
        var thisMonth = new DateTime(today.Year, today.Month, Math.Min(dueDay, DateTime.DaysInMonth(today.Year, today.Month)));
        if (thisMonth >= today)
            return thisMonth;

        var nextMonth = today.AddMonths(1);
        return new DateTime(nextMonth.Year, nextMonth.Month, Math.Min(dueDay, DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month)));
    }

    private static string GetUrgencyLevel(int daysUntilDue)
    {
        return daysUntilDue switch
        {
            <= 2 => "Critical",
            <= 5 => "Warning",
            _ => "Normal"
        };
    }
}
