using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models.Trading;

public class WeeklyReflection
{
    public int Id { get; set; }
    public string? UserId { get; set; }
    public DateTime WeekStart { get; set; }
    public string? WhatWorked { get; set; }
    public string? WhatHurt { get; set; }
    public string? OneChange { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
