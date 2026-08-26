import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StrategyComparison } from '../models/strategy.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StrategyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/strategies`;

  getComparison(): Observable<StrategyComparison> {
    return this.http.get<StrategyComparison>(`${this.baseUrl}/comparison`);
  }
}
