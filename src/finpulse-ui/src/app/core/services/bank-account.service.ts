import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankAccount, BankAccountCreate } from '../models/bank-account.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BankAccountService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/bankaccounts`;

  getAll(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(this.baseUrl);
  }

  getById(id: number): Observable<BankAccount> {
    return this.http.get<BankAccount>(`${this.baseUrl}/${id}`);
  }

  create(account: BankAccountCreate): Observable<BankAccount> {
    return this.http.post<BankAccount>(this.baseUrl, account);
  }

  update(id: number, account: BankAccountCreate): Observable<BankAccount> {
    return this.http.put<BankAccount>(`${this.baseUrl}/${id}`, account);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
