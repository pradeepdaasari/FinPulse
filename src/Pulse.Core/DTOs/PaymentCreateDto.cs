using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.DTOs;

public class PaymentCreateDto
{
    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal AmountPaid { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public int? FromAccountId { get; set; }

    [Range(0, 10_000_000)]
    public decimal? PrincipalAmount { get; set; }

    [Range(0, 10_000_000)]
    public decimal? InterestAmount { get; set; }
}
