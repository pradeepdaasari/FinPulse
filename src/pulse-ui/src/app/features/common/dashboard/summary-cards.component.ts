import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { DashboardSummary } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule, MatIconModule, CurrencyPipe, DatePipe, LocalDatePipe],
  template: `
    <div class="summary-grid">
      <div class="stat-card c1">
        <div class="stat-icon icon-blue">
          <mat-icon>account_balance_wallet</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">Total Debt</span>
          <span class="stat-value">{{ summary.totalDebt | currency }}</span>
        </div>
      </div>

      <div class="stat-card c2">
        <div class="stat-icon icon-green">
          <mat-icon>payments</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">Monthly Payment</span>
          <span class="stat-value">{{ summary.totalMonthlyPayment | currency }}</span>
        </div>
      </div>

      <div class="stat-card c3">
        <div class="stat-icon icon-purple">
          <mat-icon>event_available</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">Debt-Free Date</span>
          <span class="stat-value">{{ summary.estimatedDebtFreeDate | localDate:'mediumDate' }}</span>
        </div>
      </div>

      <div class="stat-card c4">
        <div class="stat-icon icon-red">
          <mat-icon>trending_down</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">Interest Paid</span>
          <span class="stat-value">{{ summary.totalInterestPaid | currency }}</span>
        </div>
      </div>

      <div class="stat-card c5">
        <div class="stat-icon icon-amber">
          <mat-icon>format_list_numbered</mat-icon>
        </div>
        <div class="stat-info">
          <span class="stat-label">Number of Debts</span>
          <span class="stat-value">{{ summary.numberOfDebts }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--spacing-md);
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: 16px;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xs);
      transition: box-shadow var(--transition-fast);
    }
    .stat-card:hover { box-shadow: var(--shadow-sm); }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--transition-fast);
      flex-shrink: 0;
    }
    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .stat-card:hover .stat-icon {
      transform: scale(1.08);
    }
    .icon-blue { background: var(--gradient-icon-blue); color: var(--color-primary); }
    .icon-green { background: var(--gradient-icon-green); color: var(--color-success); }
    .icon-purple { background: var(--gradient-icon-purple); color: var(--color-accent); }
    .icon-red { background: linear-gradient(135deg, rgba(198,40,40,0.12), rgba(198,40,40,0.04)); color: #c62828; }
    .icon-amber { background: var(--gradient-icon-amber); color: var(--color-warning); }
    .stat-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .stat-label {
      font-size: 0.75rem; color: var(--color-text-muted);
      font-weight: 500; letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 1.5rem; font-weight: 700;
      letter-spacing: -0.02em;
    }
    .c1 { border-left: 4px solid var(--color-danger); }
    .c2 { border-left: 4px solid var(--color-value-blue); }
    .c3 { border-left: 4px solid var(--color-value-green); }
    .c4 { border-left: 4px solid #c62828; }
    .c5 { border-left: 4px solid var(--color-value-purple); }
    .c1 .stat-value { color: var(--color-danger); }
    .c2 .stat-value { color: var(--color-value-blue); }
    .c3 .stat-value { color: var(--color-value-green); }
    .c4 .stat-value { color: #c62828; }
    .c5 .stat-value { color: var(--color-value-purple); }
    @media (max-width: 599px) {
      .summary-grid {
        display: flex;
        overflow-x: auto;
        gap: 10px;
        padding-bottom: 4px;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .summary-grid::-webkit-scrollbar { display: none; }
      .stat-card {
        flex: 0 0 auto;
        min-width: 160px;
        padding: 12px;
        gap: 10px;
      }
      .stat-icon { width: 36px; height: 36px; border-radius: 10px; }
      .stat-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .stat-value { font-size: 1rem; }
      .stat-label { font-size: 0.65rem; }
    }
  `]
})
export class SummaryCardsComponent {
  @Input({ required: true }) summary!: DashboardSummary;
}
