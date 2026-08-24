namespace FinPulse.Core.DTOs;

public class StrategyComparisonDto
{
    public PayoffStrategyDto Avalanche { get; set; } = new();
    public PayoffStrategyDto Snowball { get; set; } = new();
    public decimal InterestSavedByAvalanche { get; set; }
    public int MonthsSavedByAvalanche { get; set; }
}
