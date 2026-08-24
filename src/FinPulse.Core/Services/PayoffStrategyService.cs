using FinPulse.Core.DTOs;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.Services;

public class PayoffStrategyService : IPayoffStrategyService
{
    private const int MaxMonths = 1200;

    public StrategyComparisonDto CompareStrategies(List<DebtSnapshotDto> debts, decimal totalMonthlyBudget)
    {
        var avalanche = RunStrategy(debts, totalMonthlyBudget, "Avalanche");
        var snowball = RunStrategy(debts, totalMonthlyBudget, "Snowball");

        return new StrategyComparisonDto
        {
            Avalanche = avalanche,
            Snowball = snowball,
            InterestSavedByAvalanche = snowball.TotalInterestPaid - avalanche.TotalInterestPaid,
            MonthsSavedByAvalanche = snowball.MonthsToPayoff - avalanche.MonthsToPayoff
        };
    }

    private PayoffStrategyDto RunStrategy(List<DebtSnapshotDto> debts, decimal totalMonthlyBudget, string strategyName)
    {
        // Create working copies of debt state
        var workingDebts = debts.Select(d => new WorkingDebt
        {
            Id = d.Id,
            Name = d.Name,
            Balance = d.Balance,
            AprPercent = d.AprPercent,
            MinimumPayment = d.MinimumPayment,
            EffectiveApr = d.EffectiveApr,
            PromoEndDate = d.PromoEndDate,
            TotalInterestPaid = 0,
            PaidOff = false,
            PayoffMonth = 0
        }).ToList();

        var payoffOrder = new List<DebtPayoffOrderDto>();
        decimal totalInterest = 0;
        int monthsToPayoff = 0;
        var startDate = DateTime.Today;

        for (int month = 1; month <= MaxMonths; month++)
        {
            var activeDebts = workingDebts.Where(d => !d.PaidOff).ToList();
            if (activeDebts.Count == 0)
                break;

            monthsToPayoff = month;
            var currentDate = startDate.AddMonths(month);

            // Update effective APR based on promo expiry
            foreach (var debt in activeDebts)
            {
                if (debt.PromoEndDate.HasValue && currentDate > debt.PromoEndDate.Value)
                {
                    debt.EffectiveApr = debt.AprPercent;
                }
            }

            // Calculate interest for all active debts
            foreach (var debt in activeDebts)
            {
                decimal interest = Math.Round(debt.Balance * debt.EffectiveApr / 100m / 12m, 2);
                debt.Balance += interest;
                debt.TotalInterestPaid += interest;
                totalInterest += interest;
            }

            // Pay minimums on all debts
            decimal budgetRemaining = totalMonthlyBudget;
            foreach (var debt in activeDebts)
            {
                decimal minPayment = Math.Min(debt.MinimumPayment, debt.Balance);
                debt.Balance -= minPayment;
                budgetRemaining -= minPayment;

                if (debt.Balance < 0.01m)
                {
                    debt.Balance = 0;
                    debt.PaidOff = true;
                    debt.PayoffMonth = month;
                }
            }

            // Sort remaining active debts by strategy
            var targetDebts = workingDebts
                .Where(d => !d.PaidOff)
                .ToList();

            if (strategyName == "Avalanche")
            {
                targetDebts = targetDebts.OrderByDescending(d => d.EffectiveApr).ToList();
            }
            else // Snowball
            {
                targetDebts = targetDebts.OrderBy(d => d.Balance).ToList();
            }

            // Apply extra payments to target debts
            foreach (var debt in targetDebts)
            {
                if (budgetRemaining <= 0)
                    break;

                decimal extraPayment = Math.Min(budgetRemaining, debt.Balance);
                debt.Balance -= extraPayment;
                budgetRemaining -= extraPayment;

                if (debt.Balance < 0.01m)
                {
                    debt.Balance = 0;
                    debt.PaidOff = true;
                    debt.PayoffMonth = month;
                }
            }
        }

        // Build payoff order
        foreach (var debt in workingDebts.OrderBy(d => d.PayoffMonth))
        {
            payoffOrder.Add(new DebtPayoffOrderDto
            {
                DebtName = debt.Name,
                PayoffMonth = debt.PayoffMonth,
                InterestPaid = debt.TotalInterestPaid
            });
        }

        return new PayoffStrategyDto
        {
            StrategyName = strategyName,
            TotalInterestPaid = totalInterest,
            MonthsToPayoff = monthsToPayoff,
            DebtPayoffOrder = payoffOrder
        };
    }

    private class WorkingDebt
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public decimal AprPercent { get; set; }
        public decimal MinimumPayment { get; set; }
        public decimal EffectiveApr { get; set; }
        public DateTime? PromoEndDate { get; set; }
        public decimal TotalInterestPaid { get; set; }
        public bool PaidOff { get; set; }
        public int PayoffMonth { get; set; }
    }
}
