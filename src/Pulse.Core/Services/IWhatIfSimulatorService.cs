using Pulse.Core.DTOs;

namespace Pulse.Core.Services;

public interface IWhatIfSimulatorService
{
    WhatIfResultDto Simulate(List<DebtSnapshotDto> debts, WhatIfRequestDto request);
}
