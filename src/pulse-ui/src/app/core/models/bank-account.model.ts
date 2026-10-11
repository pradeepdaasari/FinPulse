export type BankAccountType = 'Checking' | 'Savings' | 'Brokerage' | 'Cash';

export interface BankAccount {
  id: number;
  accountName: string;
  accountType: BankAccountType;
  currentBalance: number;
  isExcluded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountCreate {
  accountName: string;
  accountType: BankAccountType;
  currentBalance: number;
  isExcluded?: boolean;
}

export interface BankAccountSummary {
  totalBalance: number;
  excludedBalance: number;
  checkingCount: number;
  savingsCount: number;
  brokerageCount: number;
  cashCount: number;
  excludedCount: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  totalTransfer: number;
}
