export interface CreditCard {
  id: string;
  cardName: string;
  currentBalance: number;
  creditLimit: number;
  aprPercent: number;
  minimumPayment: number;
  dueDay: number;
  billingCycleDays: number;
  isAutopay: boolean;
  promoAprPercent?: number;
  promoEndDate?: string;
  lastStatementDate?: string;
  createdAt: string;
  updatedAt: string;
  postStatementCharges?: number;
  postStatementRefunds?: number;
  postStatementPayments?: number;
  remainingStatementBalance?: number;
  remainingMinimumPayment?: number;
  statementBalance?: number;
  statementDate?: string;
  utilization?: number;
  nextDueDate?: string;
}

export interface CardSummary {
  totalBalance: number;
  totalLimit: number;
  totalMinPayment: number;
  avgUtilization: number;
}

export interface CardActivitySummary {
  totalCharges: number;
  totalRefunds: number;
  totalPayments: number;
  utilization: number;
  nextDueDate: string | null;
}
