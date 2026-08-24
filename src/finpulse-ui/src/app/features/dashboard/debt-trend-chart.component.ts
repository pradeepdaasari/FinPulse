import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { TrendData } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-debt-trend-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, BaseChartDirective],
  template: `
    <mat-card class="trend-card">
      <mat-card-header>
        <mat-card-title>
          <div class="card-title-row">
            <span>Debt Trend</span>
            @if (trendData()) {
              <span class="mom-change" [class.positive]="trendData()!.monthOverMonthChange > 0" [class.negative]="trendData()!.monthOverMonthChange < 0">
                <mat-icon>{{ trendData()!.monthOverMonthChange <= 0 ? 'trending_down' : 'trending_up' }}</mat-icon>
                {{ trendData()!.monthOverMonthChangePercent }}% MoM
              </span>
            }
          </div>
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (chartData()) {
          <div class="chart-container">
            <canvas baseChart
              [data]="chartData()!"
              [options]="chartOptions"
              type="line">
            </canvas>
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>show_chart</mat-icon>
            <span>Trend data will appear after your first month</span>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .trend-card { margin-top: var(--spacing-lg); }
    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .mom-change {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8125rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 16px;
    }
    .mom-change mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .mom-change.negative { color: #166534; background: #dcfce7; }
    .mom-change.positive { color: #991b1b; background: #fee2e2; }
    .chart-container { position: relative; height: 280px; }
    .empty-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: var(--spacing-lg);
      color: var(--color-text-muted);
    }
  `]
})
export class DebtTrendChartComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  trendData = signal<TrendData | null>(null);
  chartData = signal<ChartConfiguration<'line'>['data'] | null>(null);

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => '$' + Number(value).toLocaleString()
        }
      }
    }
  };

  ngOnInit(): void {
    this.dashboardService.getTrends().subscribe(data => {
      this.trendData.set(data);
      if (data.snapshots.length > 0) {
        this.chartData.set({
          labels: data.snapshots.map(s => s.label),
          datasets: [
            {
              label: 'Total Debt',
              data: data.snapshots.map(s => s.totalDebt),
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Paid This Month',
              data: data.snapshots.map(s => s.totalPaid),
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              fill: true,
              tension: 0.3
            }
          ]
        });
      }
    });
  }
}
