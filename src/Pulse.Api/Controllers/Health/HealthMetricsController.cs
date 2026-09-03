using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models.Health;

namespace Pulse.Api.Controllers.Health;

[ApiController]
[Route("api/health-metrics")]
[Authorize]
public class HealthMetricsController : ControllerBase
{
    private readonly PulseDbContext _db;

    public HealthMetricsController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<HealthMetric>>> GetAll(
        [FromQuery] string? type,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var query = _db.HealthMetrics.Where(m => m.UserId == UserId);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(m => m.MetricType == type);
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        if (fromDate.HasValue)
            query = query.Where(m => m.MeasuredAt >= TimeZoneHelper.ToUtc(fromDate.Value, tz));
        if (toDate.HasValue)
            query = query.Where(m => m.MeasuredAt < TimeZoneHelper.ToUtc(toDate.Value.Date.AddDays(1), tz));

        return Ok(await query.OrderByDescending(m => m.MeasuredAt).ToListAsync());
    }

    [HttpGet("latest")]
    public async Task<ActionResult> GetLatest()
    {
        var latest = await _db.HealthMetrics
            .Where(m => m.UserId == UserId)
            .GroupBy(m => m.MetricType)
            .Select(g => g.OrderByDescending(m => m.MeasuredAt).First())
            .ToListAsync();
        return Ok(latest);
    }

    [HttpGet("trends")]
    public async Task<ActionResult> GetTrends([FromQuery] string type, [FromQuery] int days = 90)
    {
        var since = DateTime.UtcNow.AddDays(-days);
        var data = await _db.HealthMetrics
            .Where(m => m.UserId == UserId && m.MetricType == type && m.MeasuredAt >= since)
            .OrderBy(m => m.MeasuredAt)
            .Select(m => new { m.MeasuredAt, m.Value, m.Unit })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("types")]
    public async Task<ActionResult<List<string>>> GetTypes()
    {
        var types = await _db.HealthMetrics
            .Where(m => m.UserId == UserId)
            .Select(m => m.MetricType)
            .Distinct()
            .OrderBy(t => t)
            .ToListAsync();
        return Ok(types);
    }

    [HttpPost]
    public async Task<ActionResult<HealthMetric>> Create([FromBody] HealthMetric metric)
    {
        metric.UserId = UserId;
        if (metric.MeasuredAt == default)
            metric.MeasuredAt = DateTime.UtcNow;
        _db.HealthMetrics.Add(metric);
        await _db.SaveChangesAsync();
        return Ok(metric);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HealthMetric>> Update(int id, [FromBody] HealthMetric metric)
    {
        var existing = await _db.HealthMetrics.FirstOrDefaultAsync(m => m.Id == id && m.UserId == UserId);
        if (existing == null) return NotFound();

        existing.MetricType = metric.MetricType;
        existing.Value = metric.Value;
        existing.Unit = metric.Unit;
        existing.MeasuredAt = metric.MeasuredAt;
        existing.Notes = metric.Notes;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var metric = await _db.HealthMetrics.FirstOrDefaultAsync(m => m.Id == id && m.UserId == UserId);
        if (metric == null) return NotFound();
        _db.HealthMetrics.Remove(metric);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
