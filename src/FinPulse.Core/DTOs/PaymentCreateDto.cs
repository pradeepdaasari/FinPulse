using System.ComponentModel.DataAnnotations;

namespace FinPulse.Core.DTOs;

public class PaymentCreateDto
{
    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal AmountPaid { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    public string? Notes { get; set; }
}
