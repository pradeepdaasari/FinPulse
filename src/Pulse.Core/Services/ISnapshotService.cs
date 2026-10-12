using Pulse.Core.DTOs;

namespace Pulse.Core.Services;

public interface ISnapshotService
{
    Task<TrendDataDto> GetTrendsAsync(string userId, DateTime userNow, int months = 12);
    Task EnsureCurrentMonthSnapshotAsync(string userId, DateTime userNow);
}
