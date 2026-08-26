using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class TradingSetup
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<ChecklistItem> ChecklistItems { get; set; } = new();
}
