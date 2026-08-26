import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BudgetAllocation, BudgetExpense, BudgetExpenseCreate, BudgetPlan } from '../models/budget.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/budget`;

  getAllocation(): Observable<BudgetAllocation> {
    return this.http.get<BudgetAllocation>(`${this.baseUrl}/allocation`);
  }

  getPlan(year?: number, month?: number): Observable<BudgetPlan> {
    const params: Record<string, string> = {};
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
    return this.http.get<BudgetPlan>(`${this.baseUrl}/plan`, { params });
  }

  getExpenses(): Observable<BudgetExpense[]> {
    return this.http.get<BudgetExpense[]>(`${this.baseUrl}/expenses`);
  }

  createExpense(expense: BudgetExpenseCreate): Observable<BudgetExpense> {
    return this.http.post<BudgetExpense>(`${this.baseUrl}/expenses`, expense);
  }

  updateExpense(id: number, expense: BudgetExpenseCreate): Observable<BudgetExpense> {
    return this.http.put<BudgetExpense>(`${this.baseUrl}/expenses/${id}`, expense);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/expenses/${id}`);
  }
}
