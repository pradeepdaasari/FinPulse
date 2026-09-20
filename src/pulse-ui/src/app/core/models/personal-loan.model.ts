export type LoanType = 'Personal' | 'Vehicle' | 'Mortgage' | 'Student' | 'Business' | 'Other';
export type RateType = 'Fixed' | 'Variable';

export interface PersonalLoan {
  id: number;
  lenderName: string;
  originalAmount: number;
  currentBalance: number;
  aprPercent: number;
  durationMonths: number;
  startDate: string;
  monthlyPayment: number;
  monthlyEquivalentPayment: number;
  dueDay: number;
  loanType: LoanType;
  rateType: RateType;
  isAutopay: boolean;
  paymentFrequency: 'Monthly' | 'Biweekly' | 'Weekly';
  fundedBankAccountId?: number | null;
  fundedBankAccountName?: string | null;
  nextPaymentDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAggregates {
  payments: import('../models/payment-history.model').PaymentHistory[];
  totalPaid: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
}
