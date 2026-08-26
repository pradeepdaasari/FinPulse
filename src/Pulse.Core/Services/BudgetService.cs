using Pulse.Core.DTOs;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public class BudgetService : IBudgetService
{
    public BudgetAllocationDto GenerateAllocation(decimal monthlyIncome, List<DebtSnapshotDto> debts)
    {
        // 50/30/20 rule
        decimal essentials = Math.Round(monthlyIncome * 0.50m, 2);
        decimal wants = Math.Round(monthlyIncome * 0.30m, 2);
        decimal debtPayment = Math.Round(monthlyIncome * 0.20m, 2);

        // Total minimum payments required
        decimal totalMinimums = debts.Sum(d => d.MinimumPayment);

        // If 20% doesn't cover minimums, the debt portion must be at least the total minimums
        decimal actualDebtBudget = Math.Max(debtPayment, totalMinimums);

        // Extra available for debt beyond minimums
        decimal extraForDebt = actualDebtBudget - totalMinimums;

        // Allocate extra payments using avalanche logic (highest APR first)
        var allocations = new List<SuggestedAllocationDto>();
        var sortedDebts = debts.OrderByDescending(d => d.EffectiveApr).ToList();
        decimal remainingExtra = extraForDebt;

        for (int i = 0; i < sortedDebts.Count; i++)
        {
            var debt = sortedDebts[i];
            decimal extraForThis = 0;
            string reason;

            if (i == 0 && remainingExtra > 0)
            {
                // Highest APR gets the extra
                extraForThis = remainingExtra;
                remainingExtra = 0;
                reason = $"Highest APR at {debt.EffectiveApr:F2}%";
            }
            else if (debt.Balance <= debt.MinimumPayment * 3 && remainingExtra > 0)
            {
                // Small balance - quick win
                extraForThis = Math.Min(remainingExtra, debt.Balance - debt.MinimumPayment);
                if (extraForThis > 0)
                {
                    remainingExtra -= extraForThis;
                    reason = "Smallest balance - quick win";
                }
                else
                {
                    reason = "Minimum payment only";
                }
            }
            else
            {
                reason = "Minimum payment only";
            }

            allocations.Add(new SuggestedAllocationDto
            {
                DebtName = debt.Name,
                DebtType = debt.DebtType,
                SuggestedPayment = debt.MinimumPayment + extraForThis,
                MinimumPayment = debt.MinimumPayment,
                ExtraPayment = extraForThis,
                Reason = reason
            });
        }

        return new BudgetAllocationDto
        {
            MonthlyIncome = monthlyIncome,
            EssentialExpenses = essentials,
            Wants = wants,
            DebtPayment = actualDebtBudget,
            ExtraForDebt = extraForDebt,
            SuggestedAllocations = allocations
        };
    }
}
