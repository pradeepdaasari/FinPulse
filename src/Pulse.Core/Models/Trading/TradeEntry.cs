using System.ComponentModel.DataAnnotations;
using Pulse.Core.Models;

namespace Pulse.Core.Models.Trading;

public class TradeEntry
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public DateTime Date { get; set; }
    public int SetupId { get; set; }
    [Required]
    [MaxLength(50)]
    public string Instrument { get; set; } = string.Empty;
    [MaxLength(10)]
    public string Direction { get; set; } = "long";
    public decimal EntryPrice { get; set; }
    public decimal? ExitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal? Pnl { get; set; }
    public bool ChecklistCompleted { get; set; }
    [MaxLength(20)]
    public string? EntryTime { get; set; }
    [MaxLength(20)]
    public string? ExitTime { get; set; }
    public string? Notes { get; set; }
    public string? Tags { get; set; }
    public bool IsRevengeTrading { get; set; }
    [MaxLength(50)]
    public string? EmotionAtEntry { get; set; }

    // Options fields
    [MaxLength(20)]
    public string AssetType { get; set; } = "Options";
    [MaxLength(10)]
    public string? OptionType { get; set; }
    [MaxLength(30)]
    public string? SpreadType { get; set; }
    public decimal? StrikePrice { get; set; }
    public decimal? StrikePrice2 { get; set; }
    public decimal? StrikePrice3 { get; set; }
    public decimal? StrikePrice4 { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public decimal? EntryPremium { get; set; }
    public decimal? ExitPremium { get; set; }
    public bool ExpiredWorthless { get; set; }
    public int Multiplier { get; set; } = 100;

    // Fees & net P&L
    public decimal? CommissionFees { get; set; }
    public decimal? RegExchangeFees { get; set; }
    public decimal? TotalFees { get; set; }
    public decimal? NetPnl { get; set; }

    // Brokerage account link
    public int? BankAccountId { get; set; }

    // Linked transaction for P&L balance tracking
    public int? LinkedExpenseId { get; set; }
    public DailyExpense? LinkedExpense { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public TradingSetup? Setup { get; set; }
    public List<ChecklistResponse> ChecklistResponses { get; set; } = new();
}
