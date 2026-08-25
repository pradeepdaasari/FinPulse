import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../core/services/dashboard.service';
import { RecurringService } from '../../core/services/recurring.service';
import { DashboardSummary } from '../../core/models/dashboard.model';
import { SummaryCardsComponent } from './summary-cards.component';
import { MonthlyPaymentsComponent } from './monthly-payments.component';
import { DebtTrendChartComponent } from './debt-trend-chart.component';
import { PaymentStreakComponent } from './payment-streak.component';
import { DebtCountdownComponent } from './debt-countdown.component';
import { BudgetHealthComponent } from './budget-health.component';
import { FinancialSummaryComponent } from './financial-summary.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SummaryCardsComponent,
    MonthlyPaymentsComponent,
    DebtTrendChartComponent,
    PaymentStreakComponent,
    DebtCountdownComponent,
    BudgetHealthComponent,
    FinancialSummaryComponent
  ],
  template: `
    @if (loading()) {
      <div class="loading-container">
        <mat-spinner></mat-spinner>
      </div>
    } @else if (summary()) {
      <app-financial-summary></app-financial-summary>
      <app-summary-cards [summary]="summary()!"></app-summary-cards>
      <app-budget-health></app-budget-health>
      <app-monthly-payments></app-monthly-payments>
      <app-debt-trend-chart></app-debt-trend-chart>
      <app-debt-countdown></app-debt-countdown>
      <app-payment-streak></app-payment-streak>
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
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private recurringService = inject(RecurringService);
  private router = inject(Router);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.recurringService.generate().subscribe();
    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        const setupDismissed = localStorage.getItem('finpulse_setup_dismissed');
        if (!setupDismissed && data.numberOfDebts === 0 && data.totalMonthlyPayment === 0 && data.upcomingPayments.length === 0) {
          this.router.navigate(['/setup']);
          return;
        }
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
