import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { SummaryCardsComponent } from './summary-cards.component';
import { UpcomingPaymentsComponent } from './upcoming-payments.component';
import { MonthlyPaymentsComponent } from './monthly-payments.component';
import { DebtTrendChartComponent } from './debt-trend-chart.component';
import { PaymentStreakComponent } from './payment-streak.component';
import { DebtCountdownComponent } from './debt-countdown.component';
import { BudgetHealthComponent } from './budget-health.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    SummaryCardsComponent,
    UpcomingPaymentsComponent,
    MonthlyPaymentsComponent,
    DebtTrendChartComponent,
    PaymentStreakComponent,
    DebtCountdownComponent,
    BudgetHealthComponent
  ],
  template: `
    @if (loading()) {
      <div class="loading-container">
        <mat-spinner></mat-spinner>
      </div>
    } @else if (summary()) {
      <h2><mat-icon class="section-icon">space_dashboard</mat-icon> Dashboard</h2>
      <app-summary-cards [summary]="summary()!"></app-summary-cards>
      <app-payment-streak></app-payment-streak>
      <app-budget-health></app-budget-health>
      <app-monthly-payments></app-monthly-payments>

      <div class="dashboard-row">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title><mat-icon class="card-title-icon">donut_large</mat-icon> Debt Breakdown</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas baseChart
              [data]="chartData()"
              [options]="chartOptions"
              type="doughnut">
            </canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="payments-card">
          <mat-card-content>
            <app-upcoming-payments [payments]="summary()!.upcomingPayments"></app-upcoming-payments>
          </mat-card-content>
        </mat-card>
      </div>

      <app-debt-trend-chart></app-debt-trend-chart>
      <app-debt-countdown></app-debt-countdown>
    }
  `,
  styles: [`
    :host {
      display: block;
    }
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 80px;
    }
    h2 {
      margin-bottom: var(--spacing-lg);
      display: flex;
      align-items: center;
    }
    .card-title-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-right: 8px;
      color: var(--color-primary);
      vertical-align: middle;
    }
    .dashboard-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
      margin-top: var(--spacing-lg);
    }
    .chart-card canvas {
      max-height: 300px;
      padding: var(--spacing-md);
    }
    .payments-card {
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .dashboard-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);

  chartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.buildChart(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private buildChart(data: DashboardSummary): void {
    const breakdown = data.debtBreakdown ?? [];
    this.chartData.set({
      labels: breakdown.map(d => d.name),
      datasets: [{
        data: breakdown.map(d => d.balance),
        backgroundColor: [
          '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
          '#c62828', '#00838f', '#4e342e', '#283593'
        ]
      }]
    });
  }
}
