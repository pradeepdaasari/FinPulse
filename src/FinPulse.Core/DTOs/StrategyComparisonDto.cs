namespace FinPulse.Core.DTOs;

public class StrategyComparisonDto
{
    public PayoffStrategyDto Avalanche { get; set; } = new();
    public PayoffStrategyDto Snowball { get; set; } = new();
    public decimal InterestSaved { get; set; }
    public int TimeDifference { get; set; }
}
