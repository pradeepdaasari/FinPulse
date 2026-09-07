import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of, forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummary } from '../../../core/models/dashboard.model';
import { TradingService } from '../../../core/services/trading.service';
import { TradingStats } from '../../../core/models/trading.model';
import { WorkoutLogService } from '../../../core/services/workout-log.service';
import { WorkoutPlanService } from '../../../core/services/workout-plan.service';
import { HealthMetricService } from '../../../core/services/health-metric.service';
import { WorkoutStats } from '../../../core/models/workout-log.model';
import { TodayPlanResponse } from '../../../core/models/workout-plan.model';
import { HealthMetric } from '../../../core/models/health-metric.model';
import { PaymentStreakComponent } from './payment-streak.component';
import { BudgetHealthComponent } from './budget-health.component';
import { UpcomingPaymentsComponent } from './upcoming-payments.component';
import { MonthlyPaymentsCardComponent } from './monthly-payments-card.component';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { NetWorthComponent } from './net-worth.component';
import { TodayGlanceComponent } from './today-glance.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DecimalPipe, RouterLink,
    MatCardModule, MatIconModule,
    PaymentStreakComponent, BudgetHealthComponent, UpcomingPaymentsComponent,
    MonthlyPaymentsCardComponent, SkeletonLoaderComponent, PullToRefreshDirective,
    NetWorthComponent, TodayGlanceComponent
  ],
  template: `
    <div appPullToRefresh (refresh)="onRefresh()">

    <!-- ═══════ FINANCE ═══════ -->
    @if (loading()) {
      <app-skeleton type="dashboard"></app-skeleton>
    } @else if (summary()) {
      <app-net-worth></app-net-worth>
      <app-today-glance></app-today-glance>
      <div class="dashboard-grid">
        <app-budget-health></app-budget-health>
        <app-payment-streak></app-payment-streak>
      </div>

      <!-- Monthly Payments -->
      <div class="section-block">
        <div class="section-header">
          <div class="section-title-row">
            <div class="section-icon-wrap payments-icon"><mat-icon>calendar_month</mat-icon></div>
            <h3>This Month's Payments</h3>
          </div>
          <a class="view-all" routerLink="/money-movements">View All <mat-icon>chevron_right</mat-icon></a>
        </div>
        <div class="payments-card">
          <app-monthly-payments-card></app-monthly-payments-card>
        </div>
      </div>
    }

    <!-- ═══════ TRADING ═══════ -->
    <div class="section-block">
      <div class="section-header">
        <div class="section-title-row">
          <div class="section-icon-wrap trading-icon"><mat-icon>candlestick_chart</mat-icon></div>
          <h3>Trading</h3>
        </div>
        <a class="view-all" routerLink="/trading">View All <mat-icon>chevron_right</mat-icon></a>
      </div>
      @if (tradingLoading()) {
        <div class="glance-skeleton"><app-skeleton type="card" [count]="1"></app-skeleton></div>
      } @else if (tradingStats()) {
        <div class="glance-card">
          <div class="glance-stats-row">
            <div class="glance-stat">
              <span class="gs-value" [class.positive]="tradingStats()!.pnlToday >= 0" [class.negative]="tradingStats()!.pnlToday < 0">
                {{ tradingStats()!.pnlToday | currency:'USD':'symbol':'1.0-0' }}
              </span>
              <span class="gs-label">Today's P&L</span>
            </div>
            <div class="glance-stat">
              <span class="gs-value">{{ tradingStats()!.tradesToday }}</span>
              <span class="gs-label">Trades Today</span>
            </div>
            <div class="glance-stat">
              <span class="gs-value">{{ tradingStats()!.winRate }}%</span>
              <span class="gs-label">Win Rate</span>
            </div>
            <div class="glance-stat">
              <span class="gs-value streak-val">
                {{ tradingStats()!.currentRuleStreak }}
                <mat-icon class="streak-fire">local_fire_department</mat-icon>
              </span>
              <span class="gs-label">Rule Streak</span>
            </div>
          </div>
          @if (tradingStats()!.checklistComplianceRate < 80) {
            <div class="alert-banner warn">
              <mat-icon>warning</mat-icon>
              <span>Checklist compliance at {{ tradingStats()!.checklistComplianceRate }}% — stay disciplined</span>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state-card">
          <mat-icon class="empty-icon">candlestick_chart</mat-icon>
          <p>No trading data yet. <a routerLink="/trading/journal">Log your first trade</a></p>
        </div>
      }
    </div>

    <!-- ═══════ HEALTH ═══════ -->
    <div class="section-block">
      <div class="section-header">
        <div class="section-title-row">
          <div class="section-icon-wrap health-icon"><mat-icon>favorite</mat-icon></div>
          <h3>Health</h3>
        </div>
        <a class="view-all" routerLink="/health">View All <mat-icon>chevron_right</mat-icon></a>
      </div>
      @if (healthLoading()) {
        <div class="glance-skeleton"><app-skeleton type="card" [count]="1"></app-skeleton></div>
      } @else if (workoutStats() || latestWeight()) {
        <div class="glance-card">
          <div class="glance-stats-row">
            @if (latestWeight()) {
              <div class="glance-stat">
                <span class="gs-value">{{ latestWeight()!.value | number:'1.1-1' }}</span>
                <span class="gs-label">{{ latestWeight()!.unit }}</span>
              </div>
            }
            @if (workoutStats()) {
              <div class="glance-stat">
                <span class="gs-value streak-val">
                  {{ workoutStats()!.currentStreak }}
                  <mat-icon class="streak-fire">local_fire_department</mat-icon>
                </span>
                <span class="gs-label">Workout Streak</span>
              </div>
              <div class="glance-stat">
                <span class="gs-value">{{ workoutStats()!.workoutsThisWeek }}</span>
                <span class="gs-label">This Week</span>
              </div>
            }
          </div>
          @if (todayPlan()) {
            <a class="today-banner" routerLink="/health/workout">
              <mat-icon>{{ todayPlan()!.restDay ? 'hotel' : 'fitness_center' }}</mat-icon>
              <span class="today-banner-text">{{ todayPlan()!.restDay ? 'Rest Day — recover well' : (todayPlan()!.day?.focusArea ?? 'Workout Today') }}</span>
              @if (todayPlan()!.alreadyLogged) {
                <span class="done-badge">Done</span>
              }
              <mat-icon class="banner-chevron">chevron_right</mat-icon>
            </a>
          }
        </div>
      } @else {
        <div class="empty-state-card">
          <mat-icon class="empty-icon">favorite</mat-icon>
          <p>No health data yet. <a routerLink="/health">Start tracking</a></p>
        </div>
      }
    </div>

    </div>
  `,
  styles: [`
    :host { display: block; }

    .dashboard-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md);
    }
    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }

    /* Section blocks */
    .section-block { margin-top: 28px; }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px;
    }
    .section-title-row { display: flex; align-items: center; gap: 10px; }
    .section-title-row h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }
    .section-icon-wrap {
      width: 32px; height: 32px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .section-icon-wrap mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    .trading-icon { background: var(--color-stat-purple); }
    .health-icon { background: #ff3b5c; }
    .view-all {
      display: flex; align-items: center; gap: 2px;
      font-size: 0.8rem; font-weight: 600; color: var(--color-primary);
      text-decoration: none; cursor: pointer;
    }
    .view-all mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .view-all:hover { opacity: 0.8; }

    /* Glance card */
    .glance-card {
      background: var(--color-surface); border-radius: var(--radius-lg);
      border: 1px solid var(--color-border); overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .glance-stats-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
      gap: 0; padding: 0;
    }
    .glance-stat {
      display: flex; flex-direction: column; align-items: center;
      text-align: center; gap: 4px; padding: 18px 12px;
      border-right: 1px solid var(--color-border);
    }
    .glance-stat:last-child { border-right: none; }
    .gs-value {
      font-size: 1.3rem; font-weight: 700; font-variant-numeric: tabular-nums;
      display: flex; align-items: center; gap: 4px;
    }
    .gs-label {
      font-size: 0.68rem; font-weight: 600; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.03em;
    }
    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }
    .streak-val { color: var(--color-primary); }
    .streak-fire { font-size: 16px; width: 16px; height: 16px; color: #ff9500; }

    /* Alert banner */
    .alert-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; font-size: 0.8rem; font-weight: 600;
    }
    .alert-banner mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
    .alert-banner.warn {
      background: color-mix(in srgb, var(--color-warning) 10%, var(--color-surface));
      color: var(--color-warning); border-top: 1px solid color-mix(in srgb, var(--color-warning) 20%, transparent);
    }

    /* Today workout banner */
    .today-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; text-decoration: none; color: var(--color-text);
      border-top: 1px solid var(--color-border); cursor: pointer;
      transition: background 0.15s;
    }
    .today-banner:hover { background: var(--color-surface-secondary); }
    .today-banner mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); flex-shrink: 0; }
    .today-banner-text { flex: 1; font-size: 0.85rem; font-weight: 600; }
    .done-badge {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 8px; border-radius: var(--radius-full);
      background: var(--color-stat-green-bg); color: var(--color-success);
    }
    .banner-chevron { color: var(--color-text-muted) !important; }

    /* Empty states */
    .empty-state-card {
      display: flex; align-items: center; gap: 12px;
      padding: 20px; background: var(--color-surface);
      border-radius: var(--radius-lg); border: 1px dashed var(--color-border);
    }
    .empty-state-card .empty-icon { font-size: 28px; width: 28px; height: 28px; color: var(--color-text-muted); opacity: 0.4; }
    .empty-state-card p { margin: 0; font-size: 0.85rem; color: var(--color-text-secondary); }
    .empty-state-card a { color: var(--color-primary); font-weight: 600; text-decoration: none; }
    .empty-state-card a:hover { text-decoration: underline; }

    .glance-skeleton { min-height: 80px; }

    /* Monthly Payments */
    .payments-icon { background: #5AC8FA; }
    .payments-card {
      background: var(--color-surface); border-radius: var(--radius-lg);
      border: 1px solid var(--color-border); overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    /* Mobile */
    @media (max-width: 599px) {
      .glance-stats-row { grid-template-columns: repeat(2, 1fr); }
      .glance-stat { border-bottom: 1px solid var(--color-border); }
      .glance-stat:nth-child(odd) { border-right: 1px solid var(--color-border); }
      .glance-stat:nth-child(even) { border-right: none; }
      .glance-stat:nth-last-child(-n+2) { border-bottom: none; }
      .section-block { margin-top: 24px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private tradingService = inject(TradingService);
  private workoutLogService = inject(WorkoutLogService);
  private workoutPlanService = inject(WorkoutPlanService);
  private healthMetricService = inject(HealthMetricService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);

  tradingStats = signal<TradingStats | null>(null);
  tradingLoading = signal(true);

  workoutStats = signal<WorkoutStats | null>(null);
  todayPlan = signal<TodayPlanResponse | null>(null);
  latestWeight = signal<HealthMetric | null>(null);
  healthLoading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  onRefresh(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.tradingLoading.set(true);
    this.healthLoading.set(true);

    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        const setupDismissed = localStorage.getItem('pulse_setup_dismissed');
        if (!setupDismissed && data.numberOfDebts === 0 && data.totalMonthlyPayment === 0 && data.upcomingPayments.length === 0) {
          this.router.navigate(['/setup']);
          return;
        }
        this.summary.set(data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });

    this.tradingService.getStats().pipe(
      catchError(() => of(null))
    ).subscribe(stats => {
      this.tradingStats.set(stats);
      this.tradingLoading.set(false);
      this.cdr.detectChanges();
    });

    forkJoin({
      metrics: this.healthMetricService.getLatest().pipe(catchError(() => of([] as HealthMetric[]))),
      stats: this.workoutLogService.getStats().pipe(catchError(() => of(null as WorkoutStats | null))),
      today: this.workoutPlanService.getToday().pipe(catchError(() => of(null as TodayPlanResponse | null)))
    }).subscribe(({ metrics, stats, today }) => {
      const weight = (metrics as HealthMetric[]).find(m =>
        m.metricType.toLowerCase() === 'weight'
      );
      this.latestWeight.set(weight ?? null);
      this.workoutStats.set(stats);
      this.todayPlan.set(today);
      this.healthLoading.set(false);
      this.cdr.detectChanges();
    });
  }
}
