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
  totalSpent: number;
  totalRemaining: number;
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
  spent: number;
  remaining: number;
  percentUsed: number;
  isFixed: boolean;
  icon?: string;
  isDebt: boolean;
  isRecurring: boolean;
  debtId?: number;
  debtType?: string;
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
