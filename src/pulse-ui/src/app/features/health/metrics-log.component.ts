import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatTableModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatTooltipModule, DatePipe, DecimalPipe, FormsModule, BaseChartDirective],
  template: `
    <div class="header-row">
      <mat-form-field appearance="outline" class="filter-field">
        <mat-select [(value)]="selectedType" (selectionChange)="onTypeChange()" placeholder="All Types">
          <mat-option [value]="''">All Types</mat-option>
          @for (type of types(); track type) {
            <mat-option [value]="type">{{ getMetricLabel(type) }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="openAddDialog()">
        <mat-icon>add</mat-icon> Log Metric
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (metrics().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap blue">
          <mat-icon>straighten</mat-icon>
        </div>
        <h3>No metrics recorded yet</h3>
        <p>Start tracking your vitals like weight, blood pressure, heart rate and more.</p>
        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon> Log Your First Metric
        </button>
      </div>
    } @else {
      <!-- Trend Chart -->
      @if (chartData()) {
        <div class="trend-card">
          <div class="trend-header">
            <div class="trend-title">
              <mat-icon>{{ getMetricIcon(selectedType) }}</mat-icon>
              <span>{{ getMetricLabel(selectedType) }} Trend</span>
            </div>
            <div class="trend-stats">
              @if (trendCurrent() !== null) {
                <div class="trend-stat">
                  <span class="stat-label">Current</span>
                  <span class="stat-val">{{ trendCurrent() | number:'1.0-1' }}</span>
                </div>
                <div class="trend-stat">
                  <span class="stat-label">Avg</span>
                  <span class="stat-val">{{ trendAvg() | number:'1.0-1' }}</span>
                </div>
                <div class="trend-stat">
                  <span class="stat-label">Min</span>
                  <span class="stat-val">{{ trendMin() | number:'1.0-1' }}</span>
                </div>
                <div class="trend-stat">
                  <span class="stat-label">Max</span>
                  <span class="stat-val">{{ trendMax() | number:'1.0-1' }}</span>
                </div>
              }
            </div>
          </div>
          <div class="chart-container">
            <canvas baseChart
              [data]="chartData()!"
              [options]="chartOptions"
              type="line">
            </canvas>
          </div>
        </div>
      }

      <!-- Desktop Table -->
      <mat-card class="desktop-only">
        <table mat-table [dataSource]="metrics()" class="metrics-table">
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let m">{{ getMetricLabel(m.metricType) }}</td>
          </ng-container>
          <ng-container matColumnDef="value">
            <th mat-header-cell *matHeaderCellDef>Value</th>
            <td mat-cell *matCellDef="let m">{{ m.value | number:'1.0-2' }} {{ m.unit }}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let m">{{ m.measuredAt | date:'MMM d, yyyy h:mm a' }}</td>
          </ng-container>
          <ng-container matColumnDef="notes">
            <th mat-header-cell *matHeaderCellDef>Notes</th>
            <td mat-cell *matCellDef="let m">{{ m.notes || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let m">
              <button mat-icon-button (click)="editMetric(m)" matTooltip="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="confirmDelete(m)" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
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
              <span class="mc-value">{{ m.value | number:'1.0-1' }}<small class="mc-unit">{{ m.unit }}</small></span>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .filter-field { width: 170px; }
    .filter-field .mat-mdc-form-field-subscript-wrapper { display: none; }

    .empty-state {
      text-align: center; padding: var(--spacing-xl) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-icon-wrap.blue { background: rgba(21,101,192,0.1); }
    .empty-icon-wrap.blue mat-icon { color: #1565c0; }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { margin: 0 0 var(--spacing-xs); font-size: 1.1rem; }
    .empty-state p { color: var(--color-text-muted); margin: 0 auto var(--spacing-md); max-width: 360px; }

    /* Trend Chart */
    .trend-card {
      background: var(--color-surface);
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
      padding: 16px;
      margin-bottom: var(--spacing-md);
    }
    .trend-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 12px; margin-bottom: 8px;
    }
    .trend-title {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 0.9rem;
    }
    .trend-title mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .trend-stats {
      display: flex; gap: 16px;
    }
    .trend-stat { display: flex; flex-direction: column; align-items: center; }
    .stat-label { font-size: 0.65rem; text-transform: uppercase; font-weight: 600; color: var(--color-text-muted); letter-spacing: 0.04em; }
    .stat-val { font-size: 0.9rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .chart-container { position: relative; height: 200px; }

    /* Desktop */
    .desktop-only { overflow-x: auto; }
    .metrics-table { width: 100%; }

    /* Mobile Cards */
    .mobile-cards { display: none; }
    .metric-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 12px; background: var(--color-surface);
      border-radius: var(--radius-sm); margin-bottom: 8px;
      box-shadow: var(--shadow-sm); cursor: pointer;
      transition: box-shadow var(--transition-fast);
    }
    .metric-card:active { box-shadow: var(--shadow-md); }
    .mc-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--gradient-icon-blue);
      flex-shrink: 0;
    }
    .mc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .mc-mid { flex: 1; min-width: 0; }
    .mc-name { display: block; font-weight: 600; font-size: 0.88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mc-date { display: block; font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mc-right { text-align: right; flex-shrink: 0; }
    .mc-value { font-weight: 700; font-size: 1rem; color: var(--color-primary); font-variant-numeric: tabular-nums; }
    .mc-unit { font-size: 0.7rem; color: var(--color-text-muted); font-weight: 500; margin-left: 2px; }

    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
      .header-row { justify-content: space-between; }
      .filter-field { width: 140px; }
      .trend-stats { gap: 10px; }
      .chart-container { height: 160px; }
    }
  `]
})
export class MetricsLogComponent implements OnInit {
  private healthService = inject(HealthMetricService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  metrics = signal<HealthMetric[]>([]);
  types = signal<string[]>([]);
  trendData = signal<HealthMetricTrend[]>([]);
  chartData = signal<ChartConfiguration<'line'>['data'] | null>(null);
  selectedType = '';
  displayedColumns = ['type', 'value', 'date', 'notes', 'actions'];

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxTicksLimit: 6 }
      },
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 10 }, maxTicksLimit: 5 }
      }
    },
    elements: {
      point: { radius: 3, hoverRadius: 5 },
      line: { tension: 0.3 }
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
    this.healthService.getTypes().subscribe(t => this.types.set(t));
    this.loadMetrics();
  }

  onTypeChange() {
    this.loadMetrics();
    this.loadTrend();
  }

  loadMetrics() {
    this.loading.set(true);
    this.healthService.getAll(this.selectedType || undefined).subscribe({
      next: m => { this.metrics.set(m); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  loadTrend() {
    if (this.selectedType) {
      this.healthService.getTrends(this.selectedType, 90).subscribe({
        next: data => {
          this.trendData.set(data);
          if (data.length > 1) {
            this.chartData.set({
              labels: data.map(d => {
                const dt = new Date(d.measuredAt);
                return `${dt.getMonth() + 1}/${dt.getDate()}`;
              }),
              datasets: [{
                label: this.getMetricLabel(this.selectedType),
                data: data.map(d => d.value),
                borderColor: '#1565c0',
                backgroundColor: 'rgba(21, 101, 192, 0.08)',
                fill: true,
                pointBackgroundColor: '#1565c0',
                borderWidth: 2
              }]
            });
          } else {
            this.chartData.set(null);
          }
        },
        error: () => { this.trendData.set([]); this.chartData.set(null); }
      });
    } else {
      this.trendData.set([]);
      this.chartData.set(null);
    }
  }

  openAddDialog() {
    import('./add-metric-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddMetricDialogComponent, { width: '420px', maxWidth: '95vw' });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.healthService.create(result).subscribe({
            next: () => {
              this.notify.success('Metric logged');
              this.loadMetrics();
              this.loadTrend();
              this.healthService.getTypes().subscribe(t => this.types.set(t));
            },
            error: () => this.notify.error('Failed to save metric')
          });
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
          this.healthService.update(metric.id, result).subscribe({
            next: () => { this.notify.success('Metric updated'); this.loadMetrics(); this.loadTrend(); },
            error: () => this.notify.error('Failed to update')
          });
        }
      });
    });
  }

  confirmDelete(metric: HealthMetric) {
    const confirmed = confirm(`Delete this ${this.getMetricLabel(metric.metricType)} entry?`);
    if (confirmed) {
      this.healthService.delete(metric.id).subscribe({
        next: () => { this.notify.success('Deleted'); this.loadMetrics(); this.loadTrend(); },
        error: () => this.notify.error('Failed to delete')
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
