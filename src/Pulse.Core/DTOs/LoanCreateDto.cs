using System.ComponentModel.DataAnnotations;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.DTOs;

public class LoanCreateDto
{
    [Required]
    [MaxLength(200)]
    public string LenderName { get; set; } = string.Empty;

    public decimal OriginalAmount { get; set; }

    public decimal CurrentBalance { get; set; }

    public decimal AprPercent { get; set; }

    public int DurationMonths { get; set; }

    public DateTime StartDate { get; set; }

    public decimal MonthlyPayment { get; set; }

    [Range(1, 28)]
    public int DueDay { get; set; }

    public LoanType LoanType { get; set; } = LoanType.Personal;

    public bool IsAutopay { get; set; }

    public PaymentFrequency PaymentFrequency { get; set; } = PaymentFrequency.Monthly;
}
