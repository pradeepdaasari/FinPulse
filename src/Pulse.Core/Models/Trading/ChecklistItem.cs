using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pulse.Core.Models.Trading;

public class ChecklistItem
{
    public int Id { get; set; }
    public int SetupId { get; set; }
    [Required]
    [MaxLength(300)]
    public string Label { get; set; } = string.Empty;
    public int OrderIndex { get; set; }

    [JsonIgnore]
    public TradingSetup? Setup { get; set; }
}
