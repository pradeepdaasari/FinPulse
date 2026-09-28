using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models;

public class StatementHistory
{
    public int Id { get; set; }

    public int CreditCardId { get; set; }

    public string? UserId { get; set; }

    public DateTime StatementDate { get; set; }

    public decimal StatementBalance { get; set; }

    public decimal MinimumPayment { get; set; }

    public decimal CreditLimit { get; set; }

    public DateTime CreatedAt { get; set; }
}
