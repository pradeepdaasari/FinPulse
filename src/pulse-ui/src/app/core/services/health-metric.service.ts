import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HealthMetric, HealthMetricTrend } from '../models/health-metric.model';

@Injectable({ providedIn: 'root' })
export class HealthMetricService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/health-metrics`;

  getAll(type?: string, fromDate?: string, toDate?: string): Observable<HealthMetric[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<HealthMetric[]>(this.baseUrl, { params });
  }

  getLatest(): Observable<HealthMetric[]> {
    return this.http.get<HealthMetric[]>(`${this.baseUrl}/latest`);
  }

  getTrends(type: string, days = 90): Observable<HealthMetricTrend[]> {
    const params = new HttpParams().set('type', type).set('days', days.toString());
    return this.http.get<HealthMetricTrend[]>(`${this.baseUrl}/trends`, { params });
  }

  getTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/types`);
  }

  create(metric: Partial<HealthMetric>): Observable<HealthMetric> {
    return this.http.post<HealthMetric>(this.baseUrl, metric);
  }

  update(id: number, metric: Partial<HealthMetric>): Observable<HealthMetric> {
    return this.http.put<HealthMetric>(`${this.baseUrl}/${id}`, metric);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
