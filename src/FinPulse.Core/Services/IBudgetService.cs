using FinPulse.Core.DTOs;

namespace FinPulse.Core.Services;

public interface IBudgetService
{
    BudgetAllocationDto GenerateAllocation(decimal monthlyIncome, List<DebtSnapshotDto> debts);
}
