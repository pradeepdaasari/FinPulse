export interface BudgetAllocation {
  monthlyIncome: number;
  needs: number;
  wants: number;
  debtSavings: number;
  suggestedAllocations: SuggestedAllocation[];
}

export interface SuggestedAllocation {
  debtName: string;
  suggestedPayment: number;
  minimumPayment: number;
  extraPayment: number;
  reason: string;
}

export type PayFrequency = 'Monthly' | 'Biweekly' | 'Weekly';

export interface BudgetExpense {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  parentCategoryName?: string | null;
  amount: number;
  isFixed: boolean;
  dueDay: number | null;
  frequency: PayFrequency;
  isAutopay: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetExpenseCreate {
  name: string;
  categoryId: number;
  amount: number;
  isFixed: boolean;
  dueDay: number | null;
  frequency: PayFrequency;
  isAutopay: boolean;
}

export interface BudgetPlan {
  monthlyOverview: MonthlyOverview;
  paycheckBreakdowns: PaycheckBreakdown[];
}

export interface MonthlyOverview {
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableBudgets: number;
  totalDebtPayments: number;
  totalRecurring: number;
  totalExpenses: number;
  surplus: number;
  paychecksThisMonth: number;
  byCategory: CategorySummary[];
}

export interface PaycheckBreakdown {
  payDate: string;
  grossPay: number;
  expenses: PaycheckExpense[];
  totalExpenses: number;
  leftover: number;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  amount: number;
  isFixed: boolean;
  icon?: string;
  isDebt: boolean;
  isRecurring: boolean;
}

export interface PaycheckExpense {
  expenseId: number;
  name: string;
  categoryId: number;
  categoryName: string;
  amount: number;
  dueDay: number | null;
  isAutopay: boolean;
  isDebtPayment: boolean;
}
