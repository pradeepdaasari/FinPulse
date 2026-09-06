using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;
using Pulse.Core.Services;

namespace Pulse.Api.Controllers;

[ApiController]
[Route("api/loans")]
[Authorize]
public class LoansController : ControllerBase
{
    private readonly PulseDbContext _db;
    private readonly IFinancialCalculationService _calcService;

    public LoansController(PulseDbContext db, IFinancialCalculationService calcService)
    {
        _db = db;
        _calcService = calcService;
    }

    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();
        var bankAccountIds = loans.Where(l => l.FundedBankAccountId.HasValue).Select(l => l.FundedBankAccountId!.Value).Distinct().ToList();
        var bankNames = bankAccountIds.Count > 0
            ? await _db.BankAccounts.Where(a => bankAccountIds.Contains(a.Id) && a.UserId == UserId).ToDictionaryAsync(a => a.Id, a => a.AccountName)
            : new Dictionary<int, string>();

        var result = loans.Select(l => new
        {
            l.Id, l.LenderName, l.OriginalAmount, l.CurrentBalance, l.AprPercent,
            l.DurationMonths, l.StartDate, l.MonthlyPayment, l.DueDay, l.LoanType,
            l.IsAutopay, l.PaymentFrequency, l.FundedBankAccountId,
            FundedBankAccountName = l.FundedBankAccountId.HasValue && bankNames.ContainsKey(l.FundedBankAccountId.Value)
                ? bankNames[l.FundedBankAccountId.Value] : null,
            l.CreatedAt, l.UpdatedAt
        });
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        string? bankName = null;
        if (loan.FundedBankAccountId.HasValue)
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == loan.FundedBankAccountId && a.UserId == UserId);
            bankName = account?.AccountName;
        }

        return Ok(new
        {
            loan.Id, loan.LenderName, loan.OriginalAmount, loan.CurrentBalance, loan.AprPercent,
            loan.DurationMonths, loan.StartDate, loan.MonthlyPayment, loan.DueDay, loan.LoanType,
            loan.IsAutopay, loan.PaymentFrequency, loan.FundedBankAccountId,
            FundedBankAccountName = bankName,
            loan.CreatedAt, loan.UpdatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<PersonalLoan>> Create(LoanCreateDto dto)
    {
        var exists = await _db.PersonalLoans.AnyAsync(l => l.UserId == UserId && l.LenderName == dto.LenderName.Trim());
        if (exists)
            return Conflict(new { message = $"A loan from '{dto.LenderName.Trim()}' already exists." });

        var loan = new PersonalLoan
        {
            LenderName = dto.LenderName,
            OriginalAmount = dto.OriginalAmount,
            CurrentBalance = dto.CurrentBalance,
            AprPercent = dto.AprPercent,
            DurationMonths = dto.DurationMonths,
            StartDate = dto.StartDate,
            MonthlyPayment = dto.MonthlyPayment,
            DueDay = dto.DueDay,
            LoanType = dto.LoanType,
            IsAutopay = dto.IsAutopay,
            PaymentFrequency = dto.PaymentFrequency,
            FundedBankAccountId = dto.FundedBankAccountId,
            UserId = UserId
        };

        _db.PersonalLoans.Add(loan);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = loan.Id }, loan);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PersonalLoan>> Update(int id, LoanCreateDto dto)
    {
        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        var duplicate = await _db.PersonalLoans.AnyAsync(l => l.UserId == UserId && l.Id != id && l.LenderName == dto.LenderName.Trim());
        if (duplicate)
            return Conflict(new { message = $"A loan from '{dto.LenderName.Trim()}' already exists." });

        loan.LenderName = dto.LenderName;
        loan.OriginalAmount = dto.OriginalAmount;
        loan.CurrentBalance = dto.CurrentBalance;
        loan.AprPercent = dto.AprPercent;
        loan.DurationMonths = dto.DurationMonths;
        loan.StartDate = dto.StartDate;
        loan.MonthlyPayment = dto.MonthlyPayment;
        loan.DueDay = dto.DueDay;
        loan.LoanType = dto.LoanType;
        loan.IsAutopay = dto.IsAutopay;
        loan.PaymentFrequency = dto.PaymentFrequency;
        loan.FundedBankAccountId = dto.FundedBankAccountId;

        await _db.SaveChangesAsync();

        return Ok(loan);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        _db.PersonalLoans.Remove(loan);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id}/amortization")]
    public async Task<ActionResult<AmortizationScheduleDto>> GetAmortization(int id)
    {
        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        var schedule = _calcService.GenerateFullAmortizationSchedule(
            loan.OriginalAmount,
            loan.AprPercent,
            loan.DurationMonths,
            loan.MonthlyPayment,
            loan.PaymentFrequency,
            loan.StartDate,
            loan.DueDay);

        return Ok(schedule);
    }

    [HttpPost("{id}/payments")]
    public async Task<ActionResult<PaymentHistory>> RecordPayment(int id, PaymentCreateDto dto)
    {
        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            PaymentHistory payment = null!;
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                payment = new PaymentHistory
                {
                    DebtType = DebtType.PersonalLoan,
                    DebtId = id,
                    AmountPaid = dto.AmountPaid,
                    PaymentDate = dto.PaymentDate,
                    Notes = dto.Notes,
                    UserId = UserId,
                    FromAccountId = dto.FromAccountId
                };

                loan.CurrentBalance = Math.Max(0, loan.CurrentBalance - dto.AmountPaid);

                if (dto.FromAccountId.HasValue)
                {
                    var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == dto.FromAccountId && a.UserId == UserId);
                    if (account != null)
                        account.CurrentBalance -= dto.AmountPaid;
                }

                _db.PaymentHistories.Add(payment);
                await _db.SaveChangesAsync();

                await transaction.CommitAsync();
            });
            return Ok(payment);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, inner = ex.InnerException?.Message });
        }
    }

    [HttpGet("{id}/payments")]
    public async Task<ActionResult<List<PaymentHistory>>> GetPayments(int id)
    {
        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        var payments = await _db.PaymentHistories
            .Where(p => p.DebtType == DebtType.PersonalLoan && p.DebtId == id && p.UserId == UserId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        return Ok(payments);
    }
}
