import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
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
      <div class="bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <mat-card class="login-card">
        <div class="brand">
          <div class="brand-icon-wrap">
            <mat-icon class="brand-icon">monitor_heart</mat-icon>
          </div>
          <h1>Pulse</h1>
          <p class="tagline">Take control of your financial future</p>
        </div>

        <div class="features-row">
          <div class="feature-pill">
            <mat-icon>account_balance</mat-icon>
            <span>Track</span>
          </div>
          <div class="feature-pill">
            <mat-icon>trending_up</mat-icon>
            <span>Grow</span>
          </div>
          <div class="feature-pill">
            <mat-icon>savings</mat-icon>
            <span>Save</span>
          </div>
          <div class="feature-pill">
            <mat-icon>emoji_events</mat-icon>
            <span>Achieve</span>
          </div>
        </div>

        <form class="auth-form" (ngSubmit)="login()">
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput [(ngModel)]="username" name="username" required autocomplete="username">
            <mat-icon matPrefix>person_outline</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="hidePassword() ? 'password' : 'text'" [(ngModel)]="password" name="password" required autocomplete="current-password">
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
          @if (error()) {
            <p class="error-msg">{{ error() }}</p>
          }
          <button class="sign-in-btn" type="submit" [disabled]="loading()">
            @if (loading()) {
              <span class="btn-spinner"></span>
              Signing in...
            } @else {
              Sign In
              <mat-icon class="btn-arrow">arrow_forward</mat-icon>
            }
          </button>
        </form>
      </mat-card>

      <p class="login-quote" [class.fade-out]="quoteFading()">{{ currentQuote() }}</p>
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

    .bg-orbs {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      animation: orbFloat 20s ease-in-out infinite;
    }
    .orb-1 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(0, 122, 255, 0.15) 0%, transparent 70%);
      top: -10%; left: -5%;
      animation-delay: 0s;
    }
    .orb-2 {
      width: 350px; height: 350px;
      background: radial-gradient(circle, rgba(88, 86, 214, 0.12) 0%, transparent 70%);
      bottom: -5%; right: -5%;
      animation-delay: -7s;
    }
    .orb-3 {
      width: 250px; height: 250px;
      background: radial-gradient(circle, rgba(52, 199, 89, 0.08) 0%, transparent 70%);
      top: 50%; left: 60%;
      animation-delay: -14s;
    }
    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(30px, -20px); }
      66% { transform: translate(-20px, 15px); }
    }

    .login-card {
      padding: 40px 36px 36px;
      text-align: center;
      max-width: 420px;
      width: 90%;
      border-radius: var(--radius-xl) !important;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.15) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      background: var(--color-surface-solid) !important;
      animation: loginCardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      z-index: 1;
    }
    @keyframes loginCardIn {
      from { opacity: 0; transform: translateY(24px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .brand {
      margin-bottom: 20px;
    }
    .brand-icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 68px; height: 68px;
      border-radius: 20px;
      background: var(--gradient-primary);
      box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3), 0 2px 8px rgba(88, 86, 214, 0.2);
      animation: iconPulse 3s ease-in-out infinite;
    }
    @keyframes iconPulse {
      0%, 100% { box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3), 0 2px 8px rgba(88, 86, 214, 0.2); }
      50% { box-shadow: 0 8px 32px rgba(0, 122, 255, 0.4), 0 2px 12px rgba(88, 86, 214, 0.3); }
    }
    .brand-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #fff;
      overflow: visible;
    }
    .brand h1 {
      margin: 14px 0 6px;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: var(--color-text);
    }
    .tagline {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin: 0;
      font-weight: 500;
    }

    .features-row {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
      animation: fadeSlideUp 0.5s ease-out 0.2s both;
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .feature-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: var(--radius-full);
      background: var(--color-primary-subtle);
      color: var(--color-primary);
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }
    .feature-pill mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .auth-form mat-form-field {
      width: 100%;
    }
    .auth-form mat-icon[matPrefix] {
      color: var(--color-text-muted);
      margin-right: 4px;
    }

    .sign-in-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      height: 48px;
      width: 100%;
      border: none;
      border-radius: var(--radius-sm);
      background: var(--gradient-primary);
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
    }
    .sign-in-btn:hover:not(:disabled) {
      box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4);
      transform: translateY(-1px);
    }
    .sign-in-btn:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
    }
    .sign-in-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .btn-arrow {
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: transform 0.2s ease;
    }
    .sign-in-btn:hover:not(:disabled) .btn-arrow {
      transform: translateX(3px);
    }
    .btn-spinner {
      display: inline-block;
      width: 18px; height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
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
      color: rgba(255, 255, 255, 0.45);
      font-size: var(--text-xs);
      font-style: italic;
      margin-top: var(--spacing-xl);
      text-align: center;
      max-width: 320px;
      line-height: var(--leading-relaxed);
      animation: fadeIn 0.8s ease-out 0.3s both;
      transition: opacity 0.4s ease;
      min-height: 2.4em;
    }
    .login-quote.fade-out {
      opacity: 0;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 599px) {
      .login-card {
        padding: 32px 24px 28px;
        width: 92%;
      }
      .feature-pill {
        padding: 4px 8px;
        font-size: 0.65rem;
        gap: 3px;
      }
      .feature-pill mat-icon {
        font-size: 13px; width: 13px; height: 13px;
      }
      .features-row { gap: 6px; }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  hidePassword = signal(true);
  loading = signal(false);
  error = signal('');

  private quotes = [
    '"Every dollar tracked is a step toward financial freedom."',
    '"Discipline today, freedom tomorrow."',
    '"Your net worth is not your self-worth — but tracking it helps."',
    '"Small consistent actions build extraordinary wealth."',
    '"The best time to start was yesterday. The next best time is now."',
    '"Budget like you mean it, spend like you planned it."',
    '"Financial peace isn\'t about how much you make — it\'s about how you manage."',
    '"Track the pennies and the dollars will follow."',
  ];
  currentQuote = signal(this.quotes[0]);
  quoteFading = signal(false);
  private quoteIndex = 0;
  private quoteInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.quoteIndex = Math.floor(Math.random() * this.quotes.length);
    this.currentQuote.set(this.quotes[this.quoteIndex]);

    this.quoteInterval = setInterval(() => {
      this.quoteFading.set(true);
      setTimeout(() => {
        this.quoteIndex = (this.quoteIndex + 1) % this.quotes.length;
        this.currentQuote.set(this.quotes[this.quoteIndex]);
        this.quoteFading.set(false);
      }, 400);
    }, 6000);
  }

  ngOnDestroy() {
    if (this.quoteInterval) clearInterval(this.quoteInterval);
  }

  async login() {
    this.error.set('');
    this.loading.set(true);
    const result = await this.authService.login(this.username, this.password);
    this.loading.set(false);
    if (result.success) {
      location.replace('/dashboard');
    } else {
      this.error.set(result.error || 'Login failed');
    }
  }
}
