namespace Pulse.Core.DTOs;

public class PayoffEntryDto
{
    public int MonthNumber { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal PaymentAmount { get; set; }
    public decimal InterestCharged { get; set; }
    public decimal PrincipalPaid { get; set; }
    public decimal RemainingBalance { get; set; }
    public bool IsPromoActive { get; set; }
}
