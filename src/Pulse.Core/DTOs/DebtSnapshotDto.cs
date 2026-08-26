using Pulse.Core.Models.Enums;

namespace Pulse.Core.DTOs;

public class DebtSnapshotDto
{
    public int Id { get; set; }
    public DebtType DebtType { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Balance { get; set; }
    public decimal AprPercent { get; set; }
    public decimal MinimumPayment { get; set; }
    public decimal EffectiveApr { get; set; }
    public DateTime? PromoEndDate { get; set; }
    public int DueDay { get; set; }
}
