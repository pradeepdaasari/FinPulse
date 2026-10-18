import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { HealthMetricService } from '../../core/services/health-metric.service';
import { HealthMetric, HealthMetricTrend } from '../../core/models/health-metric.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-metrics-log',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatMenuModule, MatTooltipModule, DatePipe, DecimalPipe, FormsModule, BaseChartDirective, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadMetrics()">
    <div class="hm-fb">
      <div class="hm-fb-primary">
        <button class="hm-fb-dropdown" [class.hm-fb-dropdown-active]="selectedType !== ''"
                [matMenuTriggerFor]="metricTypeMenu">
          <mat-icon class="hm-fb-dd-icon">{{ selectedType ? getMetricIcon(selectedType) : 'monitor_heart' }}</mat-icon>
          <span>{{ selectedType ? getMetricLabel(selectedType) : 'All Types' }}</span>
          <mat-icon class="hm-fb-dd-arrow">expand_more</mat-icon>
        </button>

        <span class="hm-fb-stat">{{ metrics().length }} records</span>

        <button mat-raised-button color="primary" class="hm-fb-add-btn" (click)="openAddDialog()">
          <mat-icon>add</mat-icon> Log Metric
        </button>
      </div>

      @if (selectedType) {
        <div class="hm-fb-active">
          <span class="hm-fb-chip hm-fb-chip-type">
            <mat-icon class="hm-fb-chip-icon">{{ getMetricIcon(selectedType) }}</mat-icon>
            {{ getMetricLabel(selectedType) }}
            <button class="hm-fb-chip-x" (click)="selectedType = ''; onTypeChange()"><mat-icon>close</mat-icon></button>
          </span>
        </div>
      }
    </div>

    <mat-menu #metricTypeMenu="matMenu">
      <button mat-menu-item (click)="selectedType = ''; onTypeChange()">
        <mat-icon>list</mat-icon> All Types
      </button>
      @for (type of types(); track type) {
        <button mat-menu-item (click)="selectedType = type; onTypeChange()">
          <mat-icon>{{ getMetricIcon(type) }}</mat-icon> {{ getMetricLabel(type) }}
        </button>
      }
    </mat-menu>

    @if (loading()) {
      <app-skeleton type="table"></app-skeleton>
    } @else if (metrics().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap">
          <mat-icon>monitor_heart</mat-icon>
        </div>
        <h3>No metrics recorded yet</h3>
        <p>Start tracking your vitals like weight, blood pressure, heart rate and more.</p>
        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon> Log Your First Metric
        </button>
      </div>
    } @else {
      <!-- Stat Cards -->
      @if (trendData().length > 0 && selectedType) {
        <div class="stats-row">
          <div class="stat-card">
            <mat-icon class="stat-icon blue">{{ getMetricIcon(selectedType) }}</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ trendCurrent() | number:'1.0-1' }}</span>
              <span class="stat-label">Current</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon class="stat-icon purple">analytics</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ trendAvg() | number:'1.0-1' }}</span>
              <span class="stat-label">Average</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon class="stat-icon green">arrow_downward</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ trendMin() | number:'1.0-1' }}</span>
              <span class="stat-label">Lowest</span>
            </div>
          </div>
          <div class="stat-card">
            <mat-icon class="stat-icon red">arrow_upward</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ trendMax() | number:'1.0-1' }}</span>
              <span class="stat-label">Highest</span>
            </div>
          </div>
        </div>
      }

      <!-- Trend Chart -->
      @if (chartData()) {
        <mat-card class="chart-card">
          <mat-card-content>
            <div class="chart-header">
              <span class="chart-title">
                <mat-icon>show_chart</mat-icon>
                {{ getMetricLabel(selectedType) }} — 90 Day Trend
              </span>
            </div>
            <div class="chart-container">
              <canvas baseChart
                [data]="chartData()!"
                [options]="chartOptions"
                type="line">
              </canvas>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Desktop Table -->
      <mat-card class="table-card desktop-only">
        <mat-card-content>
          <div class="table-wrapper">
            <table class="activity-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (m of metrics(); track m.id) {
                  <tr>
                    <td>
                      <span class="metric-type-badge">
                        <mat-icon class="type-icon">{{ getMetricIcon(m.metricType) }}</mat-icon>
                        {{ getMetricLabel(m.metricType) }}
                      </span>
                    </td>
                    <td>
                      <span class="metric-value">{{ m.value | number:'1.0-2' }}</span>
                      <span class="metric-unit">{{ m.unit === 'lbs' ? 'kg' : m.unit }}</span>
                    </td>
                    <td>{{ m.measuredAt | date:'MMM d, yyyy h:mm a' }}</td>
                    <td>
                      <span class="notes-text">{{ m.notes || '—' }}</span>
                    </td>
                    <td>
                      <button mat-icon-button class="action-btn action-edit" (click)="editMetric(m)" matTooltip="Edit">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button class="action-btn action-delete" (click)="confirmDelete(m)" matTooltip="Delete">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Mobile Cards -->
      <div class="mobile-cards">
        @for (m of metrics(); track m.id) {
          <div class="metric-card" (click)="editMetric(m)">
            <div class="mc-icon">
              <mat-icon>{{ getMetricIcon(m.metricType) }}</mat-icon>
            </div>
            <div class="mc-mid">
              <span class="mc-name">{{ getMetricLabel(m.metricType) }}</span>
              <span class="mc-date">{{ m.measuredAt | date:'MMM d, h:mm a' }}{{ m.notes ? ' · ' + m.notes : '' }}</span>
            </div>
            <div class="mc-right">
              <span class="mc-value">{{ m.value | number:'1.0-1' }}<small class="mc-unit">{{ m.unit === 'lbs' ? 'kg' : m.unit }}</small></span>
            </div>
          </div>
        }
      </div>
    }
    </div>
  `,
  styles: [`
    /* ─── Filter bar (pill style) ─── */
    .hm-fb {
      display: flex; flex-direction: column; gap: 10px;
      padding: 14px 18px;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      margin-bottom: var(--spacing-md);
    }
    .hm-fb-primary { display: flex; gap: 10px; align-items: center; }
    .hm-fb-dropdown {
      display: flex; align-items: center; gap: 5px;
      padding: 0 12px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: white;
      color: var(--color-text-secondary);
      font-size: 0.82rem; font-weight: 500;
      cursor: pointer; white-space: nowrap;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .hm-fb-dropdown:hover {
      border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
      color: var(--color-text);
    }
    .hm-fb-dropdown-active {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: var(--color-primary);
      color: var(--color-primary); font-weight: 600;
    }
    .hm-fb-dd-icon { font-size: 18px; width: 18px; height: 18px; }
    .hm-fb-dd-arrow { font-size: 16px; width: 16px; height: 16px; opacity: 0.5; margin-left: -2px; }
    .hm-fb-stat {
      padding: 4px 12px; border-radius: var(--radius-full);
      font-size: 0.78rem; font-weight: 600;
      background: #f1f3f5; color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .hm-fb-add-btn {
      margin-left: auto;
      border-radius: var(--radius-full) !important;
      font-weight: 600 !important;
      font-size: 0.82rem !important;
      height: 38px !important;
    }
    .hm-fb-active {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      padding-top: 8px;
      border-top: 1px dashed color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
    }
    .hm-fb-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 6px 3px 8px;
      font-size: 0.76rem; font-weight: 500;
      border-radius: var(--radius-full);
      background: #f1f3f5; color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .hm-fb-chip-type {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
      color: var(--color-primary);
    }
    .hm-fb-chip-icon { font-size: 14px; width: 14px; height: 14px; }
    .hm-fb-chip-x {
      display: flex; align-items: center; padding: 0;
      border: none; background: none; cursor: pointer;
      color: inherit; opacity: 0.5; border-radius: 50%;
      transition: var(--transition-fast);
    }
    .hm-fb-chip-x mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .hm-fb-chip-x:hover { opacity: 1; background: color-mix(in srgb, currentColor 10%, transparent); }

    /* Empty State */
    .empty-state {
      text-align: center; padding: var(--spacing-xl) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-md); margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-blue-bg);
    }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--color-stat-blue); }
    .empty-state h3 { margin: 0 0 var(--spacing-xs); font-size: 1.1rem; }
    .empty-state p { color: var(--color-text-muted); margin: 0 auto var(--spacing-md); max-width: 360px; }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: 16px;
      box-shadow: var(--shadow-sm);
    }
    .stat-icon {
      font-size: 28px; width: 28px; height: 28px;
    }
    .stat-icon.blue { color: var(--color-primary); }
    .stat-icon.purple { color: var(--color-stat-purple); }
    .stat-icon.green { color: var(--color-stat-green); }
    .stat-icon.red { color: var(--color-stat-red); }
    .stat-content { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.2rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .stat-label { font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

    /* Chart */
    .chart-card { margin-bottom: var(--spacing-md); }
    .chart-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .chart-title {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 0.9rem;
    }
    .chart-title mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .chart-container { position: relative; height: 220px; }

    /* Desktop Table */
    .table-card { overflow: hidden; }
    .table-wrapper { overflow-x: auto; scrollbar-width: none; }
    .table-wrapper::-webkit-scrollbar { display: none; }
    .activity-table { width: 100%; border-collapse: collapse; }
    .activity-table th { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--color-primary); padding: 10px 12px; border-bottom: 2px solid var(--color-primary); text-align: left; }
    .activity-table td { font-size: 0.85rem; padding: 10px 12px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    .activity-table tbody tr:hover { background: var(--color-surface-hover); }
    .metrics-table { width: 100%; }
    .metric-type-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-weight: 500; font-size: 0.85rem;
    }
    .type-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); }
    .metric-value { font-weight: 700; font-variant-numeric: tabular-nums; }
    .metric-unit { font-size: 0.8rem; color: var(--color-text-muted); margin-left: 4px; }
    .notes-text { font-size: 0.85rem; color: var(--color-text-muted); }
    td.mat-column-actions { white-space: nowrap; text-align: right; }
    .action-btn { width: 36px; height: 36px; border-radius: var(--radius-xs) !important; transition: background var(--transition-fast) !important; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-edit { color: var(--color-action-edit) !important; }
    .action-edit:hover { background: var(--color-action-edit-bg) !important; }
    .action-delete { color: var(--color-action-delete) !important; }
    .action-delete:hover { background: var(--color-action-delete-bg) !important; }

    /* Mobile Cards */
    .mobile-cards { display: none; }
    .metric-card {
      display: flex; align-items: center; gap: 14px;
      padding: 16px; background: var(--color-surface);
      border-radius: var(--radius-lg); margin-bottom: 10px;
      box-shadow: var(--shadow-sm); cursor: pointer;
      transition: box-shadow var(--transition-fast), opacity 0.1s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .metric-card:active { box-shadow: var(--shadow-md); opacity: 0.7; }
    .mc-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-blue-bg);
      flex-shrink: 0;
    }
    .mc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .mc-mid { flex: 1; min-width: 0; }
    .mc-name { display: block; font-weight: 600; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mc-date { display: block; font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mc-right { text-align: right; flex-shrink: 0; }
    .mc-value { font-weight: 700; font-size: 1rem; color: var(--color-primary); font-variant-numeric: tabular-nums; }
    .mc-unit { font-size: 0.7rem; color: var(--color-text-muted); font-weight: 500; margin-left: 2px; }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 1199px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
    }

    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
      .hm-fb-primary { flex-wrap: wrap; }
      .hm-fb-add-btn { width: 100%; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; gap: 10px; }
      .stat-icon { font-size: 22px; width: 22px; height: 22px; }
      .stat-value { font-size: 1rem; }
      .chart-container { height: 160px; }
    }
  `]
})
export class MetricsLogComponent implements OnInit {
  private healthService = inject(HealthMetricService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  metrics = signal<HealthMetric[]>([]);
  types = signal<string[]>([]);
  trendData = signal<HealthMetricTrend[]>([]);
  chartData = signal<ChartConfiguration<'line'>['data'] | null>(null);
  selectedType = '';
  displayedColumns = ['type', 'value', 'date', 'notes', 'actions'];

  private trendNotes: (string | undefined)[] = [];

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          afterBody: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx != null && this.trendNotes[idx]) {
              return `📝 ${this.trendNotes[idx]}`;
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxTicksLimit: 8 }
      },
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 10 }, maxTicksLimit: 5 }
      }
    },
    elements: {
      point: { radius: 3, hoverRadius: 6 },
      line: { tension: 0.35, borderWidth: 2.5 }
    }
  };

  trendCurrent = computed(() => {
    const d = this.trendData();
    return d.length ? d[d.length - 1].value : null;
  });
  trendAvg = computed(() => {
    const d = this.trendData();
    return d.length ? d.reduce((s, t) => s + t.value, 0) / d.length : 0;
  });
  trendMin = computed(() => {
    const d = this.trendData();
    return d.length ? Math.min(...d.map(t => t.value)) : 0;
  });
  trendMax = computed(() => {
    const d = this.trendData();
    return d.length ? Math.max(...d.map(t => t.value)) : 0;
  });

  ngOnInit() {
    this.healthService.getTypes().subscribe(t => { this.types.set(t); this.cdr.detectChanges(); });
    this.loadMetrics();
  }

  onTypeChange() {
    this.loadMetrics();
    this.loadTrend();
  }

  loadMetrics() {
    this.loading.set(true);
    this.healthService.getAll(this.selectedType || undefined).subscribe({
      next: m => { this.metrics.set(m); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  loadTrend() {
    if (this.selectedType) {
      this.healthService.getTrends(this.selectedType, 90).subscribe({
        next: data => {
          this.trendData.set(data);
          this.trendNotes = data.map(d => d.notes);
          if (data.length > 1) {
            this.chartData.set({
              labels: data.map(d => {
                const dt = new Date(d.measuredAt);
                return `${dt.getMonth() + 1}/${dt.getDate()}`;
              }),
              datasets: [{
                label: this.getMetricLabel(this.selectedType),
                data: data.map(d => d.value),
                borderColor: '#4f7cff',
                backgroundColor: 'rgba(79, 124, 255, 0.08)',
                fill: true,
                pointBackgroundColor: '#4f7cff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderWidth: 2.5,
                tension: 0.35
              }]
            });
          } else {
            this.chartData.set(null);
          }
          this.cdr.detectChanges();
        },
        error: () => { this.trendData.set([]); this.chartData.set(null); this.cdr.detectChanges(); }
      });
    } else {
      this.trendData.set([]);
      this.chartData.set(null);
    }
  }

  openAddDialog() {
    import('./add-metric-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddMetricDialogComponent, { panelClass: 'responsive-dialog-panel' });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.loadMetrics();
          this.loadTrend();
          this.healthService.getTypes().subscribe(t => { this.types.set(t); this.cdr.detectChanges(); });
        }
      });
    });
  }

  editMetric(metric: HealthMetric) {
    import('./add-metric-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddMetricDialogComponent, {
        width: '420px',
        maxWidth: '95vw',
        data: metric
      });
      ref.afterClosed().subscribe(result => {
        if (result === 'delete') {
          this.confirmDelete(metric);
        } else if (result) {
          this.loadMetrics();
          this.loadTrend();
        }
      });
    });
  }

  confirmDelete(metric: HealthMetric) {
    const confirmed = confirm(`Delete this ${this.getMetricLabel(metric.metricType)} entry?`);
    if (confirmed) {
      this.loading.set(true);
      this.healthService.delete(metric.id).subscribe({
        next: () => { this.notify.success('Deleted'); this.loadMetrics(); this.loadTrend(); },
        error: () => { this.loading.set(false); this.notify.error('Failed to delete'); this.cdr.detectChanges(); }
      });
    }
  }

  getMetricLabel(type: string): string {
    const labels: Record<string, string> = {
      'Weight': 'Weight', 'BloodPressureSystolic': 'BP (Systolic)',
      'BloodPressureDiastolic': 'BP (Diastolic)', 'HeartRate': 'Heart Rate',
      'BloodSugar': 'Blood Sugar', 'SpO2': 'Oxygen (SpO2)',
      'Temperature': 'Temperature', 'SleepHours': 'Sleep',
      'WaterIntakeMl': 'Water Intake', 'BodyFatPercent': 'Body Fat',
      'Steps': 'Steps', 'WaistCm': 'Waist',
    };
    return labels[type] || type;
  }

  getMetricIcon(type: string): string {
    const icons: Record<string, string> = {
      'Weight': 'monitor_weight', 'BloodPressureSystolic': 'favorite',
      'BloodPressureDiastolic': 'favorite', 'HeartRate': 'heart_broken',
      'BloodSugar': 'water_drop', 'SpO2': 'air', 'Temperature': 'thermostat',
      'SleepHours': 'bedtime', 'WaterIntakeMl': 'local_drink',
      'BodyFatPercent': 'percent', 'Steps': 'directions_walk',
    };
    return icons[type] || 'monitor_heart';
  }
}
