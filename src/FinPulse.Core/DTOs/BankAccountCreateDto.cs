using System.ComponentModel.DataAnnotations;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.DTOs;

public class BankAccountCreateDto
{
    [Required]
    [MaxLength(200)]
    public string AccountName { get; set; } = string.Empty;

    public BankAccountType AccountType { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CurrentBalance { get; set; }
}
