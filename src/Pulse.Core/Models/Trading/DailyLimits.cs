namespace Pulse.Core.Models.Trading;

public class DailyLimits
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public int MaxTradesPerDay { get; set; } = 5;
    public decimal MaxDailyLoss { get; set; } = 500;
    public int StopAfterConsecutiveLosses { get; set; } = 3;
    public DateTime UpdatedAt { get; set; }
}
