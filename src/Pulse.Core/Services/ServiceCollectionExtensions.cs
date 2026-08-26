using Microsoft.Extensions.DependencyInjection;

namespace Pulse.Core.Services;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPulseCoreServices(this IServiceCollection services)
    {
        services.AddScoped<IFinancialCalculationService, FinancialCalculationService>();
        services.AddScoped<IPayoffStrategyService, PayoffStrategyService>();
        services.AddScoped<IWhatIfSimulatorService, WhatIfSimulatorService>();
        services.AddScoped<IBudgetService, BudgetService>();
        services.AddScoped<IBudgetPlanService, BudgetPlanService>();
        services.AddScoped<ISnapshotService, SnapshotService>();
        services.AddScoped<IStreakService, StreakService>();

        return services;
    }
}
