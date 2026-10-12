using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public class BudgetPlanService : IBudgetPlanService
{
    public BudgetPlanDto GeneratePlan(UserProfile profile, List<BudgetExpense> expenses, List<DebtSnapshotDto> debts, List<RecurringTransaction> recurring, int year, int month, DateTime today)
    {
        var monthStart = new DateTime(year, month, 1);
        var monthEnd = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        var breakdowns = GetPaycheckWindowsForMonth(
            profile.NextPayDate ?? monthStart,
            profile.PayFrequency,
            profile.NetPayPerCheck,
            year, month);

        var fixedExpenses = expenses.Where(e => e.IsFixed).ToList();
        var variableExpenses = expenses.Where(e => !e.IsFixed).ToList();
        var recurringInMonth = recurring.Where(r => r.IsActive).ToList();

        var windowStart = breakdowns.Min(b => b.WindowStart.Date);
        var windowEnd = breakdowns.Max(b => b.WindowEnd.Date);
        var coveredMonths = GetCoveredMonths(windowStart, windowEnd);

        foreach (var expense in fixedExpenses)
        {
            var dueDay = expense.DueDay ?? 1;
            foreach (var (y, m) in coveredMonths)
            {
                var dueDate = new DateTime(y, m, Math.Min(dueDay, DateTime.DaysInMonth(y, m)));
                if (dueDate < windowStart || dueDate > windowEnd) continue;

                var assigned = FindOwningPaycheck(breakdowns, dueDate);
                assigned.Expenses.Add(new PaycheckExpenseDto
                {
                    ExpenseId = expense.Id,
                    Name = expense.Name,
                    CategoryId = expense.CategoryId,
                    CategoryName = expense.Category?.Name ?? "Unknown",
                    Amount = expense.Amount,
                    DueDay = expense.DueDay,
                    DueDate = dueDate,
                    IsAutopay = expense.IsAutopay
                });
            }
        }

        var activeDebts = debts.Where(d => !IsDeferred(d, today)).ToList();
        foreach (var debt in activeDebts)
        {
            foreach (var (y, m) in coveredMonths)
            {
                var mEnd = new DateTime(y, m, DateTime.DaysInMonth(y, m));
                var dueDates = GetDebtDueDatesInMonth(debt, y, m, mEnd);
                var perPayment = dueDates.Count > 1 && debt.PerPaymentAmount > 0
                    ? debt.PerPaymentAmount
                    : debt.MinimumPayment;

                foreach (var dueDate in dueDates)
                {
                    if (dueDate < windowStart || dueDate > windowEnd) continue;

                    var assigned = FindOwningPaycheck(breakdowns, dueDate);
                    assigned.Expenses.Add(new PaycheckExpenseDto
                    {
                        ExpenseId = debt.Id,
                        Name = debt.Name,
                        CategoryId = 0,
                        CategoryName = "Debt Payment",
                        Amount = perPayment,
                        DueDay = dueDate.Day,
                        DueDate = dueDate,
                        IsAutopay = false,
                        IsDebtPayment = true
                    });
                }
            }
        }

        foreach (var rec in recurringInMonth)
        {
            var dueDay = rec.NextRunDate.Day;
            foreach (var (y, m) in coveredMonths)
            {
                var dueDate = new DateTime(y, m, Math.Min(dueDay, DateTime.DaysInMonth(y, m)));
                if (dueDate < windowStart || dueDate > windowEnd) continue;

                var assigned = FindOwningPaycheck(breakdowns, dueDate);
                assigned.Expenses.Add(new PaycheckExpenseDto
                {
                    ExpenseId = rec.Id,
                    Name = rec.Description + " (Recurring)",
                    CategoryId = rec.CategoryId,
                    CategoryName = rec.Category?.Name ?? "Unknown",
                    Amount = rec.Amount,
                    DueDay = dueDay,
                    DueDate = dueDate,
                    IsAutopay = true
                });
            }
        }

        var inMonthBreakdowns = breakdowns.Where(b => !b.IsPriorMonth).ToList();
        foreach (var expense in variableExpenses)
        {
            var perCheck = inMonthBreakdowns.Count > 0
                ? Math.Round(expense.Amount / inMonthBreakdowns.Count, 2)
                : expense.Amount;
            foreach (var breakdown in inMonthBreakdowns)
            {
                breakdown.Expenses.Add(new PaycheckExpenseDto
                {
                    ExpenseId = expense.Id,
                    Name = expense.Name,
                    CategoryId = expense.CategoryId,
                    CategoryName = expense.Category?.Name ?? "Unknown",
                    Amount = perCheck,
                    DueDay = null,
                    DueDate = null,
                    IsAutopay = false
                });
            }
        }

        foreach (var breakdown in breakdowns)
        {
            breakdown.Expenses = breakdown.Expenses.OrderBy(e => e.DueDate ?? DateTime.MaxValue).ToList();
            breakdown.TotalExpenses = breakdown.Expenses.Sum(e => e.Amount);
            breakdown.Leftover = breakdown.GrossPay - breakdown.TotalExpenses;
            breakdown.AbsLeftover = Math.Abs(breakdown.Leftover);
            breakdown.IsOver = breakdown.Leftover < 0;
            breakdown.SpendPercent = breakdown.GrossPay > 0
                ? Math.Round(Math.Min(breakdown.TotalExpenses / breakdown.GrossPay * 100, 100), 1)
                : 0;
        }

        var inMonthCount = inMonthBreakdowns.Count;
        var payPerCheck = profile.NetPayPerCheck;

        var debtActualTotals = new Dictionary<int, decimal>();
        foreach (var debt in activeDebts)
        {
            var dueDates = GetDebtDueDatesInMonth(debt, year, month, monthEnd);
            var perPayment = dueDates.Count > 1 && debt.PerPaymentAmount > 0
                ? debt.PerPaymentAmount
                : debt.MinimumPayment;
            debtActualTotals[debt.Id] = perPayment * dueDates.Count;
        }

        var totalFixed = fixedExpenses.Sum(e => e.Amount);
        var totalVariable = variableExpenses.Sum(e => e.Amount);
        var totalDebt = debtActualTotals.Values.Sum();
        var totalRecurring = recurringInMonth.Sum(r => r.Amount);
        var totalIncome = payPerCheck * inMonthCount;
        var totalExpenses = totalFixed + totalVariable + totalDebt + totalRecurring;

        var byCategory = expenses
            .GroupBy(e => new { e.CategoryId, e.IsFixed })
            .Select(g => new CategorySummaryDto
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.First().Category?.Name ?? "Unknown",
                Amount = g.Sum(e => e.Amount),
                IsFixed = g.Key.IsFixed,
                Icon = g.First().Category?.Icon
            })
            .OrderByDescending(c => c.IsFixed)
            .ThenByDescending(c => c.Amount)
            .ToList();

        foreach (var debt in activeDebts)
        {
            var isLoan = debt.DebtType == DebtType.PersonalLoan;
            byCategory.Add(new CategorySummaryDto
            {
                CategoryId = 0,
                CategoryName = debt.Name,
                Amount = debtActualTotals.GetValueOrDefault(debt.Id, debt.MinimumPayment),
                IsFixed = true,
                Icon = isLoan ? "account_balance" : "credit_score",
                IsDebt = true,
                IsLoan = isLoan,
                DebtId = debt.Id,
                DebtType = debt.DebtType
            });
        }

        var recurringByCategory = recurringInMonth
            .GroupBy(r => r.CategoryId)
            .Select(g => new CategorySummaryDto
            {
                CategoryId = g.Key,
                CategoryName = g.First().Category?.Name ?? "Unknown",
                Amount = g.Sum(r => r.Amount),
                IsFixed = true,
                Icon = g.First().Category?.Icon ?? "autorenew",
                IsRecurring = true
            });
        byCategory.AddRange(recurringByCategory);

        var summaryIncome = breakdowns.Sum(b => b.GrossPay);
        var summaryAllocated = breakdowns.Sum(b => b.TotalExpenses);
        var summaryNet = summaryIncome - summaryAllocated;

        return new BudgetPlanDto
        {
            MonthlyOverview = new MonthlyOverviewDto
            {
                TotalIncome = totalIncome,
                TotalFixedExpenses = totalFixed,
                TotalVariableBudgets = totalVariable,
                TotalDebtPayments = totalDebt,
                TotalRecurring = totalRecurring,
                TotalExpenses = totalExpenses,
                Surplus = totalIncome - totalExpenses,
                AbsSurplus = Math.Abs(totalIncome - totalExpenses),
                IsDeficit = totalIncome < totalExpenses,
                PaychecksThisMonth = inMonthCount,
                ByCategory = byCategory
            },
            PaycheckBreakdowns = breakdowns,
            PaycheckSummary = new PaycheckSummaryDto
            {
                TotalIncome = summaryIncome,
                TotalAllocated = summaryAllocated,
                NetLeftover = summaryNet,
                AbsNetLeftover = Math.Abs(summaryNet),
                IsNetOver = summaryNet < 0,
                PaycheckCount = breakdowns.Count,
                OverCount = breakdowns.Count(b => b.IsOver)
            }
        };
    }

    private static List<(int Year, int Month)> GetCoveredMonths(DateTime windowStart, DateTime windowEnd)
    {
        var months = new List<(int, int)>();
        var current = new DateTime(windowStart.Year, windowStart.Month, 1);
        var end = new DateTime(windowEnd.Year, windowEnd.Month, 1);
        while (current <= end)
        {
            months.Add((current.Year, current.Month));
            current = current.AddMonths(1);
        }
        return months;
    }

    private static PaycheckBreakdownDto FindOwningPaycheck(List<PaycheckBreakdownDto> breakdowns, DateTime dueDate)
    {
        var due = dueDate.Date;
        return breakdowns.FirstOrDefault(b => due >= b.WindowStart.Date && due <= b.WindowEnd.Date)
            ?? breakdowns.Where(b => b.WindowStart.Date > due).OrderBy(b => b.WindowStart).FirstOrDefault()
            ?? breakdowns.Last();
    }

    private static List<PaycheckBreakdownDto> GetPaycheckWindowsForMonth(DateTime anchor, PaymentFrequency freq, decimal payPerCheck, int year, int month)
    {
        var monthStart = new DateTime(year, month, 1);
        var monthEnd = new DateTime(year, month, DateTime.DaysInMonth(year, month));

        if (freq == PaymentFrequency.Monthly)
        {
            var day = Math.Min(anchor.Day, DateTime.DaysInMonth(year, month));
            var payDate = new DateTime(year, month, day);
            return new List<PaycheckBreakdownDto>
            {
                new()
                {
                    PayDate = payDate,
                    WindowStart = payDate,
                    WindowEnd = monthEnd,
                    IsPriorMonth = false,
                    GrossPay = payPerCheck,
                    Expenses = new List<PaycheckExpenseDto>()
                }
            };
        }

        var interval = freq == PaymentFrequency.Biweekly ? 14 : 7;

        var allPayDates = new List<DateTime>();
        var rangeStart = monthStart.AddDays(-interval);
        var rangeEnd = monthEnd.AddDays(interval);

        var current = anchor.Date;
        while (current <= rangeEnd)
        {
            if (current >= rangeStart)
                allPayDates.Add(current);
            current = current.AddDays(interval);
        }
        current = anchor.Date.AddDays(-interval);
        while (current >= rangeStart)
        {
            allPayDates.Add(current);
            current = current.AddDays(-interval);
        }

        allPayDates = allPayDates.Distinct().OrderBy(d => d).ToList();

        if (allPayDates.Count == 0)
        {
            return new List<PaycheckBreakdownDto>
            {
                new()
                {
                    PayDate = monthStart,
                    WindowStart = monthStart,
                    WindowEnd = monthEnd,
                    IsPriorMonth = false,
                    GrossPay = payPerCheck,
                    Expenses = new List<PaycheckExpenseDto>()
                }
            };
        }

        var windows = new List<PaycheckBreakdownDto>();
        for (int i = 0; i < allPayDates.Count; i++)
        {
            var windowEnd = i < allPayDates.Count - 1
                ? allPayDates[i + 1].AddDays(-1)
                : allPayDates[i].AddDays(interval - 1);

            windows.Add(new PaycheckBreakdownDto
            {
                PayDate = allPayDates[i],
                WindowStart = allPayDates[i],
                WindowEnd = windowEnd,
                IsPriorMonth = allPayDates[i] < monthStart,
                GrossPay = payPerCheck,
                Expenses = new List<PaycheckExpenseDto>()
            });
        }

        var result = windows
            .Where(w => w.WindowEnd >= monthStart && w.WindowStart <= monthEnd)
            .ToList();

        if (result.Count == 0)
        {
            return new List<PaycheckBreakdownDto>
            {
                new()
                {
                    PayDate = monthStart,
                    WindowStart = monthStart,
                    WindowEnd = monthEnd,
                    IsPriorMonth = false,
                    GrossPay = payPerCheck,
                    Expenses = new List<PaycheckExpenseDto>()
                }
            };
        }

        return result;
    }

    private static List<DateTime> GetDebtDueDatesInMonth(DebtSnapshotDto debt, int year, int month, DateTime monthEnd)
    {
        var freq = debt.PaymentFrequency ?? "Monthly";
        if (freq == "Monthly")
        {
            var day = Math.Min(debt.DueDay > 0 ? debt.DueDay : 1, monthEnd.Day);
            return new List<DateTime> { new DateTime(year, month, day) };
        }

        var interval = freq == "Biweekly" ? 14 : 7;
        var anchor = debt.StartDate ?? new DateTime(year, month, Math.Min(debt.DueDay > 0 ? debt.DueDay : 1, monthEnd.Day));
        var monthStart = new DateTime(year, month, 1);
        var dates = new List<DateTime>();

        var current = anchor;
        while (current <= monthEnd)
        {
            if (current >= monthStart) dates.Add(current);
            current = current.AddDays(interval);
        }
        current = anchor.AddDays(-interval);
        while (current >= monthStart)
        {
            dates.Add(current);
            current = current.AddDays(-interval);
        }

        dates = dates.Distinct().OrderBy(d => d).ToList();
        if (dates.Count == 0)
            dates.Add(new DateTime(year, month, Math.Min(debt.DueDay > 0 ? debt.DueDay : 1, monthEnd.Day)));

        return dates;
    }

    private static bool IsDeferred(DebtSnapshotDto debt, DateTime today)
    {
        if (debt.DebtType != DebtType.PersonalLoan) return false;
        if (!debt.NextPaymentDate.HasValue || debt.Balance <= 0) return false;
        var daysAway = (debt.NextPaymentDate.Value.Date - today).TotalDays;
        var freq = debt.PaymentFrequency ?? "Monthly";
        var cycleDays = freq == "Weekly" ? 7 : freq == "Biweekly" ? 14 : 31;
        return daysAway > cycleDays + 7;
    }
}
