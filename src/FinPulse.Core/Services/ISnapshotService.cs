using FinPulse.Core.DTOs;

namespace FinPulse.Core.Services;

public interface ISnapshotService
{
    Task<TrendDataDto> GetTrendsAsync(string userId, int months = 12);
    Task EnsureCurrentMonthSnapshotAsync(string userId);
}
