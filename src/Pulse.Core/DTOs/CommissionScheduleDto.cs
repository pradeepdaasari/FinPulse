using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.DTOs;

public class CommissionScheduleCreateDto
{
    public decimal? OptionsCommissionPerContract { get; set; }
    public decimal? FuturesCommissionPerContract { get; set; }
    public decimal? OptionsRegFeePerContract { get; set; }
    public decimal? FuturesRegFeePerContract { get; set; }

    [Required]
    public DateTime EffectiveFrom { get; set; }

    public bool RecalculateTrades { get; set; } = true;
}

public class CommissionScheduleResponseDto
{
    public int Id { get; set; }
    public int BankAccountId { get; set; }
    public decimal? OptionsCommissionPerContract { get; set; }
    public decimal? FuturesCommissionPerContract { get; set; }
    public decimal? OptionsRegFeePerContract { get; set; }
    public decimal? FuturesRegFeePerContract { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CommissionScheduleResultDto
{
    public CommissionScheduleResponseDto Schedule { get; set; } = null!;
    public int TradesRecalculated { get; set; }
}
