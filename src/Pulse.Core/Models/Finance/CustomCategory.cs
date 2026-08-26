using System.ComponentModel.DataAnnotations;

namespace Pulse.Core.Models;

public enum CategoryType
{
    Expense = 0,
    Income = 1
}

public class CustomCategory
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public bool IsFixed { get; set; }

    public CategoryType Type { get; set; } = CategoryType.Expense;

    [MaxLength(50)]
    public string? Icon { get; set; }

    public string? UserId { get; set; }

    public int? ParentId { get; set; }
    public CustomCategory? Parent { get; set; }

    public List<CustomCategory> Children { get; set; } = new();

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
