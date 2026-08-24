using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/savings-goals")]
[Authorize]
public class SavingsGoalsController : ControllerBase
{
    private readonly FinPulseDbContext _db;

    public SavingsGoalsController(FinPulseDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var goals = await _db.SavingsGoals
            .Include(g => g.LinkedAccount)
            .Where(g => g.UserId == UserId)
            .OrderBy(g => g.Name)
            .ToListAsync();

        var result = goals.Select(g => new
        {
            g.Id,
            g.Name,
            g.TargetAmount,
            CurrentAmount = g.LinkedAccountId.HasValue && g.LinkedAccount != null
                ? g.LinkedAccount.CurrentBalance
                : g.CurrentAmount,
            g.TargetDate,
            g.LinkedAccountId,
            LinkedAccountName = g.LinkedAccount?.AccountName,
            g.Icon,
            g.CreatedAt
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult> Create(SavingsGoalCreateDto dto)
    {
        if (dto.LinkedAccountId.HasValue)
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(
                a => a.Id == dto.LinkedAccountId && a.UserId == UserId);
            if (account is null)
                return BadRequest("Invalid linked account.");
        }

        var goal = new SavingsGoal
        {
            Name = dto.Name,
            TargetAmount = dto.TargetAmount,
            CurrentAmount = dto.CurrentAmount,
            TargetDate = dto.TargetDate,
            LinkedAccountId = dto.LinkedAccountId,
            Icon = dto.Icon,
            UserId = UserId
        };

        _db.SavingsGoals.Add(goal);
        await _db.SaveChangesAsync();
        return Ok(new { goal.Id });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, SavingsGoalCreateDto dto)
    {
        var goal = await _db.SavingsGoals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (goal is null) return NotFound();

        if (dto.LinkedAccountId.HasValue)
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(
                a => a.Id == dto.LinkedAccountId && a.UserId == UserId);
            if (account is null)
                return BadRequest("Invalid linked account.");
        }

        goal.Name = dto.Name;
        goal.TargetAmount = dto.TargetAmount;
        goal.CurrentAmount = dto.CurrentAmount;
        goal.TargetDate = dto.TargetDate;
        goal.LinkedAccountId = dto.LinkedAccountId;
        goal.Icon = dto.Icon;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var goal = await _db.SavingsGoals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (goal is null) return NotFound();
        _db.SavingsGoals.Remove(goal);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
