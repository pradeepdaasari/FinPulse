using FinPulse.Core.DTOs;

namespace FinPulse.Core.Services;

public interface IWhatIfSimulatorService
{
    WhatIfResultDto Simulate(List<DebtSnapshotDto> debts, WhatIfRequestDto request);
}
