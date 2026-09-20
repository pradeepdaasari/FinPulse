export interface WhatIfRequest {
  loanExtraPayments: Record<number, number>;
  cardExtraPayments: Record<number, number>;
}

export interface ExtraPaymentEntry {
  debtId: string;
  debtName: string;
  debtType: string;
  extraAmount: number;
}

export interface WhatIfResult {
  projections: DebtProjection[];
  totalInterestSaved: number;
  originalDebtFreeDate: string;
  newDebtFreeDate: string;
}

export interface DebtProjection {
  debtId: number;
  debtName: string;
  debtType: string;
  originalPayoffMonths: number;
  newPayoffMonths: number;
  originalTotalInterest: number;
  newTotalInterest: number;
  interestSaved: number;
}
