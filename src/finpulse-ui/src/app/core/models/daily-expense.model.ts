export type TransactionType = 'Expense' | 'Income' | 'Transfer' | 'Refund';
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
