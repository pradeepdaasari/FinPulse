import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreditCard } from '../models/credit-card.model';
import { PaymentHistory } from '../models/payment-history.model';
import { StatementHistory } from '../models/statement-history.model';
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

  update(id: string, card: Partial<CreditCard>, skipSnapshot = false): Observable<CreditCard> {
    const url = skipSnapshot ? `${this.baseUrl}/${id}?skipSnapshot=true` : `${this.baseUrl}/${id}`;
    return this.http.put<CreditCard>(url, card);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  recordPayment(id: string, payment: { amountPaid: number; paymentDate: string; notes?: string }): Observable<PaymentHistory> {
    return this.http.post<PaymentHistory>(`${this.baseUrl}/${id}/payments`, payment);
  }

  getPayments(id: string): Observable<PaymentHistory[]> {
    return this.http.get<PaymentHistory[]>(`${this.baseUrl}/${id}/payments`);
  }

  getStatements(id: string): Observable<StatementHistory[]> {
    return this.http.get<StatementHistory[]>(`${this.baseUrl}/${id}/statements`);
  }

  addStatement(id: string, statement: Partial<StatementHistory>): Observable<StatementHistory> {
    return this.http.post<StatementHistory>(`${this.baseUrl}/${id}/statements`, statement);
  }

  updateStatement(cardId: string, stmtId: number, statement: Partial<StatementHistory>): Observable<StatementHistory> {
    return this.http.put<StatementHistory>(`${this.baseUrl}/${cardId}/statements/${stmtId}`, statement);
  }

  deleteStatement(cardId: string, stmtId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${cardId}/statements/${stmtId}`);
  }
}
