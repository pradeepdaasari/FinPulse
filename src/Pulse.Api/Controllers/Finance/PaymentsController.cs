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
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly PulseDbContext _db;

    public PaymentsController(PulseDbContext db)
    {
        _db = db;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] string? type, [FromQuery] int? debtId)
    {
        var query = _db.PaymentHistories.Where(p => p.UserId == UserId).AsQueryable();

        if (!string.IsNullOrEmpty(type))
        {
            if (Enum.TryParse<DebtType>(type, true, out var debtType))
            {
                query = query.Where(p => p.DebtType == debtType);
            }
        }

        if (debtId.HasValue)
        {
            query = query.Where(p => p.DebtId == debtId.Value);
        }

        var payments = await query
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        var loanTotal = payments.Where(p => p.DebtType == DebtType.PersonalLoan).Sum(p => p.AmountPaid);
        var cardTotal = payments.Where(p => p.DebtType == DebtType.CreditCard).Sum(p => p.AmountPaid);

        return Ok(new
        {
            payments,
            summary = new
            {
                totalPaid = loanTotal + cardTotal,
                loanTotal,
                cardTotal,
                count = payments.Count
            }
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PaymentHistory>> Update(int id, PaymentCreateDto dto)
    {
        var payment = await _db.PaymentHistories.FirstOrDefaultAsync(p => p.Id == id && p.UserId == UserId);
        if (payment is null) return NotFound();

        if (dto.AmountPaid <= 0)
            return BadRequest(new { error = "Payment amount must be greater than zero." });

        if (dto.PrincipalAmount.HasValue && dto.InterestAmount.HasValue
            && Math.Abs(dto.PrincipalAmount.Value + dto.InterestAmount.Value - dto.AmountPaid) > 0.01m)
            return BadRequest(new { error = "Principal + Interest must equal the total payment amount." });

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                await _db.Entry(payment).ReloadAsync();

                var difference = dto.AmountPaid - payment.AmountPaid;

                if (payment.DebtType == DebtType.PersonalLoan)
                {
                    var oldPrincipal = payment.PrincipalAmount ?? payment.AmountPaid;
                    var newPrincipal = dto.PrincipalAmount ?? dto.AmountPaid;
                    var principalDiff = newPrincipal - oldPrincipal;
                    var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == payment.DebtId && l.UserId == UserId);
                    if (loan != null)
                    {
                        await _db.Entry(loan).ReloadAsync();
                        loan.CurrentBalance = Math.Max(0, loan.CurrentBalance - principalDiff);
                    }
                }
                else
                {
                    var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == payment.DebtId && c.UserId == UserId);
                    if (card != null)
                    {
                        await _db.Entry(card).ReloadAsync();
                        card.CurrentBalance = Math.Max(0, card.CurrentBalance - difference);
                    }
                }

                // Handle FromAccountId change — reverse old bank deduction, apply new
                var oldFromAccountId = payment.FromAccountId;
                var oldAmount = payment.AmountPaid;

                if (oldFromAccountId != dto.FromAccountId || oldAmount != dto.AmountPaid)
                {
                    // Reverse old bank account deduction
                    if (oldFromAccountId.HasValue)
                    {
                        var oldAccount = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == oldFromAccountId && a.UserId == UserId);
                        if (oldAccount != null)
                        {
                            await _db.Entry(oldAccount).ReloadAsync();
                            oldAccount.CurrentBalance += oldAmount;
                        }
                    }
                    // Apply new bank account deduction
                    if (dto.FromAccountId.HasValue)
                    {
                        var newAccount = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == dto.FromAccountId && a.UserId == UserId);
                        if (newAccount != null)
                        {
                            await _db.Entry(newAccount).ReloadAsync();
                            newAccount.CurrentBalance -= dto.AmountPaid;
                        }
                    }
                }

                payment.AmountPaid = dto.AmountPaid;
                payment.PrincipalAmount = dto.PrincipalAmount;
                payment.InterestAmount = dto.InterestAmount;
                payment.PaymentDate = dto.PaymentDate;
                payment.Notes = dto.Notes;
                payment.FromAccountId = dto.FromAccountId;

                // Update associated money movement
                var movement = await _db.MoneyMovements.FirstOrDefaultAsync(m => m.RelatedPaymentId == payment.Id && m.UserId == UserId);
                if (movement != null)
                {
                    movement.SourceType = dto.FromAccountId.HasValue ? MoneyMovementEntityType.BankAccount : MoneyMovementEntityType.External;
                    movement.SourceId = dto.FromAccountId;
                    movement.Amount = dto.AmountPaid;
                    movement.MovementDate = dto.PaymentDate;
                    movement.Note = dto.Notes;
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });
            return Ok(payment);
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to update payment. Please try again." });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var payment = await _db.PaymentHistories.FirstOrDefaultAsync(p => p.Id == id && p.UserId == UserId);
        if (payment is null) return NotFound();

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                await _db.Entry(payment).ReloadAsync();

                if (payment.DebtType == DebtType.PersonalLoan)
                {
                    var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == payment.DebtId && l.UserId == UserId);
                    if (loan != null)
                    {
                        await _db.Entry(loan).ReloadAsync();
                        loan.CurrentBalance += payment.PrincipalAmount ?? payment.AmountPaid;
                    }
                }
                else
                {
                    var card = await _db.CreditCards.FirstOrDefaultAsync(c => c.Id == payment.DebtId && c.UserId == UserId);
                    if (card != null)
                    {
                        await _db.Entry(card).ReloadAsync();
                        card.CurrentBalance += payment.AmountPaid;
                    }
                }

                if (payment.FromAccountId.HasValue)
                {
                    var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == payment.FromAccountId && a.UserId == UserId);
                    if (account != null)
                    {
                        await _db.Entry(account).ReloadAsync();
                        account.CurrentBalance += payment.AmountPaid;
                    }
                }

                var movements = await _db.MoneyMovements
                    .Where(m => m.RelatedPaymentId == payment.Id && m.UserId == UserId)
                    .ToListAsync();
                _db.MoneyMovements.RemoveRange(movements);

                _db.PaymentHistories.Remove(payment);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });
            return NoContent();
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to delete payment. Please try again." });
        }
    }
}
