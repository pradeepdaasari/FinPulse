using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models;

public class MonthlySnapshot
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TotalDebt { get; set; }
    public decimal TotalPaidThisMonth { get; set; }
    public string DebtBalancesJson { get; set; } = "{}";
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
