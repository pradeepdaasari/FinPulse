import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentHistory, PaymentListResponse } from '../models/payment-history.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payments`;

  getAll(type?: string, debtId?: number): Observable<PaymentListResponse> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (debtId) params = params.set('debtId', debtId.toString());
    return this.http.get<PaymentListResponse>(this.baseUrl, { params });
  }

  update(id: number, payment: { amountPaid: number; paymentDate: string; notes?: string }): Observable<PaymentHistory> {
    return this.http.put<PaymentHistory>(`${this.baseUrl}/${id}`, payment);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
