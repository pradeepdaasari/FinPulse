export type RecurrenceFrequency = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly';
export type RecurringType = 'Bill' | 'Budget';

export interface RecurringTransaction {
  id: number;
  description: string;
  merchant: string | null;
  amount: number;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  transactionType: string;
  fundingSourceType: string | null;
  fundingSourceId: number | null;
  recurringType: RecurringType;
  frequency: RecurrenceFrequency;
  nextRunDate: string;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  skipCount: number;
}

export interface SkipHistory {
  id: number;
  recurringTransactionId: number;
  skippedDate: string;
  reason: string | null;
  createdAt: string;
}

export interface RecurringTransactionCreate {
  description: string;
  merchant?: string;
  amount: number;
  categoryId: number;
  transactionType: number;
  fundingSourceType?: number;
  fundingSourceId?: number;
  recurringType: number;
  frequency: number;
  nextRunDate: string;
  endDate?: string;
  isActive: boolean;
}
