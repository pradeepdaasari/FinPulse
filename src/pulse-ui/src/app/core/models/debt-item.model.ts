export interface DebtItem {
  key: string;
  id: number;
  type: 'PersonalLoan' | 'CreditCard';
  name: string;
  currentBalance: number;
  monthlyPayment: number;
  aprPercent: number;
  dueDay: number;
  isAutopay: boolean;
  subType?: string;
  promoAprPercent?: number;
  promoEndDate?: string;
}
