using Pulse.Core.DTOs;
using Pulse.Core.Models;

namespace Pulse.Core.Services;

public interface IBudgetPlanService
{
    BudgetPlanDto GeneratePlan(UserProfile profile, List<BudgetExpense> expenses, List<DebtSnapshotDto> debts, int year, int month);
}
