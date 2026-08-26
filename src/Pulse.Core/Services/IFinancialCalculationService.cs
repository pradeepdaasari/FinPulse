using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public interface IFinancialCalculationService
{
    List<AmortizationEntryDto> GenerateAmortizationSchedule(
        decimal currentBalance,
        decimal aprPercent,
        int remainingMonths,
        decimal paymentAmount,
        PaymentFrequency frequency,
        int dueDay = 0);

    AmortizationScheduleDto GenerateFullAmortizationSchedule(
        decimal originalAmount,
        decimal aprPercent,
        int durationMonths,
        decimal paymentAmount,
        PaymentFrequency frequency,
        DateTime loanStartDate,
        int dueDay);

    decimal CalculateMonthlyPayment(decimal principal, decimal annualRate, int months);

    int CalculateRemainingMonths(PersonalLoan loan);

    List<PayoffEntryDto> GenerateCardPayoffSchedule(
        decimal balance,
        decimal aprPercent,
        decimal monthlyPayment,
        decimal? promoAprPercent,
        DateTime? promoEndDate);

    decimal CalculateTotalInterest(
        decimal balance,
        decimal aprPercent,
        decimal monthlyPayment,
        decimal? promoAprPercent,
        DateTime? promoEndDate);

    int CalculatePayoffMonths(
        decimal balance,
        decimal aprPercent,
        decimal monthlyPayment,
        decimal? promoAprPercent,
        DateTime? promoEndDate);
}
