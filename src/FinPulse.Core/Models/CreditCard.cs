using System.ComponentModel.DataAnnotations;

namespace FinPulse.Core.Models;

public class CreditCard
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string CardName { get; set; } = string.Empty;

    public decimal CurrentBalance { get; set; }

    public decimal AprPercent { get; set; }

    public decimal MinimumPayment { get; set; }

    [Range(1, 28)]
    public int DueDay { get; set; }

    [Range(20, 45)]
    public int BillingCycleDays { get; set; } = 30;

    public bool IsAutopay { get; set; } = false;

    public decimal? PromoAprPercent { get; set; }

    public DateTime? PromoEndDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<PaymentHistory> Payments { get; set; } = new List<PaymentHistory>();
}
