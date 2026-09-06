import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StrategyComparison } from '../models/strategy.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StrategyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/strategies`;

  getComparison(extraPayment: number = 0): Observable<StrategyComparison> {
    let params = new HttpParams();
    if (extraPayment > 0) {
      params = params.set('extraPayment', extraPayment.toString());
    }
    return this.http.get<StrategyComparison>(`${this.baseUrl}/comparison`, { params });
  }
}
