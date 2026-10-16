import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DebtFreeCountdown } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-debt-countdown',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, LocalDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (countdown()) {
      <div class="countdown-card">
        <div class="card-title-row">
          <span class="title-with-icon"><mat-icon class="card-title-icon">timer</mat-icon> Debt-Free Countdown</span>
          @if (countdown()!.hasNeverPayoffDebts) {
            <span class="overall-date warning">
              <mat-icon>warning</mat-icon>
              Some debts need higher payments
            </span>
          } @else {
            <span class="overall-date">
              <mat-icon>flag</mat-icon>
              {{ countdown()!.overallDebtFreeDate | localDate:'MMM yyyy' }}
              ({{ countdown()!.overallRemainingMonths }} months)
            </span>
          }
        </div>
        <div class="projections">
          @for (p of countdown()!.projections; track p.debtName) {
            <div class="projection-row" [class.never-row]="p.isNeverPayoff">
              <div class="projection-info">
                <span class="debt-name">{{ p.debtName }}</span>
                <span class="debt-meta">{{ p.debtType }} &middot; {{ p.currentBalance | currency }}
                  @if (!p.isNeverPayoff) {
                    &middot; {{ p.remainingMonths }} mo
                  }
                </span>
              </div>
              <div class="projection-bar">
                @if (p.isNeverPayoff) {
                  <div class="never-label">
                    <mat-icon>warning_amber</mat-icon>
                    Min. payment won't pay off
                  </div>
                } @else {
                  <mat-progress-bar mode="determinate" [value]="p.progressPercent" [color]="getBarColor(p.remainingMonths)"></mat-progress-bar>
                }
              </div>
              <span class="payoff-date">
                @if (p.isNeverPayoff) {
                  <span class="never-date">Increase payment</span>
                } @else {
                  {{ p.projectedPayoffDate | localDate:'MMM yyyy' }}
                }
              </span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    .countdown-card {
      margin-bottom: var(--spacing-sm);
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: 20px;
    }
    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
    }
    .overall-date {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-success);
      background: var(--color-success-bg);
      padding: 4px 10px;
      border-radius: 16px;
    }
    .overall-date.warning {
      color: var(--color-warning-text);
      background: var(--color-warning-bg);
    }
    .overall-date.warning mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .title-with-icon { display: flex; align-items: center; }
    .card-title-icon { font-size: 20px; width: 20px; height: 20px; margin-right: 8px; color: var(--color-danger); }
    .overall-date mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .projections { display: flex; flex-direction: column; gap: 14px; }
    .projection-row {
      display: grid;
      grid-template-columns: 1fr 2fr auto;
      align-items: center;
      gap: 16px;
    }
    .projection-row.never-row { opacity: 0.85; }
    .projection-info { display: flex; flex-direction: column; }
    .debt-name { font-weight: 600; font-size: var(--text-sm); }
    .debt-meta { font-size: var(--text-xs); color: var(--color-text-muted); }
    .projection-bar { min-width: 120px; }
    .payoff-date { font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); white-space: nowrap; }
    .never-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-warning-text);
    }
    .never-label mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .never-date { font-size: 0.8125rem; color: var(--color-warning-text); font-weight: 500; }
    @media (max-width: 599px) {
      .card-title-row { flex-direction: column; align-items: flex-start; gap: 6px; }
      .overall-date { font-size: 0.75rem; }
      .projection-row {
        grid-template-columns: 1fr;
        gap: 4px;
      }
      .projection-bar { min-width: 0; }
    }
  `]
})
export class DebtCountdownComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  loading = signal(true);
  countdown = signal<DebtFreeCountdown | null>(null);

  ngOnInit(): void {
    this.dashboardService.getCountdown().subscribe({
      next: (data) => {
        this.countdown.set(data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  getBarColor(remainingMonths: number): 'primary' | 'accent' | 'warn' {
    if (remainingMonths <= 6) return 'primary';
    if (remainingMonths <= 24) return 'accent';
    return 'warn';
  }
}
