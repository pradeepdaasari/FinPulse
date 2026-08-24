export interface DashboardSummary {
  totalDebt: number;
  totalMonthlyPayment: number;
  estimatedDebtFreeDate: string;
  numberOfDebts: number;
  debtBreakdown: DebtBreakdownItem[];
  upcomingPayments: UpcomingPayment[];
}

export interface DebtBreakdownItem {
  name: string;
  balance: number;
  type: 'Loan' | 'CreditCard';
}

export interface UpcomingPayment {
  debtName: string;
  amount: number;
  dueDate: string;
  urgencyLevel: 'Low' | 'Medium' | 'High';
}

export interface AmortizationEntry {
  periodNumber: number;
  paymentDate: string;
  paymentAmount: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalance: number;
  isPaid: boolean;
}

export interface AmortizationSchedule {
  entries: AmortizationEntry[];
  paidPrincipal: number;
  paidInterest: number;
  pendingPrincipal: number;
  pendingInterest: number;
  totalInterest: number;
  originalAmount: number;
  totalCost: number;
}

export interface PayoffEntry {
  month: number;
  date: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface MonthlySnapshotPoint {
  year: number;
  month: number;
  label: string;
  totalDebt: number;
  totalPaid: number;
}

export interface TrendData {
  snapshots: MonthlySnapshotPoint[];
  monthOverMonthChange: number;
  monthOverMonthChangePercent: number;
}

export interface PaymentStreak {
  currentStreak: number;
  longestStreak: number;
  currentMonthAllPaid: boolean;
}

export interface DebtPayoffProjection {
  debtName: string;
  debtType: string;
  currentBalance: number;
  monthlyPayment: number;
  projectedPayoffDate: string;
  remainingMonths: number;
  progressPercent: number;
}

export interface DebtFreeCountdown {
  overallDebtFreeDate: string;
  overallRemainingMonths: number;
  projections: DebtPayoffProjection[];
}

export interface FinancialSummaryAccount {
  id: number;
  name: string;
  type: string;
  balance: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  tradingGains: number;
  tradingLosses: number;
  tradingNetPnL: number;
  bankAccounts: FinancialSummaryAccount[];
  totalBankBalance: number;
  totalCreditCardDebt: number;
  totalLoanDebt: number;
  netWorth: number;
}
