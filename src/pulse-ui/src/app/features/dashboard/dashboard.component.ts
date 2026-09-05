import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { MonthlyPaymentsComponent } from './monthly-payments.component';
import { DebtTrendChartComponent } from './debt-trend-chart.component';
import { PaymentStreakComponent } from './payment-streak.component';
import { DebtCountdownComponent } from './debt-countdown.component';
import { BudgetHealthComponent } from './budget-health.component';
import { FinancialSummaryComponent } from './financial-summary.component';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { NetWorthComponent } from './net-worth.component';
import { TodayGlanceComponent } from './today-glance.component';
import { InsightsComponent } from './insights.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MonthlyPaymentsComponent,
    DebtTrendChartComponent,
    PaymentStreakComponent,
    DebtCountdownComponent,
    BudgetHealthComponent,
    FinancialSummaryComponent,
    SkeletonLoaderComponent,
    PullToRefreshDirective,
    NetWorthComponent,
    TodayGlanceComponent,
    InsightsComponent
  ],
  template: `
    <div appPullToRefresh (refresh)="onRefresh()">
    @if (loading()) {
      <app-skeleton type="dashboard"></app-skeleton>
    } @else if (summary()) {
      <app-net-worth></app-net-worth>
      <app-today-glance></app-today-glance>
      <app-financial-summary [debtSummary]="summary()!"></app-financial-summary>
      <div class="dashboard-grid">
        <app-budget-health></app-budget-health>
        <app-debt-trend-chart></app-debt-trend-chart>
      </div>
      <app-monthly-payments></app-monthly-payments>
      <app-insights></app-insights>
      <div class="dashboard-grid">
        <app-debt-countdown></app-debt-countdown>
        <app-payment-streak></app-payment-streak>
      </div>
    }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
    }
    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  onRefresh(): void {
    this.loadData();
  }

  private loadData(): void {
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
  }
}
