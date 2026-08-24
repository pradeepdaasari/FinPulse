namespace FinPulse.Core.DTOs;

public class PaymentStreakDto
{
    public int CurrentStreak { get; set; }
    public int LongestStreak { get; set; }
    public bool CurrentMonthAllPaid { get; set; }
}
