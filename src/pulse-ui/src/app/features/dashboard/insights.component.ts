import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { MonthComparison } from '../../core/models/daily-expense.model';

interface Insight {
  icon: string;
  text: string;
  color: 'green' | 'amber' | 'red';
}

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (insights().length > 0) {
      <div class="insights-card">
        <div class="insights-header">
          <mat-icon class="header-icon">auto_awesome</mat-icon>
          <span class="header-text">Insights</span>
        </div>
        @for (insight of insights(); track insight.text) {
          <div class="insight-row">
            <div class="insight-icon-wrap" [class]="'bg-' + insight.color">
              <mat-icon class="insight-icon">{{ insight.icon }}</mat-icon>
            </div>
            <span class="insight-text">{{ insight.text }}</span>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .insights-card {
      padding: 16px 20px;
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      margin-top: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .insights-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #FFCC00;
    }
    .header-text {
      font-size: var(--text-sm);
      font-weight: 700;
      color: var(--color-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .insight-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .insight-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .insight-icon-wrap.bg-green {
      background: var(--color-success-bg);
    }
    .insight-icon-wrap.bg-amber {
      background: var(--color-warning-bg);
    }
    .insight-icon-wrap.bg-red {
      background: var(--color-danger-bg);
    }
    .insight-icon-wrap.bg-green .insight-icon { color: var(--color-success); }
    .insight-icon-wrap.bg-amber .insight-icon { color: var(--color-warning); }
    .insight-icon-wrap.bg-red .insight-icon { color: var(--color-danger); }
    .insight-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .insight-text {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      font-weight: 500;
      line-height: 1.3;
    }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    @media (max-width: 599px) {
      .insights-card {
        padding: 14px 16px;
      }
    }
  `]
})
export class InsightsComponent implements OnInit {
  private expenseService = inject(DailyExpenseService);
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  insights = signal<Insight[]>([]);

  ngOnInit(): void {
    this.expenseService.getComparison().subscribe({
      next: (data) => this.generateInsights(data),
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  private generateInsights(data: MonthComparison): void {
    const results: Insight[] = [];

    // If no previous data, skip
    if (data.previousTotal === 0 && data.currentTotal === 0) { this.loading.set(false); this.cdr.detectChanges(); return; }

    // Overall spending trend
    if (data.previousTotal > 0) {
      const percentChange = ((data.currentTotal - data.previousTotal) / data.previousTotal) * 100;
      if (percentChange < -5) {
        results.push({
          icon: 'lightbulb',
          text: `Spending down ${Math.abs(Math.round(percentChange))}% this month`,
          color: 'green'
        });
      } else if (percentChange > 10) {
        results.push({
          icon: 'trending_up',
          text: `Spending up ${Math.round(percentChange)}% vs last month`,
          color: 'amber'
        });
      }
    }

    // Category-level insights (significant increases > 20%)
    if (data.categories && data.categories.length > 0) {
      const significantIncreases = data.categories
        .filter(c => c.previousMonthAmount > 0 && c.percentChange > 20)
        .sort((a, b) => b.percentChange - a.percentChange);

      for (const cat of significantIncreases.slice(0, 2)) {
        results.push({
          icon: 'warning',
          text: `${cat.categoryName} up ${Math.round(cat.percentChange)}% vs last month`,
          color: 'amber'
        });
        if (results.length >= 3) break;
      }
    }

    // Positive cash flow insight (fetch financial summary)
    if (results.length < 3) {
      const now = new Date();
      this.dashboardService.getFinancialSummary(now.getFullYear(), now.getMonth() + 1).subscribe({
        next: (fs) => {
          if (fs.netCashFlow > 0) {
            results.push({
              icon: 'savings',
              text: `Positive cash flow of $${fs.netCashFlow.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
              color: 'green'
            });
          }
          this.insights.set(results.slice(0, 3));
          this.loading.set(false);
          this.cdr.detectChanges();
        },
        error: () => {
          this.insights.set(results.slice(0, 3));
          this.loading.set(false);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.insights.set(results.slice(0, 3));
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }
}
