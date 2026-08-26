using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public class FinancialCalculationService : IFinancialCalculationService
{
    private const int MaxIterations = 1200; // 100 years of monthly payments as safety limit

    public List<AmortizationEntryDto> GenerateAmortizationSchedule(
        decimal currentBalance,
        decimal aprPercent,
        int remainingMonths,
        decimal paymentAmount,
        PaymentFrequency frequency,
        int dueDay = 0)
    {
        var schedule = new List<AmortizationEntryDto>();
        var balance = currentBalance;
        var today = DateTime.Today;

        DateTime startDate;
        if (dueDay >= 1 && dueDay <= 28 && frequency == PaymentFrequency.Monthly)
        {
            startDate = new DateTime(today.Year, today.Month, dueDay);
            if (startDate <= today)
                startDate = startDate.AddMonths(1);
        }
        else
        {
            startDate = today;
        }

        int periodsPerYear = frequency switch
        {
            PaymentFrequency.Biweekly => 26,
            PaymentFrequency.Weekly => 52,
            _ => 12
        };

        decimal periodicRate = aprPercent / 100m / periodsPerYear;

        int totalPeriods = frequency switch
        {
            PaymentFrequency.Biweekly => (int)Math.Ceiling(remainingMonths * 26.0 / 12.0),
            PaymentFrequency.Weekly => (int)Math.Ceiling(remainingMonths * 52.0 / 12.0),
            _ => remainingMonths
        };

        for (int period = 1; period <= totalPeriods && balance > 0; period++)
        {
            decimal interest = Math.Round(balance * periodicRate, 2);
            decimal payment = Math.Min(paymentAmount, balance + interest);
            decimal principal = payment - interest;

            balance -= principal;

            if (balance < 0.01m)
                balance = 0;

            DateTime paymentDate = frequency switch
            {
                PaymentFrequency.Biweekly => startDate.AddDays(14 * period),
                PaymentFrequency.Weekly => startDate.AddDays(7 * period),
                _ => startDate.AddMonths(period - 1)
            };

            schedule.Add(new AmortizationEntryDto
            {
                PeriodNumber = period,
                PaymentDate = paymentDate,
                PaymentAmount = payment,
                PrincipalPortion = principal,
                InterestPortion = interest,
                RemainingBalance = balance
            });
        }

        return schedule;
    }

    public AmortizationScheduleDto GenerateFullAmortizationSchedule(
        decimal originalAmount,
        decimal aprPercent,
        int durationMonths,
        decimal paymentAmount,
        PaymentFrequency frequency,
        DateTime loanStartDate,
        int dueDay)
    {
        var schedule = new List<AmortizationEntryDto>();
        var balance = originalAmount;
        var today = DateTime.Today;

        DateTime firstPaymentDate;
        if (dueDay >= 1 && dueDay <= 28 && frequency == PaymentFrequency.Monthly)
        {
            firstPaymentDate = new DateTime(loanStartDate.Year, loanStartDate.Month, dueDay);
            if (firstPaymentDate <= loanStartDate)
                firstPaymentDate = firstPaymentDate.AddMonths(1);
        }
        else
        {
            firstPaymentDate = loanStartDate.AddMonths(1);
        }

        int periodsPerYear = frequency switch
        {
            PaymentFrequency.Biweekly => 26,
            PaymentFrequency.Weekly => 52,
            _ => 12
        };

        decimal periodicRate = aprPercent / 100m / periodsPerYear;

        for (int period = 1; period <= durationMonths && balance > 0; period++)
        {
            decimal interest = Math.Round(balance * periodicRate, 2);
            decimal payment = Math.Min(paymentAmount, balance + interest);
            decimal principal = payment - interest;

            balance -= principal;
            if (balance < 0.01m)
                balance = 0;

            DateTime paymentDate = frequency switch
            {
                PaymentFrequency.Biweekly => firstPaymentDate.AddDays(14 * (period - 1)),
                PaymentFrequency.Weekly => firstPaymentDate.AddDays(7 * (period - 1)),
                _ => firstPaymentDate.AddMonths(period - 1)
            };

            schedule.Add(new AmortizationEntryDto
            {
                PeriodNumber = period,
                PaymentDate = paymentDate,
                PaymentAmount = payment,
                PrincipalPortion = principal,
                InterestPortion = interest,
                RemainingBalance = balance,
                IsPaid = paymentDate <= today
            });
        }

        var paid = schedule.Where(e => e.IsPaid).ToList();
        var pending = schedule.Where(e => !e.IsPaid).ToList();
        var totalInterest = schedule.Sum(e => e.InterestPortion);

        return new AmortizationScheduleDto
        {
            Entries = schedule,
            PaidPrincipal = paid.Sum(e => e.PrincipalPortion),
            PaidInterest = paid.Sum(e => e.InterestPortion),
            PendingPrincipal = pending.Sum(e => e.PrincipalPortion),
            PendingInterest = pending.Sum(e => e.InterestPortion),
            TotalInterest = totalInterest,
            OriginalAmount = originalAmount,
            TotalCost = originalAmount + totalInterest
        };
    }

    public decimal CalculateMonthlyPayment(decimal principal, decimal annualRate, int months)
    {
        if (months <= 0)
            return principal;

        if (annualRate == 0)
            return Math.Round(principal / months, 2);

        // M = P * [r(1+r)^n] / [(1+r)^n - 1]
        double r = (double)(annualRate / 100m / 12m);
        double n = months;
        double p = (double)principal;

        double numerator = r * Math.Pow(1 + r, n);
        double denominator = Math.Pow(1 + r, n) - 1;

        double monthlyPayment = p * (numerator / denominator);

        return Math.Round((decimal)monthlyPayment, 2);
    }

    public int CalculateRemainingMonths(PersonalLoan loan)
    {
        var endDate = loan.StartDate.AddMonths(loan.DurationMonths);
        var today = DateTime.Today;

        if (today >= endDate)
            return 0;

        int remainingMonths = ((endDate.Year - today.Year) * 12) + endDate.Month - today.Month;

        if (today.Day > endDate.Day)
            remainingMonths--;

        return Math.Max(0, remainingMonths);
    }

    public List<PayoffEntryDto> GenerateCardPayoffSchedule(
        decimal balance,
        decimal aprPercent,
        decimal monthlyPayment,
        decimal? promoAprPercent,
        DateTime? promoEndDate)
    {
        var schedule = new List<PayoffEntryDto>();
        var currentBalance = balance;
        var currentDate = DateTime.Today;

        for (int month = 1; month <= MaxIterations && currentBalance > 0; month++)
        {
            var paymentDate = currentDate.AddMonths(month);

            bool isPromoActive = promoAprPercent.HasValue
                && promoEndDate.HasValue
                && paymentDate <= promoEndDate.Value;

            decimal effectiveApr = isPromoActive ? promoAprPercent!.Value : aprPercent;
            decimal monthlyInterest = Math.Round(currentBalance * effectiveApr / 100m / 12m, 2);

            decimal payment = Math.Min(monthlyPayment, currentBalance + monthlyInterest);

            // Guard against infinite loop: if payment doesn't cover interest, cap at a large duration
            if (payment <= monthlyInterest && currentBalance > 0)
            {
                // Payment does not cover interest - debt will never be paid off
                // Add this entry showing the problem and break
                schedule.Add(new PayoffEntryDto
                {
                    MonthNumber = month,
                    PaymentDate = paymentDate,
                    PaymentAmount = payment,
                    InterestCharged = monthlyInterest,
                    PrincipalPaid = 0,
                    RemainingBalance = currentBalance + monthlyInterest - payment,
                    IsPromoActive = isPromoActive
                });
                break;
            }

            decimal principalPaid = payment - monthlyInterest;
            currentBalance -= principalPaid;

            if (currentBalance < 0.01m)
                currentBalance = 0;

            schedule.Add(new PayoffEntryDto
            {
                MonthNumber = month,
                PaymentDate = paymentDate,
                PaymentAmount = payment,
                InterestCharged = monthlyInterest,
                PrincipalPaid = principalPaid,
                RemainingBalance = currentBalance,
                IsPromoActive = isPromoActive
            });
        }

        return schedule;
    }

    public decimal CalculateTotalInterest(
        decimal balance,
        decimal aprPercent,
        decimal monthlyPayment,
        decimal? promoAprPercent,
        DateTime? promoEndDate)
    {
        var schedule = GenerateCardPayoffSchedule(balance, aprPercent, monthlyPayment, promoAprPercent, promoEndDate);
        return schedule.Sum(e => e.InterestCharged);
    }

    public int CalculatePayoffMonths(
        decimal balance,
        decimal aprPercent,
        decimal monthlyPayment,
        decimal? promoAprPercent,
        DateTime? promoEndDate)
    {
        var schedule = GenerateCardPayoffSchedule(balance, aprPercent, monthlyPayment, promoAprPercent, promoEndDate);

        if (schedule.Count == 0)
            return 0;

        var lastEntry = schedule[^1];
        if (lastEntry.RemainingBalance > 0)
            return -1; // Indicates debt cannot be paid off with current payment

        return schedule.Count;
    }
}
