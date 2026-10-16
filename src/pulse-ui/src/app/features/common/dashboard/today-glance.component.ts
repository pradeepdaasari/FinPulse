import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MonthlyPaymentRow } from '../../../core/models/dashboard.model';
import { PaymentRowComponent } from '../../../shared/payment-row.component';

@Component({
  selector: 'app-today-glance',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe, PaymentRowComponent, BaseChartDirective],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (loaded()) {
      <div class="glance-card">
        <div class="glance-section" (click)="goToMonthlyPulse()">
          <mat-icon class="glance-icon icon-blue">payment</mat-icon>
          <div class="glance-info">
            <span class="glance-value">
              @if (dueToday().length > 0) {
                {{ dueTodayTotal() | currency:'USD':'symbol':'1.0-0' }} due
              } @else {
                No payments
              }
            </span>
            <span class="glance-label">Due today</span>
          </div>
          <mat-icon class="chevron-icon">chevron_right</mat-icon>
        </div>
        <div class="glance-divider"></div>
        <div class="glance-section spending-section" (click)="toggleSpendingChart()">
          <mat-icon class="glance-icon icon-amber">shopping_cart</mat-icon>
          <div class="glance-info">
            <span class="glance-value">
              @if (todaySpending() > 0) {
                {{ todaySpending() | currency:'USD':'symbol':'1.0-0' }} spent
              } @else {
                $0 spent
              }
            </span>
            <span class="glance-label">Today</span>
          </div>
          <mat-icon class="expand-icon" [class.expanded]="chartExpanded()">expand_more</mat-icon>
        </div>
      </div>

      @if (chartExpanded()) {
        <div class="spending-chart-card">
          <div class="chart-header">
            <span class="chart-title">Spending Trend</span>
            <span class="chart-avg">Avg {{ dailyAverage() | currency:'USD':'symbol':'1.0-0' }}/day</span>
          </div>
          @if (chartLoading()) {
            <div class="chart-loading"><mat-spinner diameter="24"></mat-spinner></div>
          } @else if (chartData()) {
            <div class="chart-container">
              <canvas baseChart
                [data]="chartData()!"
                [options]="chartOptions"
                type="line">
              </canvas>
            </div>
          } @else {
            <div class="chart-empty">No spending data for the last 30 days</div>
          }
        </div>
      }

      <div class="upcoming-section">
        <div class="upcoming-header">
          <span class="upcoming-title">Due &amp; Coming Up</span>
          <a class="upcoming-view-all" (click)="goToMonthlyPulse()">View All <mat-icon>chevron_right</mat-icon></a>
        </div>
        @if (allRows().length > 0) {
          <div class="rows-container">
            @for (row of allRows(); track row.id + row.kind + row.dueDate) {
              <app-payment-row [row]="row" (recordPayment)="goToMonthlyPulse()" />
            }
          </div>
        } @else {
          <div class="upcoming-empty">
            <mat-icon class="upcoming-empty-icon">check_circle</mat-icon>
            <span>No payments due or upcoming in the next 5 days</span>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .glance-card {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--spacing-md);
      gap: 16px;
    }
    .glance-section {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }
    .glance-section { cursor: pointer; }
    .chevron-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: var(--color-text-muted); flex-shrink: 0;
      margin-left: auto;
    }
    .glance-divider {
      width: 1px;
      height: 36px;
      background: var(--color-border);
      flex-shrink: 0;
    }
    .glance-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      padding: 6px;
      border-radius: var(--radius-xs);
      flex-shrink: 0;
      box-sizing: content-box;
    }
    .glance-icon.icon-blue { color: var(--color-primary); background: var(--color-primary-subtle); }
    .glance-icon.icon-amber { color: var(--color-warning); background: var(--color-warning-bg); }
    .glance-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .glance-value {
      font-size: var(--text-sm);
      font-weight: 800;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .glance-label {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      font-weight: 500;
    }
    .expand-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: var(--color-text-muted); flex-shrink: 0;
      margin-left: auto;
      transition: transform 0.2s ease;
    }
    .expand-icon.expanded { transform: rotate(180deg); }

    /* Spending chart */
    .spending-chart-card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xs);
      margin-bottom: var(--spacing-md);
      padding: 16px;
      overflow: hidden;
    }
    .chart-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px;
    }
    .chart-title {
      font-size: 0.82rem; font-weight: 700; color: var(--color-text);
      display: flex; align-items: center; gap: 6px;
    }
    .chart-avg {
      font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted);
      background: var(--color-surface-secondary); padding: 3px 10px;
      border-radius: var(--radius-full);
    }
    .chart-container { position: relative; height: 180px; }
    .chart-loading {
      display: flex; justify-content: center; align-items: center; height: 180px;
    }
    .chart-empty {
      display: flex; align-items: center; justify-content: center;
      height: 100px; color: var(--color-text-muted); font-size: var(--text-sm);
    }

    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }

    /* Upcoming payments */
    .upcoming-section {
      background: var(--color-surface-solid);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xs);
      margin-bottom: var(--spacing-lg);
      overflow: hidden;
    }
    .upcoming-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
    }
    .upcoming-title {
      font-size: var(--text-xs); font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }
    .upcoming-view-all {
      display: flex; align-items: center; gap: 2px;
      font-size: var(--text-xs); font-weight: 600; color: var(--color-primary);
      text-decoration: none; cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .upcoming-view-all mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .upcoming-view-all:hover { opacity: 0.75; }
    .rows-container {
      background: var(--color-surface); overflow: hidden;
    }
    .upcoming-empty {
      display: flex; align-items: center; gap: 10px;
      padding: 16px; color: var(--color-text-muted);
      font-size: var(--text-sm); font-weight: 500;
    }
    .upcoming-empty-icon {
      font-size: 20px; width: 20px; height: 20px;
      color: var(--color-success); flex-shrink: 0;
    }

    @media (max-width: 599px) {
      .glance-card {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 14px 16px;
      }
      .glance-divider {
        width: 100%;
        height: 1px;
      }
      .glance-section {
        gap: 10px;
      }
      .chart-container { height: 160px; }
      .spending-section { min-height: 44px; }
    }
  `]
})
export class TodayGlanceComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  loaded = signal(false);

  dueToday = signal<MonthlyPaymentRow[]>([]);
  dueTodayTotal = signal(0);
  todaySpending = signal(0);
  allRows = signal<MonthlyPaymentRow[]>([]);

  chartExpanded = signal(false);
  chartLoading = signal(false);
  chartLoaded = false;
  chartData = signal<ChartConfiguration<'line'>['data'] | null>(null);
  dailyAverage = signal(0);

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => '$' + Number(ctx.parsed.y).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        }
      }
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 7, font: { size: 10 } },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: {
          maxTicksLimit: 5,
          font: { size: 10 },
          callback: (value) => '$' + Number(value).toLocaleString('en-US')
        },
        grid: { color: 'rgba(0,0,0,0.04)' }
      }
    },
    elements: {
      point: { radius: 2, hoverRadius: 5 },
      line: { borderWidth: 2 }
    }
  };

  goToMonthlyPulse(): void { this.router.navigate(['/upcoming-payments']); }

  toggleSpendingChart(): void {
    this.chartExpanded.update(v => !v);
    if (this.chartExpanded() && !this.chartLoaded) {
      this.loadSpendingChart();
    }
  }

  private loadSpendingChart(): void {
    this.chartLoading.set(true);
    this.dashboardService.getDailySpending(30).subscribe({
      next: (data) => {
        this.dailyAverage.set(data.average);
        if (data.days.length > 0) {
          const labels = data.days.map(d => {
            const dt = new Date(d.date + 'T00:00:00');
            return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          });
          this.chartData.set({
            labels,
            datasets: [{
              data: data.days.map(d => d.amount),
              borderColor: '#FF9500',
              backgroundColor: 'rgba(255, 149, 0, 0.08)',
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#FF9500'
            }]
          });
        }
        this.chartLoaded = true;
        this.chartLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.chartLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnInit(): void {
    this.dashboardService.getMonthlyPayments().subscribe({
      next: (data) => {
        const unpaid = data.rows.filter(r => r.status !== 'paid');
        const due = unpaid.filter(r => r.status === 'due-today' || r.status === 'overdue');
        const upcoming = unpaid.filter(r => r.daysUntilDue >= 1 && r.daysUntilDue <= 5);
        this.dueToday.set(due);
        this.dueTodayTotal.set(data.dueTodayTotal);
        this.allRows.set([...due, ...upcoming]);
        this.todaySpending.set(data.todaySpending);
        this.loaded.set(true);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }
}
