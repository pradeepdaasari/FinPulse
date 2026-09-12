import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private http = inject(HttpClient);
  private cache: string[] = [];
  private loaded = false;

  getMerchants(): Observable<string[]> {
    if (this.loaded) return of(this.cache);
    return this.http.get<string[]>(`${environment.apiUrl}/expenses/merchants`).pipe(
      tap(merchants => {
        this.cache = merchants;
        this.loaded = true;
      }),
      catchError(() => of([]))
    );
  }

  filter(query: string): string[] {
    if (!query) return this.cache.slice(0, 10);
    const q = query.toLowerCase();
    return this.cache.filter(m => m.toLowerCase().includes(q)).slice(0, 8);
  }

  invalidateCache(): void {
    this.loaded = false;
    this.cache = [];
  }
}
