import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { HealthMetricService } from '../../core/services/health-metric.service';
import { WorkoutLogService } from '../../core/services/workout-log.service';
import { HealthMetric } from '../../core/models/health-metric.model';
import { WorkoutStats } from '../../core/models/workout-log.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-health-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, DatePipe, DecimalPipe],
  template: `
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openQuickLog()">
        <mat-icon>add</mat-icon> Log Metric
      </button>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
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
        <div class="section-label">Latest Vitals</div>
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
                <span class="mc-unit">{{ metric.unit }}</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Workout Stats -->
      @if (workoutStats()) {
        <div class="section-label">Workout Stats</div>
        <div class="stats-grid">
          <mat-card class="stat-card">
            <div class="stat-icon-wrap blue">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ workoutStats()!.currentStreak }}</span>
              <span class="stat-label">Day Streak</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-icon-wrap green">
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ workoutStats()!.workoutsThisWeek }}</span>
              <span class="stat-label">This Week</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-icon-wrap purple">
              <mat-icon>date_range</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ workoutStats()!.workoutsThisMonth }}</span>
              <span class="stat-label">This Month</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <div class="stat-icon-wrap orange">
              <mat-icon>fitness_center</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ workoutStats()!.monthlyVolume | number:'1.0-0' }}</span>
              <span class="stat-label">Volume (lbs)</span>
            </div>
          </mat-card>
        </div>
      }

      <!-- Quick Links -->
      <div class="section-label">Quick Access</div>
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
          <div class="lc-icon"><mat-icon>fitness_center</mat-icon></div>
          <div class="lc-mid">
            <span class="lc-name">Workout Plans</span>
            <span class="lc-desc">Your training schedule</span>
          </div>
          <mat-icon class="lc-arrow">chevron_right</mat-icon>
        </div>
        <div class="link-card" routerLink="/health/workout">
          <div class="lc-icon"><mat-icon>exercise</mat-icon></div>
          <div class="lc-mid">
            <span class="lc-name">Today's Workout</span>
            <span class="lc-desc">Log your session</span>
          </div>
          <mat-icon class="lc-arrow">chevron_right</mat-icon>
        </div>
        <div class="link-card" routerLink="/health/progress">
          <div class="lc-icon"><mat-icon>emoji_events</mat-icon></div>
          <div class="lc-mid">
            <span class="lc-name">Progress & PRs</span>
            <span class="lc-desc">Personal records</span>
          </div>
          <mat-icon class="lc-arrow">chevron_right</mat-icon>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .section-label {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
      text-transform: uppercase; color: var(--color-text-muted);
      margin: var(--spacing-lg) 0 var(--spacing-sm);
    }
    .section-label:first-of-type { margin-top: 0; }

    .metrics-grid { display: flex; flex-direction: column; gap: 8px; }
    .metric-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 12px; background: var(--color-surface);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);
      cursor: pointer; transition: box-shadow var(--transition-fast);
    }
    .metric-card:active { box-shadow: var(--shadow-md); }
    .mc-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--gradient-icon-blue);
    }
    .mc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .mc-mid { flex: 1; min-width: 0; }
    .mc-label { display: block; font-weight: 600; font-size: 0.9rem; }
    .mc-date { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .mc-right { text-align: right; }
    .mc-value { display: block; font-weight: 700; font-size: 1rem; color: var(--color-primary); }
    .mc-unit { display: block; font-size: 0.7rem; color: var(--color-text-muted); }

    .stats-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px; padding: 16px !important;
    }
    .stat-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon-wrap.blue { background: rgba(21,101,192,0.1); }
    .stat-icon-wrap.blue mat-icon { color: #1565c0; }
    .stat-icon-wrap.green { background: rgba(46,125,50,0.1); }
    .stat-icon-wrap.green mat-icon { color: #2e7d32; }
    .stat-icon-wrap.purple { background: rgba(106,27,154,0.1); }
    .stat-icon-wrap.purple mat-icon { color: #6a1b9a; }
    .stat-icon-wrap.orange { background: rgba(230,81,0,0.1); }
    .stat-icon-wrap.orange mat-icon { color: #e65100; }
    .stat-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.25rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); }

    .quick-links { display: flex; flex-direction: column; gap: 8px; }
    .link-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 12px; background: var(--color-surface);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);
      cursor: pointer; transition: box-shadow var(--transition-fast);
    }
    .link-card:active { box-shadow: var(--shadow-md); }
    .lc-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--gradient-icon-blue);
    }
    .lc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .lc-icon.red { background: rgba(211,47,47,0.1); }
    .lc-icon.red mat-icon { color: #d32f2f; }
    .lc-icon.teal { background: rgba(0,121,107,0.1); }
    .lc-icon.teal mat-icon { color: #00796b; }
    .lc-mid { flex: 1; min-width: 0; }
    .lc-name { display: block; font-weight: 600; font-size: 0.9rem; }
    .lc-desc { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .lc-arrow { color: var(--color-text-muted); }

    .empty-state {
      text-align: center; padding: var(--spacing-xl) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-icon-wrap.green { background: rgba(46,125,50,0.1); }
    .empty-icon-wrap.green mat-icon { color: #2e7d32; }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { margin: 0 0 var(--spacing-xs); font-size: 1.1rem; }
    .empty-state p { color: var(--color-text-muted); margin: 0 auto var(--spacing-md); max-width: 360px; }

    @media (max-width: 599px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class HealthDashboardComponent implements OnInit {
  private healthService = inject(HealthMetricService);
  private workoutService = inject(WorkoutLogService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  loading = signal(true);
  latestMetrics = signal<HealthMetric[]>([]);
  workoutStats = signal<WorkoutStats | null>(null);

  ngOnInit() {
    this.healthService.getLatest().subscribe({
      next: metrics => this.latestMetrics.set(metrics),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });

    this.workoutService.getStats().subscribe({
      next: stats => this.workoutStats.set(stats),
      error: () => {}
    });
  }

  openQuickLog() {
    import('./add-metric-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddMetricDialogComponent, { width: '420px', maxWidth: '95vw' });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.healthService.create(result).subscribe({
            next: () => { this.notify.success('Metric logged'); this.healthService.getLatest().subscribe(m => this.latestMetrics.set(m)); },
            error: () => this.notify.error('Failed to save')
          });
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
