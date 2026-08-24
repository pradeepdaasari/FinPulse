import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  monthlyIncome: number;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/profile`;

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.baseUrl);
  }

  saveProfile(income: number): Observable<UserProfile> {
    return this.http.post<UserProfile>(this.baseUrl, { monthlyIncome: income });
  }

  getPaycheckDay(): number | null {
    const val = localStorage.getItem('paycheckDay');
    return val ? parseInt(val, 10) : null;
  }

  setPaycheckDay(day: number): void {
    localStorage.setItem('paycheckDay', day.toString());
  }
}
