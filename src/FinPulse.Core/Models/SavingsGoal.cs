using System.ComponentModel.DataAnnotations;

namespace FinPulse.Core.Models;

public class SavingsGoal
{
    public int Id { get; set; }
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    [Range(0.01, double.MaxValue)]
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateTime? TargetDate { get; set; }
    public int? LinkedAccountId { get; set; }
    public BankAccount? LinkedAccount { get; set; }
    [MaxLength(50)]
    public string? Icon { get; set; }
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
