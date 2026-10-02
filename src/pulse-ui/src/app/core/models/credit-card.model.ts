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
}
