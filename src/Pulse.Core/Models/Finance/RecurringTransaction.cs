using System.ComponentModel.DataAnnotations;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Models;

public class RecurringTransaction
{
    public int Id { get; set; }
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    [MaxLength(200)]
    public string? Merchant { get; set; }
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
    public int CategoryId { get; set; }
    public CustomCategory Category { get; set; } = null!;
    public TransactionType TransactionType { get; set; }
    public FundingSourceType? FundingSourceType { get; set; }
    public int? FundingSourceId { get; set; }
    public RecurrenceFrequency Frequency { get; set; }
    public DateTime NextRunDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
