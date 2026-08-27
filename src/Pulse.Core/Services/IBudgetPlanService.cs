using Pulse.Core.DTOs;
using Pulse.Core.Models;

namespace Pulse.Core.Services;

public interface IBudgetPlanService
{
    BudgetPlanDto GeneratePlan(UserProfile profile, List<BudgetExpense> expenses, List<DebtSnapshotDto> debts, List<RecurringTransaction> recurring, int year, int month);
}
