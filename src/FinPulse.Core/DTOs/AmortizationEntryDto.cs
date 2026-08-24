namespace FinPulse.Core.DTOs;

public class AmortizationEntryDto
{
    public int PeriodNumber { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal PaymentAmount { get; set; }
    public decimal PrincipalPortion { get; set; }
    public decimal InterestPortion { get; set; }
    public decimal RemainingBalance { get; set; }
}
