import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecurringTransaction, RecurringTransactionCreate, SkipHistory } from '../models/recurring.model';
import { DailyExpenseCreate } from '../models/daily-expense.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/recurring`;

  getAll(): Observable<RecurringTransaction[]> {
    return this.http.get<RecurringTransaction[]>(this.baseUrl);
  }

  create(item: RecurringTransactionCreate): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, item);
  }

  update(id: number, item: RecurringTransactionCreate): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, item);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  pay(id: number, transaction: DailyExpenseCreate): Observable<{ expenseId: number; nextRunDate: string }> {
    return this.http.post<{ expenseId: number; nextRunDate: string }>(`${this.baseUrl}/${id}/pay`, transaction);
  }

  advance(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/advance`, {});
  }

  skip(id: number, reason?: string): Observable<{ nextRunDate: string }> {
    return this.http.post<{ nextRunDate: string }>(`${this.baseUrl}/${id}/skip`, { reason: reason || null });
  }

  getSkips(id: number): Observable<SkipHistory[]> {
    return this.http.get<SkipHistory[]>(`${this.baseUrl}/${id}/skips`);
  }

  generate(): Observable<{ generated: number }> {
    return this.http.post<{ generated: number }>(`${this.baseUrl}/generate`, {});
  }
}
