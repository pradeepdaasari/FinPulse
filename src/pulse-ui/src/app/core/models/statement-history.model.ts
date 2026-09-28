export interface StatementHistory {
  id: number;
  creditCardId: number;
  statementDate: string;
  statementBalance: number;
  minimumPayment: number;
  creditLimit: number;
  createdAt: string;
}
