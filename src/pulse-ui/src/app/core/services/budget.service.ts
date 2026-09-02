import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BudgetAllocation, BudgetPlan } from '../models/budget.model';
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
}
