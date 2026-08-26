using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class DailyReview
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public DateTime Date { get; set; }
    [MaxLength(2)]
    public string Grade { get; set; } = "C";
    public bool FollowedPlan { get; set; }
    public bool FollowedRules { get; set; }
    public int TotalTrades { get; set; }
    public decimal TotalPnl { get; set; }
    public string? RulesViolated { get; set; }
    public string? LessonsLearned { get; set; }
    public string? ImprovementNote { get; set; }
    public string? EmotionalSummary { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
