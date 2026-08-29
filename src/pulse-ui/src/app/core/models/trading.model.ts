export interface TradingSetup {
  id: number;
  name: string;
  description?: string;
  checklistItems: ChecklistItem[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChecklistItem {
  id?: number;
  setupId?: number;
  label: string;
  orderIndex: number;
}

export interface TradingSetupSummary {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  itemCount: number;
  tradeCount: number;
  winRate?: number;
}

export interface PreMarketNote {
  id: number;
  date: string;
  marketBias: MarketBias;
  keyLevels?: string;
  catalysts?: string;
  plan: string;
  mentalState: MentalState;
  mentalStateNotes?: string;
  maxTrades: number;
  maxLoss: number;
  createdAt?: string;
  updatedAt?: string;
}

export type MarketBias = 'bullish' | 'bearish' | 'neutral' | 'no-trade';
export type MentalState = 'green' | 'yellow' | 'red';

export interface TradeEntry {
  id: number;
  date: string;
  setupId: number;
  setupName?: string;
  instrument: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  checklistCompleted: boolean;
  checklistResponses: ChecklistResponse[];
  entryTime?: string;
  exitTime?: string;
  notes?: string;
  tags?: string[];
  isRevengeTrading: boolean;
  emotionAtEntry?: string;
  createdAt?: string;
  assetType?: string;
  optionType?: string;
  spreadType?: string;
  strikePrice?: number;
  strikePrice2?: number;
  strikePrice3?: number;
  strikePrice4?: number;
  expirationDate?: string;
  entryPremium?: number;
  exitPremium?: number;
  expiredWorthless?: boolean;
  bankAccountId?: number;
  totalFees?: number;
  netPnl?: number;
}

export type SpreadType = 'Single' | 'Vertical' | 'IronCondor' | 'Butterfly' | 'Calendar';
export type OptionTypeValue = 'Call' | 'Put';

export type TradeDirection = 'long' | 'short';

export interface ChecklistResponse {
  checklistItemId: number;
  label: string;
  checked: boolean;
}

export interface TradingRule {
  id: number;
  text: string;
  category: RuleCategory;
  isActive: boolean;
  orderIndex: number;
  createdAt?: string;
}

export type RuleCategory = 'entry' | 'exit' | 'risk' | 'mindset' | 'general';

export interface DailyReview {
  id: number;
  date: string;
  grade: TradeGrade | null;
  followedPlan: boolean;
  followedRules: boolean;
  totalTrades: number;
  totalPnl: number;
  rulesViolated: number[];
  lessonsLearned?: string;
  improvementNote?: string;
  emotionalSummary?: string;
  isObservationOnly: boolean;
  marketCondition?: string;
  marketObservation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TradeGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface DailyLimits {
  id: number;
  maxTradesPerDay: number;
  maxDailyLoss: number;
  stopAfterConsecutiveLosses: number;
  updatedAt?: string;
}

export interface TradingStats {
  totalTrades: number;
  winRate: number;
  averagePnl: number;
  totalPnl: number;
  currentRuleStreak: number;
  longestRuleStreak: number;
  averageGrade: number;
  tradesToday: number;
  pnlToday: number;
  checklistComplianceRate: number;
  setupBreakdown: SetupPerformance[];
}

export interface SetupPerformance {
  setupId: number;
  setupName: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
}

export interface TradingWisdom {
  id: number;
  text: string;
  category: WisdomCategory;
  author?: string;
}

export type WisdomCategory = 'discipline' | 'risk' | 'psychology' | 'patience' | 'process';

export interface WeeklyFocus {
  weekStart: string;
  ruleId: number;
  ruleText: string;
  complianceDays: number;
}

export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  largestWin: number;
  largestLoss: number;
  checklistCompliance: number;
  averageGrade: number;
  tradingDays: number;
  ruleStreak: number;
  setupPerformance: SetupWeeklyPerformance[];
  timeAnalysis: TimeSlotPerformance[];
  dayOfWeekAnalysis: DayOfWeekPerformance[];
  improvements: string[];
  strengths: string[];
  dangerZones: string[];
  mentorFeedback: string;
}

export interface SetupWeeklyPerformance {
  setupId: number;
  setupName: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  grade: 'strong' | 'neutral' | 'weak';
}

export interface TimeSlotPerformance {
  slot: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  grade: 'safe' | 'neutral' | 'dangerous';
}

export interface DayOfWeekPerformance {
  day: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  grade: 'strong' | 'neutral' | 'weak';
}
