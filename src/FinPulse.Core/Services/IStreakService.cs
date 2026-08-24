using FinPulse.Core.DTOs;

namespace FinPulse.Core.Services;

public interface IStreakService
{
    Task<PaymentStreakDto> GetStreakAsync(string userId);
}
