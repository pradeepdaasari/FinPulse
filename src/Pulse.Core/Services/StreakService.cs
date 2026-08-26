using Microsoft.EntityFrameworkCore;
using Pulse.Core.Data;
using Pulse.Core.DTOs;

namespace Pulse.Core.Services;

public class StreakService : IStreakService
{
    private readonly PulseDbContext _db;

    public StreakService(PulseDbContext db)
    {
        _db = db;
    }

    public async Task<PaymentStreakDto> GetStreakAsync(string userId)
    {
        var loans = await _db.PersonalLoans.Where(l => l.UserId == userId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == userId).ToListAsync();
        var payments = await _db.PaymentHistories.Where(p => p.UserId == userId).ToListAsync();

        var totalDebts = loans.Count + cards.Count;
        if (totalDebts == 0)
            return new PaymentStreakDto { CurrentStreak = 0, LongestStreak = 0, CurrentMonthAllPaid = false };

        var now = DateTime.UtcNow;
        var currentStreak = 0;
        var longestStreak = 0;
        var tempStreak = 0;

        for (int i = 0; i < 36; i++)
        {
            var checkDate = now.AddMonths(-i);
            var year = checkDate.Year;
            var month = checkDate.Month;
            var startOfMonth = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endOfMonth = startOfMonth.AddMonths(1);

            var allPaid = true;

            foreach (var loan in loans)
            {
                var loanPayments = payments
                    .Where(p => p.DebtId == loan.Id && p.PaymentDate >= startOfMonth && p.PaymentDate < endOfMonth)
                    .Sum(p => p.AmountPaid);

                if (loanPayments < loan.MonthlyPayment)
                {
                    allPaid = false;
                    break;
                }
            }

            if (allPaid)
            {
                foreach (var card in cards)
                {
                    var cardPayments = payments
                        .Where(p => p.DebtId == card.Id && p.PaymentDate >= startOfMonth && p.PaymentDate < endOfMonth)
                        .Sum(p => p.AmountPaid);

                    if (cardPayments <= 0)
                    {
                        allPaid = false;
                        break;
                    }
                }
            }

            if (allPaid)
            {
                tempStreak++;
                longestStreak = Math.Max(longestStreak, tempStreak);
            }
            else
            {
                if (i == 0)
                {
                    currentStreak = 0;
                }
                break;
            }

            if (i == 0 || currentStreak == tempStreak - 1)
            {
                currentStreak = tempStreak;
            }
        }

        var currentMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var currentMonthEnd = currentMonthStart.AddMonths(1);
        var currentMonthAllPaid = true;

        foreach (var loan in loans)
        {
            var paid = payments
                .Where(p => p.DebtId == loan.Id && p.PaymentDate >= currentMonthStart && p.PaymentDate < currentMonthEnd)
                .Sum(p => p.AmountPaid);
            if (paid < loan.MonthlyPayment)
            {
                currentMonthAllPaid = false;
                break;
            }
        }

        if (currentMonthAllPaid)
        {
            foreach (var card in cards)
            {
                var paid = payments
                    .Where(p => p.DebtId == card.Id && p.PaymentDate >= currentMonthStart && p.PaymentDate < currentMonthEnd)
                    .Sum(p => p.AmountPaid);
                if (paid <= 0)
                {
                    currentMonthAllPaid = false;
                    break;
                }
            }
        }

        return new PaymentStreakDto
        {
            CurrentStreak = currentStreak,
            LongestStreak = longestStreak,
            CurrentMonthAllPaid = currentMonthAllPaid
        };
    }
}
