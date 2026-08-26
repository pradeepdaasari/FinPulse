import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private http = inject(HttpClient);
  private cache: string[] = [];

  getMerchants(): Observable<string[]> {
    if (this.cache.length > 0) return of(this.cache);
    return this.http.get<any[]>(`${environment.apiUrl}/expenses`).pipe(
      map(expenses => {
        const merchants = [...new Set(expenses.filter((e: any) => e.merchant).map((e: any) => e.merchant as string))].sort();
        this.cache = merchants;
        return merchants;
      }),
      catchError(() => of([]))
    );
  }

  filter(query: string): string[] {
    if (!query) return this.cache.slice(0, 10);
    const q = query.toLowerCase();
    return this.cache.filter(m => m.toLowerCase().includes(q)).slice(0, 8);
  }
}
