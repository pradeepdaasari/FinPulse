using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Health;

public class PlannedExercise
{
    public int Id { get; set; }
    public int PlanDayId { get; set; }
    public WorkoutPlanDay? PlanDay { get; set; }
    [Required]
    [MaxLength(200)]
    public string ExerciseName { get; set; } = string.Empty;
    public int TargetSets { get; set; }
    [MaxLength(20)]
    public string TargetReps { get; set; } = string.Empty;
    public decimal? TargetWeight { get; set; }
    public int OrderIndex { get; set; }
    [MaxLength(300)]
    public string? Notes { get; set; }
    [MaxLength(500)]
    public string? VideoUrl { get; set; }
    [MaxLength(50)]
    public string? MuscleGroup { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
