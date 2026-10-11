namespace Pulse.Core.DTOs;

public class LoanSummaryDto
{
    public decimal TotalBalance { get; set; }
    public decimal TotalMonthlyPayment { get; set; }
    public decimal AvgApr { get; set; }
    public int ActiveCount { get; set; }
}
