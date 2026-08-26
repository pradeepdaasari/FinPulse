using Pulse.Core.Models.Enums;

namespace Pulse.Core.Models;

public class UserProfile
{
    public int Id { get; set; }

    public decimal MonthlyIncome { get; set; }

    public PaymentFrequency PayFrequency { get; set; } = PaymentFrequency.Biweekly;

    public decimal NetPayPerCheck { get; set; }

    public DateTime? NextPayDate { get; set; }

    public string? UserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
