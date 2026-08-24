namespace FinPulse.Core.DTOs;

public class BudgetPlanDto
{
    public MonthlyOverviewDto MonthlyOverview { get; set; } = new();
    public List<PaycheckBreakdownDto> PaycheckBreakdowns { get; set; } = new();
}

public class MonthlyOverviewDto
{
    public decimal TotalIncome { get; set; }
    public decimal TotalFixedExpenses { get; set; }
    public decimal TotalVariableBudgets { get; set; }
    public decimal TotalDebtPayments { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal Surplus { get; set; }
    public int PaychecksThisMonth { get; set; }
    public List<CategorySummaryDto> ByCategory { get; set; } = new();
}

public class CategorySummaryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsFixed { get; set; }
}

public class PaycheckBreakdownDto
{
    public DateTime PayDate { get; set; }
    public decimal GrossPay { get; set; }
    public List<PaycheckExpenseDto> Expenses { get; set; } = new();
    public decimal TotalExpenses { get; set; }
    public decimal Leftover { get; set; }
}

public class PaycheckExpenseDto
{
    public int ExpenseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int? DueDay { get; set; }
    public bool IsAutopay { get; set; }
    public bool IsDebtPayment { get; set; }
}
