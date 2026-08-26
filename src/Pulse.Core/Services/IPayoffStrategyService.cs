using Pulse.Core.DTOs;

namespace Pulse.Core.Services;

public interface IPayoffStrategyService
{
    StrategyComparisonDto CompareStrategies(List<DebtSnapshotDto> debts, decimal totalMonthlyBudget);
}
