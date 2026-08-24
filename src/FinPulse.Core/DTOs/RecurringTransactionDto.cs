using System.ComponentModel.DataAnnotations;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.DTOs;

public class RecurringTransactionCreateDto
{
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    [MaxLength(200)]
    public string? Merchant { get; set; }
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
    public int CategoryId { get; set; }
    public TransactionType TransactionType { get; set; }
    public FundingSourceType? FundingSourceType { get; set; }
    public int? FundingSourceId { get; set; }
    public RecurrenceFrequency Frequency { get; set; }
    public DateTime NextRunDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
}
