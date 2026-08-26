import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, catchError } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { WorkoutLogService } from '../../core/services/workout-log.service';
import { UpcomingPayment } from '../../core/models/dashboard.model';
import { DailyExpense } from '../../core/models/daily-expense.model';
import { WorkoutLog } from '../../core/models/workout-log.model';

@Component({
  selector: 'app-today-glance',
  standalone: true,
  imports: [CommonModule, MatIconModule, CurrencyPipe],
  template: `
    @if (loaded()) {
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
        <div class="glance-divider"></div>
        <div class="glance-section">
          <mat-icon class="glance-icon icon-green">fitness_center</mat-icon>
          <div class="glance-info">
            <span class="glance-value">{{ workoutLabel() }}</span>
            <span class="glance-label">Workout</span>
          </div>
        </div>
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
  private workoutService = inject(WorkoutLogService);

  loaded = signal(false);
  paymentsDueToday = signal<UpcomingPayment[]>([]);
  paymentsTotalDue = signal<number>(0);
  todaySpending = signal<number>(0);
  workoutLabel = signal<string>('Rest day');

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    forkJoin({
      summary: this.dashboardService.getSummary().pipe(catchError(() => of(null))),
      expenses: this.expenseService.getExpenses({ dateFrom: today, dateTo: today }).pipe(catchError(() => of(null))),
      workout: this.workoutService.getToday().pipe(catchError(() => of(null)))
    }).subscribe(({ summary, expenses, workout }) => {
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

      // Workout
      if (workout) {
        this.workoutLabel.set(workout.focusArea || 'Completed');
      } else {
        this.workoutLabel.set('Rest day');
      }

      this.loaded.set(true);
    });
  }
}
