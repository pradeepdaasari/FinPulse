namespace Pulse.Core.DTOs;

public class CategoryComparisonDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? CategoryIcon { get; set; }
    public decimal CurrentMonthAmount { get; set; }
    public decimal PreviousMonthAmount { get; set; }
    public decimal Difference { get; set; }
    public decimal PercentChange { get; set; }
}

public class MonthComparisonDto
{
    public int CurrentYear { get; set; }
    public int CurrentMonth { get; set; }
    public int PreviousYear { get; set; }
    public int PreviousMonth { get; set; }
    public decimal CurrentTotal { get; set; }
    public decimal PreviousTotal { get; set; }
    public List<CategoryComparisonDto> Categories { get; set; } = new();
}
