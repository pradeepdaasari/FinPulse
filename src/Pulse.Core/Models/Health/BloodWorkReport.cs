using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Health;

public class BloodWorkReport
{
    public int Id { get; set; }
    public DateTime ReportDate { get; set; }
    [MaxLength(200)]
    public string? LabName { get; set; }
    [MaxLength(500)]
    public string? Notes { get; set; }
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<BloodWorkResult> Results { get; set; } = new();
}
