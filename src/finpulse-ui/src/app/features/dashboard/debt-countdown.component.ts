import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardService } from '../../core/services/dashboard.service';
import { DebtFreeCountdown } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-debt-countdown',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, CurrencyPipe, DatePipe],
  template: `
    @if (countdown()) {
      <mat-card class="countdown-card">
        <mat-card-header>
          <mat-card-title>
            <div class="card-title-row">
              <span class="title-with-icon"><mat-icon class="card-title-icon">timer</mat-icon> Debt-Free Countdown</span>
              <span class="overall-date">
                <mat-icon>flag</mat-icon>
                {{ countdown()!.overallDebtFreeDate | date:'MMM yyyy' }}
                ({{ countdown()!.overallRemainingMonths }} months)
              </span>
            </div>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="projections">
            @for (p of countdown()!.projections; track p.debtName) {
              <div class="projection-row">
                <div class="projection-info">
                  <span class="debt-name">{{ p.debtName }}</span>
                  <span class="debt-meta">{{ p.debtType }} &middot; {{ p.currentBalance | currency }} &middot; {{ p.remainingMonths }} mo</span>
                </div>
                <div class="projection-bar">
                  <mat-progress-bar mode="determinate" [value]="p.progressPercent" [color]="getBarColor(p.remainingMonths)"></mat-progress-bar>
                </div>
                <span class="payoff-date">{{ p.projectedPayoffDate | date:'MMM yyyy' }}</span>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .countdown-card { margin-top: var(--spacing-md); }
    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
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
    .title-with-icon { display: flex; align-items: center; }
    .card-title-icon { font-size: 20px; width: 20px; height: 20px; margin-right: 8px; color: var(--color-primary); }
    .overall-date mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .projections { display: flex; flex-direction: column; gap: 14px; }
    .projection-row {
      display: grid;
      grid-template-columns: 1fr 2fr auto;
      align-items: center;
      gap: 16px;
    }
    .projection-info { display: flex; flex-direction: column; }
    .debt-name { font-weight: 600; font-size: 0.875rem; }
    .debt-meta { font-size: 0.6875rem; color: var(--color-text-muted); }
    .projection-bar { min-width: 120px; }
    .payoff-date { font-size: 0.75rem; font-weight: 500; color: var(--color-text-secondary); white-space: nowrap; }
    @media (max-width: 600px) {
      .projection-row {
        grid-template-columns: 1fr;
        gap: 6px;
      }
    }
  `]
})
export class DebtCountdownComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  countdown = signal<DebtFreeCountdown | null>(null);

  ngOnInit(): void {
    this.dashboardService.getCountdown().subscribe(data => {
      this.countdown.set(data);
    });
  }

  getBarColor(remainingMonths: number): 'primary' | 'accent' | 'warn' {
    if (remainingMonths <= 6) return 'primary';
    if (remainingMonths <= 24) return 'accent';
    return 'warn';
  }
}
