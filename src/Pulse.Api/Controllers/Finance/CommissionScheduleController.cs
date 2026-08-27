using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models.Trading;

namespace Pulse.Api.Controllers.Finance;

[ApiController]
[Route("api/bankaccounts/{accountId}/commissions")]
[Authorize]
public class CommissionScheduleController : ControllerBase
{
    private readonly PulseDbContext _db;

    public CommissionScheduleController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll(int accountId)
    {
        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == UserId);
        if (account == null) return NotFound();

        var schedules = await _db.CommissionSchedules
            .Where(s => s.BankAccountId == accountId && s.UserId == UserId)
            .OrderByDescending(s => s.EffectiveFrom)
            .Select(s => new CommissionScheduleResponseDto
            {
                Id = s.Id,
                BankAccountId = s.BankAccountId,
                OptionsCommissionPerContract = s.OptionsCommissionPerContract,
                FuturesCommissionPerContract = s.FuturesCommissionPerContract,
                OptionsRegFeePerContract = s.OptionsRegFeePerContract,
                FuturesRegFeePerContract = s.FuturesRegFeePerContract,
                EffectiveFrom = s.EffectiveFrom,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        return Ok(schedules);
    }

    [HttpPost]
    public async Task<ActionResult> Create(int accountId, [FromBody] CommissionScheduleCreateDto dto)
    {
        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == UserId);
        if (account == null) return NotFound();

        var exists = await _db.CommissionSchedules.AnyAsync(s =>
            s.BankAccountId == accountId && s.EffectiveFrom.Date == dto.EffectiveFrom.Date);
        if (exists)
            return Conflict(new { message = "A commission schedule already exists for this date. Choose a different effective date." });

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var schedule = new CommissionSchedule
            {
                BankAccountId = accountId,
                UserId = UserId,
                OptionsCommissionPerContract = dto.OptionsCommissionPerContract,
                FuturesCommissionPerContract = dto.FuturesCommissionPerContract,
                OptionsRegFeePerContract = dto.OptionsRegFeePerContract,
                FuturesRegFeePerContract = dto.FuturesRegFeePerContract,
                EffectiveFrom = dto.EffectiveFrom.Date
            };

            _db.CommissionSchedules.Add(schedule);
            await _db.SaveChangesAsync();

            // Update BankAccount's current fields if this is the latest schedule
            var isLatest = !await _db.CommissionSchedules.AnyAsync(s =>
                s.BankAccountId == accountId && s.EffectiveFrom > schedule.EffectiveFrom);
            if (isLatest)
            {
                account.OptionsCommissionPerContract = dto.OptionsCommissionPerContract;
                account.FuturesCommissionPerContract = dto.FuturesCommissionPerContract;
                account.OptionsRegFeePerContract = dto.OptionsRegFeePerContract;
                account.FuturesRegFeePerContract = dto.FuturesRegFeePerContract;
                await _db.SaveChangesAsync();
            }

            int recalculated = 0;
            if (dto.RecalculateTrades)
            {
                recalculated = await RecalculateTrades(accountId, schedule);
            }

            await transaction.CommitAsync();
            return Ok(new CommissionScheduleResultDto
            {
                Schedule = new CommissionScheduleResponseDto
                {
                    Id = schedule.Id,
                    BankAccountId = schedule.BankAccountId,
                    OptionsCommissionPerContract = schedule.OptionsCommissionPerContract,
                    FuturesCommissionPerContract = schedule.FuturesCommissionPerContract,
                    OptionsRegFeePerContract = schedule.OptionsRegFeePerContract,
                    FuturesRegFeePerContract = schedule.FuturesRegFeePerContract,
                    EffectiveFrom = schedule.EffectiveFrom,
                    CreatedAt = schedule.CreatedAt
                },
                TradesRecalculated = recalculated
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int accountId, int id, [FromBody] CommissionScheduleCreateDto dto)
    {
        var schedule = await _db.CommissionSchedules.FirstOrDefaultAsync(s =>
            s.Id == id && s.BankAccountId == accountId && s.UserId == UserId);
        if (schedule == null) return NotFound();

        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == UserId);
        if (account == null) return NotFound();

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            schedule.OptionsCommissionPerContract = dto.OptionsCommissionPerContract;
            schedule.FuturesCommissionPerContract = dto.FuturesCommissionPerContract;
            schedule.OptionsRegFeePerContract = dto.OptionsRegFeePerContract;
            schedule.FuturesRegFeePerContract = dto.FuturesRegFeePerContract;

            await _db.SaveChangesAsync();

            // Update BankAccount's current fields if this is the latest schedule
            var isLatest = !await _db.CommissionSchedules.AnyAsync(s =>
                s.BankAccountId == accountId && s.EffectiveFrom > schedule.EffectiveFrom);
            if (isLatest)
            {
                account.OptionsCommissionPerContract = dto.OptionsCommissionPerContract;
                account.FuturesCommissionPerContract = dto.FuturesCommissionPerContract;
                account.OptionsRegFeePerContract = dto.OptionsRegFeePerContract;
                account.FuturesRegFeePerContract = dto.FuturesRegFeePerContract;
                await _db.SaveChangesAsync();
            }

            int recalculated = 0;
            if (dto.RecalculateTrades)
            {
                recalculated = await RecalculateTrades(accountId, schedule);
            }

            await transaction.CommitAsync();
            return Ok(new CommissionScheduleResultDto
            {
                Schedule = new CommissionScheduleResponseDto
                {
                    Id = schedule.Id,
                    BankAccountId = schedule.BankAccountId,
                    OptionsCommissionPerContract = schedule.OptionsCommissionPerContract,
                    FuturesCommissionPerContract = schedule.FuturesCommissionPerContract,
                    OptionsRegFeePerContract = schedule.OptionsRegFeePerContract,
                    FuturesRegFeePerContract = schedule.FuturesRegFeePerContract,
                    EffectiveFrom = schedule.EffectiveFrom,
                    CreatedAt = schedule.CreatedAt
                },
                TradesRecalculated = recalculated
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int accountId, int id)
    {
        var schedule = await _db.CommissionSchedules.FirstOrDefaultAsync(s =>
            s.Id == id && s.BankAccountId == accountId && s.UserId == UserId);
        if (schedule == null) return NotFound();

        var count = await _db.CommissionSchedules.CountAsync(s => s.BankAccountId == accountId);
        if (count <= 1)
            return BadRequest(new { message = "Cannot delete the only commission schedule. At least one must remain." });

        _db.CommissionSchedules.Remove(schedule);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<int> RecalculateTrades(int accountId, CommissionSchedule schedule)
    {
        var nextSchedule = await _db.CommissionSchedules
            .Where(s => s.BankAccountId == accountId && s.EffectiveFrom > schedule.EffectiveFrom)
            .OrderBy(s => s.EffectiveFrom)
            .FirstOrDefaultAsync();

        var endDate = nextSchedule?.EffectiveFrom ?? DateTime.MaxValue;

        var trades = await _db.TradeEntries
            .Where(t => t.BankAccountId == accountId
                     && t.UserId == UserId
                     && t.Date >= schedule.EffectiveFrom
                     && t.Date < endDate)
            .ToListAsync();

        foreach (var trade in trades)
        {
            var commission = trade.AssetType == "Futures"
                ? (schedule.FuturesCommissionPerContract ?? 0)
                : (schedule.OptionsCommissionPerContract ?? 0);
            var regFee = trade.AssetType == "Futures"
                ? (schedule.FuturesRegFeePerContract ?? 0)
                : (schedule.OptionsRegFeePerContract ?? 0);

            var legs = trade.AssetType == "Options" ? GetLegsForSpread(trade.SpreadType) : 1;
            var fees = (commission + regFee) * trade.Quantity * legs * 2;

            trade.TotalFees = fees;
            trade.NetPnl = trade.Pnl.HasValue ? trade.Pnl.Value - fees : null;
        }

        await _db.SaveChangesAsync();
        return trades.Count;
    }

    private static int GetLegsForSpread(string? spreadType) => spreadType switch
    {
        "Vertical" or "Calendar" => 2,
        "Butterfly" => 3,
        "IronCondor" => 4,
        _ => 1
    };
}
