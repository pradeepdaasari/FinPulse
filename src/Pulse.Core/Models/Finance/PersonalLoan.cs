using System.ComponentModel.DataAnnotations;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Models;

public class PersonalLoan
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string LenderName { get; set; } = string.Empty;

    public decimal OriginalAmount { get; set; }

    public decimal CurrentBalance { get; set; }

    public decimal AprPercent { get; set; }

    public int DurationMonths { get; set; }

    public DateTime StartDate { get; set; }

    public decimal MonthlyPayment { get; set; }

    [Range(0, 31)]
    public int DueDay { get; set; }

    public LoanType LoanType { get; set; } = LoanType.Personal;

    public bool IsAutopay { get; set; } = false;

    public PaymentFrequency PaymentFrequency { get; set; } = PaymentFrequency.Monthly;

    public int? FundedBankAccountId { get; set; }

    public DateTime? NextPaymentDate { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public decimal MonthlyEquivalentPayment => PaymentFrequency switch
    {
        PaymentFrequency.Weekly => MonthlyPayment * 52 / 12,
        PaymentFrequency.Biweekly => MonthlyPayment * 26 / 12,
        _ => MonthlyPayment
    };

    public string? UserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<PaymentHistory> Payments { get; set; } = new List<PaymentHistory>();
}
