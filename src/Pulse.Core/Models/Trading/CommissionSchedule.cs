using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class CommissionSchedule
{
    public int Id { get; set; }

    [Required]
    public int BankAccountId { get; set; }

    public string? UserId { get; set; }

    public decimal? OptionsCommissionPerContract { get; set; }
    public decimal? FuturesCommissionPerContract { get; set; }
    public decimal? OptionsRegFeePerContract { get; set; }
    public decimal? FuturesRegFeePerContract { get; set; }

    [Required]
    public DateTime EffectiveFrom { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public BankAccount? BankAccount { get; set; }
}
