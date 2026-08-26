import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PayFrequency } from '../models/budget.model';

export interface UserProfile {
  id?: number;
  monthlyIncome: number;
  payFrequency: PayFrequency;
  netPayPerCheck: number;
  nextPayDate: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/profile`;

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.baseUrl);
  }

  saveProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.post<UserProfile>(this.baseUrl, profile);
  }
}
