export type BankAccountType = 'Checking' | 'Savings' | 'Brokerage';

export interface BankAccount {
  id: number;
  accountName: string;
  accountType: BankAccountType;
  currentBalance: number;
  optionsCommissionPerContract?: number;
  futuresCommissionPerContract?: number;
  optionsRegFeePerContract?: number;
  futuresRegFeePerContract?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountCreate {
  accountName: string;
  accountType: BankAccountType;
  currentBalance: number;
  optionsCommissionPerContract?: number;
  futuresCommissionPerContract?: number;
  optionsRegFeePerContract?: number;
  futuresRegFeePerContract?: number;
}

export interface CommissionSchedule {
  id: number;
  bankAccountId: number;
  optionsCommissionPerContract?: number;
  futuresCommissionPerContract?: number;
  optionsRegFeePerContract?: number;
  futuresRegFeePerContract?: number;
  effectiveFrom: string;
  createdAt: string;
}

export interface CommissionScheduleCreate {
  optionsCommissionPerContract?: number;
  futuresCommissionPerContract?: number;
  optionsRegFeePerContract?: number;
  futuresRegFeePerContract?: number;
  effectiveFrom: string;
  recalculateTrades: boolean;
}

export interface CommissionScheduleResult {
  schedule: CommissionSchedule;
  tradesRecalculated: number;
}
