using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class TradingGoal
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    [Required, MaxLength(50)]
    public string Metric { get; set; } = string.Empty;
    [Required, MaxLength(10)]
    public string Operator { get; set; } = "gte";
    public decimal TargetValue { get; set; }
    [Required, MaxLength(10)]
    public string Timeframe { get; set; } = "daily";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
