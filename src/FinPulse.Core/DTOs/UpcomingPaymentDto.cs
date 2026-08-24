using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.DTOs;

public class UpcomingPaymentDto
{
    public int DebtId { get; set; }
    public string DebtName { get; set; } = string.Empty;
    public DebtType DebtType { get; set; }
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public int DaysUntilDue { get; set; }
    public string UrgencyLevel { get; set; } = string.Empty;
}
