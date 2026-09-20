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
        var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).OrderByDescending(l => l.StartDate).ToListAsync();
        var bankAccountIds = loans.Where(l => l.FundedBankAccountId.HasValue).Select(l => l.FundedBankAccountId!.Value).Distinct().ToList();
        var bankNames = bankAccountIds.Count > 0
            ? await _db.BankAccounts.Where(a => bankAccountIds.Contains(a.Id) && a.UserId == UserId).ToDictionaryAsync(a => a.Id, a => a.AccountName)
            : new Dictionary<int, string>();

        var result = loans.Select(l => new
        {
            l.Id, l.LenderName, l.OriginalAmount, l.CurrentBalance, l.AprPercent,
            l.DurationMonths, l.StartDate, l.MonthlyPayment, l.DueDay, l.LoanType,
            l.IsAutopay, l.PaymentFrequency, l.RateType, l.FundedBankAccountId, l.NextPaymentDate,
            l.MonthlyEquivalentPayment,
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
            loan.IsAutopay, loan.PaymentFrequency, loan.RateType, loan.FundedBankAccountId, loan.NextPaymentDate,
            loan.MonthlyEquivalentPayment,
            FundedBankAccountName = bankName,
            loan.CreatedAt, loan.UpdatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<PersonalLoan>> Create(LoanCreateDto dto)
    {
        if (dto.PaymentFrequency is PaymentFrequency.Weekly or PaymentFrequency.Biweekly)
        {
            if (dto.DueDay < 0 || dto.DueDay > 6)
                return BadRequest(new { error = "Due day must be 0-6 (day of week) for weekly/biweekly loans." });
        }
        else if (dto.DueDay < 1 || dto.DueDay > 28)
        {
            return BadRequest(new { error = "Due day must be 1-28 for monthly loans." });
        }

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
            RateType = dto.RateType,
            FundedBankAccountId = dto.FundedBankAccountId,
            NextPaymentDate = dto.NextPaymentDate,
            UserId = UserId
        };

        string? interestWarning = null;
        var monthlyEquiv = loan.MonthlyEquivalentPayment;
        if (dto.AprPercent > 0 && monthlyEquiv > 0)
        {
            var monthlyInterest = dto.CurrentBalance * dto.AprPercent / 100m / 12m;
            if (monthlyEquiv <= monthlyInterest)
                interestWarning = "Monthly payment does not cover interest. Loan balance will grow over time.";
        }

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                _db.PersonalLoans.Add(loan);
                await _db.SaveChangesAsync();

                if (loan.FundedBankAccountId.HasValue)
                {
                    var bankAccount = await _db.BankAccounts.FirstOrDefaultAsync(
                        a => a.Id == loan.FundedBankAccountId.Value && a.UserId == UserId);
                    if (bankAccount != null)
                    {
                        await _db.Entry(bankAccount).ReloadAsync();
                        bankAccount.CurrentBalance += loan.OriginalAmount;

                        _db.MoneyMovements.Add(new MoneyMovement
                        {
                            SourceType = MoneyMovementEntityType.Loan,
                            SourceId = loan.Id,
                            DestinationType = MoneyMovementEntityType.BankAccount,
                            DestinationId = loan.FundedBankAccountId.Value,
                            Amount = loan.OriginalAmount,
                            MovementDate = loan.StartDate,
                            MovementType = MovementType.LoanFunding,
                            Note = $"Loan funded from {loan.LenderName}",
                            IsAutoGenerated = true,
                            UserId = UserId
                        });
                        await _db.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();
            });

            return CreatedAtAction(nameof(GetById), new { id = loan.Id }, new { loan, warning = interestWarning });
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to create loan. Please try again." });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<PersonalLoan>> Update(int id, LoanCreateDto dto)
    {
        if (dto.PaymentFrequency is PaymentFrequency.Weekly or PaymentFrequency.Biweekly)
        {
            if (dto.DueDay < 0 || dto.DueDay > 6)
                return BadRequest(new { error = "Due day must be 0-6 (day of week) for weekly/biweekly loans." });
        }
        else if (dto.DueDay < 1 || dto.DueDay > 28)
        {
            return BadRequest(new { error = "Due day must be 1-28 for monthly loans." });
        }

        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        var oldFundedAccountId = loan.FundedBankAccountId;
        var oldOriginalAmount = loan.OriginalAmount;

        loan.LenderName = dto.LenderName;
        loan.OriginalAmount = dto.OriginalAmount;
        loan.AprPercent = dto.AprPercent;
        loan.DurationMonths = dto.DurationMonths;
        loan.StartDate = dto.StartDate;
        loan.MonthlyPayment = dto.MonthlyPayment;
        loan.DueDay = dto.DueDay;
        loan.LoanType = dto.LoanType;
        loan.IsAutopay = dto.IsAutopay;
        loan.PaymentFrequency = dto.PaymentFrequency;
        loan.RateType = dto.RateType;
        loan.FundedBankAccountId = dto.FundedBankAccountId;
        loan.NextPaymentDate = dto.NextPaymentDate;

        string? interestWarning = null;
        var monthlyEquiv = loan.MonthlyEquivalentPayment;
        if (dto.AprPercent > 0 && monthlyEquiv > 0)
        {
            var monthlyInterest = loan.CurrentBalance * dto.AprPercent / 100m / 12m;
            if (monthlyEquiv <= monthlyInterest)
                interestWarning = "Monthly payment does not cover interest. Loan balance will grow over time.";
        }

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                if (oldFundedAccountId != dto.FundedBankAccountId || oldOriginalAmount != dto.OriginalAmount)
                {
                    if (oldFundedAccountId.HasValue)
                    {
                        var oldAccount = await _db.BankAccounts.FirstOrDefaultAsync(
                            a => a.Id == oldFundedAccountId.Value && a.UserId == UserId);
                        if (oldAccount != null)
                        {
                            await _db.Entry(oldAccount).ReloadAsync();
                            oldAccount.CurrentBalance -= oldOriginalAmount;
                        }
                    }

                    if (dto.FundedBankAccountId.HasValue)
                    {
                        var newAccount = await _db.BankAccounts.FirstOrDefaultAsync(
                            a => a.Id == dto.FundedBankAccountId.Value && a.UserId == UserId);
                        if (newAccount != null)
                        {
                            await _db.Entry(newAccount).ReloadAsync();
                            newAccount.CurrentBalance += dto.OriginalAmount;
                        }
                    }

                    var oldMovements = await _db.MoneyMovements
                        .Where(m => m.UserId == UserId && m.MovementType == MovementType.LoanFunding
                            && m.SourceType == MoneyMovementEntityType.Loan && m.SourceId == loan.Id)
                        .ToListAsync();
                    _db.MoneyMovements.RemoveRange(oldMovements);

                    if (dto.FundedBankAccountId.HasValue)
                    {
                        _db.MoneyMovements.Add(new MoneyMovement
                        {
                            SourceType = MoneyMovementEntityType.Loan,
                            SourceId = loan.Id,
                            DestinationType = MoneyMovementEntityType.BankAccount,
                            DestinationId = dto.FundedBankAccountId.Value,
                            Amount = dto.OriginalAmount,
                            MovementDate = dto.StartDate,
                            MovementType = MovementType.LoanFunding,
                            Note = $"Loan funded from {dto.LenderName}",
                            IsAutoGenerated = true,
                            UserId = UserId
                        });
                    }
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            return Ok(new { loan, warning = interestWarning });
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to update loan. Please try again." });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                await _db.Entry(loan).ReloadAsync();

                // Reverse loan funding on bank account
                if (loan.FundedBankAccountId.HasValue)
                {
                    var account = await _db.BankAccounts.FirstOrDefaultAsync(
                        a => a.Id == loan.FundedBankAccountId.Value && a.UserId == UserId);
                    if (account != null)
                    {
                        await _db.Entry(account).ReloadAsync();
                        account.CurrentBalance -= loan.OriginalAmount;
                    }
                }

                // Reverse bank deductions from all payments and delete them
                var payments = await _db.PaymentHistories
                    .Where(p => p.DebtId == id && p.DebtType == DebtType.PersonalLoan && p.UserId == UserId)
                    .ToListAsync();

                foreach (var payment in payments)
                {
                    if (payment.FromAccountId.HasValue)
                    {
                        var account = await _db.BankAccounts.FirstOrDefaultAsync(
                            a => a.Id == payment.FromAccountId.Value && a.UserId == UserId);
                        if (account != null)
                        {
                            await _db.Entry(account).ReloadAsync();
                            account.CurrentBalance += payment.AmountPaid;
                        }
                    }
                }
                _db.PaymentHistories.RemoveRange(payments);

                // Remove all money movements related to this loan
                var movements = await _db.MoneyMovements
                    .Where(m => m.UserId == UserId &&
                        ((m.DestinationType == MoneyMovementEntityType.Loan && m.DestinationId == loan.Id) ||
                         (m.SourceType == MoneyMovementEntityType.Loan && m.SourceId == loan.Id)))
                    .ToListAsync();
                _db.MoneyMovements.RemoveRange(movements);

                _db.PersonalLoans.Remove(loan);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            return NoContent();
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to delete loan. Please try again." });
        }
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

        if (loan.CurrentBalance <= 0)
            return BadRequest(new { error = "This loan has already been paid off." });

        if (dto.AmountPaid <= 0)
            return BadRequest(new { error = "Payment amount must be greater than zero." });

        var maxAllowed = loan.CurrentBalance * 1.5m;
        if (dto.AmountPaid > maxAllowed)
            return BadRequest(new { error = $"Payment amount cannot exceed 150% of the current balance ({maxAllowed:C})." });

        if (dto.PrincipalAmount.HasValue && dto.InterestAmount.HasValue
            && Math.Abs(dto.PrincipalAmount.Value + dto.InterestAmount.Value - dto.AmountPaid) > 0.01m)
            return BadRequest(new { error = "Principal + Interest must equal the total payment amount." });

        var strategy = _db.Database.CreateExecutionStrategy();
        try
        {
            PaymentHistory payment = null!;
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _db.Database.BeginTransactionAsync();

                // Re-read loan inside transaction for fresh balance
                await _db.Entry(loan).ReloadAsync();

                payment = new PaymentHistory
                {
                    DebtType = DebtType.PersonalLoan,
                    DebtId = id,
                    AmountPaid = dto.AmountPaid,
                    PrincipalAmount = dto.PrincipalAmount,
                    InterestAmount = dto.InterestAmount,
                    PaymentDate = dto.PaymentDate,
                    Notes = dto.Notes,
                    UserId = UserId,
                    FromAccountId = dto.FromAccountId
                };

                var principalReduction = dto.PrincipalAmount ?? dto.AmountPaid;
                loan.CurrentBalance = Math.Max(0, loan.CurrentBalance - principalReduction);

                if (dto.FromAccountId.HasValue)
                {
                    var account = await _db.BankAccounts.FirstOrDefaultAsync(a => a.Id == dto.FromAccountId && a.UserId == UserId);
                    if (account != null)
                    {
                        await _db.Entry(account).ReloadAsync();
                        account.CurrentBalance -= dto.AmountPaid;
                    }
                }

                _db.PaymentHistories.Add(payment);
                await _db.SaveChangesAsync();

                var movement = new MoneyMovement
                {
                    SourceType = dto.FromAccountId.HasValue ? MoneyMovementEntityType.BankAccount : MoneyMovementEntityType.External,
                    SourceId = dto.FromAccountId,
                    DestinationType = MoneyMovementEntityType.Loan,
                    DestinationId = id,
                    Amount = dto.AmountPaid,
                    MovementDate = dto.PaymentDate,
                    MovementType = MovementType.LoanPayment,
                    Note = dto.Notes,
                    IsAutoGenerated = true,
                    RelatedPaymentId = payment.Id,
                    UserId = UserId
                };
                _db.MoneyMovements.Add(movement);
                await _db.SaveChangesAsync();

                await transaction.CommitAsync();
            });
            return Ok(payment);
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to record payment. Please try again." });
        }
    }

    [HttpGet("{id}/payments")]
    public async Task<ActionResult> GetPayments(int id)
    {
        var loan = await _db.PersonalLoans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == UserId);
        if (loan is null) return NotFound();

        var payments = await _db.PaymentHistories
            .Where(p => p.DebtType == DebtType.PersonalLoan && p.DebtId == id && p.UserId == UserId)
            .OrderByDescending(p => p.PaymentDate)
            .ToListAsync();

        var totalPaid = payments.Sum(p => p.AmountPaid);
        var totalPrincipalPaid = payments.Sum(p => p.PrincipalAmount ?? p.AmountPaid);
        var totalInterestPaid = payments.Sum(p => p.InterestAmount ?? 0m);

        return Ok(new { payments, totalPaid, totalPrincipalPaid, totalInterestPaid });
    }

    [HttpPost("backfill-payment-splits")]
    public async Task<ActionResult> BackfillPaymentSplits()
    {
        var strategy = _db.Database.CreateExecutionStrategy();
        var updated = 0;
        try
        {
            await strategy.ExecuteAsync(async () =>
            {
                updated = 0;
                using var transaction = await _db.Database.BeginTransactionAsync();

                var loans = await _db.PersonalLoans.Where(l => l.UserId == UserId).ToListAsync();

                foreach (var loan in loans)
                {
                    var allPayments = await _db.PaymentHistories
                        .Where(p => p.DebtType == DebtType.PersonalLoan && p.DebtId == loan.Id && p.UserId == UserId)
                        .OrderBy(p => p.PaymentDate)
                        .ToListAsync();

                    if (allPayments.Count == 0) continue;

                    int periodsPerYear = loan.PaymentFrequency switch
                    {
                        PaymentFrequency.Biweekly => 26,
                        PaymentFrequency.Weekly => 52,
                        _ => 12
                    };
                    var periodicRate = loan.AprPercent / 100m / periodsPerYear;

                    var balance = loan.OriginalAmount;

                    foreach (var payment in allPayments)
                    {
                        var interest = Math.Round(balance * periodicRate, 2);
                        var principal = Math.Max(0, payment.AmountPaid - interest);
                        if (principal > balance)
                        {
                            principal = balance;
                            interest = Math.Min(interest, payment.AmountPaid - principal);
                        }

                        if (!payment.PrincipalAmount.HasValue && !payment.InterestAmount.HasValue)
                        {
                            payment.InterestAmount = interest;
                            payment.PrincipalAmount = principal;
                            updated++;
                        }
                        balance = Math.Max(0, balance - (payment.PrincipalAmount ?? principal));
                    }
                }

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            });

            return Ok(new { updated });
        }
        catch
        {
            return StatusCode(500, new { error = "Failed to backfill payment splits. Please try again." });
        }
    }
}
