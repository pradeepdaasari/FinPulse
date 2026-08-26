import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FundingSource, FundingSourcesResponse } from '../models/funding-source.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FundingSourceService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/funding-sources`;

  getAll(): Observable<FundingSource[]> {
    return this.http.get<FundingSourcesResponse>(this.baseUrl).pipe(
      map(res => {
        const sources: FundingSource[] = [];
        for (const a of res.bankAccounts) {
          sources.push({ type: 'BankAccount', id: a.id, name: a.name, currentBalance: a.currentBalance, accountType: a.accountType });
        }
        for (const c of res.creditCards) {
          sources.push({ type: 'CreditCard', id: c.id, name: c.name, currentBalance: c.currentBalance });
        }
        return sources;
      })
    );
  }
}
