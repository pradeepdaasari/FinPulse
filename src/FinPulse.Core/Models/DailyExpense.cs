using System.ComponentModel.DataAnnotations;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.Models;

public class DailyExpense
{
    public int Id { get; set; }
    public DateTime Date { get; set; }

    public int CategoryId { get; set; }
    public CustomCategory Category { get; set; } = null!;

    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    [MaxLength(200)]
    public string? Merchant { get; set; }

    public TransactionType? TransactionType { get; set; }
    public FundingSourceType? FundingSourceType { get; set; }
    public int? FundingSourceId { get; set; }
    public int? ToFundingSourceId { get; set; }
    public Guid? SplitGroupId { get; set; }
    [MaxLength(100)]
    public string? Tag { get; set; }

    public string? UserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
