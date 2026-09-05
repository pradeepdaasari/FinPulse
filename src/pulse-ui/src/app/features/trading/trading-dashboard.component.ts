import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TradingService } from '../../core/services/trading.service';
import { TradingDashboard } from '../../core/models/trading.model';
import { toLocalDateString } from '../../core/utils/date-utils';

@Component({
  selector: 'app-trading-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CurrencyPipe, DecimalPipe,
    MatCardModule, MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatDatepickerModule, MatFormFieldModule, MatInputModule,
    BaseChartDirective, SkeletonLoaderComponent, PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="loadDashboard()">
    <!-- Header Row -->
    <div class="header-row">
      <h2 class="page-title">Trading Dashboard</h2>
      <div class="period-controls">
        <mat-button-toggle-group [value]="period()" (change)="onPeriodChange($event.value)" hideSingleSelectionIndicator>
          <mat-button-toggle value="ytd">YTD</mat-button-toggle>
          <mat-button-toggle value="1m">1M</mat-button-toggle>
          <mat-button-toggle value="3m">3M</mat-button-toggle>
          <mat-button-toggle value="6m">6M</mat-button-toggle>
          <mat-button-toggle value="1y">1Y</mat-button-toggle>
          <mat-button-toggle value="all">All</mat-button-toggle>
        </mat-button-toggle-group>
        <div class="custom-range">
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>From</mat-label>
            <input matInput [matDatepicker]="fromPicker" [(ngModel)]="customFrom">
            <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>To</mat-label>
            <input matInput [matDatepicker]="toPicker" [(ngModel)]="customTo">
            <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </mat-form-field>
          <button mat-flat-button color="primary" class="go-btn" (click)="onCustomRange()">Go</button>
        </div>
      </div>
    </div>

    @if (loading()) {
      <app-skeleton type="dashboard"></app-skeleton>
    } @else if (dashboard()) {

    <!-- Top Stats Row -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value stat-large" [class.positive]="dashboard()!.netPnl >= 0" [class.negative]="dashboard()!.netPnl < 0">
          {{ dashboard()!.netPnl | currency:'USD':'symbol':'1.0-0' }}
        </span>
        <span class="stat-label">Net P&L</span>
        <span class="stat-sub">Gross: {{ dashboard()!.totalPnl | currency:'USD':'symbol':'1.0-0' }}</span>
      </div>
      <div class="stat-card">
        <div class="win-rate-display">
          <span class="stat-value stat-large">{{ dashboard()!.winRate }}%</span>
          <div class="win-rate-bar">
            <div class="win-rate-fill" [style.width.%]="dashboard()!.winRate"></div>
          </div>
        </div>
        <span class="stat-label">Win Rate</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-large">{{ dashboard()!.profitFactor | number:'1.2-2' }}</span>
        <span class="stat-label">Profit Factor</span>
      </div>
      <div class="stat-card">
        <div class="avg-win-loss">
          <span class="stat-value positive">{{ dashboard()!.avgWin | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="stat-divider">/</span>
          <span class="stat-value negative">{{ dashboard()!.avgLoss | currency:'USD':'symbol':'1.0-0' }}</span>
        </div>
        <span class="stat-label">Avg Win / Avg Loss</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-large">{{ dashboard()!.totalTrades }}</span>
        <span class="stat-label">Total Trades</span>
      </div>
      <div class="stat-card">
        <span class="stat-value stat-large fees-value">{{ dashboard()!.totalFees | currency:'USD':'symbol':'1.0-0' }}</span>
        <span class="stat-label">Total Fees</span>
        @if (feesPercent() !== null) {
          <span class="stat-sub fees-sub">{{ feesPercent() | number:'1.1-1' }}% of gross P&L</span>
        }
      </div>
    </div>

    <!-- Mentor Insight Card -->
    @if (insights().length > 0) {
      <mat-card class="mentor-card">
        <mat-card-content>
          <div class="mentor-header">
            <mat-icon class="mentor-icon">psychology</mat-icon>
            <span class="mentor-title">Mentor Insights</span>
          </div>
          <ul class="insight-list">
            @for (insight of insights(); track $index) {
              <li>{{ insight }}</li>
            }
          </ul>
        </mat-card-content>
      </mat-card>
    }

    <!-- Monthly P&L Chart -->
    @if (monthlyChartData()) {
      <mat-card class="chart-card">
        <mat-card-content>
          <h3 class="section-title">Monthly P&L</h3>
          <div class="chart-container">
            <canvas baseChart
              [data]="monthlyChartData()!"
              [options]="monthlyChartOptions"
              type="bar">
            </canvas>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- Day of Week & Instrument -->
    <div class="two-col">
      <mat-card class="table-card">
        <mat-card-content>
          <h3 class="section-title">Performance by Day of Week</h3>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr><th>Day</th><th>Trades</th><th>Win Rate</th><th>Avg P&L</th><th>Net P&L</th></tr>
              </thead>
              <tbody>
                @for (row of dashboard()!.dayOfWeek; track row.day) {
                  <tr [class.best-row]="row.day === bestDay()" [class.worst-row]="row.day === worstDay()">
                    <td class="col-name">{{ row.day }}</td>
                    <td>{{ row.trades }}</td>
                    <td>{{ row.winRate }}%</td>
                    <td [class.positive]="row.avgPnl >= 0" [class.negative]="row.avgPnl < 0">{{ row.avgPnl | currency:'USD':'symbol':'1.0-0' }}</td>
                    <td [class.positive]="row.pnl >= 0" [class.negative]="row.pnl < 0">{{ row.pnl | currency:'USD':'symbol':'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card class="table-card">
        <mat-card-content>
          <h3 class="section-title">Performance by Instrument</h3>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr><th>Instrument</th><th>Trades</th><th>Win Rate</th><th>Avg P&L</th><th>Net P&L</th></tr>
              </thead>
              <tbody>
                @for (row of sortedInstruments(); track row.instrument) {
                  <tr>
                    <td class="col-name">{{ row.instrument }}</td>
                    <td>{{ row.trades }}</td>
                    <td>{{ row.winRate }}%</td>
                    <td [class.positive]="row.avgPnl >= 0" [class.negative]="row.avgPnl < 0">{{ row.avgPnl | currency:'USD':'symbol':'1.0-0' }}</td>
                    <td [class.positive]="row.pnl >= 0" [class.negative]="row.pnl < 0">{{ row.pnl | currency:'USD':'symbol':'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Setup & Time of Day -->
    <div class="two-col">
      <mat-card class="table-card">
        <mat-card-content>
          <h3 class="section-title">Performance by Setup</h3>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr><th>Setup</th><th>Trades</th><th>Win Rate</th><th>Avg P&L</th><th>Net P&L</th></tr>
              </thead>
              <tbody>
                @for (row of sortedSetups(); track row.setupId) {
                  <tr>
                    <td class="col-name">{{ row.setupName }}</td>
                    <td>{{ row.trades }}</td>
                    <td>{{ row.winRate }}%</td>
                    <td [class.positive]="row.avgPnl >= 0" [class.negative]="row.avgPnl < 0">{{ row.avgPnl | currency:'USD':'symbol':'1.0-0' }}</td>
                    <td [class.positive]="row.pnl >= 0" [class.negative]="row.pnl < 0">{{ row.pnl | currency:'USD':'symbol':'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
      <mat-card class="table-card">
        <mat-card-content>
          <h3 class="section-title">Performance by Time of Day</h3>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr><th>Time</th><th>Trades</th><th>Win Rate</th><th>Avg P&L</th><th>Net P&L</th></tr>
              </thead>
              <tbody>
                @for (row of dashboard()!.timeOfDay; track row.bucket) {
                  <tr>
                    <td class="col-name">{{ row.bucket }}</td>
                    <td>{{ row.trades }}</td>
                    <td>{{ row.winRate }}%</td>
                    <td [class.positive]="row.avgPnl >= 0" [class.negative]="row.avgPnl < 0">{{ row.avgPnl | currency:'USD':'symbol':'1.0-0' }}</td>
                    <td [class.positive]="row.pnl >= 0" [class.negative]="row.pnl < 0">{{ row.pnl | currency:'USD':'symbol':'1.0-0' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Call vs Put Comparison -->
    @if (callData() || putData()) {
      <div class="two-col">
        @if (callData(); as call) {
          <mat-card class="option-card">
            <mat-card-content>
              <h3 class="section-title">Calls</h3>
              <div class="option-stats">
                <div class="option-stat"><span class="option-val">{{ call.trades }}</span><span class="option-lbl">Trades</span></div>
                <div class="option-stat"><span class="option-val">{{ call.winRate }}%</span><span class="option-lbl">Win Rate</span></div>
                <div class="option-stat"><span class="option-val" [class.positive]="call.avgPnl >= 0" [class.negative]="call.avgPnl < 0">{{ call.avgPnl | currency:'USD':'symbol':'1.0-0' }}</span><span class="option-lbl">Avg P&L</span></div>
                <div class="option-stat"><span class="option-val" [class.positive]="call.pnl >= 0" [class.negative]="call.pnl < 0">{{ call.pnl | currency:'USD':'symbol':'1.0-0' }}</span><span class="option-lbl">Total P&L</span></div>
              </div>
            </mat-card-content>
          </mat-card>
        }
        @if (putData(); as put) {
          <mat-card class="option-card">
            <mat-card-content>
              <h3 class="section-title">Puts</h3>
              <div class="option-stats">
                <div class="option-stat"><span class="option-val">{{ put.trades }}</span><span class="option-lbl">Trades</span></div>
                <div class="option-stat"><span class="option-val">{{ put.winRate }}%</span><span class="option-lbl">Win Rate</span></div>
                <div class="option-stat"><span class="option-val" [class.positive]="put.avgPnl >= 0" [class.negative]="put.avgPnl < 0">{{ put.avgPnl | currency:'USD':'symbol':'1.0-0' }}</span><span class="option-lbl">Avg P&L</span></div>
                <div class="option-stat"><span class="option-val" [class.positive]="put.pnl >= 0" [class.negative]="put.pnl < 0">{{ put.pnl | currency:'USD':'symbol':'1.0-0' }}</span><span class="option-lbl">Total P&L</span></div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }

    <!-- Today Snapshot -->
    <div class="today-row">
      <div class="today-card">
        <span class="today-val">{{ dashboard()!.tradesToday }}</span>
        <span class="today-lbl">Trades Today</span>
      </div>
      <div class="today-card">
        <span class="today-val" [class.positive]="dashboard()!.pnlToday >= 0" [class.negative]="dashboard()!.pnlToday < 0">
          {{ dashboard()!.pnlToday | currency:'USD':'symbol':'1.0-0' }}
        </span>
        <span class="today-lbl">P&L Today</span>
      </div>
      <div class="today-card">
        <span class="today-val">{{ dashboard()!.checklistCompliance }}%</span>
        <span class="today-lbl">Checklist Compliance</span>
      </div>
    </div>

    }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .header-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 12px; margin-bottom: 20px;
    }
    .page-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--color-text); }
    .period-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .custom-range { display: flex; align-items: center; gap: 8px; }
    .date-field { width: 130px; }
    .date-field .mat-mdc-form-field-infix { padding-top: 8px; padding-bottom: 8px; }
    .go-btn { height: 40px; min-width: 56px; padding: 0 16px; border-radius: 10px; }

    /* Stats Grid */
    .stats-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 12px; margin-bottom: 20px;
    }
    .stat-card {
      background: var(--color-surface); border-radius: var(--radius-md);
      padding: 16px; box-shadow: var(--shadow-sm);
      display: flex; flex-direction: column; align-items: center;
      text-align: center; gap: 4px;
    }
    .stat-value { font-weight: 700; font-variant-numeric: tabular-nums; }
    .stat-large { font-size: 1.4rem; }
    .stat-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
    .stat-sub { font-size: 0.7rem; color: var(--color-text-muted); }
    .stat-divider { color: var(--color-text-muted); margin: 0 4px; font-weight: 400; }
    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }
    .fees-value { color: var(--color-danger); }
    .fees-sub { color: var(--color-danger); font-weight: 600; }
    .avg-win-loss { display: flex; align-items: baseline; }
    .win-rate-display { display: flex; flex-direction: column; align-items: center; width: 100%; gap: 6px; }
    .win-rate-bar {
      width: 100%; height: 6px; border-radius: 3px;
      background: var(--color-danger); overflow: hidden; opacity: 0.7;
    }
    .win-rate-fill { height: 100%; background: var(--color-success); border-radius: 3px; transition: width 0.4s ease; }

    /* Mentor Card */
    .mentor-card {
      margin-bottom: 20px; border-radius: var(--radius-md);
      background: color-mix(in srgb, #f59e0b 8%, var(--color-surface));
      border-left: 4px solid #f59e0b;
    }
    .mentor-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .mentor-icon { color: #f59e0b; }
    .mentor-title { font-weight: 700; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.02em; }
    .insight-list {
      margin: 0; padding-left: 20px;
      list-style: none;
    }
    .insight-list li {
      position: relative; font-size: 0.875rem; line-height: 1.5;
      color: var(--color-text); padding: 4px 0;
    }
    .insight-list li::before {
      content: '\\2022'; position: absolute; left: -16px;
      color: #f59e0b; font-weight: 700;
    }

    /* Chart Card */
    .chart-card { margin-bottom: 20px; border-radius: var(--radius-md); }
    .chart-container { position: relative; height: 280px; }

    /* Section Title */
    .section-title {
      font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.03em; color: var(--color-text-muted); margin: 0 0 12px;
    }

    /* Two Column Grid */
    .two-col {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 16px; margin-bottom: 20px;
    }

    /* Table Card */
    .table-card { border-radius: var(--radius-md); }
    .table-scroll { overflow-x: auto; }
    .data-table {
      width: 100%; border-collapse: collapse; font-size: 0.8rem;
      font-variant-numeric: tabular-nums;
    }
    .data-table th {
      text-align: left; padding: 8px 10px; font-weight: 600;
      color: var(--color-text-muted); font-size: 0.72rem;
      text-transform: uppercase; letter-spacing: 0.03em;
      border-bottom: 2px solid var(--color-text-muted);
    }
    .data-table td { padding: 8px 10px; border-bottom: 1px solid rgba(128, 128, 128, 0.1); }
    .data-table tbody tr:nth-child(even) { background: rgba(128, 128, 128, 0.04); }
    .data-table .col-name { font-weight: 600; }
    .best-row { background: rgba(52, 199, 89, 0.08) !important; }
    .worst-row { background: rgba(255, 59, 48, 0.08) !important; }

    /* Option Cards */
    .option-card { border-radius: var(--radius-md); }
    .option-stats {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
    }
    .option-stat { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .option-val { font-size: 1.1rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .option-lbl { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }

    /* Today Row */
    .today-row {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 12px; margin-bottom: 20px;
    }
    .today-card {
      background: var(--color-surface); border-radius: var(--radius-sm);
      padding: 14px; box-shadow: var(--shadow-sm);
      display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px;
    }
    .today-val { font-size: 1.2rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .today-lbl { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }

    /* Mobile */
    @media (max-width: 599px) {
      .header-row { flex-direction: column; }
      .period-controls { align-items: flex-start; width: 100%; }
      .custom-range { flex-wrap: wrap; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .two-col { grid-template-columns: 1fr; }
      .today-row { grid-template-columns: 1fr; }
      .chart-container { height: 220px; }
    }
  `]
})
export class TradingDashboardComponent implements OnInit {
  private tradingService = inject(TradingService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  dashboard = signal<TradingDashboard | null>(null);
  period = signal<string>('ytd');
  customFrom: Date | null = null;
  customTo: Date | null = null;

  private monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  feesPercent = computed(() => {
    const d = this.dashboard();
    if (!d || d.totalPnl === 0) return null;
    return Math.abs(d.totalFees / d.totalPnl) * 100;
  });

  sortedInstruments = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [...d.byInstrument].sort((a, b) => b.trades - a.trades);
  });

  sortedSetups = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [...d.bySetup].sort((a, b) => b.trades - a.trades);
  });

  bestDay = computed(() => {
    const d = this.dashboard();
    if (!d || d.dayOfWeek.length === 0) return '';
    return d.dayOfWeek.reduce((a, b) => a.pnl > b.pnl ? a : b).day;
  });

  worstDay = computed(() => {
    const d = this.dashboard();
    if (!d || d.dayOfWeek.length === 0) return '';
    return d.dayOfWeek.reduce((a, b) => a.pnl < b.pnl ? a : b).day;
  });

  callData = computed(() => {
    const d = this.dashboard();
    if (!d) return null;
    return d.byOptionType.find(o => o.optionType.toLowerCase() === 'call') ?? null;
  });

  putData = computed(() => {
    const d = this.dashboard();
    if (!d) return null;
    return d.byOptionType.find(o => o.optionType.toLowerCase() === 'put') ?? null;
  });

  monthlyChartData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.monthlyPnl.length === 0) return null;
    const labels = d.monthlyPnl.map(m => `${this.monthNames[m.month - 1]} ${m.year}`);
    const values = d.monthlyPnl.map(m => m.netPnl);
    const colors = values.map(v => v >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)');
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
        maxBarThickness: 40,
      }]
    };
  });

  monthlyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y ?? 0;
            return (val >= 0 ? '+$' : '-$') + Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: 'rgba(128, 128, 128, 0.1)' },
        ticks: {
          callback: (value) => {
            const v = Number(value);
            return (v >= 0 ? '$' : '-$') + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 0 });
          }
        }
      }
    }
  };

  insights = computed<string[]>(() => {
    const d = this.dashboard();
    if (!d || d.totalTrades === 0) return ['Start logging trades to see personalized insights here. Discipline is built one trade at a time.'];
    const msgs: string[] = [];

    if (d.winRate >= 50) {
      msgs.push(`Your win rate of ${d.winRate}% shows solid execution. Keep following your process.`);
    } else if (d.winRate > 0) {
      msgs.push(`Win rate at ${d.winRate}% -- focus on A+ setups only. Fewer, higher-quality trades compound faster.`);
    }

    if (d.profitFactor < 1 && d.profitFactor > 0) {
      msgs.push('Your profit factor is below 1 -- wins are not covering losses. Consider tightening stops or reducing position size.');
    } else if (d.profitFactor >= 2) {
      msgs.push(`Profit factor of ${d.profitFactor.toFixed(2)} is excellent. You are letting winners run and cutting losers.`);
    }

    if (d.totalPnl > 0 && d.totalFees > 0) {
      const feePct = (d.totalFees / d.totalPnl) * 100;
      if (feePct > 10) {
        msgs.push(`You have paid $${d.totalFees.toLocaleString('en-US', { maximumFractionDigits: 0 })} in fees (${feePct.toFixed(1)}% of gross P&L). Consider if some of these trades were necessary.`);
      }
    }

    if (d.dayOfWeek.length > 0) {
      const worst = d.dayOfWeek.reduce((a, b) => a.winRate < b.winRate ? a : b);
      const best = d.dayOfWeek.reduce((a, b) => a.winRate > b.winRate ? a : b);
      if (worst.trades >= 3 && worst.winRate < 35 && best.winRate - worst.winRate > 15) {
        msgs.push(`Your ${worst.day} trades have only ${worst.winRate}% win rate. Consider sitting out or reducing size on ${worst.day}s.`);
      }
    }

    if (d.bySetup.length > 0) {
      const losingSetups = d.bySetup.filter(s => s.pnl < 0 && s.trades >= 3);
      if (losingSetups.length > 0) {
        const worst = losingSetups.reduce((a, b) => a.pnl < b.pnl ? a : b);
        msgs.push(`"${worst.setupName}" has negative P&L -- review if this strategy needs adjustment or a different entry criteria.`);
      }
    }

    if (msgs.length === 0 || d.totalTrades >= 5) {
      msgs.push('Discipline is your edge. Every trade you log and review compounds your growth as a trader.');
    }

    return msgs.slice(0, 3);
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  onPeriodChange(value: string): void {
    this.period.set(value);
    this.loadDashboard();
  }

  onCustomRange(): void {
    if (this.customFrom && this.customTo) {
      this.period.set('custom');
      this.loadDashboard(this.customFrom, this.customTo);
    }
  }

  private getDateRange(): { from: Date; to: Date } | null {
    const today = new Date();
    const p = this.period();
    let from: Date;

    switch (p) {
      case 'ytd':
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case '1m':
        from = new Date(today);
        from.setMonth(from.getMonth() - 1);
        break;
      case '3m':
        from = new Date(today);
        from.setMonth(from.getMonth() - 3);
        break;
      case '6m':
        from = new Date(today);
        from.setMonth(from.getMonth() - 6);
        break;
      case '1y':
        from = new Date(today);
        from.setFullYear(from.getFullYear() - 1);
        break;
      case 'all':
        return null;
      default:
        return null;
    }
    return { from, to: today };
  }

  loadDashboard(fromOverride?: Date, toOverride?: Date): void {
    this.loading.set(true);
    let fromStr: string | undefined;
    let toStr: string | undefined;

    if (fromOverride && toOverride) {
      fromStr = toLocalDateString(fromOverride);
      toStr = toLocalDateString(toOverride);
    } else {
      const range = this.getDateRange();
      if (range) {
        fromStr = toLocalDateString(range.from);
        toStr = toLocalDateString(range.to);
      }
    }

    this.tradingService.getDashboard(fromStr, toStr).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
