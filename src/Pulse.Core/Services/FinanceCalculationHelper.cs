using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public static class FinanceCalculationHelper
{
    public static bool IsLoanDeferred(PersonalLoan loan, DateTime today)
    {
        if (!loan.NextPaymentDate.HasValue || loan.CurrentBalance <= 0) return false;
        var daysAway = (loan.NextPaymentDate.Value.Date - today).TotalDays;
        var cycleDays = loan.PaymentFrequency == PaymentFrequency.Weekly ? 7
            : loan.PaymentFrequency == PaymentFrequency.Biweekly ? 14 : 31;
        return daysAway > cycleDays + 7;
    }

    public static DateTime? AdvanceNextDueDate(DateTime? anchor, PaymentFrequency frequency, int dueDay, DateTime today)
    {
        if (anchor.HasValue)
        {
            var d = anchor.Value.Date;
            while (d < today)
            {
                d = frequency switch
                {
                    PaymentFrequency.Weekly => d.AddDays(7),
                    PaymentFrequency.Biweekly => d.AddDays(14),
                    _ => d.AddMonths(1)
                };
            }
            return d;
        }

        if (frequency == PaymentFrequency.Monthly)
        {
            var day = Math.Min(dueDay, DateTime.DaysInMonth(today.Year, today.Month));
            var thisMonth = new DateTime(today.Year, today.Month, day);
            if (thisMonth >= today) return thisMonth;
            var next = today.AddMonths(1);
            day = Math.Min(dueDay, DateTime.DaysInMonth(next.Year, next.Month));
            return new DateTime(next.Year, next.Month, day);
        }

        if (frequency is PaymentFrequency.Biweekly or PaymentFrequency.Weekly)
        {
            var targetDow = (DayOfWeek)dueDay;
            var daysUntil = ((int)targetDow - (int)today.DayOfWeek + 7) % 7;
            if (daysUntil == 0) return today;
            return today.AddDays(daysUntil);
        }

        return null;
    }

    public static DateTime GetNextMonthlyDueDate(int dueDay, DateTime today)
    {
        var thisMonth = new DateTime(today.Year, today.Month, Math.Min(dueDay, DateTime.DaysInMonth(today.Year, today.Month)));
        if (thisMonth >= today)
            return thisMonth;

        var nextMonth = today.AddMonths(1);
        return new DateTime(nextMonth.Year, nextMonth.Month, Math.Min(dueDay, DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month)));
    }

    public static DateTime GetNextLoanDueDate(PersonalLoan loan, DateTime today)
    {
        if (loan.PaymentFrequency is PaymentFrequency.Weekly or PaymentFrequency.Biweekly)
        {
            var interval = loan.PaymentFrequency == PaymentFrequency.Biweekly ? 14 : 7;
            var anchor = loan.StartDate.Date;
            while (anchor < today)
                anchor = anchor.AddDays(interval);
            return anchor;
        }
        return GetNextMonthlyDueDate(loan.DueDay, today);
    }

    public static DateTime ComputeNextPaycheck(DateTime anchor, PaymentFrequency frequency, DateTime today)
    {
        if (frequency == PaymentFrequency.Biweekly || frequency == PaymentFrequency.Weekly)
        {
            var intervalDays = frequency == PaymentFrequency.Biweekly ? 14 : 7;
            var nextPay = anchor;
            if (nextPay > today)
            {
                while (nextPay.AddDays(-intervalDays) > today) nextPay = nextPay.AddDays(-intervalDays);
            }
            else
            {
                while (nextPay <= today) nextPay = nextPay.AddDays(intervalDays);
            }
            return nextPay;
        }

        var day = anchor.Day;
        return today.Day < day
            ? new DateTime(today.Year, today.Month, day)
            : new DateTime(today.Year, today.Month, 1).AddMonths(1).AddDays(day - 1);
    }

    public static List<DateTime> GetDatesInMonth(DateTime anchor, PaymentFrequency freq, int year, int month)
    {
        var monthEnd = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        if (freq == PaymentFrequency.Monthly)
        {
            var day = Math.Min(anchor.Day, monthEnd.Day);
            return new List<DateTime> { new(year, month, day) };
        }

        var interval = freq == PaymentFrequency.Biweekly ? 14 : 7;
        var monthStart = new DateTime(year, month, 1);
        var results = new List<DateTime>();

        var current = anchor.Date;
        while (current <= monthEnd)
        {
            if (current >= monthStart)
                results.Add(current);
            current = current.AddDays(interval);
        }
        current = anchor.Date.AddDays(-interval);
        while (current >= monthStart)
        {
            results.Add(current);
            current = current.AddDays(-interval);
        }

        results = results.Distinct().OrderBy(d => d).ToList();
        if (results.Count == 0)
        {
            var day = Math.Min(anchor.Day, monthEnd.Day);
            results.Add(new DateTime(year, month, day));
        }
        return results;
    }

    public static (string status, string label) ComputePaymentStatus(bool isPaid, DateTime dueDate, DateTime today)
    {
        if (isPaid) return ("paid", "Paid");
        if (dueDate < today)
        {
            var daysLate = (int)(today - dueDate).TotalDays;
            return ("overdue", $"{daysLate}d overdue — was due {dueDate:MMM d}");
        }
        if (dueDate == today) return ("due-today", "Due today");
        if ((dueDate - today).TotalDays <= 3) return ("due-soon", $"Due {dueDate:MMM d}");
        return ("upcoming", $"Due {dueDate:MMM d}");
    }

    public static double ComputeUtilization(decimal currentBalance, decimal creditLimit)
    {
        return creditLimit > 0
            ? Math.Min(100, Math.Round((double)currentBalance / (double)creditLimit * 100, 1))
            : 0;
    }
}
