using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models.Health;

namespace Pulse.Api.Controllers.Health;

[ApiController]
[Route("api/blood-work")]
[Authorize]
public class BloodWorkController : ControllerBase
{
    private readonly PulseDbContext _db;

    public BloodWorkController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var reports = await _db.BloodWorkReports
            .Where(r => r.UserId == UserId)
            .Include(r => r.Results)
            .OrderByDescending(r => r.ReportDate)
            .Select(r => new
            {
                r.Id,
                r.ReportDate,
                r.LabName,
                r.Notes,
                ResultCount = r.Results.Count,
                AbnormalCount = r.Results.Count(res =>
                    (res.ReferenceMin.HasValue && res.Value < res.ReferenceMin.Value) ||
                    (res.ReferenceMax.HasValue && res.Value > res.ReferenceMax.Value)),
                r.CreatedAt
            })
            .ToListAsync();
        return Ok(reports);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BloodWorkReport>> GetById(int id)
    {
        var report = await _db.BloodWorkReports
            .Include(r => r.Results)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (report == null) return NotFound();
        return Ok(report);
    }

    [HttpPost]
    public async Task<ActionResult<BloodWorkReport>> Create([FromBody] BloodWorkReport report)
    {
        report.UserId = UserId;
        _db.BloodWorkReports.Add(report);
        await _db.SaveChangesAsync();
        return Ok(report);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BloodWorkReport>> Update(int id, [FromBody] BloodWorkReport updated)
    {
        var report = await _db.BloodWorkReports
            .Include(r => r.Results)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (report == null) return NotFound();

        report.ReportDate = updated.ReportDate;
        report.LabName = updated.LabName;
        report.Notes = updated.Notes;

        _db.BloodWorkResults.RemoveRange(report.Results);
        foreach (var result in updated.Results)
        {
            result.ReportId = id;
            _db.BloodWorkResults.Add(result);
        }

        await _db.SaveChangesAsync();
        return Ok(report);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var report = await _db.BloodWorkReports
            .Include(r => r.Results)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (report == null) return NotFound();
        _db.BloodWorkReports.Remove(report);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("test-history")]
    public async Task<ActionResult> GetTestHistory([FromQuery] string testName)
    {
        var data = await _db.BloodWorkResults
            .Where(r => r.Report!.UserId == UserId && r.TestName == testName)
            .OrderBy(r => r.Report!.ReportDate)
            .Select(r => new
            {
                Date = r.Report!.ReportDate,
                r.Value,
                r.Unit,
                r.ReferenceMin,
                r.ReferenceMax
            })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("test-names")]
    public async Task<ActionResult<List<string>>> GetTestNames()
    {
        var names = await _db.BloodWorkResults
            .Where(r => r.Report!.UserId == UserId)
            .Select(r => r.TestName)
            .Distinct()
            .OrderBy(n => n)
            .ToListAsync();
        return Ok(names);
    }
}
