export type BankAccountType = 'Checking' | 'Savings' | 'Brokerage';

export interface BankAccount {
  id: number;
  accountName: string;
  accountType: BankAccountType;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountCreate {
  accountName: string;
  accountType: BankAccountType;
  currentBalance: number;
}
