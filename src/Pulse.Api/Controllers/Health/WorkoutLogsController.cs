using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models.Health;

namespace Pulse.Api.Controllers.Health;

[ApiController]
[Route("api/workout-logs")]
[Authorize]
public class WorkoutLogsController : ControllerBase
{
    private readonly PulseDbContext _db;

    public WorkoutLogsController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var query = _db.WorkoutLogs.Where(l => l.UserId == UserId);

        if (fromDate.HasValue)
            query = query.Where(l => l.Date >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(l => l.Date <= toDate.Value);

        var logs = await query
            .OrderByDescending(l => l.Date)
            .Select(l => new
            {
                l.Id,
                l.Date,
                l.FocusArea,
                l.DurationMinutes,
                l.Notes,
                SetCount = l.Sets.Count,
                TotalVolume = l.Sets.Sum(s => s.Weight * s.Reps),
                l.CreatedAt
            })
            .ToListAsync();
        return Ok(logs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkoutLog>> GetById(int id)
    {
        var log = await _db.WorkoutLogs
            .Include(l => l.Sets.OrderBy(s => s.OrderIndex).ThenBy(s => s.SetNumber))
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (log == null) return NotFound();
        return Ok(log);
    }

    [HttpGet("today")]
    public async Task<ActionResult> GetToday()
    {
        var today = DateTime.UtcNow.Date;
        var log = await _db.WorkoutLogs
            .Include(l => l.Sets.OrderBy(s => s.OrderIndex).ThenBy(s => s.SetNumber))
            .FirstOrDefaultAsync(l => l.UserId == UserId && l.Date.Date == today);
        if (log == null) return NotFound();
        return Ok(log);
    }

    [HttpPost]
    public async Task<ActionResult<WorkoutLog>> Create([FromBody] WorkoutLog log)
    {
        log.UserId = UserId;
        if (log.Date == default)
            log.Date = DateTime.UtcNow;

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            _db.WorkoutLogs.Add(log);
            await _db.SaveChangesAsync();

            var activePlan = await _db.WorkoutPlans.FirstOrDefaultAsync(p => p.UserId == UserId && p.IsActive && p.IsSequential);
            if (activePlan != null && log.PlanDayId == null)
            {
                var today = (int)DateTime.UtcNow.DayOfWeek;
                var todayDay = await _db.WorkoutPlanDays.FirstOrDefaultAsync(d => d.PlanId == activePlan.Id && d.DayOfWeek == today);
                if (todayDay != null)
                {
                    log.PlanDayId = todayDay.Id;
                    await _db.SaveChangesAsync();
                }
            }

            await transaction.CommitAsync();
            return Ok(log);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<WorkoutLog>> Update(int id, [FromBody] WorkoutLog updated)
    {
        var log = await _db.WorkoutLogs
            .Include(l => l.Sets)
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (log == null) return NotFound();

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            log.Date = updated.Date;
            log.FocusArea = updated.FocusArea;
            log.DurationMinutes = updated.DurationMinutes;
            log.Notes = updated.Notes;

            _db.ExerciseSets.RemoveRange(log.Sets);
            foreach (var set in updated.Sets)
            {
                set.WorkoutLogId = id;
                _db.ExerciseSets.Add(set);
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(log);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var log = await _db.WorkoutLogs
            .Include(l => l.Sets)
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (log == null) return NotFound();
        _db.WorkoutLogs.Remove(log);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("records")]
    public async Task<ActionResult> GetRecords()
    {
        var records = await _db.ExerciseSets
            .Where(s => s.WorkoutLog!.UserId == UserId)
            .GroupBy(s => s.ExerciseName)
            .Select(g => new
            {
                Exercise = g.Key,
                MaxWeight = g.Max(s => s.Weight),
                BestSet = g.OrderByDescending(s => s.Weight).ThenByDescending(s => s.Reps).Select(s => new
                {
                    s.Weight,
                    s.Reps,
                    Date = s.WorkoutLog!.Date
                }).First()
            })
            .ToListAsync();
        return Ok(records);
    }

    [HttpGet("progress")]
    public async Task<ActionResult> GetProgress([FromQuery] string exercise, [FromQuery] int days = 90)
    {
        var since = DateTime.UtcNow.AddDays(-days);
        var data = await _db.ExerciseSets
            .Where(s => s.WorkoutLog!.UserId == UserId
                && s.ExerciseName == exercise
                && s.WorkoutLog!.Date >= since)
            .GroupBy(s => s.WorkoutLog!.Date.Date)
            .Select(g => new
            {
                Date = g.Key,
                MaxWeight = g.Max(s => s.Weight),
                TotalVolume = g.Sum(s => s.Weight * s.Reps),
                Sets = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("exercises")]
    public async Task<ActionResult<List<string>>> GetExercises()
    {
        var exercises = await _db.ExerciseSets
            .Where(s => s.WorkoutLog!.UserId == UserId)
            .Select(s => s.ExerciseName)
            .Distinct()
            .OrderBy(n => n)
            .ToListAsync();
        return Ok(exercises);
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var now = DateTime.UtcNow;
        var startOfWeek = now.Date.AddDays(-(int)now.DayOfWeek);
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        var thisWeek = await _db.WorkoutLogs.CountAsync(l => l.UserId == UserId && l.Date >= startOfWeek);
        var thisMonth = await _db.WorkoutLogs.CountAsync(l => l.UserId == UserId && l.Date >= startOfMonth);

        var totalVolume = await _db.ExerciseSets
            .Where(s => s.WorkoutLog!.UserId == UserId && s.WorkoutLog!.Date >= startOfMonth)
            .SumAsync(s => s.Weight * s.Reps);

        var streak = 0;
        var checkDate = now.Date;
        while (true)
        {
            var hasWorkout = await _db.WorkoutLogs.AnyAsync(l => l.UserId == UserId && l.Date.Date == checkDate);
            if (!hasWorkout) break;
            streak++;
            checkDate = checkDate.AddDays(-1);
        }

        return Ok(new
        {
            WorkoutsThisWeek = thisWeek,
            WorkoutsThisMonth = thisMonth,
            MonthlyVolume = totalVolume,
            CurrentStreak = streak
        });
    }
}
