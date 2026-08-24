using FinPulse.Core.DTOs;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.Services;

public class WhatIfSimulatorService : IWhatIfSimulatorService
{
    private const int MaxMonths = 1200;

    public WhatIfResultDto Simulate(List<DebtSnapshotDto> debts, WhatIfRequestDto request)
    {
        var projections = new List<DebtProjectionDto>();
        var today = DateTime.Today;

        foreach (var debt in debts)
        {
            decimal extraPayment = 0;

            if (debt.DebtType == DebtType.PersonalLoan && request.LoanExtraPayments.ContainsKey(debt.Id))
            {
                extraPayment = request.LoanExtraPayments[debt.Id];
            }
            else if (debt.DebtType == DebtType.CreditCard && request.CardExtraPayments.ContainsKey(debt.Id))
            {
                extraPayment = request.CardExtraPayments[debt.Id];
            }

            var originalResult = SimulatePayoff(
                debt.Balance,
                debt.AprPercent,
                debt.MinimumPayment,
                debt.EffectiveApr,
                debt.PromoEndDate);

            var newResult = SimulatePayoff(
                debt.Balance,
                debt.AprPercent,
                debt.MinimumPayment + extraPayment,
                debt.EffectiveApr,
                debt.PromoEndDate);

            projections.Add(new DebtProjectionDto
            {
                DebtId = debt.Id,
                DebtName = debt.Name,
                DebtType = debt.DebtType,
                OriginalPayoffMonths = originalResult.Months,
                NewPayoffMonths = newResult.Months,
                OriginalTotalInterest = originalResult.TotalInterest,
                NewTotalInterest = newResult.TotalInterest,
                InterestSaved = originalResult.TotalInterest - newResult.TotalInterest
            });
        }

        int originalMaxMonths = projections.Count > 0
            ? projections.Max(p => p.OriginalPayoffMonths)
            : 0;
        int newMaxMonths = projections.Count > 0
            ? projections.Max(p => p.NewPayoffMonths)
            : 0;

        return new WhatIfResultDto
        {
            Projections = projections,
            TotalInterestSaved = projections.Sum(p => p.InterestSaved),
            OriginalDebtFreeDate = today.AddMonths(originalMaxMonths),
            NewDebtFreeDate = today.AddMonths(newMaxMonths)
        };
    }

    private (int Months, decimal TotalInterest) SimulatePayoff(
        decimal balance,
        decimal aprPercent,
        decimal monthlyPayment,
        decimal effectiveApr,
        DateTime? promoEndDate)
    {
        var currentBalance = balance;
        decimal totalInterest = 0;
        var today = DateTime.Today;

        for (int month = 1; month <= MaxMonths && currentBalance > 0; month++)
        {
            var currentDate = today.AddMonths(month);

            // Determine the APR for this month
            decimal currentApr = (promoEndDate.HasValue && currentDate <= promoEndDate.Value)
                ? effectiveApr
                : aprPercent;

            decimal interest = Math.Round(currentBalance * currentApr / 100m / 12m, 2);
            totalInterest += interest;

            decimal payment = Math.Min(monthlyPayment, currentBalance + interest);

            // Guard against infinite loop
            if (payment <= interest && currentBalance > 0)
            {
                return (MaxMonths, totalInterest);
            }

            decimal principal = payment - interest;
            currentBalance -= principal;

            if (currentBalance < 0.01m)
            {
                return (month, totalInterest);
            }
        }

        return (MaxMonths, totalInterest);
    }
}
