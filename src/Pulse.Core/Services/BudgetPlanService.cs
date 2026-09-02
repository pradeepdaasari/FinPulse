using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public class BudgetPlanService : IBudgetPlanService
{
    public BudgetPlanDto GeneratePlan(UserProfile profile, List<BudgetExpense> expenses, List<DebtSnapshotDto> debts, List<RecurringTransaction> recurring, int year, int month)
    {
        var payDates = GetPayDatesInMonth(profile.NextPayDate ?? new DateTime(year, month, 1), profile.PayFrequency, year, month);
        var payPerCheck = profile.NetPayPerCheck;

        var fixedExpenses = expenses.Where(e => e.IsFixed).ToList();
        var variableExpenses = expenses.Where(e => !e.IsFixed).ToList();

        // All active recurring transactions are part of the budget regardless of next run date
        var recurringInMonth = recurring
            .Where(r => r.IsActive)
            .ToList();

        var breakdowns = payDates.Select(d => new PaycheckBreakdownDto
        {
            PayDate = d,
            GrossPay = payPerCheck,
            Expenses = new List<PaycheckExpenseDto>()
        }).ToList();

        // Assign fixed expenses to the last paycheck before their due day
        foreach (var expense in fixedExpenses)
        {
            var dueDay = expense.DueDay ?? 1;
            var dueDate = new DateTime(year, month, Math.Min(dueDay, DateTime.DaysInMonth(year, month)));

            var assigned = breakdowns
                .Where(b => b.PayDate <= dueDate)
                .OrderByDescending(b => b.PayDate)
                .FirstOrDefault() ?? breakdowns.First();

            assigned.Expenses.Add(new PaycheckExpenseDto
            {
                ExpenseId = expense.Id,
                Name = expense.Name,
                CategoryId = expense.CategoryId,
                CategoryName = expense.Category?.Name ?? "Unknown",
                Amount = expense.Amount,
                DueDay = expense.DueDay,
                IsAutopay = expense.IsAutopay
            });
        }

        // Assign debt minimum payments to last paycheck before their due day
        foreach (var debt in debts)
        {
            var dueDay = debt.DueDay > 0 ? debt.DueDay : 1;
            var dueDate = new DateTime(year, month, Math.Min(dueDay, DateTime.DaysInMonth(year, month)));

            var assigned = breakdowns
                .Where(b => b.PayDate <= dueDate)
                .OrderByDescending(b => b.PayDate)
                .FirstOrDefault() ?? breakdowns.First();

            assigned.Expenses.Add(new PaycheckExpenseDto
            {
                ExpenseId = debt.Id,
                Name = debt.Name,
                CategoryId = 0,
                CategoryName = "Debt Payment",
                Amount = debt.MinimumPayment,
                DueDay = dueDay,
                IsAutopay = false,
                IsDebtPayment = true
            });
        }

        // Assign recurring transactions to paychecks
        foreach (var rec in recurringInMonth)
        {
            var dueDay = rec.NextRunDate.Day;
            var dueDate = new DateTime(year, month, Math.Min(dueDay, DateTime.DaysInMonth(year, month)));

            var assigned = breakdowns
                .Where(b => b.PayDate <= dueDate)
                .OrderByDescending(b => b.PayDate)
                .FirstOrDefault() ?? breakdowns.First();

            assigned.Expenses.Add(new PaycheckExpenseDto
            {
                ExpenseId = rec.Id,
                Name = rec.Description + " (Recurring)",
                CategoryId = rec.CategoryId,
                CategoryName = rec.Category?.Name ?? "Unknown",
                Amount = rec.Amount,
                DueDay = dueDay,
                IsAutopay = true
            });
        }

        // Split variable budgets evenly across paychecks
        foreach (var expense in variableExpenses)
        {
            var perCheck = Math.Round(expense.Amount / payDates.Count, 2);
            foreach (var breakdown in breakdowns)
            {
                breakdown.Expenses.Add(new PaycheckExpenseDto
                {
                    ExpenseId = expense.Id,
                    Name = expense.Name,
                    CategoryId = expense.CategoryId,
                    CategoryName = expense.Category?.Name ?? "Unknown",
                    Amount = perCheck,
                    DueDay = null,
                    IsAutopay = false
                });
            }
        }

        // Calculate totals per paycheck
        foreach (var breakdown in breakdowns)
        {
            breakdown.TotalExpenses = breakdown.Expenses.Sum(e => e.Amount);
            breakdown.Leftover = breakdown.GrossPay - breakdown.TotalExpenses;
        }

        // Monthly overview
        var totalFixed = fixedExpenses.Sum(e => e.Amount);
        var totalVariable = variableExpenses.Sum(e => e.Amount);
        var totalDebt = debts.Sum(d => d.MinimumPayment);
        var totalRecurring = recurringInMonth.Sum(r => r.Amount);
        var totalIncome = payPerCheck * payDates.Count;
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

        // Add each debt payment to the category breakdown
        foreach (var debt in debts)
        {
            byCategory.Add(new CategorySummaryDto
            {
                CategoryId = 0,
                CategoryName = debt.Name,
                Amount = debt.MinimumPayment,
                IsFixed = true,
                Icon = "credit_score",
                IsDebt = true
            });
        }

        // Add recurring to category breakdown, grouped by category
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
                PaychecksThisMonth = payDates.Count,
                ByCategory = byCategory
            },
            PaycheckBreakdowns = breakdowns
        };
    }

    private static bool WillRunInMonth(RecurringTransaction r, int year, int month)
    {
        var monthStart = new DateTime(year, month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        if (r.EndDate.HasValue && r.EndDate.Value < monthStart)
            return false;

        // For monthly: check if its run date day falls in this month
        if (r.Frequency == RecurrenceFrequency.Monthly)
            return r.NextRunDate <= monthEnd;

        // For daily/weekly/biweekly: check if any occurrence falls in this month
        var current = r.NextRunDate;
        // Walk backward to find the first occurrence on or before monthEnd
        while (current > monthEnd)
        {
            current = r.Frequency switch
            {
                RecurrenceFrequency.Daily => current.AddDays(-1),
                RecurrenceFrequency.Weekly => current.AddDays(-7),
                RecurrenceFrequency.Biweekly => current.AddDays(-14),
                _ => current.AddMonths(-1)
            };
        }
        // Walk forward to see if any lands in the month
        while (current <= monthEnd)
        {
            if (current >= monthStart)
                return true;
            current = r.Frequency switch
            {
                RecurrenceFrequency.Daily => current.AddDays(1),
                RecurrenceFrequency.Weekly => current.AddDays(7),
                RecurrenceFrequency.Biweekly => current.AddDays(14),
                _ => current.AddMonths(1)
            };
        }
        return false;
    }

    private List<DateTime> GetPayDatesInMonth(DateTime anchor, PaymentFrequency freq, int year, int month)
    {
        if (freq == PaymentFrequency.Monthly)
        {
            var day = Math.Min(anchor.Day, DateTime.DaysInMonth(year, month));
            return new List<DateTime> { new DateTime(year, month, day) };
        }

        var interval = freq == PaymentFrequency.Biweekly ? 14 : 7;
        var monthStart = new DateTime(year, month, 1);
        var monthEnd = new DateTime(year, month, DateTime.DaysInMonth(year, month));
        var results = new List<DateTime>();

        // Walk forward from anchor
        var current = anchor.Date;
        while (current <= monthEnd)
        {
            if (current >= monthStart)
                results.Add(current);
            current = current.AddDays(interval);
        }

        // Walk backward from anchor
        current = anchor.Date.AddDays(-interval);
        while (current >= monthStart)
        {
            results.Add(current);
            current = current.AddDays(-interval);
        }

        return results.Distinct().OrderBy(d => d).ToList();
    }
}
