import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { MatDialog } from '@angular/material/dialog';
import { HealthMetricService } from '../../core/services/health-metric.service';
import { WorkoutLogService } from '../../core/services/workout-log.service';
import { HealthMetric } from '../../core/models/health-metric.model';
import { WorkoutStats } from '../../core/models/workout-log.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-health-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, DatePipe, DecimalPipe, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openQuickLog()">
        <mat-icon>add</mat-icon> Log Metric
      </button>
    </div>

    @if (loading()) {
      <app-skeleton type="dashboard"></app-skeleton>
    } @else if (latestMetrics().length === 0 && !workoutStats()) {
      <div class="empty-state">
        <div class="empty-icon-wrap green">
          <mat-icon>monitor_heart</mat-icon>
        </div>
        <h3>Welcome to your health dashboard</h3>
        <p>Start tracking your vitals, blood work, and workouts to see your progress here.</p>
        <button mat-raised-button color="primary" routerLink="/health/metrics">
          <mat-icon>add</mat-icon> Log Your First Metric
        </button>
      </div>
    } @else {
      <!-- Health Metrics Summary -->
      @if (latestMetrics().length > 0) {
        <div class="metrics-grid">
          @for (metric of latestMetrics(); track metric.metricType) {
            <div class="metric-card" routerLink="/health/metrics">
              <div class="mc-icon">
                <mat-icon>{{ getMetricIcon(metric.metricType) }}</mat-icon>
              </div>
              <div class="mc-mid">
                <span class="mc-label">{{ metric.metricType }}</span>
                <span class="mc-date">{{ metric.measuredAt | date:'MMM d' }}</span>
              </div>
              <div class="mc-right">
                <span class="mc-value">{{ metric.value | number:'1.0-1' }}</span>
                <span class="mc-unit">{{ metric.unit === 'lbs' ? 'kg' : metric.unit }}</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Workout Stats -->
      @if (workoutStats()) {
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon-wrap blue">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ workoutStats()!.currentStreak }}</span>
              <span class="stat-label">Day Streak</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap green">
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ workoutStats()!.workoutsThisWeek }}</span>
              <span class="stat-label">This Week</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap purple">
              <mat-icon>date_range</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ workoutStats()!.workoutsThisMonth }}</span>
              <span class="stat-label">This Month</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap orange">
              <mat-icon>fitness_center</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ workoutStats()!.monthlyVolume | number:'1.0-0' }}</span>
              <span class="stat-label">Volume (kg)</span>
            </div>
          </div>
        </div>
      }

      <!-- Quick Links -->
      <div class="quick-links">
        <div class="link-card" routerLink="/health/metrics">
          <div class="lc-icon red"><mat-icon>monitor_heart</mat-icon></div>
          <div class="lc-mid">
            <span class="lc-name">Vitals & Metrics</span>
            <span class="lc-desc">Log & track health vitals</span>
          </div>
          <mat-icon class="lc-arrow">chevron_right</mat-icon>
        </div>
        <div class="link-card" routerLink="/health/blood-work">
          <div class="lc-icon teal"><mat-icon>bloodtype</mat-icon></div>
          <div class="lc-mid">
            <span class="lc-name">Blood Work</span>
            <span class="lc-desc">Lab results & trends</span>
          </div>
          <mat-icon class="lc-arrow">chevron_right</mat-icon>
        </div>
        <div class="link-card" routerLink="/health/plans">
          <div class="lc-icon blue"><mat-icon>fitness_center</mat-icon></div>
          <div class="lc-mid">
            <span class="lc-name">Workout Plans</span>
            <span class="lc-desc">Your training schedule</span>
          </div>
          <mat-icon class="lc-arrow">chevron_right</mat-icon>
        </div>
        <div class="link-card" routerLink="/health/workout">
          <div class="lc-icon purple"><mat-icon>exercise</mat-icon></div>
          <div class="lc-mid">
            <span class="lc-name">Today's Workout</span>
            <span class="lc-desc">Log your session</span>
          </div>
          <mat-icon class="lc-arrow">chevron_right</mat-icon>
        </div>
        <div class="link-card" routerLink="/health/progress">
          <div class="lc-icon amber"><mat-icon>emoji_events</mat-icon></div>
          <div class="lc-mid">
            <span class="lc-name">Progress & PRs</span>
            <span class="lc-desc">Personal records</span>
          </div>
          <mat-icon class="lc-arrow">chevron_right</mat-icon>
        </div>
      </div>
    }
    </div>
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .metrics-grid { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    .metric-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 12px; background: var(--color-surface-solid);
      border-radius: var(--radius-md); border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xs);
      cursor: pointer; transition: box-shadow var(--transition-fast);
    }
    .metric-card:active { box-shadow: var(--shadow-md); }
    .mc-icon {
      width: 40px; height: 40px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-blue-bg);
    }
    .mc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-stat-blue); }
    .mc-mid { flex: 1; min-width: 0; }
    .mc-label { display: block; font-weight: var(--weight-semibold); font-size: var(--text-sm); }
    .mc-date { display: block; font-size: var(--text-xs); color: var(--color-text-muted); }
    .mc-right { text-align: right; }
    .mc-value { display: block; font-weight: var(--weight-bold); font-size: var(--text-base); color: var(--color-primary); }
    .mc-unit { display: block; font-size: var(--text-xs); color: var(--color-text-muted); }

    .stats-row {
      display: flex; gap: 12px; overflow-x: auto;
      margin-top: var(--spacing-md); padding-bottom: 4px;
      scrollbar-width: none;
    }
    .stats-row::-webkit-scrollbar { display: none; }
    .stat-card {
      display: flex; align-items: center; gap: 12px; padding: 16px;
      min-width: 0; flex: 1;
      background: var(--color-surface); border-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
    }
    .stat-icon-wrap {
      width: 42px; height: 42px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon-wrap.blue { background: var(--color-stat-blue-bg); }
    .stat-icon-wrap.blue mat-icon { color: var(--color-stat-blue); }
    .stat-icon-wrap.green { background: var(--color-stat-green-bg); }
    .stat-icon-wrap.green mat-icon { color: var(--color-stat-green); }
    .stat-icon-wrap.purple { background: var(--color-stat-purple-bg); }
    .stat-icon-wrap.purple mat-icon { color: var(--color-stat-purple); }
    .stat-icon-wrap.orange { background: var(--color-stat-amber-bg); }
    .stat-icon-wrap.orange mat-icon { color: var(--color-stat-amber); }
    .stat-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.25rem; font-weight: var(--weight-bold); letter-spacing: -0.02em; line-height: var(--leading-tight); }
    .stat-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: var(--tracking-wide); margin-top: 2px; }

    .quick-links { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    .link-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 12px; background: var(--color-surface-solid);
      border-radius: var(--radius-md); border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xs);
      cursor: pointer; transition: box-shadow var(--transition-fast);
    }
    .link-card:active { box-shadow: var(--shadow-md); }
    .lc-icon {
      width: 40px; height: 40px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-blue-bg);
    }
    .lc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-stat-blue); }
    .lc-icon.red { background: var(--color-danger-bg); }
    .lc-icon.red mat-icon { color: var(--color-danger); }
    .lc-icon.teal { background: var(--color-stat-green-bg); }
    .lc-icon.teal mat-icon { color: var(--color-stat-green); }
    .lc-icon.blue { background: var(--color-stat-blue-bg); }
    .lc-icon.blue mat-icon { color: var(--color-stat-blue); }
    .lc-icon.purple { background: var(--color-stat-purple-bg); }
    .lc-icon.purple mat-icon { color: var(--color-stat-purple); }
    .lc-icon.amber { background: var(--color-stat-amber-bg); }
    .lc-icon.amber mat-icon { color: var(--color-stat-amber); }
    .lc-mid { flex: 1; min-width: 0; }
    .lc-name { display: block; font-weight: var(--weight-semibold); font-size: var(--text-sm); }
    .lc-desc { display: block; font-size: var(--text-xs); color: var(--color-text-muted); }
    .lc-arrow { color: var(--color-text-muted); }

    .empty-state {
      text-align: center; padding: var(--spacing-xl) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-md); margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-icon-wrap.green { background: var(--color-stat-green-bg); }
    .empty-icon-wrap.green mat-icon { color: var(--color-stat-green); }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { margin: 0 0 var(--spacing-xs); font-size: var(--text-lg); font-weight: var(--weight-bold); }
    .empty-state p { color: var(--color-text-muted); margin: 0 auto var(--spacing-md); max-width: 360px; font-size: var(--text-sm); }

    .quick-links { margin-top: var(--spacing-md); }

    @media (max-width: 599px) {
      .stat-card { min-width: 140px; flex: 0 0 auto; }
    }
  `]
})
export class HealthDashboardComponent implements OnInit {
  private healthService = inject(HealthMetricService);
  private workoutService = inject(WorkoutLogService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  latestMetrics = signal<HealthMetric[]>([]);
  workoutStats = signal<WorkoutStats | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.healthService.getLatest().subscribe({
      next: metrics => { this.latestMetrics.set(metrics); this.cdr.detectChanges(); },
      complete: () => { this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });

    this.workoutService.getStats().subscribe({
      next: stats => { this.workoutStats.set(stats); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  openQuickLog() {
    import('./add-metric-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddMetricDialogComponent, { panelClass: 'responsive-dialog-panel' });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.healthService.getLatest().subscribe(m => { this.latestMetrics.set(m); this.cdr.detectChanges(); });
        }
      });
    });
  }

  getMetricIcon(type: string): string {
    const icons: Record<string, string> = {
      'Weight': 'monitor_weight',
      'BloodPressureSystolic': 'favorite',
      'BloodPressureDiastolic': 'favorite',
      'HeartRate': 'heart_broken',
      'BloodSugar': 'water_drop',
      'SpO2': 'air',
      'Temperature': 'thermostat',
      'SleepHours': 'bedtime',
      'WaterIntakeMl': 'local_drink',
      'BodyFatPercent': 'percent',
      'Steps': 'directions_walk',
    };
    return icons[type] || 'monitor_heart';
  }
}
