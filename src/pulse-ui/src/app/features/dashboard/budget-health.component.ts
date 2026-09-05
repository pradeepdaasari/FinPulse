import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { BudgetService } from '../../core/services/budget.service';
import { UserProfileService } from '../../core/services/user-profile.service';

@Component({
  selector: 'app-budget-health',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule, MatButtonModule, CurrencyPipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else {
    <mat-card class="budget-health-card">
      <mat-card-header>
        <mat-card-title><mat-icon class="card-title-icon">monitoring</mat-icon> Budget Health</mat-card-title>
        <mat-card-subtitle>{{ monthLabel }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (loaded()) {
          <div class="overall-progress">
            <div class="overall-header">
              <span class="overall-label">Monthly Spending</span>
              <span class="overall-amounts">{{ totalSpent() | currency }} / {{ totalBudgeted() | currency }}</span>
            </div>
            <mat-progress-bar
              mode="determinate"
              [value]="overallPercent()"
              [color]="overallPercent() > 100 ? 'warn' : overallPercent() > 80 ? 'accent' : 'primary'">
            </mat-progress-bar>
            <div class="overall-footer">
              <span [class.over]="totalRemaining() < 0">
                {{ totalRemaining() >= 0 ? (totalRemaining() | currency) + ' remaining' : ((-totalRemaining()) | currency) + ' over budget' }}
              </span>
              <span class="percent">{{ overallPercent() | number:'1.0-0' }}%</span>
            </div>
          </div>

          @if (daysUntilPay() !== null) {
            <div class="next-pay">
              <mat-icon>calendar_today</mat-icon>
              <span>{{ daysUntilPay() === 0 ? 'Payday today!' : daysUntilPay() + ' days until next paycheck' }}</span>
            </div>
          }
        } @else {
          <p class="no-data">Set up your budget to see spending insights.</p>
        }
      </mat-card-content>
      <mat-card-actions>
        <a mat-button routerLink="/budget">View Details</a>
      </mat-card-actions>
    </mat-card>
    }
  `,
  styles: [`
    .budget-health-card {
      margin-top: var(--spacing-md);
    }
    .card-title-icon {
      font-size: 20px; width: 20px; height: 20px;
      margin-right: 8px; color: #34C759; vertical-align: middle;
    }
    .overall-progress { margin-bottom: var(--spacing-md); }
    .overall-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .overall-label { font-weight: 500; }
    .overall-amounts { font-size: 0.9rem; opacity: 0.8; }
    .overall-footer { display: flex; justify-content: space-between; margin-top: 4px; font-size: 0.85rem; }
    .overall-footer .over { color: var(--color-danger); font-weight: 600; }
    .percent { opacity: 0.6; }

    .next-pay { display: flex; align-items: center; gap: 8px; margin-top: var(--spacing-md); padding-top: var(--spacing-sm); border-top: 1px solid var(--color-border, #e0e0e0); font-size: 0.9rem; }
    .next-pay mat-icon { color: var(--color-primary); font-size: 18px; width: 18px; height: 18px; }
    .no-data { opacity: 0.6; font-style: italic; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
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
