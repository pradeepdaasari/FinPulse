using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class TradingGoalSnapshot
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int GoalId { get; set; }
    [Required, MaxLength(10)]
    public string Timeframe { get; set; } = string.Empty;
    public DateTime PeriodStart { get; set; }
    public decimal CurrentValue { get; set; }
    public decimal TargetValue { get; set; }
    public bool Achieved { get; set; }
    public decimal Percentage { get; set; }
    public DateTime CreatedAt { get; set; }

    public TradingGoal? Goal { get; set; }
}
