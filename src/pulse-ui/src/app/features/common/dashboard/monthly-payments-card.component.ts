import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, catchError, of } from 'rxjs';
import { DebtService } from '../../../core/services/debt.service';
import { PaymentService } from '../../../core/services/payment.service';
import { RecurringService } from '../../../core/services/recurring.service';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DebtItem } from '../../../core/models/debt-item.model';
import { PaymentHistory } from '../../../core/models/payment-history.model';
import { RecurringTransaction } from '../../../core/models/recurring.model';
import { CreditCard } from '../../../core/models/credit-card.model';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { AddExpenseDialogComponent, ExpenseDialogData } from '../../finance/expenses/add-expense-dialog.component';

interface MonthlyPaymentRow {
  id: number;
  name: string;
  kind: 'loan' | 'card' | 'bill';
  icon: string;
  iconColor: string;
  dueDay: number;
  dueDate: Date;
  dueLabel: string;
  amount: number;
  minimumPayment: number | null;
  paidAmount: number;
  balance: number | null;
  apr: number | null;
  isAutopay: boolean;
  status: 'paid' | 'overdue' | 'due-today' | 'due-soon' | 'upcoming';
  statusLabel: string;
  debtType?: 'PersonalLoan' | 'CreditCard';
  subType?: string;
  categoryIcon?: string;
}

