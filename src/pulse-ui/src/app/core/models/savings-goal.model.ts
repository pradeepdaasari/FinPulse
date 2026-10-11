export interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  linkedAccountId: number | null;
  linkedAccountName: string | null;
  icon: string | null;
  createdAt: string;
  progress: number;
}

export interface SavingsGoalCreate {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  linkedAccountId?: number;
  icon?: string;
}

export interface GoalsSummary {
  totalSaved: number;
  totalTarget: number;
  avgProgress: number;
  completedGoals: number;
  totalGoals: number;
}
