using Pulse.Core.DTOs;

namespace Pulse.Core.Services;

public interface IDebtAggregationService
{
    Task<LoanSummaryDto> GetLoanSummaryAsync(string userId);
    Task<CardSummaryDto> GetCardSummaryAsync(string userId);
    Task<GoalsSummaryDto> GetGoalsSummaryAsync(string userId);
}
