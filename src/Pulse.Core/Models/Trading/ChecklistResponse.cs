using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Pulse.Core.Models.Trading;

public class ChecklistResponse
{
    public int Id { get; set; }
    public int TradeEntryId { get; set; }
    public int ChecklistItemId { get; set; }
    [MaxLength(300)]
    public string Label { get; set; } = string.Empty;
    public bool Checked { get; set; }

    [JsonIgnore]
    public TradeEntry? TradeEntry { get; set; }
}
