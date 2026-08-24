export interface WhatIfRequest {
  extraPayments: ExtraPaymentEntry[];
}

export interface ExtraPaymentEntry {
  debtId: string;
  debtName: string;
  extraAmount: number;
}

export interface WhatIfResult {
  projections: DebtProjection[];
  totalMonthsSaved: number;
  totalInterestSaved: number;
  newDebtFreeDate: string;
}

export interface DebtProjection {
  debtId: string;
  debtName: string;
  originalMonths: number;
  newMonths: number;
  monthsSaved: number;
  interestSaved: number;
  newPayoffDate: string;
}
