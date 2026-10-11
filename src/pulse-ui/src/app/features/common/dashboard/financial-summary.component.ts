import { Component, OnInit, Input, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummary, FinancialSummary } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, LocalDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (data()) {
      <div class="panels">
        <!-- Left Panel: Cash Flow -->
        <div class="panel">
            <div class="panel-header">
              <mat-icon class="panel-icon cash-icon">account_balance_wallet</mat-icon>
              <span class="panel-title">Cash Flow</span>
            </div>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">Bank Balance</span>
                <span class="metric-value blue">{{ data()!.totalBankBalance | currency }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Income</span>
                <span class="metric-value green">{{ data()!.totalIncome | currency }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Expenses</span>
                <span class="metric-value red">{{ data()!.totalExpenses | currency }}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Net Cash Flow</span>
                <span class="metric-value" [class.green]="data()!.netCashFlow >= 0" [class.red]="data()!.netCashFlow < 0">
                  {{ data()!.netCashFlow | currency }}
                </span>
              </div>
            </div>
            <div class="pace-bar">
              <mat-icon class="pace-icon" [class.pace-ahead]="data()!.paceStatus === 'ahead'" [class.pace-on]="data()!.paceStatus === 'on-track'" [class.pace-over]="data()!.paceStatus === 'over'">
                {{ data()!.paceStatus === 'over' ? 'warning' : 'check_circle' }}
              </mat-icon>
              <span class="pace-text">{{ data()!.paceMessage }}</span>
            </div>
            @if (data()!.tradingGains !== 0 || data()!.tradingLosses !== 0) {
              <div class="trading-strip">
                <span class="trading-item"><mat-icon class="t-icon green">show_chart</mat-icon> +{{ data()!.tradingGains | currency }}</span>
                <span class="trading-item"><mat-icon class="t-icon red">trending_down</mat-icon> -{{ data()!.tradingLosses | currency }}</span>
                <span class="trading-item trading-net">
                  <mat-icon class="t-icon" [class.green]="data()!.tradingNetPnL >= 0" [class.red]="data()!.tradingNetPnL < 0">candlestick_chart</mat-icon>
                  Net: {{ data()!.tradingNetPnL | currency }}
                </span>
              </div>
            }
        </div>

        <!-- Right Panel: Debt Overview -->
        @if (debtSummary) {
          <div class="panel">
              <div class="panel-header">
                <mat-icon class="panel-icon debt-icon">trending_down</mat-icon>
                <span class="panel-title">Debt Overview</span>
              </div>
              <div class="metrics-grid">
                <div class="metric">
                  <span class="metric-label">Total Debt</span>
                  <span class="metric-value red">{{ debtSummary.totalDebt | currency }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Monthly Payment</span>
                  <span class="metric-value blue">{{ debtSummary.totalMonthlyPayment | currency }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Debt-Free Date</span>
                  <span class="metric-value purple">{{ debtSummary.estimatedDebtFreeDate | localDate:'MMM yyyy' }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Active Debts</span>
                  <span class="metric-value amber">{{ debtSummary.numberOfDebts }}</span>
                </div>
              </div>
              <div class="debt-progress">
                <div class="debt-bar-track">
                  <div class="debt-bar-fill" [style.width.%]="data()!.debtPaidPercent"></div>
                </div>
                <span class="debt-bar-label">{{ data()!.debtPaidPercent | number:'1.0-0' }}% paid off this month</span>
              </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    .panel {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      padding: 20px;
    }
    .panel-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }
    .panel-icon {
      width: 32px;
      height: 32px;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .cash-icon { background: rgba(21,101,192,0.1); color: #1565c0; }
    .debt-icon { background: rgba(211,47,47,0.1); color: #d32f2f; }
    .panel-title {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-secondary);
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px 24px;
      margin-bottom: 14px;
    }
    .metric-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 2px;
    }
    .metric-value {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .metric-value.blue { color: var(--color-primary); }
    .metric-value.green { color: var(--color-success); }
    .metric-value.red { color: var(--color-danger); }
    .metric-value.purple { color: #6a1b9a; }
    .metric-value.amber { color: #e65100; }

    /* Pace bar */
    .pace-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      background: var(--color-surface-secondary, rgba(0,0,0,0.03));
      margin-bottom: 10px;
    }
    .pace-icon { font-size: 16px; width: 16px; height: 16px; }
    .pace-ahead { color: var(--color-success); }
    .pace-on { color: var(--color-primary); }
    .pace-over { color: var(--color-danger); }
    .pace-text { font-size: 0.78rem; font-weight: 500; color: var(--color-text-secondary); }

    /* Trading strip */
    .trading-strip {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-top: 8px;
      border-top: 1px solid var(--color-border, rgba(0,0,0,0.08));
      font-size: 0.82rem;
      font-weight: 600;
    }
    .trading-item { display: flex; align-items: center; gap: 4px; }
    .t-icon { font-size: 14px; width: 14px; height: 14px; }
    .t-icon.green { color: var(--color-success); }
    .t-icon.red { color: var(--color-danger); }
    .trading-net { margin-left: auto; }

    /* Debt progress */
    .debt-progress { margin-top: 4px; }
    .debt-bar-track {
      height: 6px;
      background: var(--color-border, rgba(0,0,0,0.08));
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .debt-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-success), #66bb6a);
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .debt-bar-label {
      font-size: 0.72rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    @media (max-width: 900px) {
      .panels { grid-template-columns: 1fr; }
    }
    @media (max-width: 599px) {
      .panel { padding: 14px; -webkit-tap-highlight-color: transparent; transition: transform 0.1s ease; }
      .panel:active { transform: scale(0.98); }
      .metrics-grid { gap: 10px 16px; }
      .metric-value { font-size: 1.05rem; }
      .trading-strip { flex-wrap: wrap; gap: 8px; }
    }
  `]
})
export class FinancialSummaryComponent implements OnInit {
  @Input() debtSummary: DashboardSummary | null = null;

  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  loading = signal(true);
  data = signal<FinancialSummary | null>(null);

  ngOnInit(): void {
    this.dashboardService.getFinancialSummary().subscribe({
      next: (summary) => { this.data.set(summary); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }
}
