using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Api.Controllers;

[ApiController]
[Route("api/bankaccounts")]
[Authorize]
public class BankAccountsController : ControllerBase
{
    private readonly FinPulseDbContext _db;

    public BankAccountsController(FinPulseDbContext db)
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
        var account = new BankAccount
        {
            AccountName = dto.AccountName,
            AccountType = dto.AccountType,
            CurrentBalance = dto.CurrentBalance,
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

        account.AccountName = dto.AccountName;
        account.AccountType = dto.AccountType;
        account.CurrentBalance = dto.CurrentBalance;

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
