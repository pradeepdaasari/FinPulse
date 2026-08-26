using Pulse.Core.DTOs;

namespace Pulse.Core.Services;

public interface IStreakService
{
    Task<PaymentStreakDto> GetStreakAsync(string userId);
}
