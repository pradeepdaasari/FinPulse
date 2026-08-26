import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WorkoutLog, WorkoutLogSummary, PersonalRecord, ExerciseProgress, WorkoutStats } from '../models/workout-log.model';

@Injectable({ providedIn: 'root' })
export class WorkoutLogService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/workout-logs`;

  getAll(fromDate?: string, toDate?: string): Observable<WorkoutLogSummary[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<WorkoutLogSummary[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<WorkoutLog> {
    return this.http.get<WorkoutLog>(`${this.baseUrl}/${id}`);
  }

  getToday(): Observable<WorkoutLog> {
    return this.http.get<WorkoutLog>(`${this.baseUrl}/today`);
  }

  create(log: Partial<WorkoutLog>): Observable<WorkoutLog> {
    return this.http.post<WorkoutLog>(this.baseUrl, log);
  }

  update(id: number, log: Partial<WorkoutLog>): Observable<WorkoutLog> {
    return this.http.put<WorkoutLog>(`${this.baseUrl}/${id}`, log);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getRecords(): Observable<PersonalRecord[]> {
    return this.http.get<PersonalRecord[]>(`${this.baseUrl}/records`);
  }

  getProgress(exercise: string, days = 90): Observable<ExerciseProgress[]> {
    const params = new HttpParams().set('exercise', exercise).set('days', days.toString());
    return this.http.get<ExerciseProgress[]>(`${this.baseUrl}/progress`, { params });
  }

  getExercises(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/exercises`);
  }

  getStats(): Observable<WorkoutStats> {
    return this.http.get<WorkoutStats>(`${this.baseUrl}/stats`);
  }
}
