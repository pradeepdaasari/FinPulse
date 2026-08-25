import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface AuthUser {
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<AuthUser | null>(null);
  isAuthenticated = signal(false);
  isAdmin = computed(() => this.currentUser()?.role === 'Admin');

  async checkAuth(): Promise<boolean> {
    try {
      const user = await firstValueFrom(this.http.get<AuthUser>('/api/auth/me'));
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      return true;
    } catch {
      this.currentUser.set(null);
      this.isAuthenticated.set(false);
      return false;
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await firstValueFrom(this.http.post<AuthUser>('/api/auth/login', { username, password }));
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.error?.error || 'Login failed' };
    }
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', {}));
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }
}
