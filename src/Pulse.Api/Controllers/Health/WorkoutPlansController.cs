using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models.Health;

namespace Pulse.Api.Controllers.Health;

[ApiController]
[Route("api/workout-plans")]
[Authorize]
public class WorkoutPlansController : ControllerBase
{
    private readonly PulseDbContext _db;

    public WorkoutPlansController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var plans = await _db.WorkoutPlans
            .Where(p => p.UserId == UserId)
            .OrderByDescending(p => p.IsActive)
            .ThenByDescending(p => p.UpdatedAt)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.IsActive,
                DayCount = p.Days.Count,
                ExerciseCount = p.Days.SelectMany(d => d.Exercises).Count(),
                p.CreatedAt,
                p.UpdatedAt
            })
            .ToListAsync();
        return Ok(plans);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        var plan = await _db.WorkoutPlans
            .Where(p => p.Id == id && p.UserId == UserId)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.IsActive,
                p.IsSequential,
                p.CreatedAt,
                p.UpdatedAt,
                Days = p.Days.OrderBy(d => d.DayOfWeek).Select(d => new
                {
                    d.Id,
                    d.DayOfWeek,
                    d.FocusArea,
                    Exercises = d.Exercises.OrderBy(e => e.OrderIndex).Select(e => new
                    {
                        e.Id,
                        e.ExerciseName,
                        e.TargetSets,
                        e.TargetReps,
                        e.TargetWeight,
                        e.OrderIndex,
                        e.Notes,
                        e.VideoUrl,
                        e.MuscleGroup
                    })
                })
            })
            .FirstOrDefaultAsync();
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    [HttpGet("active")]
    public async Task<ActionResult> GetActive()
    {
        var plan = await _db.WorkoutPlans
            .Where(p => p.UserId == UserId && p.IsActive)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.IsActive,
                p.IsSequential,
                p.CreatedAt,
                p.UpdatedAt,
                Days = p.Days.OrderBy(d => d.DayOfWeek).Select(d => new
                {
                    d.Id,
                    d.DayOfWeek,
                    d.FocusArea,
                    Exercises = d.Exercises.OrderBy(e => e.OrderIndex).Select(e => new
                    {
                        e.Id,
                        e.ExerciseName,
                        e.TargetSets,
                        e.TargetReps,
                        e.TargetWeight,
                        e.OrderIndex,
                        e.Notes,
                        e.VideoUrl,
                        e.MuscleGroup
                    })
                })
            })
            .FirstOrDefaultAsync();
        if (plan == null) return NotFound();
        return Ok(plan);
    }

    [HttpGet("today")]
    public async Task<ActionResult> GetTodayPlan()
    {
        var plan = await _db.WorkoutPlans
            .Include(p => p.Days.OrderBy(d => d.DayOfWeek))
                .ThenInclude(d => d.Exercises.OrderBy(e => e.OrderIndex))
            .FirstOrDefaultAsync(p => p.UserId == UserId && p.IsActive);
        if (plan == null) return NotFound();

        WorkoutPlanDay? todayPlan;

        if (plan.IsSequential)
        {
            var completedCount = await _db.WorkoutLogs
                .Where(l => l.UserId == UserId && l.PlanDayId != null)
                .CountAsync();
            var dayIndex = completedCount % plan.Days.Count;
            var orderedDays = plan.Days.OrderBy(d => d.DayOfWeek).ToList();
            todayPlan = orderedDays[dayIndex];
        }
        else
        {
            var today = (int)DateTime.UtcNow.DayOfWeek;
            todayPlan = plan.Days.FirstOrDefault(d => d.DayOfWeek == today);
        }

        if (todayPlan == null)
            return Ok(new { restDay = true, plan = new { plan.Id, plan.Name, plan.IsSequential } });

        var alreadyLogged = await _db.WorkoutLogs
            .AnyAsync(l => l.UserId == UserId && l.Date.Date == DateTime.UtcNow.Date);

        return Ok(new
        {
            restDay = false,
            alreadyLogged,
            plan = new { plan.Id, plan.Name, plan.IsSequential, totalDays = plan.Days.Count },
            day = new
            {
                todayPlan.Id,
                dayNumber = plan.Days.OrderBy(d => d.DayOfWeek).ToList().IndexOf(todayPlan) + 1,
                todayPlan.FocusArea,
                exercises = todayPlan.Exercises.OrderBy(e => e.OrderIndex).Select(e => new
                {
                    e.ExerciseName,
                    e.TargetSets,
                    e.TargetReps,
                    e.TargetWeight,
                    e.Notes,
                    e.VideoUrl,
                    e.MuscleGroup
                })
            }
        });
    }

    [HttpPost]
    public async Task<ActionResult<WorkoutPlan>> Create([FromBody] WorkoutPlan plan)
    {
        plan.UserId = UserId;

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            if (plan.IsActive)
            {
                await DeactivateAllPlans();
            }
            _db.WorkoutPlans.Add(plan);
            await _db.SaveChangesAsync();

            await transaction.CommitAsync();
            return Ok(plan);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<WorkoutPlan>> Update(int id, [FromBody] WorkoutPlan updated)
    {
        var plan = await _db.WorkoutPlans
            .Include(p => p.Days)
                .ThenInclude(d => d.Exercises)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == UserId);
        if (plan == null) return NotFound();

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            plan.Name = updated.Name;
            plan.IsActive = updated.IsActive;

            if (plan.IsActive)
            {
                await DeactivateAllPlans(id);
            }

            _db.PlannedExercises.RemoveRange(plan.Days.SelectMany(d => d.Exercises));
            _db.WorkoutPlanDays.RemoveRange(plan.Days);

            foreach (var day in updated.Days)
            {
                day.PlanId = id;
                _db.WorkoutPlanDays.Add(day);
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(plan);
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
        var plan = await _db.WorkoutPlans
            .Include(p => p.Days)
                .ThenInclude(d => d.Exercises)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == UserId);
        if (plan == null) return NotFound();
        _db.WorkoutPlans.Remove(plan);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/activate")]
    public async Task<ActionResult> Activate(int id)
    {
        var plan = await _db.WorkoutPlans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == UserId);
        if (plan == null) return NotFound();

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            await DeactivateAllPlans();
            plan.IsActive = true;
            await _db.SaveChangesAsync();

            await transaction.CommitAsync();
            return Ok(plan);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPost("seed-fittr")]
    public async Task<ActionResult> SeedFittrPlan()
    {
        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
        var existing = await _db.WorkoutPlans
            .Include(p => p.Days).ThenInclude(d => d.Exercises)
            .FirstOrDefaultAsync(p => p.UserId == UserId && p.Name == "FITTR Training Plan");
        if (existing != null)
        {
            _db.PlannedExercises.RemoveRange(existing.Days.SelectMany(d => d.Exercises));
            _db.WorkoutPlanDays.RemoveRange(existing.Days);
            _db.WorkoutPlans.Remove(existing);
            await _db.SaveChangesAsync();
        }

        await DeactivateAllPlans();

        var plan = new WorkoutPlan
        {
            Name = "FITTR Training Plan",
            IsActive = true,
            IsSequential = false,
            UserId = UserId,
            Days = new List<WorkoutPlanDay>
            {
                new() { DayOfWeek = 1, FocusArea = "Chest + Triceps", Exercises = new List<PlannedExercise>
                {
                    new() { ExerciseName = "Pre Workout Dynamic Stretch", TargetSets = 1, TargetReps = "10", OrderIndex = 0, MuscleGroup = "Full Body", VideoUrl = "https://www.youtube.com/watch?v=2bKqm9JEJaA" },
                    new() { ExerciseName = "Push Ups", TargetSets = 4, TargetReps = "15", OrderIndex = 1, MuscleGroup = "Chest", VideoUrl = "https://www.youtube.com/watch?v=IODxDxX7oi4" },
                    new() { ExerciseName = "Machine Chest Press", TargetSets = 4, TargetReps = "10", OrderIndex = 2, MuscleGroup = "Chest", VideoUrl = "https://www.youtube.com/watch?v=xUm0BiZCWlQ" },
                    new() { ExerciseName = "Lever Pec Deck Fly", TargetSets = 4, TargetReps = "10", OrderIndex = 3, MuscleGroup = "Chest", VideoUrl = "https://www.youtube.com/watch?v=Z57CtFmRMxA" },
                    new() { ExerciseName = "Dumbbell Incline Chest Press", TargetSets = 4, TargetReps = "10", OrderIndex = 4, MuscleGroup = "Chest", VideoUrl = "https://www.youtube.com/watch?v=8iPEnn-ltC8" },
                    new() { ExerciseName = "Cable Bar Pushdown", TargetSets = 4, TargetReps = "10", OrderIndex = 5, MuscleGroup = "Triceps", VideoUrl = "https://www.youtube.com/watch?v=2-LAMcpzODU" },
                    new() { ExerciseName = "Cable Triceps Extension", TargetSets = 4, TargetReps = "10", OrderIndex = 6, MuscleGroup = "Triceps", VideoUrl = "https://www.youtube.com/watch?v=kiuVA0gs3EI" },
                    new() { ExerciseName = "Treadmill Walking", TargetSets = 1, TargetReps = "20:00 min", OrderIndex = 7, MuscleGroup = "Cardio", Notes = "Moderate pace" },
                }},
                new() { DayOfWeek = 2, FocusArea = "Back + Biceps", Exercises = new List<PlannedExercise>
                {
                    new() { ExerciseName = "Pre Workout Dynamic Stretch", TargetSets = 1, TargetReps = "10", OrderIndex = 0, MuscleGroup = "Full Body", VideoUrl = "https://www.youtube.com/watch?v=2bKqm9JEJaA" },
                    new() { ExerciseName = "Reverse Lat Pulldown", TargetSets = 4, TargetReps = "10", OrderIndex = 1, MuscleGroup = "Lats", VideoUrl = "https://www.youtube.com/watch?v=XzgSNMslg-I" },
                    new() { ExerciseName = "Seated Cable Row", TargetSets = 4, TargetReps = "10", OrderIndex = 2, MuscleGroup = "Lats", VideoUrl = "https://www.youtube.com/watch?v=GZbfZ033f74" },
                    new() { ExerciseName = "Cable Pulldown (Lats)", TargetSets = 4, TargetReps = "10", OrderIndex = 3, MuscleGroup = "Lats", VideoUrl = "https://www.youtube.com/watch?v=CAwf7n6Luuc" },
                    new() { ExerciseName = "Dumbbell Shrugs", TargetSets = 4, TargetReps = "10", OrderIndex = 4, MuscleGroup = "Traps", VideoUrl = "https://www.youtube.com/watch?v=cJRVVxmytaM" },
                    new() { ExerciseName = "DB Standing Hammer Curls", TargetSets = 4, TargetReps = "10", OrderIndex = 5, MuscleGroup = "Biceps", VideoUrl = "https://www.youtube.com/watch?v=zC3nLlEvin4" },
                    new() { ExerciseName = "Cable Biceps Curl", TargetSets = 4, TargetReps = "10", OrderIndex = 6, MuscleGroup = "Biceps", VideoUrl = "https://www.youtube.com/watch?v=NFzTWp2qpiE" },
                    new() { ExerciseName = "Treadmill Walking", TargetSets = 1, TargetReps = "15:00 min", OrderIndex = 7, MuscleGroup = "Cardio", Notes = "Moderate pace" },
                }},
                new() { DayOfWeek = 3, FocusArea = "Legs + Abs", Exercises = new List<PlannedExercise>
                {
                    new() { ExerciseName = "Pre Workout Dynamic Stretch", TargetSets = 1, TargetReps = "10", OrderIndex = 0, MuscleGroup = "Full Body", VideoUrl = "https://www.youtube.com/watch?v=2bKqm9JEJaA" },
                    new() { ExerciseName = "Dumbbell Goblet Squats", TargetSets = 4, TargetReps = "10", OrderIndex = 1, MuscleGroup = "Quadriceps", VideoUrl = "https://www.youtube.com/watch?v=MeIiIdhvXT4" },
                    new() { ExerciseName = "Bilateral Seated Leg Press", TargetSets = 4, TargetReps = "10", OrderIndex = 2, MuscleGroup = "Quadriceps", VideoUrl = "https://www.youtube.com/watch?v=IZxyjW7MPJQ" },
                    new() { ExerciseName = "Leg Curl Machine", TargetSets = 4, TargetReps = "10", OrderIndex = 3, MuscleGroup = "Hamstrings", VideoUrl = "https://www.youtube.com/watch?v=1Tq3QdYUuHs" },
                    new() { ExerciseName = "Bilateral Leg Extensions", TargetSets = 4, TargetReps = "10", OrderIndex = 4, MuscleGroup = "Quadriceps", VideoUrl = "https://www.youtube.com/watch?v=YyvSfVjQeL0" },
                    new() { ExerciseName = "Machine Crunches", TargetSets = 4, TargetReps = "10", OrderIndex = 5, MuscleGroup = "Abs", VideoUrl = "https://www.youtube.com/watch?v=DEfanGsUJSk" },
                    new() { ExerciseName = "Leg Raise", TargetSets = 4, TargetReps = "10", OrderIndex = 6, MuscleGroup = "Abs", VideoUrl = "https://www.youtube.com/watch?v=JB2oyawG9KI" },
                    new() { ExerciseName = "Treadmill Walking", TargetSets = 1, TargetReps = "15:00 min", OrderIndex = 7, MuscleGroup = "Cardio", Notes = "Moderate pace" },
                }},
                new() { DayOfWeek = 4, FocusArea = "Shoulders + Abs", Exercises = new List<PlannedExercise>
                {
                    new() { ExerciseName = "Pre Workout Dynamic Stretch", TargetSets = 1, TargetReps = "10", OrderIndex = 0, MuscleGroup = "Full Body", VideoUrl = "https://www.youtube.com/watch?v=2bKqm9JEJaA" },
                    new() { ExerciseName = "Dumbbell Shoulder Press (Seated)", TargetSets = 3, TargetReps = "10", OrderIndex = 1, MuscleGroup = "Shoulders", VideoUrl = "https://www.youtube.com/watch?v=qEwKCR5JCog" },
                    new() { ExerciseName = "Lever Shoulder Press", TargetSets = 3, TargetReps = "10", OrderIndex = 2, MuscleGroup = "Shoulders", VideoUrl = "https://www.youtube.com/watch?v=Hdz5q1FSoS4" },
                    new() { ExerciseName = "Dumbbell Arnold Press (Seated)", TargetSets = 3, TargetReps = "10", OrderIndex = 3, MuscleGroup = "Shoulders", VideoUrl = "https://www.youtube.com/watch?v=6Z15_WdXmVw" },
                    new() { ExerciseName = "Lever Seated Rear Delt Row", TargetSets = 3, TargetReps = "10", OrderIndex = 4, MuscleGroup = "Shoulders", VideoUrl = "https://www.youtube.com/watch?v=HnXEGDfV3CU" },
                    new() { ExerciseName = "Dumbbell Lateral Raise", TargetSets = 3, TargetReps = "10", OrderIndex = 5, MuscleGroup = "Shoulders", VideoUrl = "https://www.youtube.com/watch?v=3VcKaXpzqRo" },
                    new() { ExerciseName = "Plate Russian Twist", TargetSets = 4, TargetReps = "10", OrderIndex = 6, MuscleGroup = "Abs", VideoUrl = "https://www.youtube.com/watch?v=wkD8rjkodUI" },
                    new() { ExerciseName = "Plank", TargetSets = 3, TargetReps = "0:30 sec", OrderIndex = 7, MuscleGroup = "Abs", VideoUrl = "https://www.youtube.com/watch?v=ASdvN_XEl_c" },
                    new() { ExerciseName = "Running on Treadmill", TargetSets = 1, TargetReps = "15:00 min", OrderIndex = 8, MuscleGroup = "Cardio", Notes = "Moderate pace" },
                }},
                new() { DayOfWeek = 5, FocusArea = "Active Recovery", Exercises = new List<PlannedExercise>
                {
                    new() { ExerciseName = "Treadmill Walking", TargetSets = 1, TargetReps = "30:00 min", OrderIndex = 0, MuscleGroup = "Cardio", Notes = "Light pace" },
                    new() { ExerciseName = "Cable Bent-over Triceps Extension (Rope)", TargetSets = 1, TargetReps = "10", OrderIndex = 1, MuscleGroup = "Triceps", VideoUrl = "https://www.youtube.com/watch?v=nRiJVZDpdL0" },
                    new() { ExerciseName = "Cable Biceps Curl", TargetSets = 1, TargetReps = "10", OrderIndex = 2, MuscleGroup = "Biceps", VideoUrl = "https://www.youtube.com/watch?v=NFzTWp2qpiE" },
                    new() { ExerciseName = "Cable Incline Triceps Extension", TargetSets = 1, TargetReps = "10", OrderIndex = 3, MuscleGroup = "Triceps", VideoUrl = "https://www.youtube.com/watch?v=kiuVA0gs3EI" },
                    new() { ExerciseName = "Dumbbell Bicep Curl (Alternating)", TargetSets = 1, TargetReps = "10", OrderIndex = 4, MuscleGroup = "Biceps", VideoUrl = "https://www.youtube.com/watch?v=sAq_ocpRh_I" },
                    new() { ExerciseName = "Standing Incline Calf Raises", TargetSets = 1, TargetReps = "10", OrderIndex = 5, MuscleGroup = "Calves", VideoUrl = "https://www.youtube.com/watch?v=RY5tR4aoGMg" },
                    new() { ExerciseName = "Cable Crunches", TargetSets = 1, TargetReps = "10", OrderIndex = 6, MuscleGroup = "Abs", VideoUrl = "https://www.youtube.com/watch?v=AV5PmTNRmEU" },
                    new() { ExerciseName = "Post Workout Stretches", TargetSets = 1, TargetReps = "10", OrderIndex = 7, MuscleGroup = "Full Body", VideoUrl = "https://www.youtube.com/watch?v=SsT_go-LDSA" },
                }},
                new() { DayOfWeek = 6, FocusArea = "Full Body Compound", Exercises = new List<PlannedExercise>
                {
                    new() { ExerciseName = "Smith Machine Rack Pulls", TargetSets = 3, TargetReps = "10", OrderIndex = 0, MuscleGroup = "Back", VideoUrl = "https://www.youtube.com/watch?v=QbBSwJVBJ_M" },
                    new() { ExerciseName = "Barbell Shoulder Press", TargetSets = 4, TargetReps = "10", OrderIndex = 1, MuscleGroup = "Shoulders", VideoUrl = "https://www.youtube.com/watch?v=2yjwXTZQDDI" },
                    new() { ExerciseName = "Dumbbell Goblet Squats", TargetSets = 3, TargetReps = "10", OrderIndex = 2, MuscleGroup = "Quadriceps", VideoUrl = "https://www.youtube.com/watch?v=MeIiIdhvXT4" },
                    new() { ExerciseName = "Barbell Bench Press - Flat", TargetSets = 4, TargetReps = "10", OrderIndex = 3, MuscleGroup = "Chest", VideoUrl = "https://www.youtube.com/watch?v=rT7DgCr-3pg" },
                    new() { ExerciseName = "Treadmill Walking", TargetSets = 1, TargetReps = "45:00 min", OrderIndex = 4, MuscleGroup = "Cardio", Notes = "Steady state" },
                }},
            }
        };

        _db.WorkoutPlans.Add(plan);
        await _db.SaveChangesAsync();

        await transaction.CommitAsync();
        return Ok(plan);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    private async Task DeactivateAllPlans(int? exceptId = null)
    {
        var activePlans = await _db.WorkoutPlans
            .Where(p => p.UserId == UserId && p.IsActive && (exceptId == null || p.Id != exceptId))
            .ToListAsync();
        foreach (var p in activePlans)
            p.IsActive = false;
    }
}
