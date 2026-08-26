using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Health;

public class ExerciseSet
{
    public int Id { get; set; }
    public int WorkoutLogId { get; set; }
    public WorkoutLog? WorkoutLog { get; set; }
    [Required]
    [MaxLength(200)]
    public string ExerciseName { get; set; } = string.Empty;
    public int SetNumber { get; set; }
    public int Reps { get; set; }
    public decimal Weight { get; set; }
    public int OrderIndex { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
