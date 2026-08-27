import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankAccount, BankAccountCreate, CommissionSchedule, CommissionScheduleCreate, CommissionScheduleResult } from '../models/bank-account.model';
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

  getCommissionHistory(accountId: number): Observable<CommissionSchedule[]> {
    return this.http.get<CommissionSchedule[]>(`${this.baseUrl}/${accountId}/commissions`);
  }

  createCommissionSchedule(accountId: number, schedule: CommissionScheduleCreate): Observable<CommissionScheduleResult> {
    return this.http.post<CommissionScheduleResult>(`${this.baseUrl}/${accountId}/commissions`, schedule);
  }

  updateCommissionSchedule(accountId: number, scheduleId: number, schedule: CommissionScheduleCreate): Observable<CommissionScheduleResult> {
    return this.http.put<CommissionScheduleResult>(`${this.baseUrl}/${accountId}/commissions/${scheduleId}`, schedule);
  }

  deleteCommissionSchedule(accountId: number, scheduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${accountId}/commissions/${scheduleId}`);
  }
}
