import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardInsight } from '../../../core/models/dashboard.model';

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
      margin-bottom: var(--spacing-sm);
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
      color: var(--color-warning);
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
      padding: 4px 0;
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
    .insight-icon-wrap.bg-blue { background: var(--color-info-bg); }
    .insight-icon-wrap.bg-blue .insight-icon { color: var(--color-info); }
    .insight-icon-wrap.bg-purple { background: var(--color-stat-purple-bg); }
    .insight-icon-wrap.bg-purple .insight-icon { color: var(--color-stat-purple); }
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
        -webkit-tap-highlight-color: transparent;
        transition: opacity 0.1s ease;
      }
      .insights-card:active { opacity: 0.7; }
      .insight-icon-wrap { min-width: 44px; min-height: 44px; width: 44px; height: 44px; }
    }
  `]
})
export class InsightsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  insights = signal<DashboardInsight[]>([]);

  ngOnInit(): void {
    this.dashboardService.getInsights().subscribe({
      next: (insights) => { this.insights.set(insights); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }
}
