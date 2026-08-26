import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CategoryCreate } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);

  getAll(type?: string): Observable<Category[]> {
    const params = type ? `?type=${type}` : '';
    return this.http.get<Category[]>(`/api/categories${params}`);
  }

  getFlat(type?: string): Observable<Category[]> {
    const params = type ? `?type=${type}` : '';
    return this.http.get<Category[]>(`/api/categories/flat${params}`);
  }

  create(dto: CategoryCreate): Observable<Category> {
    return this.http.post<Category>('/api/categories', dto);
  }

  update(id: number, dto: CategoryCreate): Observable<Category> {
    return this.http.put<Category>(`/api/categories/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/categories/${id}`);
  }
}
