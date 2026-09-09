export interface PayoffStrategy {
  name: string;
  totalInterest: number;
  monthsToPayoff: number;
  debtPayoffOrder: DebtPayoffOrder[];
  monthlyPlan: MonthlyActionStep[];
  quickWins: QuickWin[];
  totalMonthlyPayment: number;
}

export interface StrategyComparison {
  avalanche: PayoffStrategy;
  snowball: PayoffStrategy;
  interestSaved: number;
  timeDifference: number;
  totalDebt: number;
  monthlyIncome: number;
  netPayPerCheck: number;
  recurringExpenses: number;
  payFrequency: string;
  paychecks: PaycheckInfo[];
}

export interface DebtPayoffOrder {
  debtName: string;
  balance: number;
  aprPercent: number;
  payoffMonth: number;
  totalInterestPaid: number;
  minimumPayment: number;
  dueDay: number;
}

export interface MonthlyActionStep {
  debtName: string;
  amount: number;
  isMinimum: boolean;
  explanation: string;
  dueDay: number;
  paycheckDate?: string;
}

export interface QuickWin {
  debtName: string;
  balance: number;
  monthsToPayoff: number;
}

export interface PaycheckInfo {
  date: string;
  amount: number;
}
