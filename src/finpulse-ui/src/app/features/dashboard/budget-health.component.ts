import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { SpendingSummary } from '../../core/models/daily-expense.model';

@Component({
  selector: 'app-budget-health',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatProgressBarModule, MatButtonModule, CurrencyPipe],
  template: `
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

          @if (alerts().length > 0) {
            <div class="alerts-section">
              <span class="alerts-title">Watch List</span>
              @for (alert of alerts(); track alert.categoryId) {
                <div class="alert-row" [class.over]="alert.remaining < 0">
                  <mat-icon class="alert-icon">{{ alert.categoryIcon || (alert.remaining < 0 ? 'warning' : 'info') }}</mat-icon>
                  <span class="alert-name">{{ alert.categoryName }}</span>
                  <span class="alert-detail">{{ alert.percentUsed | number:'1.0-0' }}%</span>
                </div>
              }
            </div>
          }

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
        <a mat-button routerLink="/expenses">View Details</a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .budget-health-card {
      margin-top: var(--spacing-md);
    }
    .card-title-icon {
      font-size: 20px; width: 20px; height: 20px;
      margin-right: 8px; color: var(--color-primary); vertical-align: middle;
    }
    .overall-progress { margin-bottom: var(--spacing-md); }
    .overall-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .overall-label { font-weight: 500; }
    .overall-amounts { font-size: 0.9rem; opacity: 0.8; }
    .overall-footer { display: flex; justify-content: space-between; margin-top: 4px; font-size: 0.85rem; }
    .overall-footer .over { color: var(--color-danger); font-weight: 600; }
    .percent { opacity: 0.6; }

    .alerts-section { margin-top: var(--spacing-md); padding-top: var(--spacing-sm); border-top: 1px solid var(--color-border, #e0e0e0); }
    .alerts-title { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; display: block; margin-bottom: 8px; }
    .alert-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
    .alert-row .alert-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-warning); }
    .alert-row.over .alert-icon { color: var(--color-danger); }
    .alert-row .alert-name { flex: 1; font-size: 0.9rem; }
    .alert-row .alert-detail { font-weight: 600; font-size: 0.9rem; }
    .alert-row.over .alert-detail { color: var(--color-danger); }

    .next-pay { display: flex; align-items: center; gap: 8px; margin-top: var(--spacing-md); padding-top: var(--spacing-sm); border-top: 1px solid var(--color-border, #e0e0e0); font-size: 0.9rem; }
    .next-pay mat-icon { color: var(--color-primary); font-size: 18px; width: 18px; height: 18px; }
    .no-data { opacity: 0.6; font-style: italic; }
  `]
})
export class BudgetHealthComponent implements OnInit {
  private expenseService = inject(DailyExpenseService);
  private profileService = inject(UserProfileService);

  loaded = signal(false);
  totalBudgeted = signal(0);
  totalSpent = signal(0);
  totalRemaining = signal(0);
  overallPercent = signal(0);
  alerts = signal<SpendingSummary[]>([]);
  daysUntilPay = signal<number | null>(null);

  monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  ngOnInit(): void {
    const now = new Date();
    this.expenseService.getSummary(now.getFullYear(), now.getMonth() + 1).subscribe({
      next: (data) => {
        const budgeted = data.reduce((s, d) => s + d.budgeted, 0);
        const spent = data.reduce((s, d) => s + d.spent, 0);
        this.totalBudgeted.set(budgeted);
        this.totalSpent.set(spent);
        this.totalRemaining.set(budgeted - spent);
        this.overallPercent.set(budgeted > 0 ? Math.round(spent / budgeted * 100) : 0);
        this.alerts.set(data.filter(d => d.percentUsed >= 75).sort((a, b) => b.percentUsed - a.percentUsed).slice(0, 4));
        this.loaded.set(true);
      }
    });

    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (profile?.nextPayDate) {
          const next = new Date(profile.nextPayDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          next.setHours(0, 0, 0, 0);
          const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          this.daysUntilPay.set(diff >= 0 ? diff : null);
        }
      }
    });
  }
}
