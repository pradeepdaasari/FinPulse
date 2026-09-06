using Pulse.Core.DTOs;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

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
            InterestSaved = snowball.TotalInterest - avalanche.TotalInterest,
            TimeDifference = snowball.MonthsToPayoff - avalanche.MonthsToPayoff
        };
    }

    private PayoffStrategyDto RunStrategy(List<DebtSnapshotDto> debts, decimal totalMonthlyBudget, string strategyName)
    {
        var workingDebts = debts.Select((d, idx) => new WorkingDebt
        {
            Index = idx,
            Id = d.Id,
            Name = d.Name,
            OriginalBalance = d.Balance,
            Balance = d.Balance,
            AprPercent = d.AprPercent,
            MinimumPayment = d.MinimumPayment,
            EffectiveApr = d.EffectiveApr,
            PromoEndDate = d.PromoEndDate,
            DueDay = d.DueDay,
            TotalInterestPaid = 0,
            PaidOff = false,
            PayoffMonth = 0
        }).ToList();

        var payoffOrder = new List<DebtPayoffOrderDto>();
        decimal totalInterest = 0;
        int monthsToPayoff = 0;
        var startDate = DateTime.Today;
        var monthlyPlan = new List<MonthlyActionStepDto>();

        for (int month = 1; month <= MaxMonths; month++)
        {
            var activeDebts = workingDebts.Where(d => !d.PaidOff).ToList();
            if (activeDebts.Count == 0)
                break;

            monthsToPayoff = month;
            var currentDate = startDate.AddMonths(month);

            foreach (var debt in activeDebts)
            {
                if (debt.PromoEndDate.HasValue && currentDate > debt.PromoEndDate.Value)
                    debt.EffectiveApr = debt.AprPercent;
            }

            foreach (var debt in activeDebts)
            {
                decimal interest = Math.Round(debt.Balance * debt.EffectiveApr / 100m / 12m, 2);
                debt.Balance += interest;
                debt.TotalInterestPaid += interest;
                totalInterest += interest;
            }

            decimal budgetRemaining = totalMonthlyBudget;
            foreach (var debt in activeDebts)
            {
                decimal minPayment = Math.Min(debt.MinimumPayment, debt.Balance);
                debt.Balance -= minPayment;
                budgetRemaining -= minPayment;

                if (month == 1)
                {
                    monthlyPlan.Add(new MonthlyActionStepDto
                    {
                        DebtName = debt.Name,
                        Amount = minPayment,
                        IsMinimum = true,
                        Explanation = "Minimum payment — keeps you in good standing",
                        DueDay = debt.DueDay
                    });
                }

                if (debt.Balance < 0.01m)
                {
                    debt.Balance = 0;
                    debt.PaidOff = true;
                    debt.PayoffMonth = month;
                }
            }

            var targetDebts = workingDebts.Where(d => !d.PaidOff).ToList();

            if (strategyName == "Avalanche")
                targetDebts = targetDebts.OrderByDescending(d => d.EffectiveApr).ToList();
            else
                targetDebts = targetDebts.OrderBy(d => d.Balance).ToList();

            foreach (var debt in targetDebts)
            {
                if (budgetRemaining <= 0)
                    break;

                decimal extraPayment = Math.Min(budgetRemaining, debt.Balance);
                debt.Balance -= extraPayment;
                budgetRemaining -= extraPayment;

                if (month == 1 && extraPayment > 0)
                {
                    monthlyPlan.Add(new MonthlyActionStepDto
                    {
                        DebtName = debt.Name,
                        Amount = extraPayment,
                        IsMinimum = false,
                        Explanation = "Extra payment — this is the one we're attacking first!",
                        DueDay = debt.DueDay
                    });
                }

                if (debt.Balance < 0.01m)
                {
                    debt.Balance = 0;
                    debt.PaidOff = true;
                    debt.PayoffMonth = month;
                }
            }
        }

        foreach (var debt in workingDebts.OrderBy(d => d.PayoffMonth))
        {
            payoffOrder.Add(new DebtPayoffOrderDto
            {
                DebtName = debt.Name,
                Balance = debt.OriginalBalance,
                AprPercent = debt.AprPercent,
                PayoffMonth = debt.PayoffMonth,
                TotalInterestPaid = debt.TotalInterestPaid,
                MinimumPayment = debt.MinimumPayment,
                DueDay = debt.DueDay
            });
        }

        var quickWins = workingDebts
            .Where(d => d.PayoffMonth > 0 && (d.PayoffMonth <= 3 || d.OriginalBalance < 500))
            .OrderBy(d => d.PayoffMonth)
            .Select(d => new QuickWinDto
            {
                DebtName = d.Name,
                Balance = d.OriginalBalance,
                MonthsToPayoff = d.PayoffMonth
            })
            .ToList();

        return new PayoffStrategyDto
        {
            Name = strategyName,
            TotalInterest = totalInterest,
            MonthsToPayoff = monthsToPayoff,
            DebtPayoffOrder = payoffOrder,
            MonthlyPlan = monthlyPlan,
            QuickWins = quickWins,
            TotalMonthlyPayment = totalMonthlyBudget
        };
    }

    private class WorkingDebt
    {
        public int Index { get; set; }
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal OriginalBalance { get; set; }
        public decimal Balance { get; set; }
        public decimal AprPercent { get; set; }
        public decimal MinimumPayment { get; set; }
        public decimal EffectiveApr { get; set; }
        public DateTime? PromoEndDate { get; set; }
        public decimal TotalInterestPaid { get; set; }
        public int DueDay { get; set; }
        public bool PaidOff { get; set; }
        public int PayoffMonth { get; set; }
    }
}
