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
}

export interface SavingsGoalCreate {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  linkedAccountId?: number;
  icon?: string;
}
