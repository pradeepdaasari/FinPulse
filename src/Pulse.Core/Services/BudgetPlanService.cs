using Pulse.Core.DTOs;
using Pulse.Core.Models;
using Pulse.Core.Models.Enums;

namespace Pulse.Core.Services;

public class BudgetPlanService : IBudgetPlanService
{
    public BudgetPlanDto GeneratePlan(UserProfile profile, List<BudgetExpense> expenses, List<DebtSnapshotDto> debts, int year, int month)
    {
        var payDates = GetPayDatesInMonth(profile.NextPayDate ?? new DateTime(year, month, 1), profile.PayFrequency, year, month);
        var payPerCheck = profile.NetPayPerCheck;

        var fixedExpenses = expenses.Where(e => e.IsFixed).ToList();
        var variableExpenses = expenses.Where(e => !e.IsFixed).ToList();

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
        var totalIncome = payPerCheck * payDates.Count;
        var totalExpenses = totalFixed + totalVariable + totalDebt;

        var byCategory = expenses
            .GroupBy(e => new { e.CategoryId, e.IsFixed })
            .Select(g => new CategorySummaryDto
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.First().Category?.Name ?? "Unknown",
                Amount = g.Sum(e => e.Amount),
                IsFixed = g.Key.IsFixed
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
                CategoryName = $"{debt.Name} (Debt)",
                Amount = debt.MinimumPayment,
                IsFixed = true
            });
        }

        return new BudgetPlanDto
        {
            MonthlyOverview = new MonthlyOverviewDto
            {
                TotalIncome = totalIncome,
                TotalFixedExpenses = totalFixed,
                TotalVariableBudgets = totalVariable,
                TotalDebtPayments = totalDebt,
                TotalExpenses = totalExpenses,
                Surplus = totalIncome - totalExpenses,
                PaychecksThisMonth = payDates.Count,
                ByCategory = byCategory
            },
            PaycheckBreakdowns = breakdowns
        };
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
