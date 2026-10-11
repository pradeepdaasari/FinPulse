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
            AccountName = dto.AccountName.Trim(),
            AccountType = dto.AccountType,
            CurrentBalance = dto.CurrentBalance,
            IsExcluded = dto.IsExcluded,
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

        account.AccountName = dto.AccountName.Trim();
        account.AccountType = dto.AccountType;
        account.CurrentBalance = dto.CurrentBalance;
        account.IsExcluded = dto.IsExcluded;

        await _db.SaveChangesAsync();

        return Ok(account);
    }

    [HttpPatch("{id}/excluded")]
    public async Task<ActionResult<BankAccount>> ToggleExcluded(int id)
    {
        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (account is null) return NotFound();

        account.IsExcluded = !account.IsExcluded;
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

        var hasLinkedPayments = await _db.PaymentHistories.AnyAsync(p =>
            p.FromAccountId == id && p.UserId == UserId);

        var hasLinkedMovements = await _db.MoneyMovements.AnyAsync(m =>
            m.UserId == UserId &&
            ((m.SourceType == MoneyMovementEntityType.BankAccount && m.SourceId == id) ||
             (m.DestinationType == MoneyMovementEntityType.BankAccount && m.DestinationId == id)));

        var hasLinkedRecurring = await _db.RecurringTransactions.AnyAsync(r =>
            r.UserId == UserId &&
            r.FundingSourceType == FundingSourceType.BankAccount &&
            r.FundingSourceId == id);

        if (hasLinkedExpenses || hasLinkedPayments || hasLinkedMovements || hasLinkedRecurring)
            return BadRequest(new { message = "Cannot delete account with linked transactions, payments, or recurring items. Remove or reassign them first." });

        _db.BankAccounts.Remove(account);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("summary")]
    public async Task<ActionResult> GetSummary()
    {
        var accounts = await _db.BankAccounts.Where(a => a.UserId == UserId).ToListAsync();
        var active = accounts.Where(a => !a.IsExcluded).ToList();
        var excluded = accounts.Where(a => a.IsExcluded).ToList();

        return Ok(new
        {
            TotalBalance = active.Sum(a => a.CurrentBalance),
            ExcludedBalance = excluded.Sum(a => a.CurrentBalance),
            CheckingCount = accounts.Count(a => a.AccountType == BankAccountType.Checking),
            SavingsCount = accounts.Count(a => a.AccountType == BankAccountType.Savings),
            BrokerageCount = accounts.Count(a => a.AccountType == BankAccountType.Brokerage),
            CashCount = accounts.Count(a => a.AccountType == BankAccountType.Cash),
            ExcludedCount = excluded.Count
        });
    }

    [HttpGet("{id}/transaction-summary")]
    public async Task<ActionResult> GetTransactionSummary(int id, [FromQuery] string? from, [FromQuery] string? to)
    {
        var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
        if (account is null) return NotFound();

        var tz = await TimeZoneHelper.GetUserTimeZone(_db, UserId);

        IQueryable<DailyExpense> query = _db.DailyExpenses
            .Where(e => e.UserId == UserId && e.FundingSourceType == FundingSourceType.BankAccount && e.FundingSourceId == id);

        if (DateTime.TryParse(from, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var fromDate))
        {
            var fromUtc = TimeZoneHelper.ToUtc(fromDate, tz);
            query = query.Where(e => e.Date >= fromUtc);
        }
        if (DateTime.TryParse(to, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var toDate))
        {
            var toUtc = TimeZoneHelper.ToUtc(toDate.Date.AddDays(1), tz);
            query = query.Where(e => e.Date < toUtc);
        }

        var expenses = await query.ToListAsync();

        var totalIncome = expenses.Where(e => e.TransactionType == TransactionType.Income || e.TransactionType == TransactionType.Refund).Sum(e => e.Amount);
        var totalExpense = expenses.Where(e => e.TransactionType == TransactionType.Expense).Sum(e => e.Amount);
        var totalTransfer = expenses.Where(e => e.TransactionType == TransactionType.Transfer).Sum(e => e.Amount);

        return Ok(new
        {
            TotalIncome = Math.Round(totalIncome, 2),
            TotalExpense = Math.Round(totalExpense, 2),
            TotalTransfer = Math.Round(totalTransfer, 2)
        });
    }
}
