export interface BudgetAllocation {
  monthlyIncome: number;
  needs: number;
  wants: number;
  debtSavings: number;
  suggestedAllocations: SuggestedAllocation[];
}

export interface SuggestedAllocation {
  debtName: string;
  suggestedPayment: number;
  minimumPayment: number;
  extraPayment: number;
  reason: string;
}
