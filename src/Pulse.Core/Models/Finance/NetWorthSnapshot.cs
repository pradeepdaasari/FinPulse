using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models;

public class NetWorthSnapshot
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public DateTime SnapshotDate { get; set; }
    public decimal TotalBankBalance { get; set; }
    public decimal TotalCreditCardDebt { get; set; }
    public decimal TotalLoanDebt { get; set; }
    public decimal NetWorth { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
