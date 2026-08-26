import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services/dashboard.service';
import { FinancialSummary } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-net-worth',
  standalone: true,
  imports: [CommonModule, MatIconModule, CurrencyPipe],
  template: `
    @if (summary()) {
      <div class="net-worth-card">
        <span class="nw-label">Net Worth</span>
        <span class="nw-value" [class.positive]="summary()!.netWorth >= 0" [class.negative]="summary()!.netWorth < 0">
          {{ summary()!.netWorth | currency:'USD':'symbol':'1.0-0' }}
        </span>
        @if (previousSummary()) {
          <span class="nw-trend" [class.up]="trend() >= 0" [class.down]="trend() < 0">
            <mat-icon class="trend-icon">{{ trend() >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
            {{ (trend() >= 0 ? '+' : '') }}{{ trend() | currency:'USD':'symbol':'1.0-0' }} vs last month
          </span>
        }
      </div>
    }
  `,
  styles: [`
    .net-worth-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 20px 24px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-md);
    }
    .nw-label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .nw-value {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .nw-value.positive { color: var(--color-value-green); }
    .nw-value.negative { color: var(--color-danger); }
    .nw-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-text-secondary);
    }
    .nw-trend.up { color: var(--color-success); }
    .nw-trend.down { color: var(--color-danger); }
    .trend-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    @media (max-width: 599px) {
      .net-worth-card {
        padding: 16px;
      }
      .nw-value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class NetWorthComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  summary = signal<FinancialSummary | null>(null);
  previousSummary = signal<FinancialSummary | null>(null);
  trend = signal<number>(0);

  ngOnInit(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    this.dashboardService.getFinancialSummary(currentYear, currentMonth).subscribe({
      next: (data) => this.summary.set(data),
      error: () => {}
    });

    // Fetch previous month for trend
    const prevDate = new Date(currentYear, currentMonth - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;

    this.dashboardService.getFinancialSummary(prevYear, prevMonth).subscribe({
      next: (data) => {
        this.previousSummary.set(data);
        const current = this.summary();
        if (current) {
          this.trend.set(current.netWorth - data.netWorth);
        }
      },
      error: () => {}
    });
  }
}
