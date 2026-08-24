export type LoanType = 'Personal' | 'Vehicle' | 'Mortgage' | 'Student' | 'Business' | 'Other';

export interface PersonalLoan {
  id: string;
  lenderName: string;
  originalAmount: number;
  currentBalance: number;
  aprPercent: number;
  durationMonths: number;
  startDate: string;
  monthlyPayment: number;
  dueDay: number;
  loanType: LoanType;
  isAutopay: boolean;
  paymentFrequency: 'Monthly' | 'Biweekly' | 'Weekly';
  createdAt: string;
  updatedAt: string;
}
