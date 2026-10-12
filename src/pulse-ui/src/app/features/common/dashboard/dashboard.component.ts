import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of, forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummary } from '../../../core/models/dashboard.model';
import { BudgetService } from '../../../core/services/budget.service';
import { BudgetPlan } from '../../../core/models/budget.model';
import { TradingService } from '../../../core/services/trading.service';
import { TradingStats } from '../../../core/models/trading.model';
import { WorkoutLogService } from '../../../core/services/workout-log.service';
import { WorkoutPlanService } from '../../../core/services/workout-plan.service';
import { HealthMetricService } from '../../../core/services/health-metric.service';
import { WorkoutStats } from '../../../core/models/workout-log.model';
import { TodayPlanResponse } from '../../../core/models/workout-plan.model';
import { HealthMetric } from '../../../core/models/health-metric.model';
import { PaymentStreakComponent } from './payment-streak.component';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { NetWorthComponent } from './net-worth.component';
import { TodayGlanceComponent } from './today-glance.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';
import { DebtCountdownComponent } from './debt-countdown.component';
import { InsightsComponent } from './insights.component';
import { DebtTrendChartComponent } from './debt-trend-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DecimalPipe, RouterLink,
    MatCardModule, MatIconModule,
    PaymentStreakComponent,
    SkeletonLoaderComponent, PullToRefreshDirective,
    NetWorthComponent, TodayGlanceComponent,
    DebtCountdownComponent, InsightsComponent, DebtTrendChartComponent
  ],
  template: `
    <div appPullToRefresh (refresh)="onRefresh()">

    <!-- ═══════ FINANCE ═══════ -->
    @if (loading()) {
      <app-skeleton type="dashboard"></app-skeleton>
    } @else if (summary()) {
      <app-net-worth></app-net-worth>
      <app-today-glance></app-today-glance>

      @if (budgetPlan()) {
        <div class="budget-stats-row" routerLink="/budget">
          <div class="bs-card bs-blue">
            <mat-icon>account_balance_wallet</mat-icon>
            <div class="bs-content">
              <span class="bs-value">{{ budgetPlan()!.monthlyOverview.totalIncome | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="bs-label">Income ({{ budgetPlan()!.monthlyOverview.paychecksThisMonth }})</span>
            </div>
          </div>
          <div class="bs-card bs-amber">
            <mat-icon>assignment</mat-icon>
            <div class="bs-content">
              <span class="bs-value">{{ budgetPlan()!.monthlyOverview.totalExpenses | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="bs-label">Budgeted</span>
            </div>
          </div>
          <div class="bs-card bs-purple">
            <mat-icon>shopping_cart</mat-icon>
            <div class="bs-content">
              <span class="bs-value">{{ budgetPlan()!.monthlyOverview.totalSpent | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="bs-label">Spent</span>
            </div>
          </div>
          <div class="bs-card" [class.bs-green]="!budgetPlan()!.monthlyOverview.isOverBudget" [class.bs-red]="budgetPlan()!.monthlyOverview.isOverBudget">
            <mat-icon>{{ budgetPlan()!.monthlyOverview.isOverBudget ? 'money_off' : 'savings' }}</mat-icon>
            <div class="bs-content">
              <span class="bs-value" [class.color-green]="!budgetPlan()!.monthlyOverview.isOverBudget" [class.color-red]="budgetPlan()!.monthlyOverview.isOverBudget">{{ budgetPlan()!.monthlyOverview.isOverBudget ? '-' : '' }}{{ budgetPlan()!.monthlyOverview.absRemaining | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="bs-label">{{ budgetPlan()!.monthlyOverview.isOverBudget ? 'Over Budget' : 'Remaining to Pay' }}</span>
            </div>
          </div>
          <div class="bs-card" [class.bs-green]="!budgetPlan()!.monthlyOverview.isDeficit" [class.bs-red]="budgetPlan()!.monthlyOverview.isDeficit">
            <mat-icon>{{ budgetPlan()!.monthlyOverview.isDeficit ? 'trending_down' : 'trending_up' }}</mat-icon>
            <div class="bs-content">
              <span class="bs-value" [class.color-green]="!budgetPlan()!.monthlyOverview.isDeficit" [class.color-red]="budgetPlan()!.monthlyOverview.isDeficit">{{ budgetPlan()!.monthlyOverview.isDeficit ? '-' : '+' }}{{ budgetPlan()!.monthlyOverview.absSurplus | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="bs-label">{{ budgetPlan()!.monthlyOverview.isDeficit ? 'Deficit' : 'Surplus' }}</span>
            </div>
          </div>
        </div>
      }

      <app-payment-streak></app-payment-streak>
      <app-debt-countdown></app-debt-countdown>
      <app-insights></app-insights>
      <app-debt-trend-chart></app-debt-trend-chart>

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
        <div class="trading-pnl-row">
          <div class="bs-card" [class.bs-green]="tradingStats()!.pnlToday >= 0" [class.bs-red]="tradingStats()!.pnlToday < 0">
            <mat-icon>{{ tradingStats()!.pnlToday >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
            <div class="bs-content">
              <span class="bs-value" [class.color-green]="tradingStats()!.pnlToday >= 0" [class.color-red]="tradingStats()!.pnlToday < 0">{{ tradingStats()!.pnlToday >= 0 ? '+' : '' }}{{ tradingStats()!.pnlToday | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="bs-label">Today</span>
            </div>
          </div>
          <div class="bs-card" [class.bs-green]="tradingStats()!.pnlThisWeek >= 0" [class.bs-red]="tradingStats()!.pnlThisWeek < 0">
            <mat-icon>{{ tradingStats()!.pnlThisWeek >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
            <div class="bs-content">
              <span class="bs-value" [class.color-green]="tradingStats()!.pnlThisWeek >= 0" [class.color-red]="tradingStats()!.pnlThisWeek < 0">{{ tradingStats()!.pnlThisWeek >= 0 ? '+' : '' }}{{ tradingStats()!.pnlThisWeek | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="bs-label">This Week</span>
            </div>
          </div>
          <div class="bs-card" [class.bs-green]="tradingStats()!.pnlThisMonth >= 0" [class.bs-red]="tradingStats()!.pnlThisMonth < 0">
            <mat-icon>{{ tradingStats()!.pnlThisMonth >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
            <div class="bs-content">
              <span class="bs-value" [class.color-green]="tradingStats()!.pnlThisMonth >= 0" [class.color-red]="tradingStats()!.pnlThisMonth < 0">{{ tradingStats()!.pnlThisMonth >= 0 ? '+' : '' }}{{ tradingStats()!.pnlThisMonth | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="bs-label">This Month</span>
            </div>
          </div>
        </div>
        <div class="glance-card" style="margin-top: 10px;">
          <div class="glance-stats-row">
            <div class="glance-stat">
              <span class="gs-value">{{ tradingStats()!.tradesToday }} <span class="gs-dim">/ {{ tradingStats()!.tradesThisWeek }} / {{ tradingStats()!.tradesThisMonth }}</span></span>
              <span class="gs-label">Trades (D / W / M)</span>
            </div>
            <div class="glance-stat">
              <span class="gs-value">{{ tradingStats()!.winRate | number:'1.0-1' }}%</span>
              <span class="gs-label">Win Rate</span>
            </div>
            <div class="glance-stat">
              <span class="gs-value streak-val">
                {{ tradingStats()!.currentRuleStreak }}
                <mat-icon class="streak-fire">local_fire_department</mat-icon>
              </span>
              <span class="gs-label">Rule Streak</span>
            </div>
            <div class="glance-stat">
              <span class="gs-value" [class.positive]="tradingStats()!.checklistComplianceRate >= 80" [class.negative]="tradingStats()!.checklistComplianceRate < 80">{{ tradingStats()!.checklistComplianceRate | number:'1.0-0' }}%</span>
              <span class="gs-label">Compliance</span>
            </div>
          </div>
          @if (tradingStats()!.checklistComplianceRate < 80) {
            <div class="alert-banner warn">
              <mat-icon>warning</mat-icon>
              <span>Checklist compliance at {{ tradingStats()!.checklistComplianceRate | number:'1.0-0' }}% — stay disciplined</span>
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

    /* Budget Stats Row */
    .budget-stats-row {
      display: grid; grid-template-columns: repeat(5, 1fr);
      gap: 10px; margin-top: var(--spacing-md); cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .budget-stats-row:hover { opacity: 0.9; }
    .bs-card {
      display: flex; align-items: center; gap: 10px; padding: 14px 12px;
      border-radius: var(--radius-md); background: var(--color-surface-solid);
      border: 1px solid var(--color-border); box-shadow: var(--shadow-xs);
    }
    .bs-card mat-icon {
      font-size: 22px; width: 22px; height: 22px; padding: 8px;
      border-radius: var(--radius-sm); box-sizing: content-box; flex-shrink: 0;
    }
    .bs-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .bs-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .bs-purple mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .bs-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .bs-red mat-icon { color: var(--color-danger); background: var(--color-danger-bg); }
    .bs-content { display: flex; flex-direction: column; min-width: 0; }
    .bs-value {
      font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .bs-label {
      font-size: 0.6rem; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.04em;
      font-weight: 600; margin-top: 2px;
    }
    .color-green { color: #34C759 !important; }
    .color-red { color: #FF3B30 !important; }

    /* Trading P&L Row */
    .trading-pnl-row {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    .gs-dim {
      font-size: 0.85em; font-weight: 500; opacity: 0.45;
    }


    /* Section blocks */
    .section-block {
      margin-top: var(--spacing-xl);
      animation: fadeSlideUp 0.35s ease-out both;
    }
    .section-block:nth-child(2) { animation-delay: 0.05s; }
    .section-block:nth-child(3) { animation-delay: 0.1s; }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 14px;
    }
    .section-title-row { display: flex; align-items: center; gap: 10px; }
    .section-title-row h3 {
      margin: 0; font-size: 1rem; font-weight: 700;
      letter-spacing: -0.01em;
    }
    .section-icon-wrap {
      width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .section-icon-wrap mat-icon { font-size: 17px; width: 17px; height: 17px; color: #fff; }
    .trading-icon { background: var(--color-stat-purple); }
    .health-icon { background: #ff3b5c; }
    .view-all {
      display: flex; align-items: center; gap: 2px;
      font-size: var(--text-xs); font-weight: 600; color: var(--color-primary);
      text-decoration: none; cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .view-all mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .view-all:hover { opacity: 0.75; }

    /* Glance card */
    .glance-card {
      background: var(--color-surface-solid); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); overflow: hidden;
      box-shadow: var(--shadow-xs);
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
      font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums;
      display: flex; align-items: center; gap: 4px;
      letter-spacing: -0.02em; line-height: 1.2;
    }
    .gs-label {
      font-size: 0.625rem; font-weight: 600; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.05em;
      margin-top: 2px;
    }
    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }
    .streak-val { color: var(--color-primary); }
    .streak-fire { font-size: 16px; width: 16px; height: 16px; color: #ff9500; }

    /* Alert banner */
    .alert-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; font-size: var(--text-xs); font-weight: 600;
    }
    .alert-banner mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    .alert-banner.warn {
      background: var(--color-warning-bg);
      color: var(--color-warning-text); border-top: 1px solid rgba(255, 149, 0, 0.15);
    }

    /* Today workout banner */
    .today-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; text-decoration: none; color: var(--color-text);
      border-top: 1px solid var(--color-border); cursor: pointer;
      transition: background var(--transition-fast);
    }
    .today-banner:hover { background: var(--color-surface-hover); }
    .today-banner mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); flex-shrink: 0; }
    .today-banner-text { flex: 1; font-size: var(--text-sm); font-weight: 600; }
    .done-badge {
      font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 8px; border-radius: var(--radius-full);
      background: var(--color-success-bg); color: var(--color-success-text);
    }
    .banner-chevron { color: var(--color-text-muted) !important; font-size: 16px !important; width: 16px !important; height: 16px !important; }

    /* Empty states */
    .empty-state-card {
      display: flex; align-items: center; gap: 12px;
      padding: 20px; background: var(--color-surface-solid);
      border-radius: var(--radius-md); border: 1px dashed var(--color-border-strong);
    }
    .empty-state-card .empty-icon { font-size: 24px; width: 24px; height: 24px; color: var(--color-text-muted); opacity: 0.35; }
    .empty-state-card p { margin: 0; font-size: var(--text-sm); color: var(--color-text-secondary); line-height: var(--leading-relaxed); }
    .empty-state-card a { color: var(--color-primary); font-weight: 600; text-decoration: none; }
    .empty-state-card a:hover { text-decoration: underline; }

    .glance-skeleton { min-height: 80px; }

    @media (max-width: 1024px) {
      .budget-stats-row { grid-template-columns: repeat(3, 1fr); }
    }

    /* Mobile */
    @media (max-width: 599px) {
      .budget-stats-row { grid-template-columns: repeat(2, 1fr); }
      .bs-card { padding: 10px 8px; gap: 8px; }
      .bs-card mat-icon { font-size: 18px; width: 18px; height: 18px; padding: 7px; }
      .bs-value { font-size: 0.95rem; }
      .glance-stats-row { grid-template-columns: repeat(2, 1fr); }
      .glance-stat { border-bottom: 1px solid var(--color-border); }
      .glance-stat:nth-child(odd) { border-right: 1px solid var(--color-border); }
      .glance-stat:nth-child(even) { border-right: none; }
      .glance-stat:nth-last-child(-n+2) { border-bottom: none; }
      .section-block { margin-top: 20px; }
      .gs-value { font-size: 1.15rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private budgetService = inject(BudgetService);
  private tradingService = inject(TradingService);
  private workoutLogService = inject(WorkoutLogService);
  private workoutPlanService = inject(WorkoutPlanService);
  private healthMetricService = inject(HealthMetricService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  summary = signal<DashboardSummary | null>(null);
  budgetPlan = signal<BudgetPlan | null>(null);
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

    const now = new Date();
    this.budgetService.getPlan(now.getFullYear(), now.getMonth() + 1).pipe(
      catchError(() => of(null))
    ).subscribe(plan => {
      this.budgetPlan.set(plan);
      this.cdr.detectChanges();
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
