using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Health;

public class BloodWorkResult
{
    public int Id { get; set; }
    public int ReportId { get; set; }
    public BloodWorkReport? Report { get; set; }
    [Required]
    [MaxLength(100)]
    public string TestName { get; set; } = string.Empty;
    public decimal Value { get; set; }
    [Required]
    [MaxLength(30)]
    public string Unit { get; set; } = string.Empty;
    public decimal? ReferenceMin { get; set; }
    public decimal? ReferenceMax { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
