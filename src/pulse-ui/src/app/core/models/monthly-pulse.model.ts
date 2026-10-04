export interface MonthLabel {
  year: number;
  month: number;
  label: string;
}

export interface LaneMonth {
  total: number;
}

export interface LoanPaymentMonth extends LaneMonth {
  principal: number;
  interest: number;
}

export interface TradingMonth {
  netPnl: number;
  trades: number;
  wins: number;
  winRate: number;
}

export interface NetWorthMonth {
  value: number | null;
  delta: number;
}

export interface DetailRow {
  name: string;
  icon?: string | null;
  balance?: number;
  monthly: number[];
  total: number;
  trades?: number;
}

export interface ExpenseLane {
  monthly: LaneMonth[];
  grandTotal: number;
  avgMonthly: number;
  trend: number;
  details: DetailRow[];
}

export interface PaymentLane {
  monthly: LoanPaymentMonth[] | LaneMonth[];
  grandTotal: number;
  remainingBalance: number;
  avgMonthly: number;
  trend: number;
  details: DetailRow[];
}

export interface TradingLane {
  monthly: TradingMonth[];
  totalNetPnl: number;
  totalTrades: number;
  overallWinRate: number;
  trend: number;
  details: DetailRow[];
}

export interface NetWorthLane {
  monthly: NetWorthMonth[];
  currentNetWorth: number;
  totalChange: number;
  trend: number;
  details: DetailRow[];
}

export interface MonthlyPulseData {
  months: MonthLabel[];
  expenses: ExpenseLane;
  loanPayments: PaymentLane;
  cardPayments: PaymentLane;
  trading: TradingLane;
  netWorth: NetWorthLane;
}
