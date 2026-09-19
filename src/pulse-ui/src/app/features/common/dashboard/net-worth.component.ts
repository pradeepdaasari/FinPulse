import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from '../../../core/services/dashboard.service';
import { FinancialSummary, NetWorthSnapshot } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-net-worth',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe, BaseChartDirective, MatButtonToggleModule],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (summary()) {
      <div class="net-worth-card">
        <button type="button" class="nw-top" (click)="toggleExpand()">
          <div class="nw-main">
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
          <mat-icon class="expand-icon" [class.rotated]="expanded()">expand_more</mat-icon>
        </button>

        @if (expanded()) {
          <div class="nw-breakdown">
            <!-- Assets -->
            <div class="breakdown-section">
              <div class="section-header assets">
                <mat-icon>account_balance</mat-icon>
                <span class="section-title">Assets</span>
                <span class="section-total positive">{{ summary()!.totalBankBalance | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
              @for (acct of summary()!.bankAccounts; track acct.id) {
                <div class="breakdown-row">
                  <span class="row-name">{{ acct.name }}</span>
                  <span class="row-type">{{ acct.type }}</span>
                  <span class="row-amount positive">{{ acct.balance | currency }}</span>
                </div>
              }
            </div>

            <!-- Credit Cards -->
            @if (summary()!.creditCards && summary()!.creditCards.length > 0) {
              <div class="breakdown-section">
                <div class="section-header debts">
                  <mat-icon>credit_card</mat-icon>
                  <span class="section-title">Credit Cards</span>
                  <span class="section-total negative">-{{ summary()!.totalCreditCardDebt | currency:'USD':'symbol':'1.0-0' }}</span>
                </div>
                @for (card of summary()!.creditCards; track card.id) {
                  <div class="breakdown-row">
                    <span class="row-name">{{ card.name }}</span>
                    <span class="row-amount negative">-{{ card.balance | currency }}</span>
                  </div>
                }
              </div>
            }

            <!-- Loans -->
            @if (summary()!.loans && summary()!.loans.length > 0) {
              <div class="breakdown-section">
                <div class="section-header debts">
                  <mat-icon>real_estate_agent</mat-icon>
                  <span class="section-title">Loans</span>
                  <span class="section-total negative">-{{ summary()!.totalLoanDebt | currency:'USD':'symbol':'1.0-0' }}</span>
                </div>
                @for (loan of summary()!.loans; track loan.id) {
                  <div class="breakdown-row">
                    <span class="row-name">{{ loan.name }}</span>
                    <span class="row-amount negative">-{{ loan.balance | currency }}</span>
                  </div>
                }
              </div>
            }

            <!-- Formula -->
            <div class="formula-row">
              <span>{{ summary()!.totalBankBalance | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="formula-op">−</span>
              <span>{{ summary()!.totalCreditCardDebt | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="formula-op">−</span>
              <span>{{ summary()!.totalLoanDebt | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="formula-op">=</span>
              <span class="formula-result" [class.positive]="summary()!.netWorth >= 0" [class.negative]="summary()!.netWorth < 0">
                {{ summary()!.netWorth | currency:'USD':'symbol':'1.0-0' }}
              </span>
            </div>

            <!-- Net Worth Trend Chart -->
            <div class="chart-section">
              <div class="chart-header">
                <div class="chart-label">
                  <mat-icon>show_chart</mat-icon>
                  <span>Trend</span>
                </div>
                <mat-button-toggle-group [value]="chartView()" (change)="onViewChange($event.value)" class="view-toggle">
                  <mat-button-toggle value="daily">Daily</mat-button-toggle>
                  <mat-button-toggle value="weekly">Weekly</mat-button-toggle>
                  <mat-button-toggle value="monthly">Monthly</mat-button-toggle>
                </mat-button-toggle-group>
              </div>
              @if (chartLoading()) {
                <div class="chart-loading"><mat-spinner diameter="24"></mat-spinner></div>
              } @else if (chartData()) {
                <div class="chart-container">
                  <canvas baseChart [data]="chartData()!" [options]="chartOptions" type="line"></canvas>
                </div>
              } @else {
                <div class="chart-empty">
                  <mat-icon>timeline</mat-icon>
                  <span>Data will appear as snapshots are captured daily</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .net-worth-card {
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-md);
      overflow: hidden;
    }
    .nw-top {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px;
      cursor: pointer; -webkit-tap-highlight-color: transparent;
      width: 100%; border: none; background: transparent;
      text-align: left; font-family: inherit; color: inherit;
      outline: none;
    }
    .nw-top:active { opacity: 0.8; }
    .nw-main { display: flex; flex-direction: column; gap: 4px; }
    .expand-icon {
      color: var(--color-text-muted);
      transition: transform 0.2s ease;
    }
    .expand-icon.rotated { transform: rotate(180deg); }
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
      display: flex; align-items: center; gap: 4px;
      font-size: var(--text-sm); font-weight: 500;
      color: var(--color-text-secondary);
    }
    .nw-trend.up { color: var(--color-success); }
    .nw-trend.down { color: var(--color-danger); }
    .trend-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Breakdown */
    .nw-breakdown {
      border-top: 1px solid var(--color-border);
      padding: 16px 24px 20px;
      display: flex; flex-direction: column; gap: 16px;
      animation: slideDown 0.2s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .breakdown-section {
      display: flex; flex-direction: column; gap: 6px;
    }
    .section-header {
      display: flex; align-items: center; gap: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--color-border);
    }
    .section-header mat-icon {
      font-size: 18px; width: 18px; height: 18px;
    }
    .section-header.assets mat-icon { color: var(--color-success); }
    .section-header.debts mat-icon { color: var(--color-danger); }
    .section-title {
      font-size: 0.8125rem; font-weight: 600;
      color: var(--color-text-secondary);
    }
    .section-total {
      margin-left: auto;
      font-size: 0.875rem; font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .breakdown-row {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 0 4px 26px;
      font-size: 0.8125rem;
    }
    .row-name { font-weight: 500; }
    .row-type {
      font-size: 0.7rem; color: var(--color-text-muted);
      background: var(--color-bg); padding: 1px 6px; border-radius: 4px;
    }
    .row-amount {
      margin-left: auto;
      font-weight: 600; font-variant-numeric: tabular-nums;
    }

    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }

    .formula-row {
      display: flex; align-items: center; gap: 6px;
      flex-wrap: wrap;
      padding: 10px 12px;
      background: var(--color-bg);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem; font-weight: 600;
      color: var(--color-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .formula-op {
      color: var(--color-text-muted); font-weight: 400;
    }
    .formula-result { font-weight: 700; }

    .chart-section {
      border-top: 1px solid var(--color-border);
      padding-top: 16px;
    }
    .chart-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px; gap: 8px;
    }
    .chart-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8125rem; font-weight: 600;
      color: var(--color-text-secondary);
    }
    .chart-label mat-icon {
      font-size: 16px; width: 16px; height: 16px;
      color: #6366f1;
    }
    .view-toggle {
      border-radius: var(--radius-sm) !important;
      overflow: hidden;
    }
    .view-toggle .mat-button-toggle-appearance-standard {
      height: 28px !important;
    }
    :host ::ng-deep .view-toggle .mat-button-toggle-label-content {
      font-size: 0.7rem !important;
      padding: 0 10px !important;
      line-height: 28px !important;
      font-weight: 600;
    }
    .chart-container { position: relative; height: 200px; }
    .chart-loading {
      display: flex; justify-content: center; align-items: center;
      height: 120px;
    }
    .chart-empty {
      display: flex; align-items: center; gap: 8px;
      padding: 16px; color: var(--color-text-muted);
      font-size: 0.8125rem;
    }
    .chart-empty mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }

    @media (max-width: 599px) {
      .nw-top { padding: 16px; }
      .nw-value { font-size: 1.5rem; }
      .nw-breakdown { padding: 12px 16px 16px; }
      .breakdown-row { padding-left: 26px; font-size: 0.8rem; }
      .formula-row { font-size: 0.75rem; }
      .chart-container { height: 160px; }
    }
  `]
})
export class NetWorthComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  summary = signal<FinancialSummary | null>(null);
  previousSummary = signal<FinancialSummary | null>(null);
  trend = signal<number>(0);
  expanded = signal(false);
  chartData = signal<ChartConfiguration<'line'>['data'] | null>(null);
  chartLoading = signal(false);
  chartView = signal<'daily' | 'weekly' | 'monthly'>('weekly');
  private rawSnapshots: NetWorthSnapshot[] = [];
  private chartFetched = false;

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => '$' + Number(ctx.parsed.y).toLocaleString()
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => '$' + Number(value).toLocaleString()
        }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  toggleExpand(): void {
    this.expanded.set(!this.expanded());
    if (this.expanded() && !this.chartFetched) {
      this.loadChart();
    }
    this.cdr.detectChanges();
  }

  onViewChange(view: 'daily' | 'weekly' | 'monthly'): void {
    this.chartView.set(view);
    this.buildChartData();
    this.cdr.detectChanges();
  }

  private loadChart(): void {
    this.chartFetched = true;
    this.chartLoading.set(true);
    this.dashboardService.getNetWorthHistory(52).subscribe({
      next: (snapshots) => {
        this.rawSnapshots = snapshots;
        this.buildChartData();
        this.chartLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.chartLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private buildChartData(): void {
    if (this.rawSnapshots.length === 0) {
      this.chartData.set(null);
      return;
    }

    const view = this.chartView();
    const now = new Date();
    const cutoffDays = view === 'daily' ? 90 : view === 'weekly' ? 180 : 730;

    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - cutoffDays);
    const filtered = this.rawSnapshots.filter(s => new Date(s.date) >= cutoff);
    if (filtered.length === 0) {
      this.chartData.set(null);
      return;
    }

    const points = view === 'daily'
      ? this.aggregateDaily(filtered)
      : view === 'weekly'
        ? this.aggregateWeekly(filtered)
        : this.aggregateMonthly(filtered);

    this.chartData.set({
      labels: points.map(p => p.label),
      datasets: [{
        label: 'Net Worth',
        data: points.map(p => p.value),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#6366f1',
        pointRadius: points.length > 30 ? 2 : 4,
        pointHoverRadius: 6
      }]
    });
  }

  private aggregateDaily(snapshots: NetWorthSnapshot[]): { label: string; value: number }[] {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return snapshots
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(s => {
        const d = new Date(s.date);
        return { label: monthNames[d.getMonth()] + ' ' + d.getDate(), value: s.netWorth };
      });
  }

  private aggregateWeekly(snapshots: NetWorthSnapshot[]): { label: string; value: number }[] {
    const weekMap = new Map<string, NetWorthSnapshot>();
    for (const s of snapshots) {
      const d = new Date(s.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weekMap.set(key, s);
    }
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, s]) => {
        const d = new Date(key);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return { label: monthNames[d.getMonth()] + ' ' + d.getDate(), value: s.netWorth };
      });
  }

  private aggregateMonthly(snapshots: NetWorthSnapshot[]): { label: string; value: number }[] {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap = new Map<string, NetWorthSnapshot>();
    for (const s of snapshots) {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, s);
    }
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, s]) => {
        const d = new Date(s.date);
        return { label: monthNames[d.getMonth()] + ' ' + d.getFullYear().toString().slice(2), value: s.netWorth };
      });
  }

  ngOnInit(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    this.dashboardService.getFinancialSummary(currentYear, currentMonth).subscribe({
      next: (data) => { this.summary.set(data); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });

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
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }
}
