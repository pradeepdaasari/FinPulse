import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DebtItem } from '../models/debt-item.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DebtService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/debts`;

  getAll(): Observable<DebtItem[]> {
    return this.http.get<DebtItem[]>(this.baseUrl);
  }
}
