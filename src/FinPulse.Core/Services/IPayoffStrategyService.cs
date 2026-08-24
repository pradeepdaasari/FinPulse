using FinPulse.Core.DTOs;

namespace FinPulse.Core.Services;

public interface IPayoffStrategyService
{
    StrategyComparisonDto CompareStrategies(List<DebtSnapshotDto> debts, decimal totalMonthlyBudget);
}
