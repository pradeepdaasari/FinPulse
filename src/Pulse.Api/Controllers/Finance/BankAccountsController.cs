using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/bankaccounts")]
[Authorize]
public class BankAccountsController : ControllerBase
{
    private readonly PulseDbContext _db;

    public BankAccountsController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<List<BankAccount>>> GetAll()
    {
        var accounts = await _db.BankAccounts
            .Where(a => a.UserId == UserId)
            .OrderBy(a => a.AccountName)
            .ToListAsync();
        return Ok(accounts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BankAccount>> GetById(int id)
    {
        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (account is null) return NotFound();
        return Ok(account);
    }

    [HttpPost]
    public async Task<ActionResult<BankAccount>> Create(BankAccountCreateDto dto)
    {
        var exists = await _db.BankAccounts.AnyAsync(a => a.UserId == UserId && a.AccountName == dto.AccountName.Trim());
        if (exists)
            return Conflict(new { message = $"A bank account named '{dto.AccountName.Trim()}' already exists." });

        var account = new BankAccount
        {
            AccountName = dto.AccountName,
            AccountType = dto.AccountType,
            CurrentBalance = dto.CurrentBalance,
            OptionsCommissionPerContract = dto.OptionsCommissionPerContract,
            FuturesCommissionPerContract = dto.FuturesCommissionPerContract,
            OptionsRegFeePerContract = dto.OptionsRegFeePerContract,
            FuturesRegFeePerContract = dto.FuturesRegFeePerContract,
            UserId = UserId
        };

        _db.BankAccounts.Add(account);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = account.Id }, account);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BankAccount>> Update(int id, BankAccountCreateDto dto)
    {
        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (account is null) return NotFound();

        var duplicate = await _db.BankAccounts.AnyAsync(a => a.UserId == UserId && a.Id != id && a.AccountName == dto.AccountName.Trim());
        if (duplicate)
            return Conflict(new { message = $"A bank account named '{dto.AccountName.Trim()}' already exists." });

        account.AccountName = dto.AccountName;
        account.AccountType = dto.AccountType;
        account.CurrentBalance = dto.CurrentBalance;
        account.OptionsCommissionPerContract = dto.OptionsCommissionPerContract;
        account.FuturesCommissionPerContract = dto.FuturesCommissionPerContract;
        account.OptionsRegFeePerContract = dto.OptionsRegFeePerContract;
        account.FuturesRegFeePerContract = dto.FuturesRegFeePerContract;

        await _db.SaveChangesAsync();

        return Ok(account);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (account is null) return NotFound();

        var hasLinkedExpenses = await _db.DailyExpenses.AnyAsync(e =>
            e.FundingSourceType == FundingSourceType.BankAccount &&
            e.FundingSourceId == id &&
            e.UserId == UserId);

        if (hasLinkedExpenses)
            return BadRequest(new { message = "Cannot delete account with linked transactions. Remove or reassign them first." });

        _db.BankAccounts.Remove(account);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
