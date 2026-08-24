using System.ComponentModel.DataAnnotations;

namespace FinPulse.Core.DTOs;

public class SavingsGoalCreateDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    [Range(0.01, double.MaxValue)]
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateTime? TargetDate { get; set; }
    public int? LinkedAccountId { get; set; }
    [MaxLength(50)]
    public string? Icon { get; set; }
}
