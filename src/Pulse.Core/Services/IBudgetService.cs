using Pulse.Core.DTOs;

namespace Pulse.Core.Services;

public interface IBudgetService
{
    BudgetAllocationDto GenerateAllocation(decimal monthlyIncome, List<DebtSnapshotDto> debts);
}
