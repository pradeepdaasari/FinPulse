import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AppUser {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  reseed() {
    return this.http.post<{ message: string }>('/api/admin/reseed', {});
  }

  getUsers() {
    return this.http.get<AppUser[]>('/api/admin/users');
  }

  createUser(username: string, email: string, password: string) {
    return this.http.post<AppUser>('/api/admin/users', { username, email, password });
  }

  deactivateUser(id: string) {
    return this.http.post(`/api/admin/users/${id}/deactivate`, {});
  }

  activateUser(id: string) {
    return this.http.post(`/api/admin/users/${id}/activate`, {});
  }

  deleteUser(id: string) {
    return this.http.delete(`/api/admin/users/${id}`);
  }
}
