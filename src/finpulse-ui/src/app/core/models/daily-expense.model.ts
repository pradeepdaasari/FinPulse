export type TransactionType = 'Expense' | 'Income' | 'Transfer' | 'Refund' | 'CardPayment';
export type FundingSourceType = 'BankAccount' | 'CreditCard';

export interface DailyExpense {
  id: number;
  date: string;
  categoryId: number;
  categoryName: string;
  categoryIcon?: string | null;
  parentCategoryName?: string | null;
  amount: number;
  description: string;
  merchant: string | null;
  transactionType: TransactionType | null;
  fundingSourceType: FundingSourceType | null;
  fundingSourceId: number | null;
  fundingSourceName: string | null;
  toFundingSourceId: number | null;
  toFundingSourceName: string | null;
  splitGroupId: string | null;
  tag: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyExpenseCreate {
  date: string;
  categoryId: number;
  amount: number;
  description: string;
  merchant: string | null;
  transactionType: TransactionType;
  fundingSourceType: FundingSourceType | null;
  fundingSourceId: number | null;
  toFundingSourceId: number | null;
  tag?: string | null;
}

export interface SpendingSummary {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string | null;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface ExpenseFilter {
  year?: number;
  month?: number;
  search?: string;
  categoryId?: number;
  transactionType?: number;
  fundingSourceId?: number;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  tag?: string;
}

export interface CategoryComparison {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string | null;
  currentMonthAmount: number;
  previousMonthAmount: number;
  difference: number;
  percentChange: number;
}

export interface MonthComparison {
  currentYear: number;
  currentMonth: number;
  previousYear: number;
  previousMonth: number;
  currentTotal: number;
  previousTotal: number;
  categories: CategoryComparison[];
}
