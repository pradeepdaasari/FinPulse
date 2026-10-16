import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardSummary } from '../../../core/models/dashboard.model';
import { PaymentStreakComponent } from './payment-streak.component';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { NetWorthComponent } from './net-worth.component';
import { TodayGlanceComponent } from './today-glance.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';
import { DebtCountdownComponent } from './debt-countdown.component';
import { DebtTrendChartComponent } from './debt-trend-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatIconModule,
    PaymentStreakComponent,
    SkeletonLoaderComponent, PullToRefreshDirective,
    NetWorthComponent, TodayGlanceComponent,
    DebtCountdownComponent, DebtTrendChartComponent
  ],
  template: `
    <div appPullToRefresh (refresh)="onRefresh()">

    <!-- ═══════ FINANCE ═══════ -->
    @if (loading()) {
      <app-skeleton type="dashboard"></app-skeleton>
    } @else if (summary()) {
      <app-net-worth></app-net-worth>
      <app-today-glance></app-today-glance>

      <app-payment-streak></app-payment-streak>
      <app-debt-countdown></app-debt-countdown>
      <app-debt-trend-chart></app-debt-trend-chart>

    }


    </div>
  `,
  styles: [`
    :host { display: block; }
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
    this.loading.set(true);

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
