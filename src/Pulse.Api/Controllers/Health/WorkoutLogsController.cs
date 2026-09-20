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
    private readonly ILogger<WorkoutLogsController> _logger;

    public WorkoutLogsController(PulseDbContext db, ILogger<WorkoutLogsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var query = _db.WorkoutLogs.Where(l => l.UserId == UserId);

        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        if (fromDate.HasValue)
            query = query.Where(l => l.Date >= TimeZoneHelper.ToUtc(fromDate.Value, tz));
        if (toDate.HasValue)
            query = query.Where(l => l.Date < TimeZoneHelper.ToUtc(toDate.Value.Date.AddDays(1), tz));

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
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var todayStart = TimeZoneHelper.ToUtc(userNow.Date, tz);
        var todayEnd = TimeZoneHelper.ToUtc(userNow.Date.AddDays(1), tz);

        var log = await _db.WorkoutLogs
            .Include(l => l.Sets.OrderBy(s => s.OrderIndex).ThenBy(s => s.SetNumber))
            .FirstOrDefaultAsync(l => l.UserId == UserId && l.Date >= todayStart && l.Date < todayEnd);
        if (log == null) return NotFound();
        return Ok(log);
    }

    [HttpPost]
    public async Task<ActionResult<WorkoutLog>> Create([FromBody] WorkoutLog log)
    {
        log.Id = 0;
        log.UserId = UserId;
        log.FocusArea = log.FocusArea?.Trim();
        log.Notes = log.Notes?.Trim();
        foreach (var s in log.Sets)
        {
            s.Id = 0;
            s.ExerciseName = s.ExerciseName?.Trim() ?? "";
        }

        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        if (log.Date == default)
            log.Date = DateTime.UtcNow;
        else
            log.Date = TimeZoneHelper.ToUtc(log.Date, tz);

        var userNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var todayDow = (int)userNow.DayOfWeek;

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                _db.ChangeTracker.Clear();
                using var transaction = await _db.Database.BeginTransactionAsync();

                _db.WorkoutLogs.Add(log);
                await _db.SaveChangesAsync();

                var activePlan = await _db.WorkoutPlans.FirstOrDefaultAsync(p => p.UserId == UserId && p.IsActive && p.IsSequential);
                if (activePlan != null && log.PlanDayId == null)
                {
                    var todayDay = await _db.WorkoutPlanDays.FirstOrDefaultAsync(d => d.PlanId == activePlan.Id && d.DayOfWeek == todayDow);
                    if (todayDay != null)
                    {
                        await _db.Entry(log).ReloadAsync();
                        log.PlanDayId = todayDay.Id;
                        await _db.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();
            });
            return Ok(log);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating workout log");
            return StatusCode(500, new { error = "An error occurred while creating the workout log." });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<WorkoutLog>> Update(int id, [FromBody] WorkoutLog updated)
    {
        var log = await _db.WorkoutLogs
            .Include(l => l.Sets)
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (log == null) return NotFound();

        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                _db.ChangeTracker.Clear();
                using var transaction = await _db.Database.BeginTransactionAsync();

                var l = await _db.WorkoutLogs.Include(x => x.Sets)
                    .FirstAsync(x => x.Id == id && x.UserId == UserId);

                l.Date = TimeZoneHelper.ToUtc(updated.Date, tz);
                l.FocusArea = updated.FocusArea?.Trim();
                l.DurationMinutes = updated.DurationMinutes;
                l.Notes = updated.Notes?.Trim();

                _db.ExerciseSets.RemoveRange(l.Sets);
                foreach (var set in updated.Sets)
                {
                    set.Id = 0;
                    set.WorkoutLogId = id;
                    set.ExerciseName = set.ExerciseName?.Trim() ?? "";
                    _db.ExerciseSets.Add(set);
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            await _db.Entry(log).ReloadAsync();
            return Ok(log);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating workout log {Id}", id);
            return StatusCode(500, new { error = "An error occurred while updating the workout log." });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var log = await _db.WorkoutLogs
            .Include(l => l.Sets)
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (log == null) return NotFound();

        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            _db.ChangeTracker.Clear();
            var l = await _db.WorkoutLogs.Include(x => x.Sets)
                .FirstAsync(x => x.Id == id && x.UserId == UserId);
            _db.WorkoutLogs.Remove(l);
            await _db.SaveChangesAsync();
        });
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
        if (string.IsNullOrWhiteSpace(exercise))
            return BadRequest(new { error = "exercise is required." });

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
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        var userToday = userNow.Date;

        var startOfWeek = userToday.AddDays(-(int)userToday.DayOfWeek);
        var startOfMonth = new DateTime(userToday.Year, userToday.Month, 1);

        var weekStartUtc = TimeZoneHelper.ToUtc(startOfWeek, tz);
        var monthStartUtc = TimeZoneHelper.ToUtc(startOfMonth, tz);

        var thisWeek = await _db.WorkoutLogs.CountAsync(l => l.UserId == UserId && l.Date >= weekStartUtc);
        var thisMonth = await _db.WorkoutLogs.CountAsync(l => l.UserId == UserId && l.Date >= monthStartUtc);

        var totalVolume = await _db.ExerciseSets
            .Where(s => s.WorkoutLog!.UserId == UserId && s.WorkoutLog!.Date >= monthStartUtc)
            .SumAsync(s => s.Weight * s.Reps);

        var streakSince = TimeZoneHelper.ToUtc(userToday.AddDays(-60), tz);
        var workoutDatesUtc = await _db.WorkoutLogs
            .Where(l => l.UserId == UserId && l.Date >= streakSince)
            .Select(l => l.Date)
            .ToListAsync();

        var workoutLocalDates = workoutDatesUtc
            .Select(d => TimeZoneInfo.ConvertTimeFromUtc(d, tz).Date)
            .Distinct()
            .ToHashSet();

        var streak = 0;
        var checkDate = userToday;
        while (workoutLocalDates.Contains(checkDate))
        {
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
