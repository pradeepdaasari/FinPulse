using Pulse.Core.Data;

namespace Pulse.Api;

public static class TimeZoneHelper
{
    public static async Task<TimeZoneInfo> GetUserTimeZone(PulseDbContext db, string userId)
    {
        var user = await db.Users.FindAsync(userId);
        var tzId = user?.PreferredTimezone;
        if (string.IsNullOrEmpty(tzId)) return TimeZoneInfo.Utc;
        try { return TimeZoneInfo.FindSystemTimeZoneById(tzId); }
        catch { return TimeZoneInfo.Utc; }
    }

    public static DateTime ToUtc(DateTime local, TimeZoneInfo tz)
    {
        var unspecified = DateTime.SpecifyKind(local, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, tz);
    }

    public static (DateTime fromUtc, DateTime toUtc) MonthRangeUtc(int year, int month, TimeZoneInfo tz)
    {
        var localStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Unspecified);
        var localEnd = localStart.AddMonths(1);
        return (TimeZoneInfo.ConvertTimeToUtc(localStart, tz), TimeZoneInfo.ConvertTimeToUtc(localEnd, tz));
    }
}
