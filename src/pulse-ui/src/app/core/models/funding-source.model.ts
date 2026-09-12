import { FundingSourceType } from './daily-expense.model';

export interface FundingSource {
  type: FundingSourceType;
  id: number;
  name: string;
  currentBalance: number;
  accountType?: string;
  usageCount?: number;
}

export interface SourceUsage {
  type: string;
  id: number;
  count: number;
}

export interface FundingSourcesResponse {
  bankAccounts: Array<{ type: string; id: number; name: string; currentBalance: number; accountType: string }>;
  creditCards: Array<{ type: string; id: number; name: string; currentBalance: number }>;
}
