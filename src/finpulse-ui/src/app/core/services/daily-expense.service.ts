import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DailyExpense, DailyExpenseCreate, ExpenseFilter, MonthComparison, SpendingSummary, TagSummary } from '../models/daily-expense.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DailyExpenseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/expenses`;

  getExpenses(filter: ExpenseFilter = {}): Observable<DailyExpense[]> {
    const params: Record<string, string> = {};
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '')
        params[key] = value.toString();
    });
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

  createSplit(items: DailyExpenseCreate[]): Observable<{ splitGroupId: string; count: number }> {
    return this.http.post<{ splitGroupId: string; count: number }>(`${this.baseUrl}/split`, items);
  }

  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/tags`);
  }

  getTagSummary(): Observable<TagSummary[]> {
    return this.http.get<TagSummary[]>(`${this.baseUrl}/tag-summary`);
  }

  getComparison(year?: number, month?: number): Observable<MonthComparison> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
    return this.http.get<MonthComparison>(`${this.baseUrl}/comparison`, { params });
  }

  exportCsv(year: number, month: number): void {
    this.http.get(`${this.baseUrl}/export`, {
      params: { year: year.toString(), month: month.toString() },
      responseType: 'blob'
    }).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${year}_${month.toString().padStart(2, '0')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
