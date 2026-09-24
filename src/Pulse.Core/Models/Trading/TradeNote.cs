using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pulse.Core.Models.Trading;

public class TradeNote
{
    public int Id { get; set; }
    public int TradeEntryId { get; set; }
    public string? UserId { get; set; }
    [Required]
    public string Note { get; set; } = string.Empty;
    [MaxLength(20)]
    public string? Emotion { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    [JsonIgnore]
    public TradeEntry? TradeEntry { get; set; }
}
