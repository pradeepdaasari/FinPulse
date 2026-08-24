using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.Models;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class UserProfileController : ControllerBase
{
    private readonly FinPulseDbContext _db;

    public UserProfileController(FinPulseDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<UserProfile>> Get()
    {
        var profile = await _db.UserProfiles.FirstOrDefaultAsync();
        if (profile is null) return NotFound();
        return Ok(profile);
    }

    [HttpPost]
    public async Task<ActionResult<UserProfile>> CreateOrUpdate(UserProfile dto)
    {
        var existing = await _db.UserProfiles.FirstOrDefaultAsync();

        if (existing is null)
        {
            var profile = new UserProfile
            {
                MonthlyIncome = dto.MonthlyIncome
            };
            _db.UserProfiles.Add(profile);
            await _db.SaveChangesAsync();
            return Ok(profile);
        }

        existing.MonthlyIncome = dto.MonthlyIncome;
        await _db.SaveChangesAsync();

        return Ok(existing);
    }
}
