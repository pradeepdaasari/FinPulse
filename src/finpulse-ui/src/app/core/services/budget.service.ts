import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BudgetAllocation } from '../models/budget.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/budget`;

  getAllocation(): Observable<BudgetAllocation> {
    return this.http.get<BudgetAllocation>(`${this.baseUrl}/allocation`);
  }
}
