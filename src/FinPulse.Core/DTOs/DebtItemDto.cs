namespace FinPulse.Core.DTOs;

public class DebtItemDto
{
    public string Key { get; set; } = string.Empty;
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal CurrentBalance { get; set; }
    public decimal MonthlyPayment { get; set; }
    public decimal AprPercent { get; set; }
    public int DueDay { get; set; }
    public bool IsAutopay { get; set; }
    public string? SubType { get; set; }
}
