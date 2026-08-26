import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BloodWorkReport, BloodWorkReportSummary, TestHistory } from '../models/blood-work.model';

@Injectable({ providedIn: 'root' })
export class BloodWorkService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/blood-work`;

  getAll(): Observable<BloodWorkReportSummary[]> {
    return this.http.get<BloodWorkReportSummary[]>(this.baseUrl);
  }

  getById(id: number): Observable<BloodWorkReport> {
    return this.http.get<BloodWorkReport>(`${this.baseUrl}/${id}`);
  }

  create(report: Partial<BloodWorkReport>): Observable<BloodWorkReport> {
    return this.http.post<BloodWorkReport>(this.baseUrl, report);
  }

  update(id: number, report: Partial<BloodWorkReport>): Observable<BloodWorkReport> {
    return this.http.put<BloodWorkReport>(`${this.baseUrl}/${id}`, report);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getTestHistory(testName: string): Observable<TestHistory[]> {
    const params = new HttpParams().set('testName', testName);
    return this.http.get<TestHistory[]>(`${this.baseUrl}/test-history`, { params });
  }

  getTestNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/test-names`);
  }
}
