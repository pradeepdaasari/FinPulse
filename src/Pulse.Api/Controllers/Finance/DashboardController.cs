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
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userNow = TimeZoneHelper.UserNow(tz);
        var allLoans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();
        var activeLoans = allLoans.Where(l => l.CurrentBalance > 0).ToList();

        var totalDebt = allLoans.Sum(l => l.CurrentBalance) + cards.Sum(c => c.CurrentBalance);
        var totalMonthlyPayment = activeLoans.Sum(l => l.MonthlyEquivalentPayment) + cards.Sum(c => c.MinimumPayment);
        var numberOfDebts = allLoans.Count + cards.Count;

        // Calculate estimated debt-free date (max of all individual payoff dates)
        var payoffDates = new List<DateTime>();

        foreach (var loan in activeLoans)
        {
            var remainingMonths = _calcService.CalculateRemainingMonths(loan);
            if (remainingMonths > 0 && remainingMonths < 999)
                payoffDates.Add(userNow.AddMonths(remainingMonths));
        }

        foreach (var card in cards)
        {
            var months = _calcService.CalculatePayoffMonths(
                card.CurrentBalance,
                card.AprPercent,
                card.MinimumPayment,
                card.PromoAprPercent,
                card.PromoEndDate);
            if (months > 0)
                payoffDates.Add(userNow.AddMonths(months));
        }

        var estimatedDebtFreeDate = payoffDates.Count > 0
            ? payoffDates.Max()
            : userNow;

        // Upcoming payments within 7 days
        var today = TimeZoneHelper.UserToday(tz);
        var upcomingPayments = new List<UpcomingPaymentDto>();

        foreach (var loan in activeLoans)
        {
            var dueDate = FinanceCalculationHelper.GetNextLoanDueDate(loan, today);
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
            var dueDate = FinanceCalculationHelper.GetNextMonthlyDueDate(card.DueDay, today);
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

        var totalInterestPaid = await _db.PaymentHistories
            .Where(p => p.UserId == UserId && p.InterestAmount.HasValue)
            .SumAsync(p => p.InterestAmount!.Value);

        var summary = new DashboardSummaryDto
        {
            TotalDebt = totalDebt,
            TotalMonthlyPayment = totalMonthlyPayment,
            EstimatedDebtFreeDate = estimatedDebtFreeDate,
            NumberOfDebts = numberOfDebts,
            TotalInterestPaid = totalInterestPaid,
            UpcomingPayments = upcomingPayments.OrderBy(p => p.DaysUntilDue).ToList()
        };

        return Ok(summary);
    }

    [HttpGet("trends")]
    public async Task<ActionResult<TrendDataDto>> GetTrends([FromQuery] int months = 12)
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var trends = await _snapshotService.GetTrendsAsync(UserId, TimeZoneHelper.UserNow(tz), months);
        return Ok(trends);
    }

    [HttpGet("streak")]
    public async Task<ActionResult<PaymentStreakDto>> GetStreak()
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var streak = await _streakService.GetStreakAsync(UserId, TimeZoneHelper.UserNow(tz));
        return Ok(streak);
    }

    [HttpGet("countdown")]
    public async Task<ActionResult<DebtFreeCountdownDto>> GetCountdown()
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userNow = TimeZoneHelper.UserNow(tz);
        var loans = await _db.PersonalLoans
            .Where(l => l.UserId == UserId && l.CurrentBalance > 0)
            .ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();

        var projections = new List<DebtPayoffProjectionDto>();

        foreach (var loan in loans)
        {
            var remainingMonths = Math.Min(_calcService.CalculateRemainingMonths(loan), 600);
            var payoffDate = userNow.AddMonths(remainingMonths);
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
            var rawMonths = _calcService.CalculatePayoffMonths(
                card.CurrentBalance, card.AprPercent, card.MinimumPayment,
                card.PromoAprPercent, card.PromoEndDate);
            var isNever = rawMonths < 0;
            var months = isNever ? 0 : rawMonths;
            var payoffDate = isNever ? DateTime.MinValue : userNow.AddMonths(months);

            projections.Add(new DebtPayoffProjectionDto
            {
                DebtName = card.CardName,
                DebtType = "CreditCard",
                CurrentBalance = card.CurrentBalance,
                MonthlyPayment = card.MinimumPayment,
                ProjectedPayoffDate = payoffDate,
                RemainingMonths = months,
                ProgressPercent = 0,
                IsNeverPayoff = isNever
            });
        }

        projections = projections.OrderBy(p => p.IsNeverPayoff).ThenBy(p => p.ProjectedPayoffDate).ToList();
        var payable = projections.Where(p => !p.IsNeverPayoff).ToList();
        var hasNever = projections.Any(p => p.IsNeverPayoff);
        var overallDate = payable.Count > 0 ? payable.Max(p => p.ProjectedPayoffDate) : userNow;
        var overallMonths = payable.Count > 0 ? payable.Max(p => p.RemainingMonths) : 0;

        return Ok(new DebtFreeCountdownDto
        {
            OverallDebtFreeDate = overallDate,
            OverallRemainingMonths = overallMonths,
            HasNeverPayoffDebts = hasNever,
            Projections = projections
        });
    }

    [HttpGet("financial-summary")]
    public async Task<ActionResult> GetFinancialSummary([FromQuery] int? year, [FromQuery] int? month)
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var now = TimeZoneHelper.UserNow(tz);
        var targetYear = year ?? now.Year;
        var targetMonth = month ?? now.Month;
        var (startDate, endDate) = TimeZoneHelper.MonthRangeUtc(targetYear, targetMonth, tz);

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

        var cardIds = creditCards.Select(c => c.Id).ToList();
        var postStmtCharges = new Dictionary<int, decimal>();
        var postStmtPayments = new Dictionary<int, decimal>();
        foreach (var c in creditCards.Where(c => c.LastStatementDate.HasValue))
        {
            postStmtCharges[c.Id] = await _db.DailyExpenses
                .Where(e => e.UserId == UserId && e.FundingSourceType == FundingSourceType.CreditCard
                    && e.FundingSourceId == c.Id && e.Date > c.LastStatementDate.Value
                    && e.TransactionType != TransactionType.CardPayment)
                .SumAsync(e => (decimal?)e.Amount ?? 0);
            postStmtPayments[c.Id] = await _db.PaymentHistories
                .Where(p => p.UserId == UserId && p.DebtType == DebtType.CreditCard
                    && p.DebtId == c.Id && p.PaymentDate > c.LastStatementDate.Value)
                .SumAsync(p => (decimal?)p.AmountPaid ?? 0);
        }

        var totalCreditCardDebt = creditCards.Sum(c =>
            c.CurrentBalance
            + (postStmtCharges.TryGetValue(c.Id, out var ch) ? ch : 0)
            - (postStmtPayments.TryGetValue(c.Id, out var py) ? py : 0));
        var totalLoanDebt = loans.Sum(l => l.CurrentBalance);

        var totalDebt = totalCreditCardDebt + totalLoanDebt;
        var totalMonthlyPayment = loans.Sum(l => l.MonthlyEquivalentPayment) + creditCards.Sum(c => c.MinimumPayment);
        var debtPaidPercent = totalDebt <= 0 ? 0m
            : Math.Min(100, Math.Round(totalMonthlyPayment / (totalDebt + totalMonthlyPayment) * 100, 1));

        var daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
        var dayOfMonth = now.Day;
        var paceRatio = (decimal)dayOfMonth / daysInMonth;
        var spendRatio = totalIncome > 0 ? totalExpenses / totalIncome : (totalExpenses > 0 ? 2m : 0m);
        var paceStatus = spendRatio <= paceRatio * 0.85m ? "ahead"
            : spendRatio <= paceRatio * 1.1m ? "on-track" : "over";
        var daysLeft = daysInMonth - dayOfMonth;
        var spentPct = totalIncome > 0 ? (int)Math.Round(totalExpenses / totalIncome * 100) : 0;
        var paceMessage = totalIncome <= 0
            ? (totalExpenses == 0
                ? $"No spending recorded yet — {daysLeft} days left this month."
                : $"Spent {totalExpenses:C0} with {daysLeft} days left. Log income to track pace.")
            : paceStatus == "ahead" ? $"{spentPct}% of income spent, {daysLeft} days left — under budget!"
            : paceStatus == "on-track" ? $"{spentPct}% of income spent, {daysLeft} days left — on track."
            : $"{spentPct}% of income spent, {daysLeft} days left — over budget.";

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
                    + (postStmtCharges.TryGetValue(c.Id, out var ch) ? ch : 0)
                    - (postStmtPayments.TryGetValue(c.Id, out var py) ? py : 0)
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
            NetWorth = totalBankBalance - totalCreditCardDebt - totalLoanDebt,
            DebtPaidPercent = debtPaidPercent,
            PaceStatus = paceStatus,
            PaceMessage = paceMessage
        });
    }

    [HttpGet("net-worth-history")]
    public async Task<ActionResult> GetNetWorthHistory([FromQuery] int weeks = 52)
    {
        weeks = Math.Clamp(weeks, 1, 520);
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var today = TimeZoneHelper.UserToday(tz);
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
            var existingSnapshotDates = await _db.NetWorthSnapshots
                .Where(s => s.UserId == UserId)
                .Select(s => s.SnapshotDate)
                .ToListAsync();
            var existingDatesSet = new HashSet<DateTime>(existingSnapshotDates);

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
                .Select(p => new { p.DebtType, p.DebtId, p.AmountPaid, p.PrincipalAmount, p.PaymentDate, p.FromAccountId })
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
                if (existingDatesSet.Contains(d)) continue;

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
                        bal += p.PrincipalAmount ?? p.AmountPaid;
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

    private static string GetUrgencyLevel(int daysUntilDue)
    {
        return daysUntilDue switch
        {
            <= 2 => "Critical",
            <= 5 => "Warning",
            _ => "Normal"
        };
    }

    [HttpGet("today-glance")]
    public async Task<ActionResult> GetTodayGlance()
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userToday = TimeZoneHelper.UserToday(tz);

        // Payments due today (from upcoming payments within 7 days)
        var allLoans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();
        var paymentsDueToday = new List<object>();
        decimal paymentsTotalDue = 0;

        foreach (var loan in allLoans)
        {
            var dueDate = FinanceCalculationHelper.GetNextLoanDueDate(loan, userToday);
            if (dueDate == userToday)
            {
                paymentsDueToday.Add(new { DebtName = loan.LenderName, Amount = loan.MonthlyPayment, DebtType = "PersonalLoan" });
                paymentsTotalDue += loan.MonthlyPayment;
            }
        }
        foreach (var card in cards)
        {
            var dueDate = FinanceCalculationHelper.GetNextMonthlyDueDate(card.DueDay, userToday);
            if (dueDate == userToday)
            {
                paymentsDueToday.Add(new { DebtName = card.CardName, Amount = card.MinimumPayment, DebtType = "CreditCard" });
                paymentsTotalDue += card.MinimumPayment;
            }
        }

        // Today's spending
        var (dayStart, dayEnd) = TimeZoneHelper.MonthRangeUtc(userToday.Year, userToday.Month, tz);
        var todayUtcStart = userToday.Date - tz.GetUtcOffset(userToday);
        var todayUtcEnd = todayUtcStart.AddDays(1);
        var todaySpending = await _db.DailyExpenses
            .Where(e => e.UserId == UserId && e.Date >= todayUtcStart && e.Date < todayUtcEnd
                && (e.TransactionType == TransactionType.Expense || e.TransactionType == null))
            .SumAsync(e => (decimal?)e.Amount ?? 0);

        // Recurring bills due today or overdue
        var recurring = await _db.RecurringTransactions
            .Where(r => r.UserId == UserId && r.IsActive && r.RecurringType != RecurringType.Budget
                && r.NextRunDate.Date <= userToday)
            .Select(r => new { Name = r.Description, r.Amount, r.NextRunDate })
            .ToListAsync();
        var recurringDueTotal = recurring.Sum(r => r.Amount);

        // Upcoming payments in the next 5 days (excluding today) — skip already-paid
        var upcomingLimit = userToday.AddDays(5);
        var upcomingPayments = new List<UpcomingGlanceItem>();

        var (utcMonthStart, utcMonthEnd) = TimeZoneHelper.MonthRangeUtc(userToday.Year, userToday.Month, tz);
        var monthPayments = await _db.PaymentHistories
            .Where(p => p.UserId == UserId && p.PaymentDate >= utcMonthStart && p.PaymentDate < utcMonthEnd)
            .ToListAsync();

        foreach (var loan in allLoans)
        {
            if (loan.CurrentBalance <= 0) continue;
            var dueDate = FinanceCalculationHelper.GetNextLoanDueDate(loan, userToday);
            var days = (int)(dueDate - userToday).TotalDays;
            if (days >= 1 && days <= 5)
            {
                var paid = monthPayments
                    .Where(p => p.DebtId == loan.Id && p.DebtType == DebtType.PersonalLoan)
                    .Sum(p => p.AmountPaid);
                if (paid >= loan.MonthlyPayment) continue;
                upcomingPayments.Add(new(loan.LenderName, loan.MonthlyPayment, dueDate.ToString("yyyy-MM-dd"), days, "loan", loan.IsAutopay));
            }
        }
        foreach (var card in cards)
        {
            var dueDate = FinanceCalculationHelper.GetNextMonthlyDueDate(card.DueDay, userToday);
            var days = (int)(dueDate - userToday).TotalDays;
            if (days >= 1 && days <= 5)
            {
                if (card.CurrentBalance <= 0) continue;
                var paid = monthPayments
                    .Where(p => p.DebtId == card.Id && p.DebtType == DebtType.CreditCard)
                    .Sum(p => p.AmountPaid);
                if (paid >= card.MinimumPayment) continue;
                upcomingPayments.Add(new(card.CardName, card.MinimumPayment, dueDate.ToString("yyyy-MM-dd"), days, "card", card.IsAutopay));
            }
        }
        var upcomingRecurring = await _db.RecurringTransactions
            .Where(r => r.UserId == UserId && r.IsActive && r.RecurringType != RecurringType.Budget
                && r.NextRunDate.Date > userToday && r.NextRunDate.Date <= upcomingLimit)
            .Select(r => new { r.Description, r.Amount, r.NextRunDate })
            .ToListAsync();
        foreach (var bill in upcomingRecurring)
        {
            var days = (int)(bill.NextRunDate.Date - userToday).TotalDays;
            upcomingPayments.Add(new(bill.Description, bill.Amount, bill.NextRunDate.Date.ToString("yyyy-MM-dd"), days, "recurring", false));
        }
        upcomingPayments = upcomingPayments.OrderBy(p => p.DaysUntilDue).ToList();
        var upcomingTotal = upcomingPayments.Sum(p => p.MonthlyPayment);

        return Ok(new
        {
            PaymentsDueToday = paymentsDueToday,
            PaymentsTotalDue = paymentsTotalDue,
            TodaySpending = todaySpending,
            RecurringDue = recurring,
            RecurringDueCount = recurring.Count,
            RecurringDueTotal = recurringDueTotal,
            UpcomingPayments = upcomingPayments,
            UpcomingTotal = upcomingTotal
        });
    }

    [HttpGet("insights")]
    public async Task<ActionResult> GetInsights()
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var now = TimeZoneHelper.UserNow(tz);
        var (currentStart, currentEnd) = TimeZoneHelper.MonthRangeUtc(now.Year, now.Month, tz);
        var prevDate = new DateTime(now.Year, now.Month, 1).AddMonths(-1);
        var (prevStart, prevEnd) = TimeZoneHelper.MonthRangeUtc(prevDate.Year, prevDate.Month, tz);

        var tradingCatIds = await _db.CustomCategories
            .Where(c => c.UserId == UserId && c.Name.Contains("Trading"))
            .Select(c => c.Id).ToListAsync();

        var currentExpenses = await _db.DailyExpenses
            .Include(e => e.Category)
            .Where(e => e.UserId == UserId && e.TransactionType == TransactionType.Expense
                && e.Date >= currentStart && e.Date < currentEnd
                && (!e.CategoryId.HasValue || !tradingCatIds.Contains(e.CategoryId.Value)))
            .ToListAsync();

        var prevExpenses = await _db.DailyExpenses
            .Include(e => e.Category)
            .Where(e => e.UserId == UserId && e.TransactionType == TransactionType.Expense
                && e.Date >= prevStart && e.Date < prevEnd
                && (!e.CategoryId.HasValue || !tradingCatIds.Contains(e.CategoryId.Value)))
            .ToListAsync();

        var currentTotal = currentExpenses.Sum(e => e.Amount);
        var previousTotal = prevExpenses.Sum(e => e.Amount);

        var results = new List<object>();

        if (previousTotal > 0)
        {
            var percentChange = (currentTotal - previousTotal) / previousTotal * 100;
            if (percentChange < -5)
                results.Add(new { Icon = "lightbulb", Text = $"Spending down {Math.Abs(Math.Round(percentChange))}% this month", Color = "green" });
            else if (percentChange > 10)
                results.Add(new { Icon = "trending_up", Text = $"Spending up {Math.Round(percentChange)}% vs last month", Color = "amber" });
        }

        // Category-level insights
        var currentByCategory = currentExpenses.Where(e => e.CategoryId.HasValue).GroupBy(e => e.CategoryId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));
        var prevByCategory = prevExpenses.Where(e => e.CategoryId.HasValue).GroupBy(e => e.CategoryId!.Value)
            .ToDictionary(g => g.Key, g => g.Sum(e => e.Amount));
        var categoryInfo = currentExpenses.Concat(prevExpenses)
            .Where(e => e.CategoryId.HasValue).GroupBy(e => e.CategoryId!.Value)
            .ToDictionary(g => g.Key, g => g.First().Category?.Name ?? "Unknown");

        var significantIncreases = currentByCategory
            .Where(kv => prevByCategory.TryGetValue(kv.Key, out var prev) && prev > 0 && ((kv.Value - prev) / prev * 100) > 20)
            .Select(kv => new { Name = categoryInfo.GetValueOrDefault(kv.Key, "Unknown"), Change = Math.Round((kv.Value - prevByCategory[kv.Key]) / prevByCategory[kv.Key] * 100) })
            .OrderByDescending(c => c.Change)
            .Take(2);

        foreach (var cat in significantIncreases)
        {
            results.Add(new { Icon = "warning", Text = $"{cat.Name} up {cat.Change}% vs last month", Color = "amber" });
            if (results.Count >= 3) break;
        }

        // Positive cash flow
        if (results.Count < 3)
        {
            var income = await _db.DailyExpenses
                .Where(e => e.UserId == UserId && e.TransactionType == TransactionType.Income
                    && e.Date >= currentStart && e.Date < currentEnd)
                .SumAsync(e => (decimal?)e.Amount ?? 0);
            var netCashFlow = income - currentTotal;
            if (netCashFlow > 0)
                results.Add(new { Icon = "savings", Text = $"Positive cash flow of {netCashFlow:C0}", Color = "green" });
        }

        return Ok(results.Take(3));
    }

    [HttpGet("monthly-payments")]
    public async Task<ActionResult> GetMonthlyPayments()
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var now = TimeZoneHelper.UserNow(tz);
        var year = now.Year;
        var month = now.Month;
        var today = now.Date;
        var monthStart = new DateTime(year, month, 1);
        var monthEnd = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();

        var (utcMonthStart, utcMonthEnd) = TimeZoneHelper.MonthRangeUtc(year, month, tz);
        var allPayments = await _db.PaymentHistories
            .Where(p => p.UserId == UserId && p.PaymentDate >= utcMonthStart && p.PaymentDate < utcMonthEnd)
            .ToListAsync();

        var rows = new List<object>();

        foreach (var loan in loans)
        {
            if (loan.CurrentBalance <= 0) continue;
            if (FinanceCalculationHelper.IsLoanDeferred(loan, today)) continue;

            var freq = loan.PaymentFrequency;
            var debtPayments = allPayments.Where(p => p.DebtId == loan.Id && p.DebtType == DebtType.PersonalLoan).ToList();
            var anchor = loan.NextPaymentDate?.Date ?? loan.StartDate.Date;
            var dateAnchor = freq == PaymentFrequency.Monthly
                ? new DateTime(year, month, Math.Min(loan.DueDay, DateTime.DaysInMonth(year, month)))
                : anchor;
            var dueDates = FinanceCalculationHelper.GetDatesInMonth(dateAnchor, freq, year, month);

            foreach (var dueDate in dueDates)
            {
                var nearbyPaid = freq == PaymentFrequency.Monthly
                    ? debtPayments.Sum(p => p.AmountPaid)
                    : debtPayments.Where(p => {
                        var pd = TimeZoneHelper.ToLocalDate(p.PaymentDate, tz);
                        return pd >= dueDate.AddDays(-7) && pd <= dueDate.AddDays(7);
                      }).Sum(p => p.AmountPaid);

                var amount = loan.MonthlyPayment;
                var isPaid = loan.CurrentBalance <= 0 || nearbyPaid >= amount;
                var (status, statusLabel) = FinanceCalculationHelper.ComputePaymentStatus(isPaid, dueDate, today);

                var daysUntil = (int)(dueDate - today).TotalDays;

                rows.Add(new
                {
                    Id = loan.Id, Name = loan.LenderName, Kind = "loan",
                    Icon = "account_balance", IconColor = "#007AFF",
                    DueDay = dueDate.Day, DueDate = dueDate.ToString("o"),
                    DueLabel = statusLabel, Amount = amount,
                    MinimumPayment = amount, PaidAmount = nearbyPaid,
                    Balance = loan.CurrentBalance, Apr = loan.AprPercent,
                    IsAutopay = loan.IsAutopay, Status = status, StatusLabel = statusLabel,
                    DebtType = "PersonalLoan", SubType = loan.LoanType.ToString(),
                    DaysUntilDue = daysUntil, MinimumPaid = false,
                    RecurringId = (int?)null, CategoryId = (int?)null
                });
            }
        }

        foreach (var card in cards)
        {
            var debtPayments = allPayments.Where(p => p.DebtId == card.Id && p.DebtType == DebtType.CreditCard).ToList();
            var dueDate = new DateTime(year, month, Math.Min(card.DueDay, monthEnd.Day));

            var nearbyPaid = debtPayments.Sum(p => p.AmountPaid);
            var amount = card.MinimumPayment;
            bool isPaid;
            if (card.CurrentBalance <= 0)
                isPaid = true;
            else if (card.LastStatementDate.HasValue && nearbyPaid > 0)
            {
                var latestPaymentDate = debtPayments.Max(p => p.PaymentDate);
                isPaid = card.LastStatementDate.Value > latestPaymentDate || nearbyPaid >= amount;
            }
            else
                isPaid = nearbyPaid >= amount;

            var (status, statusLabel) = FinanceCalculationHelper.ComputePaymentStatus(isPaid, dueDate, today);

            var cardDaysUntil = (int)(dueDate - today).TotalDays;
            var cardMinPaid = nearbyPaid > 0 && nearbyPaid >= amount;

            rows.Add(new
            {
                Id = card.Id, Name = card.CardName, Kind = "card",
                Icon = "credit_card", IconColor = "#5856D6",
                DueDay = dueDate.Day, DueDate = dueDate.ToString("o"),
                DueLabel = statusLabel, Amount = amount,
                MinimumPayment = amount, PaidAmount = nearbyPaid,
                Balance = card.CurrentBalance, Apr = card.AprPercent,
                IsAutopay = card.IsAutopay, Status = status, StatusLabel = statusLabel,
                DebtType = "CreditCard", SubType = (string?)null,
                DaysUntilDue = cardDaysUntil, MinimumPaid = cardMinPaid,
                RecurringId = (int?)null, CategoryId = (int?)null
            });
        }

        // Recurring bills
        var bills = await _db.RecurringTransactions
            .Include(r => r.Category)
            .Where(r => r.UserId == UserId && r.IsActive && r.RecurringType == RecurringType.Bill)
            .ToListAsync();

        var dailyExpenses = await _db.DailyExpenses
            .Where(e => e.UserId == UserId && e.Date >= utcMonthStart && e.Date < utcMonthEnd
                   && e.TransactionType == TransactionType.Expense)
            .ToListAsync();

        foreach (var bill in bills)
        {
            var dueDates = GetRecurringDueDatesInMonth(bill.NextRunDate, bill.Frequency, bill.IntervalCount, monthStart, monthEnd);
            foreach (var dueDate in dueDates)
            {
                var paidAmount = dailyExpenses
                    .Where(e => e.CategoryId == bill.CategoryId)
                    .Sum(e => e.Amount);
                var isPaid = paidAmount >= bill.Amount;
                var (status, statusLabel) = FinanceCalculationHelper.ComputePaymentStatus(isPaid, dueDate, today);
                var daysUntil = (int)(dueDate - today).TotalDays;

                rows.Add(new
                {
                    Id = bill.Id, Name = bill.Description, Kind = "recurring",
                    Icon = bill.Category?.Icon ?? "autorenew", IconColor = "#FF9500",
                    DueDay = dueDate.Day, DueDate = dueDate.ToString("o"),
                    DueLabel = statusLabel, Amount = bill.Amount,
                    MinimumPayment = (decimal?)null, PaidAmount = paidAmount,
                    Balance = (decimal?)null, Apr = (decimal?)null,
                    IsAutopay = true, Status = status, StatusLabel = statusLabel,
                    DebtType = (string?)null, SubType = (string?)null,
                    DaysUntilDue = daysUntil, MinimumPaid = false,
                    RecurringId = (int?)bill.Id, CategoryId = bill.CategoryId
                });
            }
        }

        var sorted = rows.Cast<dynamic>().OrderBy(r => r.Status switch
        {
            "overdue" => 0, "due-today" => 1, "due-soon" => 2, "upcoming" => 3, "paid" => 4, _ => 5
        }).ThenBy(r => (int)r.DueDay).ToList();

        var totalDue = sorted.Sum(r => (decimal)r.Amount);
        var totalMinimum = sorted.Sum(r => (decimal)(r.MinimumPayment ?? r.Amount));
        var totalPaid = sorted.Where(r => r.Status == "paid").Sum(r => (decimal)r.Amount);
        var totalPending = sorted.Where(r => r.Status != "paid").Sum(r => (decimal)r.Amount);
        var paidCount = sorted.Count(r => r.Status == "paid");
        var overdueCount = sorted.Count(r => r.Status == "overdue");
        var paidPercent = sorted.Count == 0 ? 100m : Math.Round((decimal)paidCount / sorted.Count * 100, 1);

        // Paycheck info
        string? nextPaycheckDate = null;
        int? daysUntilPaycheck = null;
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == UserId);
        if (profile?.NextPayDate != null)
        {
            var anchor = TimeZoneHelper.ToLocalDate(profile.NextPayDate.Value, tz);
            var nextPay = FinanceCalculationHelper.ComputeNextPaycheck(anchor, profile.PayFrequency, today);
            nextPaycheckDate = nextPay.ToString("o");
            daysUntilPaycheck = (int)Math.Ceiling((nextPay - today).TotalDays);
        }

        // Today's spending
        var todayUtcStart = today - tz.GetUtcOffset(today);
        var todayUtcEnd = todayUtcStart.AddDays(1);
        var todaySpending = await _db.DailyExpenses
            .Where(e => e.UserId == UserId && e.Date >= todayUtcStart && e.Date < todayUtcEnd
                && (e.TransactionType == TransactionType.Expense || e.TransactionType == null))
            .SumAsync(e => (decimal?)e.Amount ?? 0);

        // Pre-compute due-today total for dashboard glance
        var dueTodayRows = sorted.Where(r => {
            var status = ((dynamic)r).Status;
            return status == "due-today" || status == "overdue";
        });
        var dueTodayTotal = dueTodayRows.Sum(r => (decimal)((dynamic)r).Amount);

        return Ok(new
        {
            Rows = sorted,
            TotalDue = totalDue,
            TotalMinimum = totalMinimum,
            TotalPaid = totalPaid,
            TotalPending = totalPending,
            PaidCount = paidCount,
            OverdueCount = overdueCount,
            PaidPercent = paidPercent,
            NextPaycheckDate = nextPaycheckDate,
            DaysUntilPaycheck = daysUntilPaycheck,
            TodaySpending = todaySpending,
            DueTodayTotal = dueTodayTotal
        });
    }

    private static List<DateTime> GetRecurringDueDatesInMonth(DateTime nextRunDate, RecurrenceFrequency freq, int intervalCount, DateTime monthStart, DateTime monthEnd)
    {
        if (freq == RecurrenceFrequency.Monthly)
        {
            if (intervalCount <= 1)
            {
                var day = Math.Min(nextRunDate.Day, monthEnd.Day);
                return new List<DateTime> { new(monthStart.Year, monthStart.Month, day) };
            }
            var dates = new List<DateTime>();
            var cursor = nextRunDate.Date;
            while (cursor <= monthEnd)
            {
                if (cursor >= monthStart) dates.Add(cursor);
                cursor = cursor.AddMonths(intervalCount);
            }
            cursor = nextRunDate.Date.AddMonths(-intervalCount);
            while (cursor >= monthStart)
            {
                dates.Add(cursor);
                cursor = cursor.AddMonths(-intervalCount);
            }
            dates.Sort();
            if (dates.Count == 0)
            {
                var day = Math.Min(nextRunDate.Day, monthEnd.Day);
                dates.Add(new DateTime(monthStart.Year, monthStart.Month, day));
            }
            return dates;
        }

        var interval = freq switch
        {
            RecurrenceFrequency.Weekly => 7 * intervalCount,
            RecurrenceFrequency.Biweekly => 14,
            RecurrenceFrequency.Daily => intervalCount,
            _ => 30
        };
        var anchor = nextRunDate.Date;
        var result = new List<DateTime>();
        var current = anchor;
        while (current <= monthEnd) { if (current >= monthStart) result.Add(current); current = current.AddDays(interval); }
        current = anchor.AddDays(-interval);
        while (current >= monthStart) { result.Add(current); current = current.AddDays(-interval); }
        result.Sort();
        if (result.Count == 0)
        {
            var day = Math.Min(nextRunDate.Day, monthEnd.Day);
            result.Add(new DateTime(monthStart.Year, monthStart.Month, day));
        }
        return result;
    }

    [HttpGet("monthly-pulse")]
    public async Task<ActionResult> GetMonthlyPulse([FromQuery] int months = 3, [FromQuery] int? year = null, [FromQuery] int? month = null, [FromQuery] string? mode = null)
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var (currentYear, currentMonth) = TimeZoneHelper.UserYearMonth(tz);
        var endYear = year ?? currentYear;
        var endMonth = month ?? currentMonth;

        if (mode == "ytd")
            months = endMonth;
        else
            months = Math.Clamp(months, 1, 12);

        var (_, endDate) = TimeZoneHelper.MonthRangeUtc(endYear, endMonth, tz);
        var startMonth = new DateTime(endYear, endMonth, 1).AddMonths(-(months - 1));
        var (startDate, _) = TimeZoneHelper.MonthRangeUtc(startMonth.Year, startMonth.Month, tz);

        var labels = new List<object>();
        for (int i = 0; i < months; i++)
        {
            var m = startMonth.AddMonths(i);
            labels.Add(new { Year = m.Year, Month = m.Month, Label = m.ToString("MMM yyyy", System.Globalization.CultureInfo.InvariantCulture) });
        }

        // 1. Expenses (exclude trading categories)
        var tradingCatIds = await _db.CustomCategories
            .Where(c => c.UserId == UserId && c.Name.Contains("Trading"))
            .Select(c => c.Id).ToListAsync();

        var expenses = await _db.DailyExpenses
            .Include(e => e.Category)
            .Where(e => e.UserId == UserId && e.TransactionType == TransactionType.Expense
                && e.Date >= startDate && e.Date < endDate
                && (!e.CategoryId.HasValue || !tradingCatIds.Contains(e.CategoryId.Value)))
            .Select(e => new { e.Date, e.Amount, e.CategoryId, CategoryName = e.Category != null ? e.Category.Name : "Uncategorized", CategoryIcon = e.Category != null ? e.Category.Icon : null, e.Merchant, e.Description })
            .ToListAsync();

        var expenseMonthly = new List<object>();
        for (int i = 0; i < months; i++)
        {
            var mStart = startDate.AddMonths(i);
            var mEnd = mStart.AddMonths(1);
            expenseMonthly.Add(new { Total = expenses.Where(e => e.Date >= mStart && e.Date < mEnd).Sum(e => e.Amount) });
        }
        var expTotals = expenses.Sum(e => e.Amount);

        var expenseCategories = expenses.GroupBy(e => e.CategoryName).Select(g =>
        {
            var monthlyAmounts = new List<decimal>();
            for (int i = 0; i < months; i++)
            {
                var mStart = startDate.AddMonths(i);
                var mEnd = mStart.AddMonths(1);
                monthlyAmounts.Add(g.Where(e => e.Date >= mStart && e.Date < mEnd).Sum(e => e.Amount));
            }
            var children = g.GroupBy(e => string.IsNullOrWhiteSpace(e.Merchant) ? e.Description : e.Merchant).Select(mg =>
            {
                var mAmounts = new List<decimal>();
                for (int i = 0; i < months; i++)
                {
                    var mStart = startDate.AddMonths(i);
                    var mEnd = mStart.AddMonths(1);
                    mAmounts.Add(mg.Where(e => e.Date >= mStart && e.Date < mEnd).Sum(e => e.Amount));
                }
                return new { Name = mg.Key, Monthly = mAmounts, Total = mg.Sum(e => e.Amount) };
            }).OrderByDescending(m => m.Total).ToList();
            return new { Name = g.Key, Icon = g.First().CategoryIcon, CategoryId = g.First().CategoryId, Monthly = monthlyAmounts, Total = g.Sum(e => e.Amount), Children = children };
        }).OrderByDescending(c => c.Total).ToList();

        // 2. Loan Payments
        var loanPayments = await _db.PaymentHistories
            .Where(p => p.UserId == UserId && p.DebtType == DebtType.PersonalLoan
                && p.PaymentDate >= startDate && p.PaymentDate < endDate)
            .Select(p => new { p.PaymentDate, p.AmountPaid, p.PrincipalAmount, p.InterestAmount, p.DebtId })
            .ToListAsync();

        var loanNames = await _db.PersonalLoans.Where(l => l.UserId == UserId)
            .ToDictionaryAsync(l => l.Id, l => new { Name = l.LenderName, l.CurrentBalance });

        var loanMonthly = new List<object>();
        for (int i = 0; i < months; i++)
        {
            var mStart = startDate.AddMonths(i);
            var mEnd = mStart.AddMonths(1);
            var mPayments = loanPayments.Where(p => p.PaymentDate >= mStart && p.PaymentDate < mEnd);
            loanMonthly.Add(new
            {
                Total = mPayments.Sum(p => p.AmountPaid),
                Principal = mPayments.Sum(p => p.PrincipalAmount ?? 0),
                Interest = mPayments.Sum(p => p.InterestAmount ?? 0)
            });
        }
        var loanRemaining = loanNames.Values.Sum(l => l.CurrentBalance);

        var loanDetails = loanPayments.GroupBy(p => p.DebtId).Select(g =>
        {
            var info = loanNames.GetValueOrDefault(g.Key);
            var monthlyAmounts = new List<decimal>();
            for (int i = 0; i < months; i++)
            {
                var mStart = startDate.AddMonths(i);
                var mEnd = mStart.AddMonths(1);
                monthlyAmounts.Add(g.Where(p => p.PaymentDate >= mStart && p.PaymentDate < mEnd).Sum(p => p.AmountPaid));
            }
            return new { Name = info?.Name ?? "Unknown", DebtId = g.Key, Balance = info?.CurrentBalance ?? 0, Monthly = monthlyAmounts, Total = g.Sum(p => p.AmountPaid) };
        }).OrderByDescending(l => l.Total).ToList();

        // 3. Credit Card Payments
        var ccPayments = await _db.PaymentHistories
            .Where(p => p.UserId == UserId && p.DebtType == DebtType.CreditCard
                && p.PaymentDate >= startDate && p.PaymentDate < endDate)
            .Select(p => new { p.PaymentDate, p.AmountPaid, p.DebtId })
            .ToListAsync();

        var cardNames = await _db.CreditCards.Where(c => c.UserId == UserId)
            .ToDictionaryAsync(c => c.Id, c => new { c.CardName, c.CurrentBalance });

        var ccMonthly = new List<object>();
        for (int i = 0; i < months; i++)
        {
            var mStart = startDate.AddMonths(i);
            var mEnd = mStart.AddMonths(1);
            ccMonthly.Add(new { Total = ccPayments.Where(p => p.PaymentDate >= mStart && p.PaymentDate < mEnd).Sum(p => p.AmountPaid) });
        }
        var ccRemaining = cardNames.Values.Sum(c => c.CurrentBalance);

        var cardDetails = ccPayments.GroupBy(p => p.DebtId).Select(g =>
        {
            var info = cardNames.GetValueOrDefault(g.Key);
            var monthlyAmounts = new List<decimal>();
            for (int i = 0; i < months; i++)
            {
                var mStart = startDate.AddMonths(i);
                var mEnd = mStart.AddMonths(1);
                monthlyAmounts.Add(g.Where(p => p.PaymentDate >= mStart && p.PaymentDate < mEnd).Sum(p => p.AmountPaid));
            }
            return new { Name = info?.CardName ?? "Unknown", DebtId = g.Key, Balance = info?.CurrentBalance ?? 0, Monthly = monthlyAmounts, Total = g.Sum(p => p.AmountPaid) };
        }).OrderByDescending(c => c.Total).ToList();

        // 4. Trading P&L — attribute to close date (same as trading calendar)
        var trades = await _db.TradeEntries
            .Where(t => t.UserId == UserId && t.Pnl.HasValue && t.ClosedDate.HasValue)
            .Select(t => new { t.ClosedDate, t.Pnl, t.NetPnl, t.Instrument })
            .ToListAsync();

        // Convert close date to local time and filter by local month boundaries
        var localTrades = trades.Select(t => new
        {
            LocalDate = TimeZoneHelper.ToLocalDate(t.ClosedDate!.Value, tz),
            t.Pnl, t.NetPnl, t.Instrument
        }).Where(t => t.LocalDate.Year >= startMonth.Year && t.LocalDate.Month >= startMonth.Month || t.LocalDate.Year > startMonth.Year)
         .Where(t => t.LocalDate < startMonth.AddMonths(months))
         .ToList();

        var tradingMonthly = new List<object>();
        for (int i = 0; i < months; i++)
        {
            var mLocal = startMonth.AddMonths(i);
            var mTrades = localTrades.Where(t => t.LocalDate.Year == mLocal.Year && t.LocalDate.Month == mLocal.Month).ToList();
            var wins = mTrades.Count(t => t.Pnl > 0);
            tradingMonthly.Add(new
            {
                NetPnl = mTrades.Sum(t => t.NetPnl ?? t.Pnl ?? 0),
                Trades = mTrades.Count,
                Wins = wins,
                WinRate = mTrades.Count == 0 ? 0m : Math.Round((decimal)wins / mTrades.Count * 100, 1)
            });
        }
        var totalNetPnl = localTrades.Sum(t => t.NetPnl ?? t.Pnl ?? 0);
        var totalTradeCount = localTrades.Count;
        var totalWins = localTrades.Count(t => t.Pnl > 0);

        var tradingDetails = localTrades.GroupBy(t => t.Instrument ?? "Unknown").Select(g =>
        {
            var monthlyPnl = new List<decimal>();
            for (int i = 0; i < months; i++)
            {
                var mLocal = startMonth.AddMonths(i);
                monthlyPnl.Add(g.Where(t => t.LocalDate.Year == mLocal.Year && t.LocalDate.Month == mLocal.Month).Sum(t => t.NetPnl ?? t.Pnl ?? 0));
            }
            return new { Name = g.Key, Monthly = monthlyPnl, Total = g.Sum(t => t.NetPnl ?? t.Pnl ?? 0), Trades = g.Count() };
        }).OrderByDescending(i => Math.Abs(i.Total)).ToList();

        // 5. Net Worth Delta — use same post-statement CC adjustment as Dashboard
        var nwBankBal = await _db.BankAccounts.Where(a => a.UserId == UserId).SumAsync(a => a.CurrentBalance);
        var nwCards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();
        var nwCcDebt = 0m;
        foreach (var c in nwCards)
        {
            var adj = c.CurrentBalance;
            if (c.LastStatementDate.HasValue)
            {
                adj += await _db.DailyExpenses
                    .Where(e => e.UserId == UserId && e.FundingSourceType == FundingSourceType.CreditCard
                        && e.FundingSourceId == c.Id && e.Date > c.LastStatementDate.Value
                        && e.TransactionType != TransactionType.CardPayment)
                    .SumAsync(e => (decimal?)e.Amount ?? 0);
                adj -= await _db.PaymentHistories
                    .Where(p => p.UserId == UserId && p.DebtType == DebtType.CreditCard
                        && p.DebtId == c.Id && p.PaymentDate > c.LastStatementDate.Value)
                    .SumAsync(p => (decimal?)p.AmountPaid ?? 0);
            }
            nwCcDebt += adj;
        }
        var nwLoanDebt = await _db.PersonalLoans.Where(l => l.UserId == UserId).SumAsync(l => l.CurrentBalance);
        var todayDate = TimeZoneHelper.UserToday(tz);
        var snapExistsToday = await _db.NetWorthSnapshots
            .AnyAsync(s => s.UserId == UserId && s.SnapshotDate == todayDate);
        if (!snapExistsToday)
        {
            _db.NetWorthSnapshots.Add(new Pulse.Core.Models.NetWorthSnapshot
            {
                UserId = UserId,
                SnapshotDate = todayDate,
                TotalBankBalance = nwBankBal,
                TotalCreditCardDebt = nwCcDebt,
                TotalLoanDebt = nwLoanDebt,
                NetWorth = nwBankBal - nwCcDebt - nwLoanDebt
            });
            await _db.SaveChangesAsync();
        }

        var snapshots = await _db.NetWorthSnapshots
            .Where(s => s.UserId == UserId && s.SnapshotDate >= startDate.Date && s.SnapshotDate <= endDate.Date)
            .OrderBy(s => s.SnapshotDate)
            .ToListAsync();

        var nwMonthly = new List<object>();
        var nwComponents = new List<object[]>(); // bank, cc, loan deltas per month
        for (int i = 0; i < months; i++)
        {
            var mLocalStart = startMonth.AddMonths(i);
            var mLocalEnd = mLocalStart.AddMonths(1);
            var mSnaps = snapshots.Where(s => s.SnapshotDate >= mLocalStart && s.SnapshotDate < mLocalEnd).ToList();
            if (mSnaps.Count >= 2)
            {
                var first = mSnaps.First();
                var last = mSnaps.Last();
                nwMonthly.Add(new { Value = last.NetWorth, Delta = last.NetWorth - first.NetWorth });
                nwComponents.Add(new object[] {
                    last.TotalBankBalance - first.TotalBankBalance,
                    -(last.TotalCreditCardDebt - first.TotalCreditCardDebt),
                    -(last.TotalLoanDebt - first.TotalLoanDebt)
                });
            }
            else if (mSnaps.Count == 1)
            {
                nwMonthly.Add(new { Value = mSnaps[0].NetWorth, Delta = 0m });
                nwComponents.Add(new object[] { 0m, 0m, 0m });
            }
            else
            {
                nwMonthly.Add(new { Value = (decimal?)null, Delta = 0m });
                nwComponents.Add(new object[] { 0m, 0m, 0m });
            }
        }
        var currentNw = nwBankBal - nwCcDebt - nwLoanDebt;
        var firstNw = snapshots.FirstOrDefault()?.NetWorth ?? 0;

        var nwDetails = new[] { "Banks", "Credit Cards", "Loans" }.Select((name, idx) => new
        {
            Name = name,
            Monthly = nwComponents.Select(c => (decimal)c[idx]).ToList(),
            Total = nwComponents.Sum(c => (decimal)c[idx])
        }).ToList();

        // Trend calculations
        static decimal CalcTrend(decimal first, decimal last) =>
            first == 0 ? 0 : Math.Round((last - first) / Math.Abs(first) * 100, 1);

        var expFirst = expenses.Where(e => e.Date >= startDate && e.Date < startDate.AddMonths(1)).Sum(e => e.Amount);
        var expLast = expenses.Where(e => e.Date >= startDate.AddMonths(months - 1) && e.Date < startDate.AddMonths(months)).Sum(e => e.Amount);

        var loanFirst = loanPayments.Where(p => p.PaymentDate >= startDate && p.PaymentDate < startDate.AddMonths(1)).Sum(p => p.AmountPaid);
        var loanLast = loanPayments.Where(p => p.PaymentDate >= startDate.AddMonths(months - 1) && p.PaymentDate < startDate.AddMonths(months)).Sum(p => p.AmountPaid);

        var ccFirst = ccPayments.Where(p => p.PaymentDate >= startDate && p.PaymentDate < startDate.AddMonths(1)).Sum(p => p.AmountPaid);
        var ccLast = ccPayments.Where(p => p.PaymentDate >= startDate.AddMonths(months - 1) && p.PaymentDate < startDate.AddMonths(months)).Sum(p => p.AmountPaid);

        var tradFirstMonth = startMonth;
        var tradLastMonth = startMonth.AddMonths(months - 1);
        var tradFirst = localTrades.Where(t => t.LocalDate.Year == tradFirstMonth.Year && t.LocalDate.Month == tradFirstMonth.Month).Sum(t => t.NetPnl ?? t.Pnl ?? 0);
        var tradLast = localTrades.Where(t => t.LocalDate.Year == tradLastMonth.Year && t.LocalDate.Month == tradLastMonth.Month).Sum(t => t.NetPnl ?? t.Pnl ?? 0);

        return Ok(new
        {
            months = labels,
            expenses = new
            {
                monthly = expenseMonthly,
                grandTotal = expTotals,
                avgMonthly = months > 0 ? Math.Round(expTotals / months, 2) : 0,
                trend = CalcTrend(expFirst, expLast),
                details = expenseCategories
            },
            loanPayments = new
            {
                monthly = loanMonthly,
                grandTotal = loanPayments.Sum(p => p.AmountPaid),
                remainingBalance = loanRemaining,
                avgMonthly = months > 0 ? Math.Round(loanPayments.Sum(p => p.AmountPaid) / months, 2) : 0,
                trend = CalcTrend(loanFirst, loanLast),
                details = loanDetails
            },
            cardPayments = new
            {
                monthly = ccMonthly,
                grandTotal = ccPayments.Sum(p => p.AmountPaid),
                remainingBalance = ccRemaining,
                avgMonthly = months > 0 ? Math.Round(ccPayments.Sum(p => p.AmountPaid) / months, 2) : 0,
                trend = CalcTrend(ccFirst, ccLast),
                details = cardDetails
            },
            trading = new
            {
                monthly = tradingMonthly,
                totalNetPnl = totalNetPnl,
                totalTrades = totalTradeCount,
                overallWinRate = totalTradeCount == 0 ? 0m : Math.Round((decimal)totalWins / totalTradeCount * 100, 1),
                trend = CalcTrend(tradFirst, tradLast),
                details = tradingDetails
            },
            netWorth = new
            {
                monthly = nwMonthly,
                currentNetWorth = currentNw,
                totalChange = currentNw - firstNw,
                trend = CalcTrend(firstNw, currentNw),
                details = nwDetails
            }
        });
    }

    [HttpGet("daily-spending")]
    public async Task<ActionResult> GetDailySpending([FromQuery] int days = 30)
    {
        if (days < 1 || days > 90) days = 30;

        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userToday = TimeZoneHelper.UserToday(tz);
        var startDate = userToday.AddDays(-(days - 1));

        var utcStart = TimeZoneHelper.ToUtc(startDate, tz);
        var utcEnd = TimeZoneHelper.ToUtc(userToday.AddDays(1), tz);

        var tradingParentId = await _db.CustomCategories
            .Where(c => c.UserId == UserId && c.Name == "Day Trading" && c.ParentId == null)
            .Select(c => c.Id).FirstOrDefaultAsync();
        var tradingCatIds = tradingParentId == 0
            ? new List<int>()
            : await _db.CustomCategories
                .Where(c => c.UserId == UserId && (c.Id == tradingParentId || c.ParentId == tradingParentId))
                .Select(c => c.Id).ToListAsync();

        var expenses = await _db.DailyExpenses
            .Where(e => e.UserId == UserId
                && e.Date >= utcStart && e.Date < utcEnd
                && (e.TransactionType == TransactionType.Expense || e.TransactionType == null)
                && (!e.CategoryId.HasValue || !tradingCatIds.Contains(e.CategoryId.Value)))
            .Select(e => new { e.Date, e.Amount })
            .ToListAsync();

        var grouped = expenses
            .GroupBy(e => TimeZoneHelper.ToLocalDate(e.Date, tz))
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Amount));

        var result = Enumerable.Range(0, days).Select(i =>
        {
            var date = startDate.AddDays(i);
            grouped.TryGetValue(date, out var amount);
            return new { date = date.ToString("yyyy-MM-dd"), amount };
        }).ToList();

        var total = result.Sum(r => r.amount);
        var average = days > 0 ? Math.Round(total / days, 2) : 0;

        return Ok(new { days = result, total, average });
    }

    private record UpcomingGlanceItem(string Name, decimal MonthlyPayment, string DueDate, int DaysUntilDue, string Kind, bool IsAutopay);
}
