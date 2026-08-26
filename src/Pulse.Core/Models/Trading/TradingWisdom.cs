using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class TradingWisdom
{
    public int Id { get; set; }
    [Required]
    [MaxLength(1000)]
    public string Text { get; set; } = string.Empty;
    [MaxLength(20)]
    public string Category { get; set; } = "discipline";
    [MaxLength(200)]
    public string? Author { get; set; }
}
