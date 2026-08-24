using System.ComponentModel.DataAnnotations;

namespace FinPulse.Core.DTOs;

public class CreditCardCreateDto
{
    [Required]
    [MaxLength(200)]
    public string CardName { get; set; } = string.Empty;

    public decimal CurrentBalance { get; set; }

    public decimal AprPercent { get; set; }

    public decimal MinimumPayment { get; set; }

    [Range(1, 28)]
    public int DueDay { get; set; }

    public bool IsAutopay { get; set; }

    public decimal? PromoAprPercent { get; set; }

    public DateTime? PromoEndDate { get; set; }
}
