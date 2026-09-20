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
    private readonly ILogger<BloodWorkController> _logger;

    public BloodWorkController(PulseDbContext db, ILogger<BloodWorkController> logger)
    {
        _db = db;
        _logger = logger;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var reports = await _db.BloodWorkReports
            .Where(r => r.UserId == UserId)
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
        report.Id = 0;
        report.UserId = UserId;
        report.LabName = report.LabName?.Trim();
        report.Notes = report.Notes?.Trim();
        foreach (var r in report.Results)
        {
            r.Id = 0;
            r.TestName = r.TestName?.Trim() ?? "";
            r.Unit = r.Unit?.Trim() ?? "";
        }

        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            _db.ChangeTracker.Clear();
            _db.BloodWorkReports.Add(report);
            await _db.SaveChangesAsync();
        });
        return Ok(report);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BloodWorkReport>> Update(int id, [FromBody] BloodWorkReport updated)
    {
        var report = await _db.BloodWorkReports
            .Include(r => r.Results)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (report == null) return NotFound();

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                _db.ChangeTracker.Clear();
                using var transaction = await _db.Database.BeginTransactionAsync();

                var rpt = await _db.BloodWorkReports.Include(r => r.Results)
                    .FirstAsync(r => r.Id == id && r.UserId == UserId);

                rpt.ReportDate = updated.ReportDate;
                rpt.LabName = updated.LabName?.Trim();
                rpt.Notes = updated.Notes?.Trim();

                _db.BloodWorkResults.RemoveRange(rpt.Results);
                foreach (var result in updated.Results)
                {
                    result.Id = 0;
                    result.ReportId = id;
                    result.TestName = result.TestName?.Trim() ?? "";
                    result.Unit = result.Unit?.Trim() ?? "";
                    _db.BloodWorkResults.Add(result);
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            await _db.Entry(report).ReloadAsync();
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating blood work report {Id}", id);
            return StatusCode(500, new { error = "An error occurred while updating the report." });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var report = await _db.BloodWorkReports
            .Include(r => r.Results)
            .FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (report == null) return NotFound();

        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            _db.ChangeTracker.Clear();
            var rpt = await _db.BloodWorkReports.Include(r => r.Results)
                .FirstAsync(r => r.Id == id && r.UserId == UserId);
            _db.BloodWorkReports.Remove(rpt);
            await _db.SaveChangesAsync();
        });
        return NoContent();
    }

    [HttpGet("test-history")]
    public async Task<ActionResult> GetTestHistory([FromQuery] string testName)
    {
        if (string.IsNullOrWhiteSpace(testName))
            return BadRequest(new { error = "testName is required." });

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
