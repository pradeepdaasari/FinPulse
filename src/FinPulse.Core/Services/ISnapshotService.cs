using FinPulse.Core.DTOs;

namespace FinPulse.Core.Services;

public interface ISnapshotService
{
    Task<TrendDataDto> GetTrendsAsync(int months = 12);
    Task EnsureCurrentMonthSnapshotAsync();
}
