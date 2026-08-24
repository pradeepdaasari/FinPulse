import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTabsModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <div class="brand">
          <mat-icon class="brand-icon">account_balance_wallet</mat-icon>
          <h1>FinPulse</h1>
          <p class="tagline">Take control of your finances</p>
        </div>

        <mat-tab-group [(selectedIndex)]="activeTab" animationDuration="200ms">
          <mat-tab label="Sign In">
            <form class="auth-form" (ngSubmit)="login()">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" [(ngModel)]="email" name="email" required>
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
          </mat-tab>

          <mat-tab label="Register">
            <form class="auth-form" (ngSubmit)="register()">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" [(ngModel)]="email" name="email" required>
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
                {{ loading() ? 'Creating account...' : 'Create Account' }}
              </button>
            </form>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
      <p class="login-quote">"Every dollar tracked is a step toward financial freedom."</p>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--gradient-login);
      position: relative;
      overflow: hidden;
    }
    .login-container::before {
      content: '';
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(0, 122, 255, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }
    .login-card {
      padding: 48px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-float);
    }
    .brand {
      margin-bottom: 24px;
    }
    .brand-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--color-primary);
    }
    .brand h1 {
      margin: 12px 0 4px;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .tagline {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin: 0;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      padding-top: 20px;
      gap: 4px;
    }
    .auth-form mat-form-field {
      width: 100%;
    }
    .auth-form button[type="submit"] {
      margin-top: 8px;
      height: 44px;
      border-radius: var(--radius-sm);
      width: 100%;
      font-size: 15px;
    }
    .error-msg {
      color: var(--color-danger);
      font-size: 13px;
      margin: 0 0 8px;
    }
    .login-quote {
      color: rgba(255, 255, 255, 0.5);
      font-size: var(--text-sm);
      font-style: italic;
      margin-top: var(--spacing-lg);
      text-align: center;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  activeTab = 0;
  hidePassword = signal(true);
  loading = signal(false);
  error = signal('');

  async login() {
    this.error.set('');
    this.loading.set(true);
    const result = await this.authService.login(this.email, this.password);
    this.loading.set(false);
    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set(result.error || 'Login failed');
    }
  }

  async register() {
    this.error.set('');
    this.loading.set(true);
    const result = await this.authService.register(this.email, this.password);
    this.loading.set(false);
    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set(result.errors?.join(', ') || 'Registration failed');
    }
  }
}
