using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Health;

public class WorkoutPlanDay
{
    public int Id { get; set; }
    public int PlanId { get; set; }
    public WorkoutPlan? Plan { get; set; }
    public int DayOfWeek { get; set; }
    [Required]
    [MaxLength(100)]
    public string FocusArea { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<PlannedExercise> Exercises { get; set; } = new();
}
