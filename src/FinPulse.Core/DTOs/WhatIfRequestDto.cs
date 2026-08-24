namespace FinPulse.Core.DTOs;

public class WhatIfRequestDto
{
    public Dictionary<int, decimal> LoanExtraPayments { get; set; } = new();
    public Dictionary<int, decimal> CardExtraPayments { get; set; } = new();
}
