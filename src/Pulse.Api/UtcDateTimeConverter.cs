using System.Text.Json;
using System.Text.Json.Serialization;

namespace Pulse.Api;

public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    internal static IHttpContextAccessor? HttpContextAccessor;

    private static TimeZoneInfo? GetUserTimeZone()
    {
        var tz = HttpContextAccessor?.HttpContext?.Items["UserTimeZone"] as TimeZoneInfo;
        return tz is null || tz == TimeZoneInfo.Utc ? null : tz;
    }

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var dt = reader.GetDateTime();
        if (dt.Kind == DateTimeKind.Utc) return dt;

        var tz = GetUserTimeZone();
        if (tz != null)
            return TimeZoneHelper.ToUtc(dt, tz);

        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var tz = GetUserTimeZone();
        if (tz != null)
        {
            var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(value, DateTimeKind.Utc), tz);
            writer.WriteStringValue(DateTime.SpecifyKind(local, DateTimeKind.Unspecified));
        }
        else
        {
            writer.WriteStringValue(DateTime.SpecifyKind(value, DateTimeKind.Utc));
        }
    }
}

public class UtcNullableDateTimeConverter : JsonConverter<DateTime?>
{
    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;

        var dt = reader.GetDateTime();
        if (dt.Kind == DateTimeKind.Utc) return dt;

        var tz = UtcDateTimeConverter.HttpContextAccessor?.HttpContext?.Items["UserTimeZone"] as TimeZoneInfo;
        if (tz != null && tz != TimeZoneInfo.Utc)
            return TimeZoneHelper.ToUtc(dt, tz);

        return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
        {
            writer.WriteNullValue();
            return;
        }

        var tz = UtcDateTimeConverter.HttpContextAccessor?.HttpContext?.Items["UserTimeZone"] as TimeZoneInfo;
        if (tz != null && tz != TimeZoneInfo.Utc)
        {
            var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(value.Value, DateTimeKind.Utc), tz);
            writer.WriteStringValue(DateTime.SpecifyKind(local, DateTimeKind.Unspecified));
        }
        else
        {
            writer.WriteStringValue(DateTime.SpecifyKind(value.Value, DateTimeKind.Utc));
        }
    }
}
