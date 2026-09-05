import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of, catchError } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { RecurringService } from '../../core/services/recurring.service';
import { UpcomingPayment } from '../../core/models/dashboard.model';
import { DailyExpense } from '../../core/models/daily-expense.model';
import { RecurringTransaction } from '../../core/models/recurring.model';
import { toLocalDateString } from '../../core/utils/date-utils';

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
              @if (paymentsDueToday().length > 0) {
                {{ paymentsTotalDue() | currency:'USD':'symbol':'1.0-0' }} due
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
      @if (recurringDue().length > 0) {
        <div class="due-banner" (click)="goToRecurring()">
          <mat-icon class="due-icon">notifications_active</mat-icon>
          <span class="due-text">
            {{ recurringDue().length }} recurring bill{{ recurringDue().length > 1 ? 's' : '' }} due today &mdash;
            {{ recurringDueTotal() | currency:'USD':'symbol':'1.0-0' }} total
          </span>
          <mat-icon class="due-arrow">chevron_right</mat-icon>
        </div>
      }
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
    .glance-icon.icon-green { color: var(--color-success); }
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
    .due-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      background: var(--color-stat-amber-bg);
      border: 1px solid rgba(255, 149, 0, 0.25);
      margin-bottom: var(--spacing-md);
      cursor: pointer;
      transition: filter var(--transition-fast);
    }
    .due-banner:hover { filter: brightness(0.96); }
    .due-icon { color: var(--color-warning); font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .due-text { flex: 1; font-size: var(--text-sm); font-weight: 600; color: var(--color-warning); }
    .due-arrow { color: var(--color-warning); font-size: 20px; width: 20px; height: 20px; }
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
    }
  `]
})
export class TodayGlanceComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private expenseService = inject(DailyExpenseService);
  private recurringService = inject(RecurringService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  loaded = signal(false);
  paymentsDueToday = signal<UpcomingPayment[]>([]);
  paymentsTotalDue = signal<number>(0);
  todaySpending = signal<number>(0);
  recurringDue = signal<RecurringTransaction[]>([]);
  recurringDueTotal = signal<number>(0);

  goToRecurring(): void { this.router.navigate(['/recurring']); }

  ngOnInit(): void {
    const today = toLocalDateString(new Date());

    forkJoin({
      summary: this.dashboardService.getSummary().pipe(catchError(() => of(null))),
      expenses: this.expenseService.getExpenses({ dateFrom: today, dateTo: today }).pipe(catchError(() => of(null))),
      recurring: this.recurringService.getAll().pipe(catchError(() => of([])))
    }).subscribe(({ summary, expenses, recurring }) => {
      // Payments due today
      if (summary && summary.upcomingPayments) {
        const todayPayments = summary.upcomingPayments.filter(p => {
          const dueDate = new Date(p.dueDate);
          const now = new Date();
          return dueDate.getFullYear() === now.getFullYear() &&
                 dueDate.getMonth() === now.getMonth() &&
                 dueDate.getDate() === now.getDate();
        });
        this.paymentsDueToday.set(todayPayments);
        this.paymentsTotalDue.set(todayPayments.reduce((sum, p) => sum + p.amount, 0));
      }

      // Today's spending
      if (expenses && expenses.length > 0) {
        const spent = expenses
          .filter(e => e.transactionType === 'Expense')
          .reduce((sum, e) => sum + e.amount, 0);
        this.todaySpending.set(spent);
      }

      // Recurring bills due today
      if (recurring && recurring.length > 0) {
        const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
        const due = (recurring as RecurringTransaction[]).filter(r => r.isActive && r.nextRunDate.slice(0, 10) <= todayStr);
        this.recurringDue.set(due);
        this.recurringDueTotal.set(due.reduce((sum, r) => sum + r.amount, 0));
      }

      this.loaded.set(true);
      this.loading.set(false);
      this.cdr.detectChanges();
    });
  }
}
