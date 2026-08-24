namespace FinPulse.Core.DTOs;

public class MonthlySnapshotPointDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string Label { get; set; } = "";
    public decimal TotalDebt { get; set; }
    public decimal TotalPaid { get; set; }
}

public class TrendDataDto
{
    public List<MonthlySnapshotPointDto> Snapshots { get; set; } = new();
    public decimal MonthOverMonthChange { get; set; }
    public decimal MonthOverMonthChangePercent { get; set; }
}
