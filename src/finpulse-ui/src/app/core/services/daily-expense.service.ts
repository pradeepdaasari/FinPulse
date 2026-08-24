import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DailyExpense, DailyExpenseCreate, SpendingSummary } from '../models/daily-expense.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DailyExpenseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/expenses`;

  getExpenses(year?: number, month?: number): Observable<DailyExpense[]> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
    return this.http.get<DailyExpense[]>(this.baseUrl, { params });
  }

  getSummary(year?: number, month?: number): Observable<SpendingSummary[]> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
    return this.http.get<SpendingSummary[]>(`${this.baseUrl}/summary`, { params });
  }

  create(expense: DailyExpenseCreate): Observable<DailyExpense> {
    return this.http.post<DailyExpense>(this.baseUrl, expense);
  }

  update(id: number, expense: DailyExpenseCreate): Observable<DailyExpense> {
    return this.http.put<DailyExpense>(`${this.baseUrl}/${id}`, expense);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
