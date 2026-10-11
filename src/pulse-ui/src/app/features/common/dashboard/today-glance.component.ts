import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MonthlyPaymentRow, MonthlyPaymentsData } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-today-glance',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (loaded()) {
      <div class="glance-card">
        <div class="glance-section">
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
        </div>
        <div class="glance-divider"></div>
        <div class="glance-section">
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
        </div>
      </div>
      <div class="upcoming-section">
        <div class="upcoming-header">
          <span class="upcoming-title">Coming Up</span>
          <a class="upcoming-view-all" (click)="goToMonthlyPulse()">View All <mat-icon>chevron_right</mat-icon></a>
        </div>
        @if (upcoming().length > 0) {
          <div class="upcoming-list">
            @for (p of upcoming(); track p.id + p.kind) {
              <div class="upcoming-row">
                <mat-icon class="upcoming-kind-icon" [class.icon-amber]="p.daysUntilDue <= 2" [class.icon-muted]="p.daysUntilDue > 2">
                  {{ p.icon }}
                </mat-icon>
                <div class="upcoming-info">
                  <span class="upcoming-name">{{ p.name }}</span>
                  <span class="upcoming-due" [class.due-urgent]="p.daysUntilDue <= 2">
                    {{ p.daysUntilDue === 1 ? 'Tomorrow' : 'In ' + p.daysUntilDue + ' days' }}
                  </span>
                </div>
                @if (p.isAutopay) {
                  <span class="autopay-badge">Autopay</span>
                }
                <span class="upcoming-amount">{{ p.amount | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="upcoming-empty">
            <mat-icon class="upcoming-empty-icon">check_circle</mat-icon>
            <span>No payments upcoming in the next 5 days</span>
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
    .glance-divider {
      width: 1px;
      height: 36px;
      background: var(--color-border);
      flex-shrink: 0;
    }
    .glance-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }
    .glance-icon.icon-blue { color: var(--color-primary); }
    .glance-icon.icon-amber { color: var(--color-warning); }
    .glance-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .glance-value {
      font-size: var(--text-sm);
      font-weight: 700;
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
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    /* Upcoming payments */
    .upcoming-section {
      background: var(--color-surface-solid);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xs);
      margin-bottom: var(--spacing-md);
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
      color: var(--color-text-secondary);
    }
    .upcoming-view-all {
      display: flex; align-items: center; gap: 2px;
      font-size: var(--text-xs); font-weight: 600; color: var(--color-primary);
      text-decoration: none; cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .upcoming-view-all mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .upcoming-view-all:hover { opacity: 0.75; }
    .upcoming-list { display: flex; flex-direction: column; }
    .upcoming-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
    }
    .upcoming-row:last-child { border-bottom: none; }
    .upcoming-kind-icon {
      font-size: 20px; width: 20px; height: 20px; flex-shrink: 0;
    }
    .upcoming-kind-icon.icon-amber { color: var(--color-warning); }
    .upcoming-kind-icon.icon-muted { color: var(--color-text-muted); opacity: 0.6; }
    .upcoming-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .upcoming-name {
      font-size: var(--text-sm); font-weight: 600; color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .upcoming-due {
      font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 500;
    }
    .upcoming-due.due-urgent { color: var(--color-warning); font-weight: 600; }
    .autopay-badge {
      font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 6px; border-radius: var(--radius-full);
      background: var(--color-success-bg); color: var(--color-success-text);
      flex-shrink: 0;
    }
    .upcoming-amount {
      font-size: var(--text-sm); font-weight: 700; color: var(--color-text);
      white-space: nowrap; flex-shrink: 0;
    }
    .upcoming-chevron {
      font-size: 16px; width: 16px; height: 16px;
      color: var(--color-text-muted); flex-shrink: 0;
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
      .upcoming-row { padding: 10px 14px; gap: 10px; }
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
  upcoming = signal<MonthlyPaymentRow[]>([]);

  goToMonthlyPulse(): void { this.router.navigate(['/monthly-pulse']); }

  ngOnInit(): void {
    this.dashboardService.getMonthlyPayments().subscribe({
      next: (data) => {
        const unpaid = data.rows.filter(r => r.status !== 'paid');
        this.dueToday.set(unpaid.filter(r => r.status === 'due-today' || r.status === 'overdue'));
        this.dueTodayTotal.set(data.dueTodayTotal);
        this.upcoming.set(unpaid.filter(r => r.daysUntilDue >= 1 && r.daysUntilDue <= 5));
        this.todaySpending.set(data.todaySpending);
        this.loaded.set(true);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }
}
