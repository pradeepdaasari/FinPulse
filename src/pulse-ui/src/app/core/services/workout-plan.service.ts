import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WorkoutPlan, WorkoutPlanSummary, TodayPlanResponse } from '../models/workout-plan.model';

@Injectable({ providedIn: 'root' })
export class WorkoutPlanService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/workout-plans`;

  getAll(): Observable<WorkoutPlanSummary[]> {
    return this.http.get<WorkoutPlanSummary[]>(this.baseUrl);
  }

  getById(id: number): Observable<WorkoutPlan> {
    return this.http.get<WorkoutPlan>(`${this.baseUrl}/${id}`);
  }

  getActive(): Observable<WorkoutPlan> {
    return this.http.get<WorkoutPlan>(`${this.baseUrl}/active`);
  }

  getToday(): Observable<TodayPlanResponse> {
    return this.http.get<TodayPlanResponse>(`${this.baseUrl}/today`);
  }

  create(plan: Partial<WorkoutPlan>): Observable<WorkoutPlan> {
    return this.http.post<WorkoutPlan>(this.baseUrl, plan);
  }

  update(id: number, plan: Partial<WorkoutPlan>): Observable<WorkoutPlan> {
    return this.http.put<WorkoutPlan>(`${this.baseUrl}/${id}`, plan);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  activate(id: number): Observable<WorkoutPlan> {
    return this.http.post<WorkoutPlan>(`${this.baseUrl}/${id}/activate`, {});
  }
}
