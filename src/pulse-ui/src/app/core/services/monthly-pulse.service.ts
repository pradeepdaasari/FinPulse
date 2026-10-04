import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MonthlyPulseData } from '../models/monthly-pulse.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MonthlyPulseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/dashboard/monthly-pulse`;

  getPulse(months: number = 3, year?: number, month?: number, mode?: string): Observable<MonthlyPulseData> {
    const params: Record<string, string> = { months: months.toString() };
    if (year) params['year'] = year.toString();
    if (month) params['month'] = month.toString();
    if (mode) params['mode'] = mode;
    return this.http.get<MonthlyPulseData>(this.baseUrl, { params });
  }
}
