using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class UserProfileController : ControllerBase
{
    private readonly PulseDbContext _db;

    public UserProfileController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == UserId);
        if (profile is null) return NotFound();
        return Ok(new
        {
            profile.Id,
            profile.MonthlyIncome,
            PayFrequency = profile.PayFrequency.ToString(),
            profile.NetPayPerCheck,
            profile.NextPayDate,
            MarketOpenTime = profile.MarketOpenTime?.ToString(@"hh\:mm")
        });
    }

    [HttpPost]
    public async Task<ActionResult> CreateOrUpdate(ProfileDto dto)
    {
        TimeSpan? marketOpen = null;
        if (!string.IsNullOrEmpty(dto.MarketOpenTime) && TimeSpan.TryParse(dto.MarketOpenTime, out var parsed))
            marketOpen = parsed;

        var existing = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == UserId);

        if (existing is null)
        {
            var profile = new UserProfile
            {
                MonthlyIncome = ComputeMonthlyIncome(dto.NetPayPerCheck, dto.PayFrequency),
                PayFrequency = dto.PayFrequency,
                NetPayPerCheck = dto.NetPayPerCheck,
                NextPayDate = dto.NextPayDate,
                MarketOpenTime = marketOpen,
                UserId = UserId
            };
            _db.UserProfiles.Add(profile);
            await _db.SaveChangesAsync();
            return Ok(profile);
        }

        existing.PayFrequency = dto.PayFrequency;
        existing.NetPayPerCheck = dto.NetPayPerCheck;
        existing.NextPayDate = dto.NextPayDate;
        existing.MarketOpenTime = marketOpen;
        existing.MonthlyIncome = ComputeMonthlyIncome(dto.NetPayPerCheck, dto.PayFrequency);
        await _db.SaveChangesAsync();

        return Ok(existing);
    }

    public class ProfileDto
    {
        public decimal NetPayPerCheck { get; set; }
        public PaymentFrequency PayFrequency { get; set; }
        public DateTime? NextPayDate { get; set; }
        public string? MarketOpenTime { get; set; }
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
