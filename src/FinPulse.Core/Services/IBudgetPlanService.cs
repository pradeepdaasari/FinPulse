using FinPulse.Core.DTOs;
using FinPulse.Core.Models;

namespace FinPulse.Core.Services;

public interface IBudgetPlanService
{
    BudgetPlanDto GeneratePlan(UserProfile profile, List<BudgetExpense> expenses, List<DebtSnapshotDto> debts, int year, int month);
}
