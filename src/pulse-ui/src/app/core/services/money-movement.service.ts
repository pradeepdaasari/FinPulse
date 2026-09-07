import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MoneyMovement, MoneyMovementCreate, MoneyMovementEntityType, MovementType } from '../models/money-movement.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MoneyMovementService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/money-movements`;

  getAll(filters?: {
    entityType?: MoneyMovementEntityType;
    entityId?: number;
    movementType?: MovementType;
    from?: string;
    to?: string;
  }): Observable<MoneyMovement[]> {
    let params = new HttpParams();
    if (filters?.entityType) params = params.set('entityType', filters.entityType);
    if (filters?.entityId) params = params.set('entityId', filters.entityId.toString());
    if (filters?.movementType) params = params.set('movementType', filters.movementType);
    if (filters?.from) params = params.set('from', filters.from);
    if (filters?.to) params = params.set('to', filters.to);
    return this.http.get<MoneyMovement[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<MoneyMovement> {
    return this.http.get<MoneyMovement>(`${this.baseUrl}/${id}`);
  }

  create(dto: MoneyMovementCreate): Observable<MoneyMovement> {
    return this.http.post<MoneyMovement>(this.baseUrl, dto);
  }

  update(id: number, dto: MoneyMovementCreate): Observable<MoneyMovement> {
    return this.http.put<MoneyMovement>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
