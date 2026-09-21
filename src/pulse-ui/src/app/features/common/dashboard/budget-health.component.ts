import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { BudgetService } from '../../../core/services/budget.service';
import { UserProfileService } from '../../../core/services/user-profile.service';

@Component({
  selector: 'app-budget-health',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule, MatButtonModule, CurrencyPipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else {
    <div class="budget-card" routerLink="/budget">
      @if (loaded()) {
        <div class="budget-top">
          <div class="budget-hero">
            <svg class="ring" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="6"/>
              <circle cx="40" cy="40" r="34" fill="none"
                [attr.stroke]="ringColor()"
                stroke-width="6"
                stroke-linecap="round"
                [attr.stroke-dasharray]="ringDash()"
                transform="rotate(-90 40 40)"/>
            </svg>
            <span class="hero-pct" [style.color]="ringColor()">{{ overallPercent() }}<small>%</small></span>
          </div>
          <div class="budget-info">
            <span class="budget-title">{{ monthLabel }}</span>
            <span class="budget-amounts">{{ totalSpent() | currency }} of {{ totalBudgeted() | currency }}</span>
            <span class="budget-remaining" [class.over]="totalRemaining() < 0">
              {{ totalRemaining() >= 0 ? (totalRemaining() | currency) + ' left' : ((-totalRemaining()) | currency) + ' over' }}
            </span>
          </div>
          <mat-icon class="budget-arrow">chevron_right</mat-icon>
        </div>

        @if (daysUntilPay() !== null) {
          <div class="next-pay">
            <mat-icon>calendar_today</mat-icon>
            <span>{{ daysUntilPay() === 0 ? 'Payday today!' : daysUntilPay() + ' days until next paycheck' }}</span>
          </div>
        }
      } @else {
        <div class="no-budget">
          <div class="no-budget-icon"><mat-icon>monitoring</mat-icon></div>
          <span>Set up your budget to see spending insights</span>
          <mat-icon class="budget-arrow">chevron_right</mat-icon>
        </div>
      }
    </div>
    }
  `,
  styles: [`
    .budget-card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: 16px;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: box-shadow var(--transition-fast);
      margin-top: var(--spacing-md);
    }
    .budget-card:active { box-shadow: var(--shadow-md); }

    .budget-top {
      display: flex; align-items: center; gap: 14px;
    }
    .budget-hero {
      position: relative;
      width: 64px; height: 64px; flex-shrink: 0;
    }
    .ring { width: 64px; height: 64px; }
    .hero-pct {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.15rem; font-weight: 800; letter-spacing: -0.03em;
    }
    .hero-pct small { font-size: 0.65rem; font-weight: 600; margin-left: 1px; }

    .budget-info { flex: 1; min-width: 0; }
    .budget-title {
      display: block; font-size: 0.82rem; font-weight: 700;
    }
    .budget-amounts {
      display: block; font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;
    }
    .budget-remaining {
      display: inline-block; font-size: 0.68rem; font-weight: 600; margin-top: 4px;
      padding: 2px 8px; border-radius: var(--radius-full);
      background: var(--color-success-bg); color: var(--color-success);
    }
    .budget-remaining.over {
      background: var(--color-danger-bg); color: var(--color-danger);
    }
    .budget-arrow { color: var(--color-text-muted); }

    .next-pay {
      display: flex; align-items: center; gap: 8px;
      margin-top: 12px; padding-top: 12px;
      border-top: 1px solid var(--color-border);
      font-size: 0.78rem; color: var(--color-text-muted);
    }
    .next-pay mat-icon { color: var(--color-primary); font-size: 16px; width: 16px; height: 16px; }

    .no-budget {
      display: flex; align-items: center; gap: 12px;
      font-size: 0.82rem; color: var(--color-text-muted);
    }
    .no-budget-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-green-bg);
    }
    .no-budget-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-stat-green); }
    .no-budget span { flex: 1; }

    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 100px; }
  `]
})
export class BudgetHealthComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private profileService = inject(UserProfileService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  loaded = signal(false);
  totalBudgeted = signal(0);
  totalSpent = signal(0);
  totalRemaining = signal(0);
  overallPercent = signal(0);
  daysUntilPay = signal<number | null>(null);

  monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  ringColor(): string {
    const pct = this.overallPercent();
    if (pct > 100) return '#FF3B30';
    if (pct > 80) return '#FF9500';
    return '#34C759';
  }

  ringDash(): string {
    const circumference = 2 * Math.PI * 34;
    const pct = Math.min(this.overallPercent(), 100);
    const filled = (pct / 100) * circumference;
    return `${filled} ${circumference}`;
  }

  ngOnInit(): void {
    const now = new Date();
    this.budgetService.getPlan(now.getFullYear(), now.getMonth() + 1).subscribe({
      next: (plan) => {
        const all = plan.monthlyOverview.byCategory;
        const budgeted = all.reduce((s, c) => s + c.amount, 0);
        const spent = all.reduce((s, c) => s + c.spent, 0);
        const remaining = budgeted - spent;
        this.totalBudgeted.set(budgeted);
        this.totalSpent.set(spent);
        this.totalRemaining.set(remaining);
        this.overallPercent.set(budgeted > 0 ? Math.round(spent / budgeted * 100) : 0);
        this.loaded.set(true);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });

    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (profile?.nextPayDate) {
          const anchor = new Date(profile.nextPayDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          anchor.setHours(0, 0, 0, 0);

          let next = new Date(anchor);
          const freq = profile.payFrequency;
          if (freq === 'Biweekly' || freq === 'Weekly') {
            const interval = freq === 'Biweekly' ? 14 : 7;
            if (next > today) {
              while (next.getTime() - interval * 86400000 > today.getTime()) {
                next = new Date(next.getTime() - interval * 86400000);
              }
            } else {
              while (next <= today) {
                next = new Date(next.getTime() + interval * 86400000);
              }
            }
          }

          const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          this.daysUntilPay.set(diff >= 0 ? diff : null);
          this.cdr.detectChanges();
        }
      }
    });
  }
}
