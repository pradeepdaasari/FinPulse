using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Services;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/simulator")]
[Authorize]
public class SimulatorController : ControllerBase
{
    private readonly PulseDbContext _db;
    private readonly IDebtSnapshotHelper _snapshotHelper;
    private readonly IWhatIfSimulatorService _simulatorService;

    public SimulatorController(PulseDbContext db, IDebtSnapshotHelper snapshotHelper, IWhatIfSimulatorService simulatorService)
    {
        _db = db;
        _snapshotHelper = snapshotHelper;
        _simulatorService = simulatorService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost("what-if")]
    public async Task<ActionResult<WhatIfResultDto>> WhatIf(WhatIfRequestDto request)
    {
        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);
        var userNow = TimeZoneHelper.UserNow(tz);
        var snapshots = await _snapshotHelper.GetDebtSnapshots(UserId, userNow);
        var result = _simulatorService.Simulate(snapshots, request);
        return Ok(result);
    }
}
