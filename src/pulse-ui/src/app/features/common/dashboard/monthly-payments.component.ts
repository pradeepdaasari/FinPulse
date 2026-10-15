import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MonthlyPaymentRow, MonthlyPaymentsData } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-monthly-payments',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressBarModule, RouterModule],
  template: `
    <div class="page-wrap">
      @if (loading()) {
        <div class="loading-container">
          <div class="shimmer-bar"></div>
          <div class="shimmer-bar short"></div>
          <div class="shimmer-bar"></div>
        </div>
      } @else {
        <!-- Paycheck banner -->
        @if (data()?.nextPaycheckDate) {
          <div class="paycheck-banner">
            <mat-icon>account_balance_wallet</mat-icon>
            <div class="paycheck-text">
              <span class="paycheck-label">Next Paycheck</span>
              <span class="paycheck-date">{{ data()!.nextPaycheckDate! | date:'EEE, MMM d' }}</span>
            </div>
            <span class="paycheck-days">{{ data()!.daysUntilPaycheck === 0 ? 'Today' : data()!.daysUntilPaycheck + 'd away' }}</span>
          </div>
        }

        <!-- Summary stats -->
        <div class="summary-bar">
          <div class="summary-stat">
            <span class="ss-value">{{ data()!.totalDue | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="ss-label">Total This Month</span>
          </div>
          <div class="summary-stat">
            <span class="ss-value paid-color">{{ data()!.totalPaid | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="ss-label">Paid</span>
          </div>
          <div class="summary-stat">
            <span class="ss-value" [class.danger-color]="data()!.totalPending > 0">{{ data()!.totalPending | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="ss-label">Still Needed</span>
          </div>
          <div class="summary-stat">
            <span class="ss-value">{{ data()!.paidPercent | number:'1.0-0' }}%</span>
            <span class="ss-label">Covered</span>
          </div>
        </div>

        <!-- Progress -->
        <div class="progress-wrap">
          <mat-progress-bar mode="determinate" [value]="data()!.paidPercent" [color]="data()!.overdueCount > 0 ? 'warn' : 'primary'"></mat-progress-bar>
          <div class="progress-labels">
            <span>{{ data()!.paidCount }}/{{ allRows().length }} payments completed</span>
            <span class="days-left">{{ daysLeftInMonth() }}d left in month</span>
          </div>
          @if (data()!.overdueCount > 0) {
            <div class="overdue-banner">
              <mat-icon>warning</mat-icon>
              <span>{{ data()!.overdueCount }} payment{{ data()!.overdueCount > 1 ? 's' : '' }} overdue</span>
              <span class="overdue-amount">{{ overdueTotal() | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          }
        </div>

        <!-- Filter chips -->
        <div class="filter-row">
          <button class="filter-chip" [class.active]="filters().size === 0" (click)="clearFilters()">
            All <span class="chip-count">{{ allRows().length }}</span>
          </button>
          <button class="filter-chip" [class.active]="filters().has('unpaid')" (click)="toggleFilter('unpaid')">
            Unpaid <span class="chip-count">{{ unpaidCount() }}</span>
          </button>
          <button class="filter-chip" [class.active]="filters().has('overdue')" (click)="toggleFilter('overdue')">
            Overdue <span class="chip-count">{{ overdueCount() }}</span>
          </button>
          <button class="filter-chip" [class.active]="filters().has('loan')" (click)="toggleFilter('loan')">
            Loans <span class="chip-count">{{ loanCount() }}</span>
          </button>
          <button class="filter-chip" [class.active]="filters().has('card')" (click)="toggleFilter('card')">
            Cards <span class="chip-count">{{ cardCount() }}</span>
          </button>
          <button class="filter-chip" [class.active]="filters().has('recurring')" (click)="toggleFilter('recurring')">
            Bills <span class="chip-count">{{ recurringCount() }}</span>
          </button>
        </div>

        <!-- Due section -->
        @if (dueRows().length > 0) {
          <div class="section-header due-header">
            <mat-icon>schedule</mat-icon>
            <span>Due</span>
            <span class="section-count">{{ dueRows().length }}</span>
            <span class="section-total">{{ dueTotal() | currency:'USD':'symbol':'1.0-0' }}</span>
          </div>
          <div class="rows-container">
            @for (row of dueRows(); track row.id + row.kind + row.dueDate) {
              <ng-container *ngTemplateOutlet="payRow; context: { $implicit: row }"></ng-container>
            }
          </div>
        }

        <!-- Paid section -->
        @if (paidRows().length > 0) {
          <div class="section-header paid-header">
            <mat-icon>check_circle</mat-icon>
            <span>Paid</span>
            <span class="section-count">{{ paidRows().length }}</span>
          </div>
          <div class="rows-container">
            @for (row of paidRows(); track row.id + row.kind + row.dueDate) {
              <ng-container *ngTemplateOutlet="payRow; context: { $implicit: row }"></ng-container>
            }
          </div>
        }

        @if (filteredRows().length === 0) {
          <div class="rows-container">
            <div class="empty-row">
              <mat-icon>celebration</mat-icon>
              <span>{{ filters().size === 0 ? 'No payments due this month' : 'No matching payments' }}</span>
            </div>
          </div>
        }

        <ng-template #payRow let-row>
          <div class="pay-row" [class]="'status-' + row.status" (click)="recordPayment(row)">
            <div class="pay-icon" [style.background]="row.iconColor">
              <mat-icon>{{ row.icon }}</mat-icon>
            </div>
            <div class="pay-main">
              <div class="pay-top-line">
                <span class="pay-name">
                  {{ row.name }}
                  @if (row.isAutopay) {
                    <mat-icon class="autopay-badge" matTooltip="Autopay enabled">autorenew</mat-icon>
                  }
                </span>
                <span class="pay-amount" [class.paid-through]="row.status === 'paid'">{{ row.amount | currency }}</span>
              </div>
              <div class="pay-meta-line">
                <span class="pay-due">
                  @if (row.status === 'overdue') {
                    <mat-icon class="meta-icon overdue">error</mat-icon>
                  } @else if (row.status === 'paid') {
                    <mat-icon class="meta-icon paid">check_circle</mat-icon>
                  }
                  {{ row.dueLabel }}
                </span>
                <div class="pay-pills">
                  @if (row.kind === 'loan') {
                    <span class="pill pill-loan">Loan</span>
                  } @else if (row.kind === 'card') {
                    <span class="pill pill-card">Card</span>
                  } @else {
                    <span class="pill pill-bill">Bill</span>
                  }
                  @if (row.minimumPayment !== null && row.minimumPayment > 0) {
                    <span class="pill pill-min">Min {{ row.minimumPayment | currency:'USD':'symbol':'1.0-0' }}</span>
                  }
                  @if (row.apr !== null && row.apr! > 0) {
                    <span class="pill pill-apr">{{ row.apr | number:'1.1-1' }}%</span>
                  }
                  @if (row.subType) {
                    <span class="pill pill-type">{{ row.subType }}</span>
                  }
                </div>
              </div>
              @if (row.balance !== null && row.balance !== undefined) {
                <div class="pay-balance-line">
                  <span class="bal-label">Balance</span>
                  <span class="bal-value">{{ row.balance | currency }}</span>
                  @if (row.paidAmount > 0 && row.status !== 'paid') {
                    <span class="bal-paid">{{ row.paidAmount | currency }} paid</span>
                  }
                </div>
              }
            </div>
            <div class="pay-status-col">
              @if (row.status === 'paid') {
                <span class="status-badge s-paid"><mat-icon>check</mat-icon></span>
              } @else {
                <button class="record-btn" (click)="recordPayment(row); $event.stopPropagation()" matTooltip="Record payment">
                  <mat-icon>payments</mat-icon>
                </button>
              }
            </div>
          </div>
        </ng-template>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-wrap {
      max-width: 720px; margin: 0 auto; padding: 0 16px 32px;
    }

    .loading-container { padding: 24px 0; display: flex; flex-direction: column; gap: 16px; }
    .shimmer-bar {
      height: 56px; border-radius: var(--radius-sm); background: var(--color-surface-secondary);
      animation: shimmer 1.2s ease-in-out infinite alternate;
    }
    .shimmer-bar.short { width: 60%; }
    @keyframes shimmer { from { opacity: 0.5; } to { opacity: 1; } }

    /* Paycheck banner */
    .paycheck-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; margin-bottom: 16px;
      background: linear-gradient(135deg, #E3F2FD, #F3E5F5);
      border-radius: var(--radius-md); border: 1px solid rgba(21, 101, 192, 0.12);
    }
    .paycheck-banner > mat-icon { font-size: 22px; width: 22px; height: 22px; color: #1565C0; }
    .paycheck-text { display: flex; flex-direction: column; flex: 1; }
    .paycheck-label { font-size: 0.68rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .paycheck-date { font-size: 0.95rem; font-weight: 700; color: #1565C0; }
    .paycheck-days {
      font-size: 0.82rem; font-weight: 700; color: #1565C0;
      background: rgba(21, 101, 192, 0.1); padding: 4px 12px; border-radius: 20px;
    }

    /* Summary stats */
    .summary-bar {
      display: grid; grid-template-columns: repeat(4, 1fr);
      background: var(--color-surface); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); overflow: hidden; margin-bottom: 12px;
    }
    .summary-stat {
      display: flex; flex-direction: column; align-items: center;
      padding: 16px 8px; gap: 4px;
      border-right: 1px solid var(--color-border);
    }
    .summary-stat:last-child { border-right: none; }
    .ss-value { font-size: 1.1rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .ss-label { font-size: 0.62rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .paid-color { color: var(--color-success); }
    .danger-color { color: var(--color-danger); }

    /* Progress */
    .progress-wrap { padding: 0 0 12px; }
    .progress-labels {
      display: flex; justify-content: space-between; margin-top: 6px;
      font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted);
    }
    .days-left { color: var(--color-text-muted); }
    .overdue-banner {
      display: flex; align-items: center; gap: 6px; margin-top: 8px;
      padding: 6px 10px; border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-danger) 8%, transparent);
      font-size: 0.75rem; font-weight: 600; color: var(--color-danger);
    }
    .overdue-banner mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .overdue-amount { margin-left: auto; font-weight: 700; font-variant-numeric: tabular-nums; }

    /* Filter chips */
    .filter-row {
      display: flex; gap: 8px; padding: 0 0 12px;
      overflow-x: auto; scrollbar-width: none;
    }
    .filter-row::-webkit-scrollbar { display: none; }
    .filter-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 20px; border: 1px solid var(--color-border);
      background: var(--color-surface); font-size: 0.78rem; font-weight: 600;
      color: var(--color-text-muted); cursor: pointer; white-space: nowrap;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .filter-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .filter-chip.active {
      background: var(--color-primary); color: #fff; border-color: var(--color-primary);
    }
    .chip-count {
      font-size: 0.68rem; font-weight: 700;
      background: rgba(0,0,0,0.08); padding: 1px 6px; border-radius: 10px;
    }
    .filter-chip.active .chip-count { background: rgba(255,255,255,0.25); }

    /* Section headers */
    .section-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 0 6px; font-size: 0.82rem; font-weight: 700;
      color: var(--color-text);
    }
    .section-header mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .section-count {
      font-size: 0.68rem; font-weight: 700;
      background: rgba(0,0,0,0.06); padding: 1px 7px; border-radius: 10px;
      color: var(--color-text-muted);
    }
    .section-total {
      margin-left: auto; font-size: 0.82rem; font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .due-header mat-icon { color: var(--color-warning); }
    .due-header .section-total { color: var(--color-danger); }
    .paid-header mat-icon { color: var(--color-success); }
    .paid-header { color: var(--color-text-muted); }

    /* Payment rows */
    .rows-container {
      background: var(--color-surface); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); overflow: hidden;
    }

    .pay-row {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
      transition: background 0.15s; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .pay-row:last-child { border-bottom: none; }
    .pay-row:hover { background: var(--color-surface-secondary); }
    .pay-row.status-overdue { background: color-mix(in srgb, var(--color-danger) 5%, var(--color-surface)); }
    .pay-row.status-paid { opacity: 0.55; }

    .pay-icon {
      width: 36px; height: 36px; min-width: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      margin-top: 2px;
    }
    .pay-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }

    .pay-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .pay-top-line { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .pay-name {
      font-size: 0.88rem; font-weight: 600; display: flex; align-items: center; gap: 4px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .autopay-badge { font-size: 14px; width: 14px; height: 14px; color: var(--color-primary); flex-shrink: 0; }
    .pay-amount { font-size: 0.92rem; font-weight: 700; font-variant-numeric: tabular-nums; flex-shrink: 0; }
    .paid-through { text-decoration: line-through; opacity: 0.5; }

    .pay-meta-line {
      display: flex; justify-content: space-between; align-items: center; gap: 8px;
      flex-wrap: wrap;
    }
    .pay-due {
      font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500;
      display: flex; align-items: center; gap: 3px;
    }
    .meta-icon { font-size: 13px; width: 13px; height: 13px; }
    .meta-icon.overdue { color: var(--color-danger); }
    .meta-icon.paid { color: var(--color-success); }
    .pay-pills { display: flex; gap: 4px; flex-wrap: wrap; }
    .pill {
      font-size: 0.58rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.03em; padding: 1px 6px; border-radius: var(--radius-full);
    }
    .pill-loan { background: color-mix(in srgb, #007AFF 12%, transparent); color: #007AFF; }
    .pill-card { background: color-mix(in srgb, #5856D6 12%, transparent); color: #5856D6; }
    .pill-bill { background: color-mix(in srgb, #FF9500 12%, transparent); color: #FF9500; }
    .pill-min { background: color-mix(in srgb, var(--color-warning) 12%, transparent); color: var(--color-warning); }
    .pill-apr { background: color-mix(in srgb, var(--color-danger) 10%, transparent); color: var(--color-danger); }
    .pill-type { background: var(--color-surface-secondary); color: var(--color-text-muted); }

    .pay-balance-line {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;
    }
    .bal-label { font-weight: 500; }
    .bal-value { font-weight: 600; color: var(--color-text); font-variant-numeric: tabular-nums; }
    .bal-paid { color: var(--color-success); font-weight: 600; margin-left: auto; }

    .pay-status-col {
      display: flex; align-items: center; flex-shrink: 0; margin-top: 2px;
    }
    .status-badge {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .status-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .s-paid { background: var(--color-success); color: #fff; }
    .record-btn {
      width: 34px; height: 34px; border: 1px solid var(--color-border);
      border-radius: 10px; background: var(--color-surface); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s, border-color 0.15s;
    }
    .record-btn:hover { border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 8%, var(--color-surface)); }
    .record-btn mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-success); }

    .empty-row {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 40px 16px; color: var(--color-text-muted); font-size: 0.88rem;
    }
    .empty-row mat-icon { color: var(--color-success); }

    @media (max-width: 599px) {
      .page-wrap { padding: 0 0 24px; }
      .summary-bar {
        display: flex; overflow-x: auto;
        scrollbar-width: none; border-radius: var(--radius-sm);
      }
      .summary-bar::-webkit-scrollbar { display: none; }
      .summary-stat {
        flex: 0 0 auto; min-width: 90px; border-bottom: none;
        border-right: 1px solid var(--color-border); padding: 12px 8px;
      }
      .summary-stat:last-child { border-right: none; }
      .ss-value { font-size: 0.95rem; }
      .pay-row { padding: 12px 14px; gap: 10px; }
      .pay-icon { width: 32px; height: 32px; min-width: 32px; }
      .pay-amount { font-size: 0.85rem; }
      .pay-pills { gap: 3px; }
      .filter-row { padding: 0 0 8px; }
      .paycheck-banner { padding: 12px 14px; margin-bottom: 12px; }
    }
  `]
})
export class MonthlyPaymentsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  data = signal<MonthlyPaymentsData | null>(null);
  filters = signal<Set<string>>(new Set());

  daysLeftInMonth = computed(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  });
  allRows = computed(() => this.data()?.rows ?? []);
  unpaidCount = computed(() => this.allRows().filter(r => r.status !== 'paid').length);
  overdueCount = computed(() => this.allRows().filter(r => r.status === 'overdue').length);
  loanCount = computed(() => this.allRows().filter(r => r.kind === 'loan').length);
  cardCount = computed(() => this.allRows().filter(r => r.kind === 'card').length);
  recurringCount = computed(() => this.allRows().filter(r => r.kind === 'recurring').length);

  filteredRows = computed(() => {
    const rows = this.allRows();
    const active = this.filters();
    if (active.size === 0) return rows;
    return rows.filter(r => {
      if (active.has('unpaid') && r.status !== 'paid') return true;
      if (active.has('overdue') && r.status === 'overdue') return true;
      if (active.has('loan') && r.kind === 'loan') return true;
      if (active.has('card') && r.kind === 'card') return true;
      if (active.has('recurring') && r.kind === 'recurring') return true;
      return false;
    });
  });

  toggleFilter(key: string): void {
    const next = new Set(this.filters());
    if (next.has(key)) next.delete(key); else next.add(key);
    this.filters.set(next);
  }

  clearFilters(): void {
    this.filters.set(new Set());
  }

  dueRows = computed(() => this.filteredRows().filter(r => r.status !== 'paid'));
  dueTotal = computed(() => this.dueRows().reduce((sum, r) => sum + r.amount, 0));
  overdueTotal = computed(() => this.allRows().filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amount, 0));
  paidRows = computed(() => this.filteredRows().filter(r => r.status === 'paid'));

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.dashboardService.getMonthlyPayments().subscribe({
      next: (data) => { this.data.set(data); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  recordPayment(row: MonthlyPaymentRow): void {
    if (row.kind === 'recurring') {
      import('../../finance/expenses/add-expense-dialog.component').then(m => {
        const dialogRef = this.dialog.open(m.AddExpenseDialogComponent, {
          panelClass: 'expense-dialog-panel',
          data: { expense: null }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) { this.notify.success('Payment recorded'); this.loadData(); }
        });
      });
      return;
    }

    if (!row.debtType) return;
    import('../../finance/expenses/add-expense-dialog.component').then(m => {
      const preselectedType = row.debtType === 'CreditCard' ? 'CardPayment' : 'LoanPayment';
      const dialogRef = this.dialog.open(m.AddExpenseDialogComponent, {
        panelClass: 'expense-dialog-panel',
        data: {
          expense: null,
          preselectedType,
          preselectedDebtKey: `${row.debtType}:${row.id}`
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) { this.notify.success('Payment recorded'); this.loadData(); }
      });
    });
  }
}
