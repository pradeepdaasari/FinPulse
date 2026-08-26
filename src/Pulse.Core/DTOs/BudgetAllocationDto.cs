using Pulse.Core.Models.Enums;

namespace Pulse.Core.DTOs;

public class BudgetAllocationDto
{
    public decimal MonthlyIncome { get; set; }
    public decimal EssentialExpenses { get; set; }
    public decimal Wants { get; set; }
    public decimal DebtPayment { get; set; }
    public decimal ExtraForDebt { get; set; }
    public List<SuggestedAllocationDto> SuggestedAllocations { get; set; } = new();
}

public class SuggestedAllocationDto
{
    public string DebtName { get; set; } = string.Empty;
    public DebtType DebtType { get; set; }
    public decimal SuggestedPayment { get; set; }
    public decimal MinimumPayment { get; set; }
    public decimal ExtraPayment { get; set; }
    public string Reason { get; set; } = string.Empty;
}
