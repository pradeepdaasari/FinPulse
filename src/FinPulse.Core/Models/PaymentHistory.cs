using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.Models;

public class PaymentHistory
{
    public int Id { get; set; }

    public DebtType DebtType { get; set; }

    public int DebtId { get; set; }

    public decimal AmountPaid { get; set; }

    public DateTime PaymentDate { get; set; }

    public string? Notes { get; set; }

    public string? UserId { get; set; }

    public int? FromAccountId { get; set; }
}
