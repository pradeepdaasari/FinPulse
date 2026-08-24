using System.ComponentModel.DataAnnotations;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.Models;

public class BudgetExpense
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public int CategoryId { get; set; }
    public CustomCategory Category { get; set; } = null!;

    public decimal Amount { get; set; }

    public bool IsFixed { get; set; }

    [Range(1, 28)]
    public int? DueDay { get; set; }

    public PaymentFrequency Frequency { get; set; } = PaymentFrequency.Monthly;

    public bool IsAutopay { get; set; }

    public string? UserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
