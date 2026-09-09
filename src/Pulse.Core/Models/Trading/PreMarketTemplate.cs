namespace Pulse.Core.Models.Trading;

public class PreMarketTemplate
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? KeyLevels { get; set; }
    public string? Catalysts { get; set; }
    public string? Plan { get; set; }
    public DateTime UpdatedAt { get; set; }
}
