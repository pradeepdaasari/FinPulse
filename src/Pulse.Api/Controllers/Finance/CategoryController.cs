using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoryController : ControllerBase
{
    private readonly PulseDbContext _db;

    public CategoryController(PulseDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? type)
    {
        var query = _db.CustomCategories
            .Include(c => c.Children)
            .Where(c => c.ParentId == null && (c.UserId == null || c.UserId == UserId));

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<CategoryType>(type, true, out var catType))
            query = query.Where(c => c.Type == catType);

        var categories = await query
            .OrderBy(c => c.IsFixed ? 0 : 1)
            .ThenBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.IsFixed,
                c.Icon,
                Type = c.Type.ToString(),
                ParentId = (int?)null,
                Children = c.Children.OrderBy(ch => ch.Name).Select(ch => new
                {
                    ch.Id,
                    ch.Name,
                    ch.IsFixed,
                    ch.Icon,
                    Type = ch.Type.ToString(),
                    ch.ParentId
                }).ToList()
            })
            .ToListAsync();
        return Ok(categories);
    }

    [HttpGet("flat")]
    public async Task<IActionResult> GetFlat([FromQuery] string? type)
    {
        var query = _db.CustomCategories
            .Include(c => c.Parent)
            .Where(c => c.UserId == null || c.UserId == UserId);

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<CategoryType>(type, true, out var catType))
            query = query.Where(c => c.Type == catType);

        var categories = await query
            .OrderBy(c => c.Parent != null ? c.Parent.Name : c.Name)
            .ThenBy(c => c.ParentId.HasValue ? 1 : 0)
            .ThenBy(c => c.Name)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.IsFixed,
                c.Icon,
                Type = c.Type.ToString(),
                c.ParentId,
                ParentName = c.Parent != null ? c.Parent.Name : null
            })
            .ToListAsync();
        return Ok(categories);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Category name is required.");

        var exists = await _db.CustomCategories
            .AnyAsync(c => c.Name == dto.Name.Trim() && c.ParentId == dto.ParentId && (c.UserId == null || c.UserId == UserId));
        if (exists)
            return Conflict("A category with that name already exists at this level.");

        var category = new CustomCategory
        {
            Name = dto.Name.Trim(),
            IsFixed = dto.IsFixed,
            Type = dto.Type,
            Icon = dto.Icon,
            UserId = UserId,
            ParentId = dto.ParentId
        };

        _db.CustomCategories.Add(category);
        await _db.SaveChangesAsync();
        return Ok(new { category.Id, category.Name, category.IsFixed, category.Icon, Type = category.Type.ToString(), category.ParentId });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryCreateDto dto)
    {
        var category = await _db.CustomCategories.FindAsync(id);
        if (category == null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Category name is required.");

        var duplicate = await _db.CustomCategories
            .AnyAsync(c => c.Name == dto.Name.Trim() && c.ParentId == dto.ParentId && c.Id != id && (c.UserId == null || c.UserId == UserId));
        if (duplicate)
            return Conflict("A category with that name already exists at this level.");

        category.Name = dto.Name.Trim();
        category.IsFixed = dto.IsFixed;
        category.Type = dto.Type;
        category.Icon = dto.Icon;
        category.ParentId = dto.ParentId;
        await _db.SaveChangesAsync();
        return Ok(new { category.Id, category.Name, category.IsFixed, category.Icon, Type = category.Type.ToString(), category.ParentId });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _db.CustomCategories.FindAsync(id);
        if (category == null) return NotFound();

        var hasChildren = await _db.CustomCategories.AnyAsync(c => c.ParentId == id);
        if (hasChildren)
            return BadRequest("Cannot delete a category that has subcategories. Remove subcategories first.");

        var budgetExpenses = await _db.BudgetExpenses.Where(e => e.CategoryId == id).ToListAsync();
        var dailyExpenses = await _db.DailyExpenses
            .Where(e => e.CategoryId == id && e.UserId == UserId)
            .OrderByDescending(e => e.Date)
            .Take(20)
            .Select(e => new { e.Id, e.Date, e.Description, e.Amount, e.TransactionType, e.Tag })
            .ToListAsync();

        if (budgetExpenses.Count > 0 || dailyExpenses.Count > 0)
        {
            var totalDaily = await _db.DailyExpenses.CountAsync(e => e.CategoryId == id && e.UserId == UserId);
            return Conflict(new
            {
                message = "Cannot delete a category that is in use.",
                budgetExpenses = budgetExpenses.Select(b => new { b.Id, b.Name, b.Amount }),
                transactions = dailyExpenses,
                totalTransactions = totalDaily
            });
        }

        _db.CustomCategories.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public class CategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsFixed { get; set; }
    public CategoryType Type { get; set; } = CategoryType.Expense;
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
}
