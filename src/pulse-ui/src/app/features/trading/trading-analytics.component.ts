import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { TradingService } from '../../core/services/trading.service';
import { TradingDashboard } from '../../core/models/trading.model';
import { toLocalDateString } from '../../core/utils/date-utils';

@Component({
  selector: 'app-trading-analytics',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CurrencyPipe,
    MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatDatepickerModule, MatFormFieldModule, MatInputModule,
    BaseChartDirective, SkeletonLoaderComponent, PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>insights</mat-icon></div>
        <h2>Trading Analytics</h2>
        <p class="banner-subtitle">Visual breakdowns of your trading performance</p>
      </div>
    </div>

    <!-- Period Selector -->
    <div class="period-row">
      <mat-button-toggle-group [value]="period()" (change)="onPeriodChange($event.value)" hideSingleSelectionIndicator>
        <mat-button-toggle value="ytd">YTD</mat-button-toggle>
        <mat-button-toggle value="1m">1M</mat-button-toggle>
        <mat-button-toggle value="3m">3M</mat-button-toggle>
        <mat-button-toggle value="6m">6M</mat-button-toggle>
        <mat-button-toggle value="1y">1Y</mat-button-toggle>
        <mat-button-toggle value="all">All</mat-button-toggle>
      </mat-button-toggle-group>
    </div>

    @if (loading()) {
      <app-skeleton type="dashboard"></app-skeleton>
    } @else if (dashboard()) {

    <!-- Summary Stats -->
    <div class="summary-row">
      <div class="summary-stat">
        <span class="summary-value" [class.positive]="dashboard()!.netPnl >= 0" [class.negative]="dashboard()!.netPnl < 0">
          {{ dashboard()!.netPnl | currency:'USD':'symbol':'1.0-0' }}
        </span>
        <span class="summary-label">Net P&L</span>
      </div>
      <div class="summary-stat">
        <span class="summary-value">{{ dashboard()!.totalTrades }}</span>
        <span class="summary-label">Trades</span>
      </div>
      <div class="summary-stat">
        <span class="summary-value">{{ dashboard()!.winRate }}%</span>
        <span class="summary-label">Win Rate</span>
      </div>
      <div class="summary-stat">
        <span class="summary-value">{{ dashboard()!.profitFactor }}</span>
        <span class="summary-label">Profit Factor</span>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">

      <!-- Equity Curve -->
      @if (equityData()) {
        <div class="chart-card chart-wide">
          <h3 class="chart-title"><mat-icon>show_chart</mat-icon> Equity Curve</h3>
          <div class="chart-container chart-tall">
            <canvas baseChart [data]="equityData()!" [options]="equityOptions" type="line"></canvas>
          </div>
        </div>
      }

      <!-- P&L by Month -->
      @if (monthlyData()) {
        <div class="chart-card chart-wide">
          <h3 class="chart-title"><mat-icon>calendar_month</mat-icon> P&L by Month</h3>
          <div class="chart-container">
            <canvas baseChart [data]="monthlyData()!" [options]="pnlBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- P&L by Day of Week -->
      @if (dayOfWeekData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>date_range</mat-icon> P&L by Day of Week</h3>
          <div class="chart-container">
            <canvas baseChart [data]="dayOfWeekData()!" [options]="pnlBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- P&L by Time of Day -->
      @if (timeOfDayData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>schedule</mat-icon> P&L by Time of Day</h3>
          <div class="chart-container">
            <canvas baseChart [data]="timeOfDayData()!" [options]="pnlBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- P&L by Instrument -->
      @if (instrumentData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>pie_chart</mat-icon> P&L by Instrument</h3>
          <div class="chart-container">
            <canvas baseChart [data]="instrumentData()!" [options]="horizontalBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- P&L by Setup -->
      @if (setupData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>tune</mat-icon> P&L by Setup</h3>
          <div class="chart-container">
            <canvas baseChart [data]="setupData()!" [options]="horizontalBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- P&L by Direction -->
      @if (directionData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>swap_vert</mat-icon> P&L by Direction</h3>
          <div class="chart-container">
            <canvas baseChart [data]="directionData()!" [options]="pnlBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- P&L by Spread Type -->
      @if (spreadTypeData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>layers</mat-icon> P&L by Spread Type</h3>
          <div class="chart-container">
            <canvas baseChart [data]="spreadTypeData()!" [options]="pnlBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- Call vs Put -->
      @if (optionTypeData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>call_split</mat-icon> Call vs Put</h3>
          <div class="chart-container">
            <canvas baseChart [data]="optionTypeData()!" [options]="pnlBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- Win Rate Comparison -->
      @if (winRateCompData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>emoji_events</mat-icon> Win Rate by Day</h3>
          <div class="chart-container">
            <canvas baseChart [data]="winRateCompData()!" [options]="percentBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- R-Multiple Distribution -->
      @if (rDistData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>bar_chart</mat-icon> R-Multiple Distribution</h3>
          <div class="chart-container">
            <canvas baseChart [data]="rDistData()!" [options]="countBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- Win Rate by Trade # -->
      @if (tradeNumData()) {
        <div class="chart-card">
          <h3 class="chart-title"><mat-icon>format_list_numbered</mat-icon> Win Rate by Trade # in Session</h3>
          <div class="chart-container">
            <canvas baseChart [data]="tradeNumData()!" [options]="percentBarOptions" type="bar"></canvas>
          </div>
        </div>
      }

      <!-- Trade Volume Heatmap -->
      @if (dashboard()!.dayOfWeek.length > 0 && dashboard()!.timeOfDay.length > 0) {
        <div class="chart-card chart-wide">
          <h3 class="chart-title"><mat-icon>grid_on</mat-icon> Trade Volume Heatmap</h3>
          <div class="heatmap-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th></th>
                  @for (bucket of timeBuckets; track bucket) {
                    <th>{{ bucket }}</th>
                  }
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                @for (row of heatmapRows(); track row.day) {
                  <tr>
                    <td class="heatmap-day">{{ row.day }}</td>
                    @for (cell of row.cells; track $index) {
                      <td class="heatmap-cell" [style.background]="cell.color" [style.color]="cell.textColor">
                        {{ cell.count || '' }}
                      </td>
                    }
                    <td class="heatmap-total">{{ row.total }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>
    }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-banner {
      position: relative;
      margin: -24px -24px 24px;
      padding: 40px 24px 32px;
      background: var(--gradient-primary);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content { position: relative; text-align: center; }
    .banner-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px; border: 1px solid rgba(255,255,255,0.3);
    }
    .banner-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #fff; }
    h2 { margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .banner-subtitle { color: rgba(255,255,255,0.75); font-size: 0.9rem; margin: 4px 0 0; }

    .period-row {
      display: flex; justify-content: center; margin-bottom: var(--spacing-lg);
    }
    ::ng-deep .period-row .mat-button-toggle-group {
      border-radius: var(--radius-full); overflow: hidden;
    }
    ::ng-deep .period-row .mat-button-toggle { font-size: 0.8rem; }

    .summary-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }
    .summary-stat {
      text-align: center; padding: 14px 8px;
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }
    .summary-value { display: block; font-size: 1.2rem; font-weight: 700; }
    .summary-value.positive { color: var(--color-success); }
    .summary-value.negative { color: var(--color-danger); }
    .summary-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

    .charts-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);
    }
    .chart-card {
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); padding: 16px;
    }
    .chart-card.chart-wide { grid-column: 1 / -1; }
    .chart-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.9rem; font-weight: 700; margin: 0 0 12px;
    }
    .chart-title mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); }
    .chart-container { position: relative; height: 260px; }
    .chart-container.chart-tall { height: 320px; }

    /* Heatmap */
    .heatmap-container { overflow-x: auto; }
    .heatmap-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    .heatmap-table th {
      padding: 6px 8px; font-weight: 600; font-size: 0.72rem;
      color: var(--color-text-muted); text-align: center;
    }
    .heatmap-day { font-weight: 600; padding: 6px 10px; white-space: nowrap; }
    .heatmap-cell {
      text-align: center; padding: 8px 6px; border-radius: 4px;
      font-weight: 600; min-width: 36px; transition: background 0.2s;
    }
    .heatmap-total { text-align: center; font-weight: 700; padding: 8px 6px; color: var(--color-text-secondary); }

    @media (max-width: 599px) {
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
      .summary-row { grid-template-columns: repeat(2, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
      .chart-card.chart-wide { grid-column: auto; }
      .chart-container { height: 220px; }
      .chart-container.chart-tall { height: 260px; }
    }
  `]
})
export class TradingAnalyticsComponent implements OnInit {
  private tradingService = inject(TradingService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  dashboard = signal<TradingDashboard | null>(null);
  period = signal<string>('ytd');
  customFrom: Date | null = null;
  customTo: Date | null = null;

  private monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  timeBuckets = ['Pre-Market', 'Morning', 'Midday', 'Afternoon', 'Power Hour'];

  // --- Chart Data Computeds ---

  equityData = computed<ChartConfiguration<'line'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.equityCurve.length === 0) return null;
    return {
      labels: d.equityCurve.map(p => p.date),
      datasets: [
        {
          label: 'Cumulative P&L',
          data: d.equityCurve.map(p => p.cumPnl),
          borderColor: 'rgba(52, 199, 89, 0.9)',
          backgroundColor: 'rgba(52, 199, 89, 0.1)',
          fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2,
        },
        {
          label: 'Drawdown',
          data: d.equityCurve.map(p => -p.drawdown),
          borderColor: 'rgba(255, 59, 48, 0.6)',
          backgroundColor: 'rgba(255, 59, 48, 0.08)',
          fill: true, tension: 0.3, pointRadius: 0, borderWidth: 1,
        }
      ]
    };
  });

  monthlyData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.monthlyPnl.length === 0) return null;
    const labels = d.monthlyPnl.map(m => `${this.monthNames[m.month - 1]} ${m.year}`);
    const values = d.monthlyPnl.map(m => m.netPnl);
    return {
      labels,
      datasets: [{ data: values, backgroundColor: values.map(v => v >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)'), borderRadius: 4, maxBarThickness: 40 }]
    };
  });

  dayOfWeekData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.dayOfWeek.length === 0) return null;
    const ordered = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const sorted = ordered.map(day => d.dayOfWeek.find(x => x.day === day)).filter(Boolean) as typeof d.dayOfWeek;
    return {
      labels: sorted.map(x => x.day.substring(0, 3)),
      datasets: [{ data: sorted.map(x => x.pnl), backgroundColor: sorted.map(x => x.pnl >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)'), borderRadius: 4, maxBarThickness: 50 }]
    };
  });

  timeOfDayData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.timeOfDay.length === 0) return null;
    return {
      labels: d.timeOfDay.map(x => x.bucket.replace(/\(.*\)/, '').trim()),
      datasets: [{ data: d.timeOfDay.map(x => x.pnl), backgroundColor: d.timeOfDay.map(x => x.pnl >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)'), borderRadius: 4, maxBarThickness: 50 }]
    };
  });

  instrumentData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.byInstrument.length === 0) return null;
    const sorted = [...d.byInstrument].sort((a, b) => b.pnl - a.pnl);
    return {
      labels: sorted.map(x => x.instrument),
      datasets: [{ data: sorted.map(x => x.pnl), backgroundColor: sorted.map(x => x.pnl >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)'), borderRadius: 4, maxBarThickness: 30 }]
    };
  });

  setupData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.bySetup.length === 0) return null;
    const sorted = [...d.bySetup].sort((a, b) => b.pnl - a.pnl);
    return {
      labels: sorted.map(x => x.setupName),
      datasets: [{ data: sorted.map(x => x.pnl), backgroundColor: sorted.map(x => x.pnl >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)'), borderRadius: 4, maxBarThickness: 30 }]
    };
  });

  directionData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.byDirection.length === 0) return null;
    return {
      labels: d.byDirection.map(x => x.direction.charAt(0).toUpperCase() + x.direction.slice(1)),
      datasets: [{ data: d.byDirection.map(x => x.pnl), backgroundColor: d.byDirection.map(x => x.pnl >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)'), borderRadius: 4, maxBarThickness: 60 }]
    };
  });

  spreadTypeData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.bySpreadType.length === 0) return null;
    const sorted = [...d.bySpreadType].sort((a, b) => b.pnl - a.pnl);
    return {
      labels: sorted.map(x => x.spreadType),
      datasets: [{ data: sorted.map(x => x.pnl), backgroundColor: sorted.map(x => x.pnl >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)'), borderRadius: 4, maxBarThickness: 50 }]
    };
  });

  optionTypeData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.byOptionType.length === 0) return null;
    return {
      labels: d.byOptionType.map(x => x.optionType),
      datasets: [{ data: d.byOptionType.map(x => x.pnl), backgroundColor: d.byOptionType.map(x => x.pnl >= 0 ? 'rgba(52, 199, 89, 0.8)' : 'rgba(255, 59, 48, 0.8)'), borderRadius: 4, maxBarThickness: 60 }]
    };
  });

  winRateCompData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.dayOfWeek.length === 0) return null;
    const ordered = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const sorted = ordered.map(day => d.dayOfWeek.find(x => x.day === day)).filter(Boolean) as typeof d.dayOfWeek;
    return {
      labels: sorted.map(x => x.day.substring(0, 3)),
      datasets: [
        { label: 'Win Rate %', data: sorted.map(x => x.winRate), backgroundColor: 'rgba(52, 199, 89, 0.7)', borderRadius: 4, maxBarThickness: 30 },
        { label: 'Trades', data: sorted.map(x => x.trades), backgroundColor: 'rgba(100, 149, 237, 0.7)', borderRadius: 4, maxBarThickness: 30 }
      ]
    };
  });

  rDistData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.rDistribution.length === 0) return null;
    const colors = d.rDistribution.map(r => {
      if (r.bucket.startsWith('< -') || r.bucket.startsWith('-2R')) return 'rgba(255, 59, 48, 0.8)';
      if (r.bucket.startsWith('-1R')) return 'rgba(255, 149, 0, 0.7)';
      if (r.bucket.startsWith('0R')) return 'rgba(100, 149, 237, 0.6)';
      if (r.bucket.startsWith('1R')) return 'rgba(52, 199, 89, 0.7)';
      return 'rgba(52, 199, 89, 0.9)';
    });
    return {
      labels: d.rDistribution.map(r => r.bucket),
      datasets: [{ data: d.rDistribution.map(r => r.count), backgroundColor: colors, borderRadius: 4, maxBarThickness: 40 }]
    };
  });

  tradeNumData = computed<ChartConfiguration<'bar'>['data'] | null>(() => {
    const d = this.dashboard();
    if (!d || d.winRateByTradeNumber.length === 0) return null;
    return {
      labels: d.winRateByTradeNumber.map(x => `Trade #${x.tradeNumber}`),
      datasets: [
        { label: 'Win Rate %', data: d.winRateByTradeNumber.map(x => x.winRate), backgroundColor: 'rgba(52, 199, 89, 0.7)', borderRadius: 4, maxBarThickness: 40 },
        { label: 'Count', data: d.winRateByTradeNumber.map(x => x.count), backgroundColor: 'rgba(100, 149, 237, 0.5)', borderRadius: 4, maxBarThickness: 40 }
      ]
    };
  });

  // --- Heatmap ---
  heatmapRows = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const bucketOrder = ['Pre-Market', 'Morning (9-11)', 'Midday (11-1)', 'Afternoon (1-3)', 'Power Hour (3+)'];

    const tradeMap = new Map<string, number>();
    let maxCount = 0;

    // We don't have per-day-per-time data from the API, so show day totals and time totals
    // Build from dayOfWeek trades count
    return days.map(day => {
      const dayData = d.dayOfWeek.find(x => x.day === day);
      const dayTotal = dayData?.trades || 0;
      const cells = bucketOrder.map(bucket => {
        const timeData = d.timeOfDay.find(x => x.bucket === bucket);
        const estimate = dayTotal > 0 && timeData ? Math.round(dayTotal * timeData.trades / d.totalTrades) : 0;
        return {
          count: estimate,
          color: this.heatColor(estimate, d.totalTrades / 25),
          textColor: estimate > (d.totalTrades / 25) * 0.6 ? '#fff' : 'var(--color-text-secondary)'
        };
      });
      return { day: day.substring(0, 3), cells, total: dayTotal };
    });
  });

  // --- Chart Options ---

  pnlBarOptions: ChartConfiguration<'bar'>['options'] = {
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

  horizontalBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.x ?? 0;
            return (val >= 0 ? '+$' : '-$') + Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
          }
        }
      }
    },
    scales: {
      y: { grid: { display: false } },
      x: {
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

  percentBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(128, 128, 128, 0.1)' } }
    }
  };

  countBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} trades`
        }
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(128, 128, 128, 0.1)' } }
    }
  };

  equityOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y ?? 0;
            return ctx.dataset.label + ': ' + (val >= 0 ? '$' : '-$') + Math.abs(val).toLocaleString('en-US', { maximumFractionDigits: 0 });
          }
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
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

  ngOnInit(): void {
    this.loadData();
  }

  onPeriodChange(value: string): void {
    this.period.set(value);
    this.loadData();
  }

  loadData(fromOverride?: Date, toOverride?: Date): void {
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

  private getDateRange(): { from: Date; to: Date } | null {
    const today = new Date();
    let from: Date;
    switch (this.period()) {
      case 'ytd': from = new Date(today.getFullYear(), 0, 1); break;
      case '1m': from = new Date(today); from.setMonth(from.getMonth() - 1); break;
      case '3m': from = new Date(today); from.setMonth(from.getMonth() - 3); break;
      case '6m': from = new Date(today); from.setMonth(from.getMonth() - 6); break;
      case '1y': from = new Date(today); from.setFullYear(from.getFullYear() - 1); break;
      case 'all': return null;
      default: return null;
    }
    return { from, to: today };
  }

  private heatColor(count: number, scale: number): string {
    if (count === 0) return 'transparent';
    const intensity = Math.min(count / Math.max(scale, 1), 1);
    const alpha = 0.15 + intensity * 0.7;
    return `rgba(52, 199, 89, ${alpha})`;
  }
}
