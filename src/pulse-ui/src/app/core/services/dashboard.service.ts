import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary, TrendData, PaymentStreak, DebtFreeCountdown, FinancialSummary } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/dashboard`;

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/summary`);
  }

  getTrends(months = 12): Observable<TrendData> {
    return this.http.get<TrendData>(`${this.baseUrl}/trends?months=${months}`);
  }

  getStreak(): Observable<PaymentStreak> {
    return this.http.get<PaymentStreak>(`${this.baseUrl}/streak`);
  }

  getCountdown(): Observable<DebtFreeCountdown> {
    return this.http.get<DebtFreeCountdown>(`${this.baseUrl}/countdown`);
  }

  getFinancialSummary(year?: number, month?: number): Observable<FinancialSummary> {
    const params: string[] = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${month}`);
    const query = params.length ? `?${params.join('&')}` : '';
    return this.http.get<FinancialSummary>(`${this.baseUrl}/financial-summary${query}`);
  }
}
