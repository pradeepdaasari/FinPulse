using System.ComponentModel.DataAnnotations;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.DTOs;

public class BankAccountCreateDto
{
    [Required]
    [MaxLength(200)]
    public string AccountName { get; set; } = string.Empty;

    public BankAccountType AccountType { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CurrentBalance { get; set; }
}
