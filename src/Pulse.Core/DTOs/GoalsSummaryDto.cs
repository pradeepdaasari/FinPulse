namespace Pulse.Core.DTOs;

public class GoalsSummaryDto
{
    public decimal TotalSaved { get; set; }
    public decimal TotalTarget { get; set; }
    public decimal AvgProgress { get; set; }
    public int CompletedGoals { get; set; }
    public int TotalGoals { get; set; }
}
