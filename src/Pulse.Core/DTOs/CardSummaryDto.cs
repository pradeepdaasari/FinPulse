namespace Pulse.Core.DTOs;

public class CardSummaryDto
{
    public decimal TotalBalance { get; set; }
    public decimal TotalLimit { get; set; }
    public decimal TotalMinPayment { get; set; }
    public int AvgUtilization { get; set; }
}
