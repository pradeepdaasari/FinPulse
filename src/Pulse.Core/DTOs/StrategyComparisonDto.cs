namespace Pulse.Core.DTOs;

public class StrategyComparisonDto
{
    public PayoffStrategyDto Avalanche { get; set; } = new();
    public PayoffStrategyDto Snowball { get; set; } = new();
    public decimal InterestSaved { get; set; }
    public int TimeDifference { get; set; }
    public decimal TotalDebt { get; set; }
    public decimal MonthlyIncome { get; set; }
    public decimal NetPayPerCheck { get; set; }
    public string PayFrequency { get; set; } = string.Empty;
    public List<PaycheckInfoDto> Paychecks { get; set; } = new();
}

public class PaycheckInfoDto
{
    public string Date { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
