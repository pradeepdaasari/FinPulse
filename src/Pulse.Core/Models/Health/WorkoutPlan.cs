using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Health;

public class WorkoutPlan
{
    public int Id { get; set; }
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsSequential { get; set; }
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<WorkoutPlanDay> Days { get; set; } = new();
}
