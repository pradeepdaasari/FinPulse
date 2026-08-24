using FinPulse.Core.DTOs;
using FinPulse.Core.Models;
using FinPulse.Core.Models.Enums;

namespace FinPulse.Core.Services;

public interface IFinancialCalculationService
{
    List<AmortizationEntryDto> GenerateAmortizationSchedule(
        decimal currentBalance,
        decimal aprPercent,
        int remainingMonths,
        decimal paymentAmount,
        PaymentFrequency frequency);

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
