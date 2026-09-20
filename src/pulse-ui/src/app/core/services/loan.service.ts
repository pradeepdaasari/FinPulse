import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PersonalLoan, PaymentAggregates } from '../models/personal-loan.model';
import { AmortizationSchedule } from '../models/dashboard.model';
import { PaymentHistory } from '../models/payment-history.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/loans`;

  getAll(): Observable<PersonalLoan[]> {
    return this.http.get<PersonalLoan[]>(this.baseUrl);
  }

  getById(id: number | string): Observable<PersonalLoan> {
    return this.http.get<PersonalLoan>(`${this.baseUrl}/${id}`);
  }

  create(loan: Partial<PersonalLoan>): Observable<{ loan: PersonalLoan; warning?: string }> {
    return this.http.post<{ loan: PersonalLoan; warning?: string }>(this.baseUrl, loan);
  }

  update(id: number | string, loan: Partial<PersonalLoan>): Observable<{ loan: PersonalLoan; warning?: string }> {
    return this.http.put<{ loan: PersonalLoan; warning?: string }>(`${this.baseUrl}/${id}`, loan);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAmortization(id: number | string): Observable<AmortizationSchedule> {
    return this.http.get<AmortizationSchedule>(`${this.baseUrl}/${id}/amortization`);
  }

  recordPayment(id: number | string, payment: { amountPaid: number; paymentDate: string; notes?: string; fromAccountId?: number; principalAmount?: number; interestAmount?: number }): Observable<PaymentHistory> {
    return this.http.post<PaymentHistory>(`${this.baseUrl}/${id}/payments`, payment);
  }

  getPayments(id: number | string): Observable<PaymentAggregates> {
    return this.http.get<PaymentAggregates>(`${this.baseUrl}/${id}/payments`);
  }

  backfillPaymentSplits(): Observable<{ updated: number }> {
    return this.http.post<{ updated: number }>(`${this.baseUrl}/backfill-payment-splits`, {});
  }
}
