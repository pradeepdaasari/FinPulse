export interface CreditCard {
  id: string;
  cardName: string;
  currentBalance: number;
  aprPercent: number;
  minimumPayment: number;
  dueDay: number;
  billingCycleDays: number;
  isAutopay: boolean;
  promoAprPercent?: number;
  promoEndDate?: string;
  createdAt: string;
  updatedAt: string;
}
