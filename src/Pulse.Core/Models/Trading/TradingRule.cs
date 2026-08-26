using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class TradingRule
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    [Required]
    [MaxLength(500)]
    public string Text { get; set; } = string.Empty;
    [MaxLength(20)]
    public string Category { get; set; } = "general";
    public bool IsActive { get; set; } = true;
    public int OrderIndex { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
