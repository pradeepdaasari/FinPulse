using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Health;

public class WorkoutLog
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    [Required]
    [MaxLength(100)]
    public string FocusArea { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
    [MaxLength(500)]
    public string? Notes { get; set; }
    public string? UserId { get; set; }
    public int? PlanDayId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<ExerciseSet> Sets { get; set; } = new();
}
