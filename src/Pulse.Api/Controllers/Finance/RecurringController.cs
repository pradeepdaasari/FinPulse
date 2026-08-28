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
[Route("api/recurring")]
[Authorize]
public class RecurringController : ControllerBase
{
    private readonly PulseDbContext _db;

    public RecurringController(PulseDbContext db) => _db = db;

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var items = await _db.RecurringTransactions
            .Include(r => r.Category)
            .Where(r => r.UserId == UserId)
            .OrderBy(r => r.NextRunDate)
            .ToListAsync();

        var result = items.Select(r => new
        {
            r.Id,
            r.Description,
            r.Merchant,
            r.Amount,
            r.CategoryId,
            CategoryName = r.Category.Name,
            CategoryIcon = r.Category.Icon,
            TransactionType = r.TransactionType.ToString(),
            FundingSourceType = r.FundingSourceType?.ToString(),
            r.FundingSourceId,
            Frequency = r.Frequency.ToString(),
            r.NextRunDate,
            r.EndDate,
            r.IsActive,
            r.CreatedAt
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult> Create(RecurringTransactionCreateDto dto)
    {
        var duplicate = await _db.RecurringTransactions.AnyAsync(r =>
            r.UserId == UserId &&
            r.Description.ToLower() == dto.Description.ToLower() &&
            r.CategoryId == dto.CategoryId);
        if (duplicate)
            return Conflict(new { message = $"A recurring transaction named '{dto.Description}' already exists in this category." });

        var item = new RecurringTransaction
        {
            Description = dto.Description,
            Merchant = dto.Merchant,
            Amount = dto.Amount,
            CategoryId = dto.CategoryId,
            TransactionType = dto.TransactionType,
            FundingSourceType = dto.FundingSourceType,
            FundingSourceId = dto.FundingSourceId,
            Frequency = dto.Frequency,
            NextRunDate = dto.NextRunDate,
            EndDate = dto.EndDate,
            IsActive = dto.IsActive,
            UserId = UserId
        };

        _db.RecurringTransactions.Add(item);
        await _db.SaveChangesAsync();
        return Ok(new { item.Id });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, RecurringTransactionCreateDto dto)
    {
        var item = await _db.RecurringTransactions.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item is null) return NotFound();

        var duplicate = await _db.RecurringTransactions.AnyAsync(r =>
            r.UserId == UserId &&
            r.Id != id &&
            r.Description.ToLower() == dto.Description.ToLower() &&
            r.CategoryId == dto.CategoryId);
        if (duplicate)
            return Conflict(new { message = $"A recurring transaction named '{dto.Description}' already exists in this category." });
        item.Description = dto.Description;
        item.Merchant = dto.Merchant;
        item.Amount = dto.Amount;
        item.CategoryId = dto.CategoryId;
        item.TransactionType = dto.TransactionType;
        item.FundingSourceType = dto.FundingSourceType;
        item.FundingSourceId = dto.FundingSourceId;
        item.Frequency = dto.Frequency;
        item.NextRunDate = dto.NextRunDate;
        item.EndDate = dto.EndDate;
        item.IsActive = dto.IsActive;

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var item = await _db.RecurringTransactions.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item is null) return NotFound();
        _db.RecurringTransactions.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/advance")]
    public async Task<ActionResult> Advance(int id)
    {
        var item = await _db.RecurringTransactions.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item is null) return NotFound();

        item.NextRunDate = AdvanceDate(item.NextRunDate, item.Frequency);
        if (item.EndDate.HasValue && item.NextRunDate > item.EndDate.Value)
            item.IsActive = false;

        await _db.SaveChangesAsync();
        return Ok(new { nextRunDate = item.NextRunDate });
    }

