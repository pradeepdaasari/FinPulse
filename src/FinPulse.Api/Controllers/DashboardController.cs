using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models.Enums;
using FinPulse.Core.Services;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly FinPulseDbContext _db;
    private readonly IFinancialCalculationService _calcService;
    private readonly ISnapshotService _snapshotService;
    private readonly IStreakService _streakService;

    public DashboardController(FinPulseDbContext db, IFinancialCalculationService calcService, ISnapshotService snapshotService, IStreakService streakService)
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
        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == UserId).ToListAsync();

        var totalDebt = loans.Sum(l => l.CurrentBalance) + cards.Sum(c => c.CurrentBalance);
        var totalMonthlyPayment = loans.Sum(l => l.MonthlyPayment) + cards.Sum(c => c.MinimumPayment);
        var numberOfDebts = loans.Count + cards.Count;

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
        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
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
                MonthlyPayment = loan.MonthlyPayment,
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
            .Where(t => t.TransactionType == TransactionType.Income && t.Category.Name == "Trading Gains")
            .Sum(t => t.Amount);
        var tradingLosses = transactions
            .Where(t => t.TransactionType == TransactionType.Expense && t.Category.Name == "Trading Losses")
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
            TotalBankBalance = totalBankBalance,
            TotalCreditCardDebt = totalCreditCardDebt,
            TotalLoanDebt = totalLoanDebt,
            NetWorth = totalBankBalance - totalCreditCardDebt - totalLoanDebt
        });
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
