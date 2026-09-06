namespace Pulse.Core.DTOs;

public class PayoffStrategyDto
{
    public string Name { get; set; } = string.Empty;
    public decimal TotalInterest { get; set; }
    public int MonthsToPayoff { get; set; }
    public List<DebtPayoffOrderDto> DebtPayoffOrder { get; set; } = new();
    public List<MonthlyActionStepDto> MonthlyPlan { get; set; } = new();
    public List<QuickWinDto> QuickWins { get; set; } = new();
    public decimal TotalMonthlyPayment { get; set; }
}

public class DebtPayoffOrderDto
{
    public string DebtName { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal AprPercent { get; set; }
    public int PayoffMonth { get; set; }
    public decimal TotalInterestPaid { get; set; }
    public decimal MinimumPayment { get; set; }
    public int DueDay { get; set; }
}

public class MonthlyActionStepDto
{
    public string DebtName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsMinimum { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public int DueDay { get; set; }
    public string? PaycheckDate { get; set; }
}

public class QuickWinDto
{
    public string DebtName { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public int MonthsToPayoff { get; set; }
}
