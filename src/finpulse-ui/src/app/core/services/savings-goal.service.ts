import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SavingsGoal, SavingsGoalCreate } from '../models/savings-goal.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SavingsGoalService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/savings-goals`;

  getAll(): Observable<SavingsGoal[]> {
    return this.http.get<SavingsGoal[]>(this.baseUrl);
  }

  create(goal: SavingsGoalCreate): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.baseUrl, goal);
  }

  update(id: number, goal: SavingsGoalCreate): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, goal);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
