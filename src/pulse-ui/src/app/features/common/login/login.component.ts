import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <div class="brand">
          <mat-icon class="brand-icon">monitor_heart</mat-icon>
          <h1>Pulse</h1>
          <p class="tagline">Your personal life dashboard</p>
        </div>

        <form class="auth-form" (ngSubmit)="login()">
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput [(ngModel)]="username" name="username" required>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="hidePassword() ? 'password' : 'text'" [(ngModel)]="password" name="password" required>
            <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }
          <button mat-raised-button color="primary" type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </mat-card>
      <p class="login-quote">"Every dollar tracked is a step toward financial freedom."</p>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      background: var(--gradient-login);
      position: relative;
      overflow: hidden;
    }
    .login-container::before {
      content: '';
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, rgba(88, 86, 214, 0.06) 40%, transparent 70%);
      pointer-events: none;
    }
    .login-container::after {
      content: '';
      position: absolute;
      bottom: 10%;
      right: 20%;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(88, 86, 214, 0.08) 0%, transparent 70%);
      pointer-events: none;
    }
    .login-card {
      padding: 44px 40px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      border-radius: var(--radius-xl) !important;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.15) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      background: var(--color-surface-solid) !important;
      animation: loginCardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      z-index: 1;
    }
    @keyframes loginCardIn {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .brand {
      margin-bottom: 28px;
    }
    .brand-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #fff;
      padding: 12px;
      border-radius: 16px;
      background: var(--gradient-primary);
      box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
      box-sizing: content-box;
      overflow: visible;
    }
    .brand h1 {
      margin: 16px 0 6px;
      font-size: 1.625rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--color-text);
    }
    .tagline {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      margin: 0;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      padding-top: 24px;
      gap: 4px;
    }
    .auth-form mat-form-field {
      width: 100%;
    }
    .auth-form button[type="submit"] {
      margin-top: 12px;
      height: 46px;
      border-radius: var(--radius-sm);
      width: 100%;
      font-size: var(--text-base);
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .error-msg {
      color: var(--color-danger);
      font-size: var(--text-xs);
      font-weight: 500;
      margin: 0 0 8px;
      padding: 8px 12px;
      background: var(--color-danger-bg);
      border-radius: var(--radius-sm);
      text-align: left;
    }
    .login-quote {
      color: rgba(255, 255, 255, 0.4);
      font-size: var(--text-xs);
      font-style: italic;
      margin-top: var(--spacing-xl);
      text-align: center;
      max-width: 300px;
      line-height: var(--leading-relaxed);
      animation: fadeIn 0.8s ease-out 0.3s both;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (max-width: 599px) {
      .login-card {
        padding: 36px 28px;
        width: 92%;
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  hidePassword = signal(true);
  loading = signal(false);
  error = signal('');

  async login() {
    this.error.set('');
    this.loading.set(true);
    const result = await this.authService.login(this.username, this.password);
    this.loading.set(false);
    if (result.success) {
      // Hard reload so DATE_PIPE_DEFAULT_OPTIONS re-initializes with the user's timezone
      location.replace('/dashboard');
    } else {
      this.error.set(result.error || 'Login failed');
    }
  }
}