    [HttpPost("{id}/pay")]
    public async Task<ActionResult> Pay(int id, [FromBody] DailyExpenseCreateDto dto)
    {
        var item = await _db.RecurringTransactions.FirstOrDefaultAsync(r => r.Id == id && r.UserId == UserId);
        if (item is null) return NotFound();

        var fundingSourceType = dto.FundingSourceType ?? item.FundingSourceType;
        var fundingSourceId = dto.FundingSourceId ?? item.FundingSourceId;

        switch (dto.TransactionType)
        {
            case TransactionType.Expense:
                if (fundingSourceId == null) return BadRequest(new { message = "Expense requires a payment source." });
                break;
            case TransactionType.Income:
                if (fundingSourceId == null) return BadRequest(new { message = "Income requires an account to receive into." });
                if (fundingSourceType == FundingSourceType.CreditCard) return BadRequest(new { message = "Income cannot be received into a credit card." });
                break;
            case TransactionType.Transfer:
                if (fundingSourceId == null) return BadRequest(new { message = "Transfer requires a source account." });
                if (dto.ToFundingSourceId == null) return BadRequest(new { message = "Transfer requires a destination account." });
                break;
            case TransactionType.Refund:
                if (fundingSourceId == null) return BadRequest(new { message = "Refund requires an account to refund into." });
                break;
            case TransactionType.CardPayment:
                if (fundingSourceId == null || fundingSourceType != FundingSourceType.BankAccount) return BadRequest(new { message = "Card payment must come from a bank account." });
                if (dto.ToFundingSourceId == null) return BadRequest(new { message = "Card payment requires a target credit card." });
                break;
        }

        // Build expense and advance date in one SaveChangesAsync so both succeed or both fail
        var expense = new DailyExpense
        {
            Date = dto.Date,
            CategoryId = dto.CategoryId ?? item.CategoryId,
            Amount = dto.Amount,
            Description = dto.Description,
            Merchant = dto.Merchant ?? item.Merchant,
            TransactionType = dto.TransactionType,
            FundingSourceType = fundingSourceType,
            FundingSourceId = fundingSourceId,
            ToFundingSourceId = dto.ToFundingSourceId,
            Tag = dto.Tag,
            TagType = dto.TagType,
            UserId = UserId
        };
        _db.DailyExpenses.Add(expense);

        // Apply balance adjustments
        if (dto.TransactionType == TransactionType.Transfer && fundingSourceId.HasValue && dto.ToFundingSourceId.HasValue)
        {
            var source = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == fundingSourceId && a.UserId == UserId);
            var dest = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == dto.ToFundingSourceId && a.UserId == UserId);
            if (source != null) source.CurrentBalance -= dto.Amount;
            if (dest != null) dest.CurrentBalance += dto.Amount;
        }
        else if (dto.TransactionType == TransactionType.CardPayment && fundingSourceId.HasValue && dto.ToFundingSourceId.HasValue)
        {
            var bank = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == fundingSourceId && a.UserId == UserId);
            var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == dto.ToFundingSourceId && c.UserId == UserId);
            if (bank != null) bank.CurrentBalance -= dto.Amount;
            if (card != null) card.CurrentBalance -= dto.Amount;
        }
        else if (fundingSourceType == FundingSourceType.BankAccount && fundingSourceId.HasValue)
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == fundingSourceId && a.UserId == UserId);
            if (account != null)
                account.CurrentBalance += (dto.TransactionType == TransactionType.Income || dto.TransactionType == TransactionType.Refund) ? dto.Amount : -dto.Amount;
        }
        else if (fundingSourceType == FundingSourceType.CreditCard && fundingSourceId.HasValue)
        {
            var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == fundingSourceId && c.UserId == UserId);
            if (card != null)
                card.CurrentBalance += dto.TransactionType == TransactionType.Refund ? -dto.Amount : dto.Amount;
        }

        item.NextRunDate = AdvanceDate(item.NextRunDate, item.Frequency);
        if (item.EndDate.HasValue && item.NextRunDate > item.EndDate.Value)
            item.IsActive = false;

        await _db.SaveChangesAsync();
        return Ok(new { expenseId = expense.Id, nextRunDate = item.NextRunDate });
    }

    [HttpPost("generate")]
    public async Task<ActionResult> Generate()
    {
        var today = DateTime.UtcNow.Date;
        var dueItems = await _db.RecurringTransactions
            .Where(r => r.UserId == UserId && r.IsActive && r.NextRunDate <= today)
            .ToListAsync();

        var strategy = _db.Database.CreateExecutionStrategy();
        var generated = 0;
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                foreach (var item in dueItems)
                {
                    while (item.NextRunDate <= today)
                    {
                        var expense = new DailyExpense
                        {
                            Date = item.NextRunDate,
                            CategoryId = item.CategoryId,
                            Amount = item.Amount,
                            Description = item.Description,
                            Merchant = item.Merchant,
                            TransactionType = item.TransactionType,
                            FundingSourceType = item.FundingSourceType,
                            FundingSourceId = item.FundingSourceId,
                            UserId = UserId
                        };
                        _db.DailyExpenses.Add(expense);
                        generated++;

                        item.NextRunDate = AdvanceDate(item.NextRunDate, item.Frequency);

                        if (item.EndDate.HasValue && item.NextRunDate > item.EndDate.Value)
                        {
                            item.IsActive = false;
                            break;
                        }
                    }
                }

                if (generated > 0)
                    await _db.SaveChangesAsync();

                await transaction.CommitAsync();
            });
            return Ok(new { generated });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    private static DateTime AdvanceDate(DateTime date, RecurrenceFrequency frequency)
    {
        return frequency switch
        {
            RecurrenceFrequency.Daily => date.AddDays(1),
            RecurrenceFrequency.Weekly => date.AddDays(7),
            RecurrenceFrequency.Biweekly => date.AddDays(14),
            RecurrenceFrequency.Monthly => date.AddMonths(1),
            _ => date.AddMonths(1)
        };
    }
}

