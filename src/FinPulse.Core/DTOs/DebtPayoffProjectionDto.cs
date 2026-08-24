namespace FinPulse.Core.DTOs;

public class DebtPayoffProjectionDto
{
    public string DebtName { get; set; } = "";
    public string DebtType { get; set; } = "";
    public decimal CurrentBalance { get; set; }
    public decimal MonthlyPayment { get; set; }
    public DateTime ProjectedPayoffDate { get; set; }
    public int RemainingMonths { get; set; }
    public decimal ProgressPercent { get; set; }
}

public class DebtFreeCountdownDto
{
    public DateTime OverallDebtFreeDate { get; set; }
    public int OverallRemainingMonths { get; set; }
    public List<DebtPayoffProjectionDto> Projections { get; set; } = new();
}
