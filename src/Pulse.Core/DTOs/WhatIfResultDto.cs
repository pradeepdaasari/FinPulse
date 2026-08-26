using Pulse.Core.Models.Enums;

namespace Pulse.Core.DTOs;

public class WhatIfResultDto
{
    public List<DebtProjectionDto> Projections { get; set; } = new();
    public decimal TotalInterestSaved { get; set; }
    public DateTime OriginalDebtFreeDate { get; set; }
    public DateTime NewDebtFreeDate { get; set; }
}

public class DebtProjectionDto
{
    public int DebtId { get; set; }
    public string DebtName { get; set; } = string.Empty;
    public DebtType DebtType { get; set; }
    public int OriginalPayoffMonths { get; set; }
    public int NewPayoffMonths { get; set; }
    public decimal OriginalTotalInterest { get; set; }
    public decimal NewTotalInterest { get; set; }
    public decimal InterestSaved { get; set; }
}
