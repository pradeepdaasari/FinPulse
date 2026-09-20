using System.ComponentModel.DataAnnotations;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.DTOs;

public class LoanCreateDto
{
    [Required]
    [MaxLength(200)]
    public string LenderName { get; set; } = string.Empty;

    [Range(0.01, 100_000_000)]
    public decimal OriginalAmount { get; set; }

    [Range(0, 100_000_000)]
    public decimal CurrentBalance { get; set; }

    [Range(0, 100)]
    public decimal AprPercent { get; set; }

    [Range(1, 600)]
    public int DurationMonths { get; set; }

    public DateTime StartDate { get; set; }

    [Range(0.01, 10_000_000)]
    public decimal MonthlyPayment { get; set; }

    [Range(0, 28)]
    public int DueDay { get; set; }

    public LoanType LoanType { get; set; } = LoanType.Personal;

    public bool IsAutopay { get; set; }

    public PaymentFrequency PaymentFrequency { get; set; } = PaymentFrequency.Monthly;

    public RateType RateType { get; set; } = RateType.Fixed;

    public int? FundedBankAccountId { get; set; }

    public DateTime? NextPaymentDate { get; set; }
}
