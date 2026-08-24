using System.ComponentModel.DataAnnotations;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.Models;

public class BankAccount
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string AccountName { get; set; } = string.Empty;

    public BankAccountType AccountType { get; set; } = BankAccountType.Checking;

    public decimal CurrentBalance { get; set; }

    public string? UserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
