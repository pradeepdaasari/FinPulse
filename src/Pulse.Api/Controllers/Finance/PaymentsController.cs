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

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var difference = dto.AmountPaid - payment.AmountPaid;

            if (payment.DebtType == DebtType.PersonalLoan)
            {
                var loan = await _db.PersonalLoans.FindAsync(payment.DebtId);
                if (loan != null)
                    loan.CurrentBalance = Math.Max(0, loan.CurrentBalance - difference);
            }
            else
            {
                var card = await _db.CreditCards.FindAsync(payment.DebtId);
                if (card != null)
                    card.CurrentBalance = Math.Max(0, card.CurrentBalance - difference);
            }

            payment.AmountPaid = dto.AmountPaid;
            payment.PaymentDate = dto.PaymentDate;
            payment.Notes = dto.Notes;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Ok(payment);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var payment = await _db.PaymentHistories.FirstOrDefaultAsync(p => p.Id == id && p.UserId == UserId);
        if (payment is null) return NotFound();

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            if (payment.DebtType == DebtType.PersonalLoan)
            {
                var loan = await _db.PersonalLoans.FindAsync(payment.DebtId);
                if (loan != null)
                    loan.CurrentBalance += payment.AmountPaid;
            }
            else
            {
                var card = await _db.CreditCards.FindAsync(payment.DebtId);
                if (card != null)
                    card.CurrentBalance += payment.AmountPaid;
            }

            _db.PaymentHistories.Remove(payment);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }
}
