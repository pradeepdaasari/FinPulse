using System.Globalization;
using Microsoft.EntityFrameworkCore;
using FinPulse.Core.Data;
using FinPulse.Core.DTOs;
using FinPulse.Core.Models;

namespace FinPulse.Core.Services;

public class SnapshotService : ISnapshotService
{
    private readonly FinPulseDbContext _db;

    public SnapshotService(FinPulseDbContext db)
    {
        _db = db;
    }

    public async Task EnsureCurrentMonthSnapshotAsync(string userId)
    {
        var now = DateTime.UtcNow;
        var exists = await _db.MonthlySnapshots
            .AnyAsync(s => s.Year == now.Year && s.Month == now.Month && s.UserId == userId);

        if (exists) return;

        var loans = await _db.PersonalLoans.Where(l => l.UserId == userId).ToListAsync();
        var cards = await _db.CreditCards.Where(c => c.UserId == userId).ToListAsync();
        var totalDebt = loans.Sum(l => l.CurrentBalance) + cards.Sum(c => c.CurrentBalance);

        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var payments = await _db.PaymentHistories
            .Where(p => p.UserId == userId && p.PaymentDate >= startOfMonth)
            .ToListAsync();
        var totalPaid = payments.Sum(p => p.AmountPaid);

        var snapshot = new MonthlySnapshot
        {
            Year = now.Year,
            Month = now.Month,
            TotalDebt = totalDebt,
            TotalPaidThisMonth = totalPaid,
            UserId = userId
        };

        _db.MonthlySnapshots.Add(snapshot);
        await _db.SaveChangesAsync();
    }

    public async Task<TrendDataDto> GetTrendsAsync(string userId, int months = 12)
    {
        await EnsureCurrentMonthSnapshotAsync(userId);

        var snapshots = await _db.MonthlySnapshots
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.Year)
            .ThenByDescending(s => s.Month)
            .Take(months)
            .ToListAsync();

        snapshots.Reverse();

        var points = snapshots.Select(s => new MonthlySnapshotPointDto
        {
            Year = s.Year,
            Month = s.Month,
            Label = new DateTime(s.Year, s.Month, 1).ToString("MMM yyyy", CultureInfo.InvariantCulture),
            TotalDebt = s.TotalDebt,
            TotalPaid = s.TotalPaidThisMonth
        }).ToList();

        decimal change = 0;
        decimal changePercent = 0;
        if (points.Count >= 2)
        {
            var current = points[^1].TotalDebt;
            var previous = points[^2].TotalDebt;
            change = current - previous;
            changePercent = previous != 0 ? (change / previous) * 100 : 0;
        }

        return new TrendDataDto
        {
            Snapshots = points,
            MonthOverMonthChange = change,
            MonthOverMonthChangePercent = Math.Round(changePercent, 2)
        };
    }
}
