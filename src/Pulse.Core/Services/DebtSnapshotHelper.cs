using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public interface IDebtSnapshotHelper
{
    Task<List<DebtSnapshotDto>> GetDebtSnapshots(string userId, DateTime userNow);
}

public class DebtSnapshotHelper : IDebtSnapshotHelper
{
    private readonly PulseDbContext _db;

    public DebtSnapshotHelper(PulseDbContext db) => _db = db;

    public async Task<List<DebtSnapshotDto>> GetDebtSnapshots(string userId, DateTime userNow)
    {
        var loans = await _db.PersonalLoans
            .Where(l => l.UserId == userId && l.CurrentBalance > 0)
            .ToListAsync();
        var cards = await _db.CreditCards
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var snapshots = new List<DebtSnapshotDto>();

        foreach (var loan in loans)
        {
            snapshots.Add(new DebtSnapshotDto
            {
                Id = loan.Id,
                DebtType = DebtType.PersonalLoan,
                Name = loan.LenderName,
                Balance = loan.CurrentBalance,
                AprPercent = loan.AprPercent,
                MinimumPayment = loan.MonthlyEquivalentPayment,
                EffectiveApr = loan.AprPercent,
                PromoEndDate = null,
                DueDay = loan.DueDay,
                PaymentFrequency = loan.PaymentFrequency.ToString(),
                StartDate = loan.StartDate,
                PerPaymentAmount = loan.MonthlyPayment,
                NextPaymentDate = loan.NextPaymentDate
            });
        }

        foreach (var card in cards)
        {
            snapshots.Add(new DebtSnapshotDto
            {
                Id = card.Id,
                DebtType = DebtType.CreditCard,
                Name = card.CardName,
                Balance = card.CurrentBalance,
                AprPercent = card.AprPercent,
                MinimumPayment = card.MinimumPayment,
                EffectiveApr = card.PromoEndDate.HasValue && card.PromoEndDate > userNow
                    ? card.PromoAprPercent ?? card.AprPercent
                    : card.AprPercent,
                PromoEndDate = card.PromoEndDate,
                DueDay = card.DueDay,
                PerPaymentAmount = card.MinimumPayment,
                CreditLimit = card.CreditLimit
            });
        }

        return snapshots;
    }
}
