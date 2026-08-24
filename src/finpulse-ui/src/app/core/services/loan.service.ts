import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PersonalLoan } from '../models/personal-loan.model';
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

  getById(id: string): Observable<PersonalLoan> {
    return this.http.get<PersonalLoan>(`${this.baseUrl}/${id}`);
  }

  create(loan: Partial<PersonalLoan>): Observable<PersonalLoan> {
    return this.http.post<PersonalLoan>(this.baseUrl, loan);
  }

  update(id: string, loan: Partial<PersonalLoan>): Observable<PersonalLoan> {
    return this.http.put<PersonalLoan>(`${this.baseUrl}/${id}`, loan);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getAmortization(id: string): Observable<AmortizationSchedule> {
    return this.http.get<AmortizationSchedule>(`${this.baseUrl}/${id}/amortization`);
  }

  recordPayment(id: string, payment: { amountPaid: number; paymentDate: string; notes?: string }): Observable<PaymentHistory> {
    return this.http.post<PaymentHistory>(`${this.baseUrl}/${id}/payments`, payment);
  }

  getPayments(id: string): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/${id}/payments`);
  }
}
