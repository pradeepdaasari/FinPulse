using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class TradeEntry
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public DateTime Date { get; set; }
    public int SetupId { get; set; }
    [Required]
    [MaxLength(50)]
    public string Instrument { get; set; } = string.Empty;
    [MaxLength(10)]
    public string Direction { get; set; } = "long";
    public decimal EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal? Pnl { get; set; }
    public bool ChecklistCompleted { get; set; }
    [MaxLength(20)]
    public string? EntryTime { get; set; }
    [MaxLength(20)]
    public string? ExitTime { get; set; }
    public string? Notes { get; set; }
    public string? Tags { get; set; }
    public bool IsRevengeTrading { get; set; }
    [MaxLength(50)]
    public string? EmotionAtEntry { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public TradingSetup? Setup { get; set; }
    public List<ChecklistResponse> ChecklistResponses { get; set; } = new();
}
