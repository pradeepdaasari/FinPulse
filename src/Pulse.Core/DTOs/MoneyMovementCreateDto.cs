using System.ComponentModel.DataAnnotations;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.DTOs;

public class MoneyMovementCreateDto
{
    [Required]
    public MoneyMovementEntityType SourceType { get; set; }
    public int? SourceId { get; set; }

    [Required]
    public MoneyMovementEntityType DestinationType { get; set; }
    public int? DestinationId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [Required]
    public DateTime MovementDate { get; set; }

    [Required]
    public MovementType MovementType { get; set; }

    [MaxLength(500)]
    public string? Note { get; set; }
}
