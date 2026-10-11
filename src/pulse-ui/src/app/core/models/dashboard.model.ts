export interface DashboardSummary {
  totalDebt: number;
  totalMonthlyPayment: number;
  estimatedDebtFreeDate: string;
  numberOfDebts: number;
  totalInterestPaid: number;
  upcomingPayments: UpcomingPayment[];
}

export interface UpcomingPayment {
  debtId: number;
  debtName: string;
  debtType: 'PersonalLoan' | 'CreditCard';
  amount: number;
  dueDate: string;
  urgencyLevel: 'Critical' | 'Warning' | 'Normal';
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

export interface FinancialSummaryDebt {
  id: number;
  name: string;
  balance: number;
}

export interface NetWorthSnapshot {
  date: string;
  totalBankBalance: number;
  totalCreditCardDebt: number;
  totalLoanDebt: number;
  netWorth: number;
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
  creditCards: FinancialSummaryDebt[];
  loans: FinancialSummaryDebt[];
  totalBankBalance: number;
  totalCreditCardDebt: number;
  totalLoanDebt: number;
  netWorth: number;
  debtPaidPercent: number;
  paceStatus: 'ahead' | 'on-track' | 'over';
  paceMessage: string;
}

export interface TodayGlance {
  paymentsDueToday: { debtName: string; amount: number; debtType: string }[];
  paymentsTotalDue: number;
  todaySpending: number;
  recurringDue: { name: string; amount: number; nextRunDate: string }[];
  recurringDueCount: number;
  recurringDueTotal: number;
  upcomingPayments: UpcomingGlancePayment[];
  upcomingTotal: number;
}

export interface UpcomingGlancePayment {
  name: string;
  monthlyPayment: number;
  dueDate: string;
  daysUntilDue: number;
  kind: string;
  isAutopay: boolean;
}

export interface MonthlyPaymentRow {
  id: number;
  name: string;
  kind: 'loan' | 'card' | 'recurring';
  icon: string;
  iconColor: string;
  dueDay: number;
  dueDate: string;
  dueLabel: string;
  amount: number;
  minimumPayment: number | null;
  paidAmount: number;
  balance: number | null;
  apr: number | null;
  isAutopay: boolean;
  status: 'paid' | 'overdue' | 'due-today' | 'due-soon' | 'upcoming';
  statusLabel: string;
  debtType?: 'PersonalLoan' | 'CreditCard';
  subType?: string;
  daysUntilDue: number;
  minimumPaid: boolean;
  recurringId?: number;
}

export interface MonthlyPaymentsData {
  rows: MonthlyPaymentRow[];
  totalDue: number;
  totalMinimum: number;
  totalPaid: number;
  totalPending: number;
  paidCount: number;
  overdueCount: number;
  paidPercent: number;
  nextPaycheckDate: string | null;
  daysUntilPaycheck: number | null;
  todaySpending: number;
  dueTodayTotal: number;
}

export interface DashboardInsight {
  icon: string;
  text: string;
  color: 'green' | 'amber' | 'red';
}
