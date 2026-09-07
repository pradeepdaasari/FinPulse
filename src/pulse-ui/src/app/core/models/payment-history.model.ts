export interface PaymentHistory {
  id: number;
  debtType: 'PersonalLoan' | 'CreditCard';
  debtId: number;
  amountPaid: number;
  paymentDate: string;
  notes?: string;
  fromAccountId?: number;
}

export interface PaymentSummary {
  totalPaid: number;
  loanTotal: number;
  cardTotal: number;
  count: number;
}

export interface PaymentListResponse {
  payments: PaymentHistory[];
  summary: PaymentSummary;
}
