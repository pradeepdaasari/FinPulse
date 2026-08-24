namespace FinPulse.Core.DTOs;

public class PayoffStrategyDto
{
    public string StrategyName { get; set; } = string.Empty;
    public decimal TotalInterestPaid { get; set; }
    public int MonthsToPayoff { get; set; }
    public List<DebtPayoffOrderDto> DebtPayoffOrder { get; set; } = new();
}

public class DebtPayoffOrderDto
{
    public string DebtName { get; set; } = string.Empty;
    public int PayoffMonth { get; set; }
    public decimal InterestPaid { get; set; }
}
