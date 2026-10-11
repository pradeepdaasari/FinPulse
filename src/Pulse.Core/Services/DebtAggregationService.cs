using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;

namespace Pulse.Core.Services;

public class DebtAggregationService : IDebtAggregationService
{
    private readonly PulseDbContext _db;

    public DebtAggregationService(PulseDbContext db) => _db = db;

    public async Task<LoanSummaryDto> GetLoanSummaryAsync(string userId)
    {
        var loans = await _db.PersonalLoans
            .Where(l => l.UserId == userId)
            .ToListAsync();

        var totalBalance = loans.Sum(l => l.CurrentBalance);
        var totalMonthly = loans.Sum(l => l.MonthlyEquivalentPayment);
        var activeLoans = loans.Where(l => l.CurrentBalance > 0).ToList();

        decimal avgApr = 0;
        if (activeLoans.Count > 0)
        {
            var totalWeightedApr = activeLoans.Sum(l => l.AprPercent * l.CurrentBalance);
            var totalActiveBalance = activeLoans.Sum(l => l.CurrentBalance);
            if (totalActiveBalance > 0)
                avgApr = Math.Round(totalWeightedApr / totalActiveBalance, 1);
        }

        return new LoanSummaryDto
        {
            TotalBalance = totalBalance,
            TotalMonthlyPayment = totalMonthly,
            AvgApr = avgApr,
            ActiveCount = activeLoans.Count
        };
    }

    public async Task<CardSummaryDto> GetCardSummaryAsync(string userId)
    {
        var cards = await _db.CreditCards
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var totalBalance = cards.Sum(c => c.CurrentBalance);
        var totalLimit = cards.Sum(c => c.CreditLimit);
        var totalMinPayment = cards.Sum(c => c.MinimumPayment);

        int avgUtilization = 0;
        if (cards.Count > 0)
        {
            var utilizations = cards.Select(c =>
                c.CreditLimit > 0
                    ? Math.Min(100m, c.CurrentBalance / c.CreditLimit * 100m)
                    : 0m);
            avgUtilization = (int)Math.Round(utilizations.Average());
        }

        return new CardSummaryDto
        {
            TotalBalance = totalBalance,
            TotalLimit = totalLimit,
            TotalMinPayment = totalMinPayment,
            AvgUtilization = avgUtilization
        };
    }

    public async Task<GoalsSummaryDto> GetGoalsSummaryAsync(string userId)
    {
        var goals = await _db.SavingsGoals
            .Include(g => g.LinkedAccount)
            .Where(g => g.UserId == userId)
            .ToListAsync();

        var resolved = goals.Select(g =>
        {
            var currentAmount = g.LinkedAccountId.HasValue && g.LinkedAccount != null
                ? g.LinkedAccount.CurrentBalance
                : g.CurrentAmount;
            var progress = g.TargetAmount > 0
                ? Math.Min(100m, currentAmount / g.TargetAmount * 100m)
                : 0m;
            return new { currentAmount, g.TargetAmount, progress };
        }).ToList();

        var totalSaved = resolved.Sum(r => r.currentAmount);
        var totalTarget = resolved.Sum(r => r.TargetAmount);
        var avgProgress = resolved.Count > 0 ? Math.Round(resolved.Average(r => r.progress), 1) : 0m;
        var completedGoals = resolved.Count(r => r.progress >= 100);

        return new GoalsSummaryDto
        {
            TotalSaved = totalSaved,
            TotalTarget = totalTarget,
            AvgProgress = avgProgress,
            CompletedGoals = completedGoals,
            TotalGoals = resolved.Count
        };
    }
}
