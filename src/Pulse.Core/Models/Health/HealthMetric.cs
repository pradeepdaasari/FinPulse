using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Health;

public class HealthMetric
{
    public int Id { get; set; }
    [Required]
    [MaxLength(50)]
    public string MetricType { get; set; } = string.Empty;
    public decimal Value { get; set; }
    [Required]
    [MaxLength(20)]
    public string Unit { get; set; } = string.Empty;
    public DateTime MeasuredAt { get; set; }
    [MaxLength(500)]
    public string? Notes { get; set; }
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
