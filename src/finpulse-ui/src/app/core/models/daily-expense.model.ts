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
  createdAt: string;
  updatedAt: string;
}

export interface DailyExpenseCreate {
  date: string;
  categoryId: number;
  amount: number;
  description: string;
  merchant: string | null;
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
