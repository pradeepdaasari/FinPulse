using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models;

public class SkipHistory
{
    public int Id { get; set; }
    public int RecurringTransactionId { get; set; }
    public DateTime SkippedDate { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