@Component({
  selector: 'app-monthly-payments-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressBarModule, SkeletonLoaderComponent],
  template: `
    @if (loading()) {
      <app-skeleton type="card" [count]="1"></app-skeleton>
    } @else {
      <!-- Summary bar -->
      <div class="summary-bar">
        <div class="summary-stat">
          <span class="ss-value">{{ totalDue() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="ss-label">Total Due</span>
        </div>
        <div class="summary-stat">
          <span class="ss-value">{{ totalMinimum() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="ss-label">Min Due</span>
        </div>
        <div class="summary-stat">
          <span class="ss-value paid-color">{{ totalPaid() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="ss-label">Paid</span>
        </div>
        <div class="summary-stat">
          <span class="ss-value" [class.danger-color]="totalPending() > 0">{{ totalPending() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="ss-label">Pending</span>
        </div>
        <div class="summary-stat">
          <span class="ss-value">{{ paidCount() }}/{{ rows().length }}</span>
          <span class="ss-label">Completed</span>
        </div>
      </div>

      <!-- Progress -->
      <div class="progress-wrap">
        <mat-progress-bar mode="determinate" [value]="paidPercent()" [color]="overdueCount() > 0 ? 'warn' : 'primary'"></mat-progress-bar>
        <div class="progress-labels">
          <span>{{ paidPercent() | number:'1.0-0' }}% paid</span>
          @if (overdueCount() > 0) {
            <span class="overdue-label">{{ overdueCount() }} overdue</span>
          }
        </div>
      </div>

      <!-- Payment rows -->
      <div class="rows-container">
        @for (row of rows(); track row.id + row.kind) {
          <div class="pay-row" [class]="'status-' + row.status">
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
                  @if (row.minimumPayment !== null) {
                    <span class="pill pill-min">Min {{ row.minimumPayment | currency:'USD':'symbol':'1.0-0' }}</span>
                  }
                  @if (row.apr !== null && row.apr > 0) {
                    <span class="pill pill-apr">{{ row.apr | number:'1.1-1' }}%</span>
                  }
                  @if (row.subType) {
                    <span class="pill pill-type">{{ row.subType }}</span>
                  } @else if (row.kind === 'card') {
                    <span class="pill pill-type">Card</span>
                  } @else if (row.kind === 'bill') {
                    <span class="pill pill-type">Bill</span>
                  }
                </div>
              </div>
              @if (row.balance !== null) {
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
              } @else if (row.debtType) {
                <button class="record-btn" (click)="recordPayment(row)" matTooltip="Record payment">
                  <mat-icon>payments</mat-icon>
                </button>
              }
            </div>
          </div>
        }

        @if (rows().length === 0) {
          <div class="empty-row">
            <mat-icon>celebration</mat-icon>
            <span>No payments due this month</span>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .summary-bar {
      display: grid; grid-template-columns: repeat(5, 1fr);
      border-bottom: 1px solid var(--color-border);
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

    .progress-wrap { padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
    .progress-labels {
      display: flex; justify-content: space-between; margin-top: 6px;
      font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted);
    }
    .overdue-label { color: var(--color-danger); }

    .rows-container { padding: 0; }

    .pay-row {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
      transition: background 0.15s;
    }
    .pay-row:last-child { border-bottom: none; }
    .pay-row:hover { background: var(--color-surface-secondary); }
    .pay-row.status-overdue { background: color-mix(in srgb, var(--color-danger) 5%, var(--color-surface)); }
    .pay-row.status-paid { opacity: 0.65; }

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
      transition: all 0.15s;
    }
    .record-btn:hover { border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 8%, var(--color-surface)); }
    .record-btn mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-success); }

    .empty-row {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 32px 16px; color: var(--color-text-muted); font-size: 0.88rem;
    }
    .empty-row mat-icon { color: var(--color-success); }

    @media (max-width: 599px) {
      .summary-bar { grid-template-columns: repeat(2, 1fr); }
      .summary-stat { border-bottom: 1px solid var(--color-border); border-right: none; }
      .summary-stat:nth-child(odd) { border-right: 1px solid var(--color-border); }
      .summary-stat:last-child:nth-child(odd) { grid-column: 1 / -1; border-right: none; border-bottom: none; }
      .summary-stat:nth-last-child(1):nth-child(even),
      .summary-stat:nth-last-child(2):nth-child(odd) { border-bottom: none; }
      .ss-value { font-size: 0.95rem; }
      .pay-row { padding: 12px 14px; gap: 10px; }
      .pay-icon { width: 32px; height: 32px; min-width: 32px; }
      .pay-amount { font-size: 0.85rem; }
      .pay-pills { gap: 3px; }
    }
  `]
})
export class MonthlyPaymentsCardComponent implements OnInit {
  private debtService = inject(DebtService);
  private paymentService = inject(PaymentService);
  private recurringService = inject(RecurringService);
  private creditCardService = inject(CreditCardService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  recording = signal(false);
  rows = signal<MonthlyPaymentRow[]>([]);

  totalDue = computed(() => this.rows().reduce((s, r) => s + r.amount, 0));
  totalMinimum = computed(() => this.rows().reduce((s, r) => s + (r.minimumPayment ?? r.amount), 0));
  totalPaid = computed(() => this.rows().filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0));
  totalPending = computed(() => this.rows().filter(r => r.status !== 'paid').reduce((s, r) => s + r.amount, 0));
  paidCount = computed(() => this.rows().filter(r => r.status === 'paid').length);
  overdueCount = computed(() => this.rows().filter(r => r.status === 'overdue').length);
  paidPercent = computed(() => {
    const total = this.rows().length;
    return total === 0 ? 100 : (this.paidCount() / total) * 100;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    forkJoin({
      debts: this.debtService.getAll().pipe(catchError(() => of([] as DebtItem[]))),
      payments: this.paymentService.getAll().pipe(catchError(() => of({ payments: [] as PaymentHistory[], summary: { totalPaid: 0, loanTotal: 0, cardTotal: 0, count: 0 } }))),
      recurring: this.recurringService.getAll().pipe(catchError(() => of([] as RecurringTransaction[]))),
      cards: this.creditCardService.getAll().pipe(catchError(() => of([] as CreditCard[])))
    }).subscribe(({ debts, payments, recurring, cards }) => {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
      const today = new Date(year, month, now.getDate());

      const thisMonthPayments = payments.payments.filter(p => {
        const d = new Date(p.paymentDate);
        return d >= monthStart && d <= monthEnd;
      });

      const cardMap = new Map<number, CreditCard>();
      for (const c of cards) cardMap.set(Number(c.id), c);

      const rows: MonthlyPaymentRow[] = [];

      for (const debt of debts) {
        const dueDay = Math.min(debt.dueDay, monthEnd.getDate());
        const dueDate = new Date(year, month, dueDay);
        const paidThisMonth = thisMonthPayments
          .filter(p => p.debtId === debt.id && p.debtType === debt.type)
          .reduce((s, p) => s + p.amountPaid, 0);

        const isPaid = paidThisMonth >= debt.monthlyPayment;
        const isOverdue = !isPaid && dueDate < today;
        const isDueToday = !isPaid && dueDate.getDate() === today.getDate();
        const isDueSoon = !isPaid && !isOverdue && !isDueToday && (dueDate.getTime() - today.getTime()) <= 3 * 86400000;

        let status: MonthlyPaymentRow['status'] = 'upcoming';
        let statusLabel = `Due ${this.formatDate(dueDate)}`;
        if (isPaid) { status = 'paid'; statusLabel = 'Paid'; }
        else if (isOverdue) {
          const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);
          status = 'overdue';
          statusLabel = `${daysLate}d overdue — was due ${this.formatDate(dueDate)}`;
        }
        else if (isDueToday) { status = 'due-today'; statusLabel = 'Due today'; }
        else if (isDueSoon) { status = 'due-soon'; statusLabel = `Due ${this.formatDate(dueDate)}`; }

        const isCard = debt.type === 'CreditCard';
        const card = isCard ? cardMap.get(debt.id) : undefined;
        const minPay = card?.minimumPayment ?? null;
        rows.push({
          id: debt.id,
          name: debt.name,
          kind: isCard ? 'card' : 'loan',
          icon: isCard ? 'credit_card' : 'account_balance',
          iconColor: isCard ? '#5856D6' : '#007AFF',
          dueDay,
          dueDate,
          dueLabel: statusLabel,
          amount: debt.monthlyPayment,
          minimumPayment: isCard ? minPay : debt.monthlyPayment,
          paidAmount: paidThisMonth,
          balance: debt.currentBalance,
          apr: debt.aprPercent,
          isAutopay: debt.isAutopay,
          status,
          statusLabel,
          debtType: debt.type,
          subType: debt.subType || undefined,
        });
      }

      const activeBills = recurring.filter(r =>
        r.isActive && r.transactionType === 'Expense' && r.frequency === 'Monthly'
      );
      for (const bill of activeBills) {
        const nextRun = new Date(bill.nextRunDate);
        const billInMonth = nextRun.getMonth() === month && nextRun.getFullYear() === year;
        const alreadyPaid = nextRun > monthEnd;
        if (!billInMonth && !alreadyPaid) continue;

        const dueDate = billInMonth ? nextRun : new Date(year, month, nextRun.getDate());
        const isPaid = alreadyPaid || (nextRun > monthEnd);
        const isOverdue = !isPaid && dueDate < today;

        let status: MonthlyPaymentRow['status'] = 'upcoming';
        let statusLabel = `Due ${this.formatDate(dueDate)}`;
        if (isPaid) { status = 'paid'; statusLabel = 'Paid'; }
        else if (isOverdue) {
          const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);
          status = 'overdue';
          statusLabel = `${daysLate}d overdue — was due ${this.formatDate(dueDate)}`;
        }
        else if (dueDate.getDate() === today.getDate()) { status = 'due-today'; statusLabel = 'Due today'; }

        rows.push({
          id: bill.id,
          name: bill.description || bill.merchant || 'Bill',
          kind: 'bill',
          icon: bill.categoryIcon || 'receipt_long',
          iconColor: '#FF9500',
          dueDay: dueDate.getDate(),
          dueDate,
          dueLabel: statusLabel,
          amount: bill.amount,
          minimumPayment: null,
          paidAmount: isPaid ? bill.amount : 0,
          balance: null,
          apr: null,
          isAutopay: false,
          status,
          statusLabel,
          categoryIcon: bill.categoryIcon,
        });
      }

      rows.sort((a, b) => {
        const order = { overdue: 0, 'due-today': 1, 'due-soon': 2, upcoming: 3, paid: 4 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return a.dueDay - b.dueDay;
      });

      this.rows.set(rows);
      this.loading.set(false);
      this.cdr.detectChanges();
    });
  }

  recordPayment(row: MonthlyPaymentRow): void {
    if (!row.debtType) return;
    const preselectedType = row.debtType === 'CreditCard' ? 'CardPayment' : 'LoanPayment';
    const debtKey = `${row.debtType}:${row.id}`;

    const ref = this.dialog.open(AddExpenseDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {
        expense: null,
        preselectedType,
        preselectedDebtKey: debtKey,
      } as ExpenseDialogData,
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.loanPayment) {
        this.notify.success(`${result.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} payment recorded for ${result.debtName}`);
        this.loadData();
      }
    });
  }

  private formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
