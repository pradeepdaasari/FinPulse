import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { BudgetService } from '../../../core/services/budget.service';
import { BudgetPlan, PaycheckBreakdown } from '../../../core/models/budget.model';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';

@Component({
  selector: 'app-paychecks-page',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatTooltipModule, CurrencyPipe, LocalDatePipe,
    SkeletonLoaderComponent, PullToRefreshDirective, RouterLink
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    <!-- Month Navigator -->
    <div class="month-nav-row">
      <div class="month-nav">
        <button mat-icon-button (click)="prevMonth()" aria-label="Previous month"><mat-icon>chevron_left</mat-icon></button>
        <span class="month-label">{{ monthLabel() }}</span>
        <button mat-icon-button (click)="nextMonth()" aria-label="Next month"><mat-icon>chevron_right</mat-icon></button>
      </div>
      @if (!isCurrentMonth()) {
        <button mat-stroked-button class="today-btn" (click)="goToCurrentMonth()">
          <mat-icon>today</mat-icon> Today
        </button>
      }
    </div>

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else if (hasError()) {
      <div class="error-state">
        <mat-icon class="error-icon">cloud_off</mat-icon>
        <h3>Couldn't load your paychecks</h3>
        <p>Something went wrong. Check your connection and try again.</p>
        <button mat-raised-button color="primary" (click)="loadData()">
          <mat-icon>refresh</mat-icon> Try Again
        </button>
      </div>
    } @else if (plan()) {
      <!-- Paycheck Summary -->
      @if (plan()!.paycheckBreakdowns.length > 0) {
        <div class="paycheck-summary-card" [class.summary-over]="plan()!.paycheckSummary.isNetOver">
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="summary-stat-label">Total Income</span>
              <span class="summary-stat-value">{{ plan()!.paycheckSummary.totalIncome | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="summary-stat-sub">{{ plan()!.paycheckSummary.paycheckCount }} paychecks</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-stat">
              <span class="summary-stat-label">Total Allocated</span>
              <span class="summary-stat-value">{{ plan()!.paycheckSummary.totalAllocated | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="summary-stat-sub">all bills & budgets</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-stat">
              <span class="summary-stat-label">{{ plan()!.paycheckSummary.isNetOver ? 'Over by' : 'Net Available' }}</span>
              <span class="summary-stat-value" [class.color-green]="!plan()!.paycheckSummary.isNetOver" [class.color-red]="plan()!.paycheckSummary.isNetOver">
                {{ plan()!.paycheckSummary.isNetOver ? '-' : '+' }}{{ plan()!.paycheckSummary.absNetLeftover | currency:'USD':'symbol':'1.0-0' }}
              </span>
              <span class="summary-stat-sub">across all paychecks</span>
            </div>
          </div>
          @if (plan()!.paycheckSummary.overCount > 0) {
            <div class="summary-note">
              <mat-icon>info_outline</mat-icon>
              <span>{{ plan()!.paycheckSummary.overCount }} paycheck{{ plan()!.paycheckSummary.overCount > 1 ? 's' : '' }} over-allocated — balanced by surplus in others</span>
            </div>
          }
        </div>
      }

      @for (pc of plan()!.paycheckBreakdowns; track pc.payDate) {
        <div class="paycheck-card" [class.prior-month]="pc.isPriorMonth" [class.current-paycheck]="isCurrentPaycheck(pc)">
          <div class="paycheck-header">
            <div class="paycheck-title-block">
              <div class="paycheck-title-row">
                <mat-icon class="paycheck-cal-icon">event</mat-icon>
                <span class="paycheck-range">{{ pc.windowStart | localDate:'MMM d' }} – {{ pc.windowEnd | localDate:'MMM d' }}</span>
                @if (pc.isPriorMonth) {
                  <span class="paycheck-pill prior-pill">Prior paycheck</span>
                }
                @if (isCurrentPaycheck(pc)) {
                  <span class="paycheck-pill current-pill">Current</span>
                }
              </div>
              <span class="paycheck-subtitle">{{ pc.payDate | localDate:'EEEE, MMM d' }} (payday)</span>
            </div>
            <div class="paycheck-header-right">
              <span class="paycheck-take-home">{{ pc.grossPay | currency:'USD':'symbol':'1.0-0' }}</span>
              @if (pc.totalBillCount > 0) {
                <span class="paid-badge" [class.all-paid]="pc.paidCount === pc.totalBillCount">
                  <mat-icon class="paid-badge-icon">{{ pc.paidCount === pc.totalBillCount ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                  {{ pc.paidCount }} of {{ pc.totalBillCount }} paid
                </span>
              }
            </div>
          </div>
          <div class="paycheck-progress-row">
            <mat-progress-bar mode="determinate" [value]="pc.spendPercent"
              [color]="pc.isOver ? 'warn' : 'primary'">
            </mat-progress-bar>
            <div class="paycheck-labels">
              <span class="paycheck-allocated">{{ pc.totalExpenses | currency:'USD':'symbol':'1.0-0' }} allocated</span>
              <span class="paycheck-leftover" [class.negative]="pc.isOver" [class.positive]="!pc.isOver">
                {{ pc.isOver ? 'Over by ' : '' }}{{ pc.absLeftover | currency:'USD':'symbol':'1.0-0' }}{{ pc.isOver ? '' : ' available' }}
              </span>
            </div>
          </div>
          @if (pc.expenses.length > 0) {
            <div class="paycheck-expenses">
              @for (e of pc.expenses; track e.expenseId; let odd = $odd) {
                <div class="expense-row" [class.alt-row]="odd" [class.row-paid]="e.isPaid" [class.row-overdue]="e.status === 'overdue'">
                  @if (e.dueDate) {
                    <mat-icon class="status-icon" [class.si-paid]="e.status === 'paid'" [class.si-overdue]="e.status === 'overdue'" [class.si-due-today]="e.status === 'due-today'" [class.si-upcoming]="e.status === 'upcoming' || e.status === 'due-soon'">
                      {{ e.status === 'paid' ? 'check_circle' : e.status === 'overdue' ? 'error' : e.status === 'due-today' ? 'schedule' : 'radio_button_unchecked' }}
                    </mat-icon>
                  }
                  <div class="expense-name">
                    {{ e.name }}
                    @if (e.isDebtPayment) { <mat-icon class="inline-badge debt-badge" matTooltip="Debt Payment">credit_score</mat-icon> }
                    @if (e.isAutopay) { <mat-icon class="inline-badge auto-badge" matTooltip="Autopay">autorenew</mat-icon> }
                  </div>
                  <span class="expense-status-label" [class.sl-paid]="e.status === 'paid'" [class.sl-overdue]="e.status === 'overdue'" [class.sl-due-today]="e.status === 'due-today'">{{ e.statusLabel }}</span>
                  <span class="expense-amount" [class.amount-paid]="e.isPaid">{{ e.amount | currency }}</span>
                </div>
              }
            </div>
          } @else {
            <div class="paycheck-empty">
              <mat-icon>check_circle</mat-icon>
              <span>No expenses assigned to this paycheck</span>
            </div>
          }
        </div>
      }

      @if (plan()!.paycheckBreakdowns.length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap blue">
            <mat-icon>calendar_today</mat-icon>
          </div>
          <h3>No paychecks found</h3>
          <p>Set your pay frequency and next pay date in Setup to see your paycheck breakdown.</p>
          <a mat-raised-button color="primary" routerLink="/settings">
            <mat-icon>settings</mat-icon> Go to Setup
          </a>
        </div>
      }
    } @else {
      <div class="empty-state">
        <div class="empty-icon-wrap amber">
          <mat-icon>payments</mat-icon>
        </div>
        <h3>Set up your paychecks</h3>
        <p>Add your pay information to start tracking your paycheck breakdown.</p>
        <a mat-raised-button color="primary" routerLink="/settings">
          <mat-icon>settings</mat-icon> Go to Setup
        </a>
      </div>
    }
    </div>
  `,
  styles: [`
    /* Month Navigator */
    .month-nav-row {
      display: flex; align-items: center; justify-content: flex-end;
      gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); flex-wrap: wrap;
    }
    .month-nav { display: flex; align-items: center; gap: var(--spacing-xs); }
    .month-label {
      font-size: var(--text-lg); font-weight: var(--weight-bold);
      min-width: 160px; text-align: center; letter-spacing: -0.01em;
    }
    .today-btn {
      font-size: var(--text-xs) !important; padding: 0 12px !important;
      height: 32px !important; line-height: 32px !important;
      border-radius: var(--radius-full) !important;
    }
    .today-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    .color-green { color: #34C759 !important; }
    .color-red { color: #FF3B30 !important; }

    /* Paycheck Summary Card */
    .paycheck-summary-card {
      background: var(--color-surface-solid); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); box-shadow: var(--shadow-xs);
      margin-bottom: var(--spacing-md); padding: 16px 20px; overflow: hidden;
    }
    .paycheck-summary-card.summary-over { border-color: var(--color-danger-bg); }
    .summary-stats {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    .summary-stat { flex: 1; text-align: center; }
    .summary-stat-label {
      display: block; font-size: var(--text-xs); color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: var(--tracking-wide);
      font-weight: var(--weight-semibold); margin-bottom: 4px;
    }
    .summary-stat-value {
      display: block; font-size: 1.15rem; font-weight: var(--weight-bold);
      letter-spacing: -0.02em;
    }
    .summary-stat-sub {
      display: block; font-size: 11px; color: var(--color-text-muted);
      font-weight: var(--weight-medium); margin-top: 2px;
    }
    .summary-divider {
      width: 1px; height: 40px; background: var(--color-border); flex-shrink: 0;
    }
    .summary-note {
      display: flex; align-items: center; gap: 6px; margin-top: 12px;
      padding-top: 12px; border-top: 1px solid var(--color-border);
      font-size: var(--text-xs); color: var(--color-text-muted);
      font-weight: var(--weight-medium);
    }
    .summary-note mat-icon {
      font-size: 16px; width: 16px; height: 16px; color: var(--color-stat-amber);
      flex-shrink: 0;
    }

    /* Paycheck Cards */
    .paycheck-card {
      background: var(--color-surface-solid); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); box-shadow: var(--shadow-xs);
      margin-bottom: var(--spacing-md); overflow: hidden;
      border-left: 3px solid transparent;
    }
    .paycheck-card.prior-month {
      border-left-color: var(--color-stat-amber);
      background: rgba(255, 152, 0, 0.03);
    }
    .paycheck-card.current-paycheck {
      border-left-color: var(--color-primary);
      background: rgba(59, 130, 246, 0.03);
    }
    .paycheck-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
    }
    .paycheck-title-block { display: flex; flex-direction: column; gap: 2px; }
    .paycheck-title-row {
      display: flex; align-items: center; gap: 8px;
      font-weight: var(--weight-bold); font-size: var(--text-base);
    }
    .paycheck-range { font-weight: var(--weight-bold); }
    .paycheck-subtitle {
      font-size: var(--text-xs); color: var(--color-text-muted);
      font-weight: var(--weight-medium); padding-left: 28px;
    }
    .paycheck-pill {
      font-size: 11px; font-weight: var(--weight-semibold);
      padding: 2px 8px; border-radius: var(--radius-full);
      white-space: nowrap; line-height: 1.4;
    }
    .prior-pill { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }
    .current-pill { background: rgba(59, 130, 246, 0.12); color: var(--color-primary); }
    .paycheck-cal-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .paycheck-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .paycheck-take-home { font-weight: var(--weight-bold); font-size: var(--text-base); color: var(--color-primary); }
    .paid-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: var(--weight-semibold);
      color: var(--color-text-muted); padding: 2px 8px;
      border-radius: var(--radius-full); background: var(--color-surface-secondary);
    }
    .paid-badge.all-paid { background: var(--color-success-bg); color: var(--color-success-text); }
    .paid-badge-icon { font-size: 13px; width: 13px; height: 13px; }
    .paycheck-progress-row { padding: 14px 16px; }
    .paycheck-labels {
      display: flex; justify-content: space-between; margin-top: 6px; font-size: var(--text-xs);
    }
    .paycheck-allocated { color: var(--color-text-muted); font-weight: var(--weight-medium); }
    .paycheck-leftover { font-weight: var(--weight-semibold); }
    .paycheck-leftover.positive { color: var(--color-success-text); }
    .paycheck-leftover.negative { color: var(--color-danger-text); }

    /* Expense Rows */
    .paycheck-expenses { border-top: 1px solid var(--color-border); }
    .expense-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; font-size: var(--text-sm); gap: 8px;
    }
    .alt-row { background: var(--color-surface-secondary); }
    .expense-name {
      flex: 1; min-width: 0; font-weight: var(--weight-medium);
      display: flex; align-items: center; gap: 4px;
    }
    .inline-badge { font-size: 15px; width: 15px; height: 15px; opacity: 0.5; }
    .debt-badge { color: var(--color-accent); }
    .auto-badge { color: var(--color-text-muted); }
    .expense-due { font-size: var(--text-xs); color: var(--color-text-muted); min-width: 48px; text-align: center; }
    .expense-amount { font-weight: var(--weight-semibold); white-space: nowrap; }
    .expense-amount.amount-paid { opacity: 0.5; }
    .row-paid { opacity: 0.7; }
    .row-overdue { background: rgba(255, 59, 48, 0.04); }
    .status-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    .si-paid { color: var(--color-success-text); }
    .si-overdue { color: var(--color-danger-text); }
    .si-due-today { color: var(--color-stat-amber); }
    .si-upcoming { color: var(--color-text-muted); opacity: 0.4; }
    .expense-status-label {
      font-size: var(--text-xs); color: var(--color-text-muted);
      white-space: nowrap; min-width: 56px; text-align: center;
    }
    .sl-paid { color: var(--color-success-text); font-weight: var(--weight-semibold); }
    .sl-overdue { color: var(--color-danger-text); font-weight: var(--weight-semibold); }
    .sl-due-today { color: var(--color-stat-amber); font-weight: var(--weight-semibold); }
    .paycheck-empty {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 24px 16px; color: var(--color-text-muted); font-size: var(--text-sm);
      border-top: 1px solid var(--color-border);
    }
    .paycheck-empty mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-success); }

    /* Empty & Error States */
    .empty-state { text-align: center; padding: 48px 24px; }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-icon-wrap.amber { background: var(--color-stat-amber-bg); }
    .empty-icon-wrap.amber mat-icon { color: var(--color-stat-amber); font-size: 32px; width: 32px; height: 32px; }
    .empty-icon-wrap.blue { background: var(--color-stat-blue-bg); }
    .empty-icon-wrap.blue mat-icon { color: var(--color-stat-blue); font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { font-weight: var(--weight-bold); margin-bottom: 8px; }
    .empty-state p { color: var(--color-text-muted); font-size: var(--text-sm); max-width: 320px; margin: 0 auto 20px; line-height: var(--leading-relaxed); }
    .error-state { text-align: center; padding: 48px 24px; }
    .error-icon { font-size: 48px; width: 48px; height: 48px; color: var(--color-text-muted); margin-bottom: 12px; }
    .error-state h3 { font-weight: var(--weight-bold); margin-bottom: 8px; }
    .error-state p { color: var(--color-text-muted); font-size: var(--text-sm); max-width: 320px; margin: 0 auto 20px; }

    /* Responsive */
    @media (max-width: 768px) {
      .paycheck-header { flex-direction: column; align-items: flex-start; gap: 6px; }
      .paycheck-title-row { flex-wrap: wrap; }
    }
    @media (max-width: 599px) {
      .expense-due { display: none; }
      .summary-stats { flex-direction: column; gap: 12px; }
      .summary-divider { width: 100%; height: 1px; }
      .summary-stat { text-align: left; display: flex; align-items: baseline; gap: 8px; }
      .summary-stat-label { margin-bottom: 0; }
      .summary-stat-sub { display: none; }
    }
  `]
})
export class PaychecksPageComponent implements OnInit {
  private budgetService = inject(BudgetService);

  plan = signal<BudgetPlan | null>(null);
  loading = signal(true);
  hasError = signal(false);

  isCurrentMonth = computed(() => {
    const now = new Date();
    return this.currentYear === now.getFullYear() && this.currentMonth === now.getMonth() + 1;
  });

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  monthLabel = signal('');

  ngOnInit(): void {
    this.updateMonthLabel();
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.hasError.set(false);
    this.budgetService.getPlan(this.currentYear, this.currentMonth).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: () => {
        this.plan.set(null);
        this.loading.set(false);
        this.hasError.set(true);
      }
    });
  }

  prevMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 1) { this.currentMonth = 12; this.currentYear--; }
    this.updateMonthLabel();
    this.loadData();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 12) { this.currentMonth = 1; this.currentYear++; }
    this.updateMonthLabel();
    this.loadData();
  }

  goToCurrentMonth(): void {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;
    this.updateMonthLabel();
    this.loadData();
  }

  private updateMonthLabel(): void {
    const date = new Date(this.currentYear, this.currentMonth - 1, 1);
    this.monthLabel.set(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }

  isCurrentPaycheck(pc: PaycheckBreakdown): boolean {
    if (pc.isPriorMonth || !pc.windowStart || !pc.windowEnd) return false;
    const now = new Date();
    const start = new Date(pc.windowStart);
    const end = new Date(pc.windowEnd);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  }
}
