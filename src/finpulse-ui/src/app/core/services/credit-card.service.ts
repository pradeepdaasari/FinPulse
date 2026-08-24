import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreditCard } from '../models/credit-card.model';
import { PayoffEntry } from '../models/dashboard.model';
import { PaymentHistory } from '../models/payment-history.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CreditCardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/creditcards`;

  getAll(): Observable<CreditCard[]> {
    return this.http.get<CreditCard[]>(this.baseUrl);
  }

  getById(id: string): Observable<CreditCard> {
    return this.http.get<CreditCard>(`${this.baseUrl}/${id}`);
  }

  create(card: Partial<CreditCard>): Observable<CreditCard> {
    return this.http.post<CreditCard>(this.baseUrl, card);
  }

  update(id: string, card: Partial<CreditCard>): Observable<CreditCard> {
    return this.http.put<CreditCard>(`${this.baseUrl}/${id}`, card);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPayoffTimeline(id: string): Observable<PayoffEntry[]> {
    return this.http.get<PayoffEntry[]>(`${this.baseUrl}/${id}/payoff-timeline`);
  }

  recordPayment(id: string, payment: { amountPaid: number; paymentDate: string; notes?: string }): Observable<PaymentHistory> {
    return this.http.post<PaymentHistory>(`${this.baseUrl}/${id}/payments`, payment);
  }

  getPayments(id: string): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/${id}/payments`);
  }
}
