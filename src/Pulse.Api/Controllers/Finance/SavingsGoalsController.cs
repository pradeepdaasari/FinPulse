using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Services;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/savings-goals")]
[Authorize]
public class SavingsGoalsController : ControllerBase
{
    private readonly PulseDbContext _db;
    private readonly IDebtAggregationService _aggregationService;

    public SavingsGoalsController(PulseDbContext db, IDebtAggregationService aggregationService)
    {
        _db = db;
        _aggregationService = aggregationService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var goals = await _db.SavingsGoals
            .Include(g => g.LinkedAccount)
            .Where(g => g.UserId == UserId)
            .OrderBy(g => g.Name)
            .ToListAsync();

        var result = goals.Select(g =>
        {
            var current = g.LinkedAccountId.HasValue && g.LinkedAccount != null
                ? g.LinkedAccount.CurrentBalance
                : g.CurrentAmount;
            return new
            {
                g.Id,
                g.Name,
                g.TargetAmount,
                CurrentAmount = current,
                g.TargetDate,
                g.LinkedAccountId,
                LinkedAccountName = g.LinkedAccount?.AccountName,
                g.Icon,
                g.CreatedAt,
                Progress = g.TargetAmount > 0
                    ? Math.Min(100, Math.Round((double)current / (double)g.TargetAmount * 100, 1))
                    : 0
            };
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

    [HttpPost("{id}/contribute")]
    public async Task<ActionResult> Contribute(int id, [FromBody] ContributeDto dto)
    {
        if (dto.Amount <= 0)
            return BadRequest(new { error = "Contribution amount must be greater than zero." });

        var goal = await _db.SavingsGoals.FirstOrDefaultAsync(g => g.Id == id && g.UserId == UserId);
        if (goal is null) return NotFound();

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                await _db.Entry(goal).ReloadAsync();
                goal.CurrentAmount += dto.Amount;

                if (goal.LinkedAccountId.HasValue)
                {
                    var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == goal.LinkedAccountId && a.UserId == UserId);
                    if (account != null)
                    {
                        await _db.Entry(account).ReloadAsync();
                        account.CurrentBalance += dto.Amount;
                    }
                }

                await _db.SaveChangesAsync();
            });
            return Ok(new { goal.CurrentAmount });
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to record contribution. Please try again." });
        }
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

    [HttpGet("summary")]
    public async Task<ActionResult<GoalsSummaryDto>> GetSummary()
    {
        return Ok(await _aggregationService.GetGoalsSummaryAsync(UserId));
    }
}
