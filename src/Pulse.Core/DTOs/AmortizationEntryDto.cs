namespace Pulse.Core.DTOs;

public class AmortizationEntryDto
{
    public int PeriodNumber { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal PaymentAmount { get; set; }
    public decimal PrincipalPortion { get; set; }
    public decimal InterestPortion { get; set; }
    public decimal RemainingBalance { get; set; }
    public bool IsPaid { get; set; }
}

public class AmortizationScheduleDto
{
    public List<AmortizationEntryDto> Entries { get; set; } = new();
    public decimal PaidPrincipal { get; set; }
    public decimal PaidInterest { get; set; }
    public decimal PendingPrincipal { get; set; }
    public decimal PendingInterest { get; set; }
    public decimal TotalInterest { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal TotalCost { get; set; }
}
