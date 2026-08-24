using System.ComponentModel.DataAnnotations;

namespace FinPulse.Core.DTOs;

public class DailyExpenseCreateDto
{
    public DateTime Date { get; set; }
    public int CategoryId { get; set; }
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    [MaxLength(200)]
    public string? Merchant { get; set; }
}

public class SpendingSummaryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? CategoryIcon { get; set; }
    public decimal Budgeted { get; set; }
    public decimal Spent { get; set; }
    public decimal Remaining { get; set; }
    public decimal PercentUsed { get; set; }
}
