namespace FinPulse.Core.DTOs;

public class PayoffStrategyDto
{
    public string Name { get; set; } = string.Empty;
    public decimal TotalInterest { get; set; }
    public int MonthsToPayoff { get; set; }
    public List<DebtPayoffOrderDto> DebtPayoffOrder { get; set; } = new();
}

public class DebtPayoffOrderDto
{
    public string DebtName { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal AprPercent { get; set; }
    public int PayoffMonth { get; set; }
    public decimal TotalInterestPaid { get; set; }
}
