using System.ComponentModel.DataAnnotations;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.DTOs;

public class BudgetExpenseCreateDto
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public int CategoryId { get; set; }

    public decimal Amount { get; set; }

    public bool IsFixed { get; set; }

    [Range(1, 28)]
    public int? DueDay { get; set; }

    public PaymentFrequency Frequency { get; set; } = PaymentFrequency.Monthly;

    public bool IsAutopay { get; set; }
}
