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
