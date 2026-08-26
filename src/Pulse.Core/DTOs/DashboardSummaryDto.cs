namespace Pulse.Core.DTOs;

public class DashboardSummaryDto
{
    public decimal TotalDebt { get; set; }
    public decimal TotalMonthlyPayment { get; set; }
    public DateTime EstimatedDebtFreeDate { get; set; }
    public int NumberOfDebts { get; set; }
    public List<UpcomingPaymentDto> UpcomingPayments { get; set; } = new();
}
