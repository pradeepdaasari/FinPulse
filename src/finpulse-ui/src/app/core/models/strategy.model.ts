export interface PayoffStrategy {
  name: string;
  totalInterest: number;
  monthsToPayoff: number;
  debtPayoffOrder: DebtPayoffOrder[];
}

export interface StrategyComparison {
  avalanche: PayoffStrategy;
  snowball: PayoffStrategy;
  interestSaved: number;
  timeDifference: number;
}

export interface DebtPayoffOrder {
  debtName: string;
  balance: number;
  aprPercent: number;
  payoffMonth: number;
  totalInterestPaid: number;
}
