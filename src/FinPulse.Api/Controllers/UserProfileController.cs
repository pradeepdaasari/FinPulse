using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.Models;
using FinPulse.Core.Models.Enums;

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
                MonthlyIncome = ComputeMonthlyIncome(dto.NetPayPerCheck, dto.PayFrequency),
                PayFrequency = dto.PayFrequency,
                NetPayPerCheck = dto.NetPayPerCheck,
                NextPayDate = dto.NextPayDate
            };
            _db.UserProfiles.Add(profile);
            await _db.SaveChangesAsync();
            return Ok(profile);
        }

        existing.PayFrequency = dto.PayFrequency;
        existing.NetPayPerCheck = dto.NetPayPerCheck;
        existing.NextPayDate = dto.NextPayDate;
        existing.MonthlyIncome = ComputeMonthlyIncome(dto.NetPayPerCheck, dto.PayFrequency);
        await _db.SaveChangesAsync();

        return Ok(existing);
    }

    private static decimal ComputeMonthlyIncome(decimal netPayPerCheck, PaymentFrequency frequency)
    {
        return frequency switch
        {
            PaymentFrequency.Weekly => netPayPerCheck * 52 / 12,
            PaymentFrequency.Biweekly => netPayPerCheck * 26 / 12,
            PaymentFrequency.Monthly => netPayPerCheck,
            _ => netPayPerCheck * 26 / 12
        };
    }
}
