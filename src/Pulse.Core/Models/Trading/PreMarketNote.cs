using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class PreMarketNote
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public DateTime Date { get; set; }
    [MaxLength(20)]
    public string MarketBias { get; set; } = "neutral";
    public string? KeyLevels { get; set; }
    public string? Catalysts { get; set; }
    [Required]
    public string Plan { get; set; } = string.Empty;
    [MaxLength(10)]
    public string MentalState { get; set; } = "green";
    public string? MentalStateNotes { get; set; }
    public int MaxTrades { get; set; }
    public decimal MaxLoss { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
