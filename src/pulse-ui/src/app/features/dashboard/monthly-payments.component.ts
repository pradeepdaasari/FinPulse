import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { DebtService } from '../../core/services/debt.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';
import { RecordPaymentDialogComponent } from '../../shared/record-payment-dialog.component';
import { DebtItem } from '../../core/models/debt-item.model';
import { roundCurrency, sumCurrency } from '../../core/utils/currency';

interface MonthlyPayment {
  id: string | number;
  name: string;
  type: 'Loan' | 'Credit Card';
  amount: number;
  minimumPayment: number | null;
  minimumPaid: boolean;
  isAutopay: boolean;
  currentBalance: number;
  paidAmount: number;
  dueDate: Date;
  nextDueDate: Date;
  daysUntilDue: number;
  status: 'overdue' | 'due-soon' | 'upcoming' | 'paid';
}

@Component({
  selector: 'app-monthly-payments',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule, MatChipsModule, MatTooltipModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else {
    <mat-card class="payments-table-card">
      <mat-card-header>
        <mat-card-title>
          <div class="card-title-row">
            <span class="card-title-text"><mat-icon class="card-title-icon">receipt_long</mat-icon> Upcoming Payments</span>
            <span class="payment-count">{{ payments().length }} due in next 30 days</span>
          </div>
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (paycheckDay()) {
          <div class="paycheck-info">
            <mat-icon>account_balance_wallet</mat-icon>
            <span>Next paycheck: <strong>{{ paycheckDateLabel() }}</strong></span>
            <span class="paycheck-days">({{ daysUntilPaycheck() }} days away)</span>
          </div>
        }
        @if (payments().length === 0) {
          <div class="empty-state">
            <mat-icon>check_circle</mat-icon>
            <span>All payments are up to date!</span>
          </div>
        } @else {
          <div class="table-wrapper">
            <table mat-table [dataSource]="payments()">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Account</th>
                <td mat-cell *matCellDef="let p">
                  <div class="account-cell">
                    <mat-icon class="account-icon">{{ p.type === 'Loan' ? 'account_balance' : 'credit_card' }}</mat-icon>
                    <div>
                      <span class="account-name">{{ p.name }}</span>
                      <span class="account-type">{{ p.type }}
                        @if (p.isAutopay) {
                          <span class="autopay-badge"><mat-icon>autorenew</mat-icon>Auto</span>
                        }
                      </span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Due</th>
                <td mat-cell *matCellDef="let p" class="amount-cell">
                  <span>{{ p.amount | currency }}</span>
                  @if (p.minimumPayment != null && p.minimumPayment > 0) {
                    <span class="min-payment-label">Min: {{ p.minimumPayment | currency }}</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef>Balance</th>
                <td mat-cell *matCellDef="let p" class="balance-cell">{{ p.currentBalance | currency }}</td>
              </ng-container>

              <ng-container matColumnDef="dueDate">
                <th mat-header-cell *matHeaderCellDef>Due Date</th>
                <td mat-cell *matCellDef="let p" class="due-date-cell">
                  {{ p.dueDate | date:'MMM d, y' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="daysLeft">
                <th mat-header-cell *matHeaderCellDef>Days Left</th>
                <td mat-cell *matCellDef="let p" class="days-cell">
                  @if (p.daysUntilDue < 0) {
                    <span class="days-overdue">{{ p.daysUntilDue * -1 }} days ago</span>
                  } @else if (p.daysUntilDue === 0) {
                    <span class="days-today">Today</span>
                  } @else {
                    <span class="days-remaining">{{ p.daysUntilDue }} days</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="paid">
                <th mat-header-cell *matHeaderCellDef>Paid</th>
                <td mat-cell *matCellDef="let p" class="paid-cell">
                  @if (p.paidAmount > 0) {
                    <span class="paid-progress">{{ p.paidAmount | currency }}</span>
                    <span class="paid-remaining">({{ p.amount - p.paidAmount | currency }} left)</span>
                  } @else {
                    <span class="paid-remaining">({{ p.amount | currency }} left)</span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let p">
                  <span class="status-badge" [class]="'status-' + p.status">
                    @if (p.status === 'due-soon') {
                      Due in {{ p.daysUntilDue }}d
                    } @else {
                      {{ p.daysUntilDue }} days
                    }
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p">
                  <div class="actions-wrap">
                    @if (p.minimumPaid) {
                      <mat-icon class="min-paid-check" matTooltip="Minimum paid">check_circle_outline</mat-icon>
                    }
                    <button mat-icon-button color="primary" (click)="recordPayment(p)" aria-label="Record Payment">
                      <mat-icon>paid</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
          <div class="total-row">
            <span>Total Due This Month</span>
            <span class="total-amount">{{ totalDue() | currency }}</span>
          </div>
        }
      </mat-card-content>
    </mat-card>
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    .payments-table-card {
      margin-top: var(--spacing-md);
    }
    .card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .card-title-text {
      display: flex;
      align-items: center;
    }
    .card-title-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-right: 8px;
      color: var(--color-primary);
    }
    .payment-count {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      background: var(--color-bg);
      padding: 4px 12px;
      border-radius: 20px;
    }
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table { width: 100%; min-width: 450px; }
    .account-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .account-icon {
      color: var(--color-primary);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .account-name {
      display: block;
      font-weight: 500;
    }
    .account-type {
      display: block;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    .amount-cell {
      font-weight: 600;
    }
    .min-payment-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--color-text-muted);
    }
    .balance-cell {
      font-weight: 500;
      color: var(--color-text-secondary);
    }
    .due-date-cell {
      white-space: nowrap;
    }
    .status-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .status-overdue {
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
    }
    .status-due-soon {
      background-color: var(--color-warning-bg);
      color: var(--color-warning);
    }
    .status-upcoming {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }
    .status-paid {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }
    .paid-cell { font-size: 0.875rem; }
    .paid-progress { font-weight: 600; color: var(--color-success); }
    .paid-remaining { color: var(--color-text-muted); font-size: 0.75rem; display: block; }
    .next-due { color: var(--color-text-secondary); font-size: 0.8125rem; }
    .paid-check { color: var(--color-success); font-size: 22px; width: 22px; height: 22px; }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-md) var(--spacing-md) 0;
      margin-top: var(--spacing-md);
      border-top: 1px solid var(--color-border);
      font-weight: 600;
    }
    .total-amount {
      font-size: 1.125rem;
      color: var(--color-primary);
    }
    .empty-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: var(--spacing-md);
      color: var(--color-success);
    }
    .empty-state mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .paycheck-info {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: var(--spacing-sm) var(--spacing-md);
      margin-bottom: var(--spacing-md);
      background: var(--gradient-icon-blue);
      border: 1px solid rgba(21, 101, 192, 0.15);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      color: var(--color-primary-dark);
    }
    .paycheck-info mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--color-primary);
    }
    .paycheck-days {
      color: var(--color-text-secondary);
      font-size: 0.8125rem;
    }
    .actions-wrap { display: inline-flex; align-items: center; gap: 2px; }
    .min-paid-check { color: var(--color-success); font-size: 20px; width: 20px; height: 20px; }
    .mat-column-actions { width: 80px; text-align: center; }
    .days-cell { font-weight: 500; }
    .days-overdue { color: var(--color-danger); }
    .days-today { color: var(--color-warning); font-weight: 700; }
    .days-remaining { color: var(--color-text-secondary); }
    .autopay-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      margin-left: 6px;
      font-size: 0.625rem;
      font-weight: 600;
      color: var(--color-primary-dark);
      background: var(--gradient-icon-blue);
      padding: 1px 5px;
      border-radius: 8px;
      vertical-align: middle;
    }
    .autopay-badge mat-icon {
      font-size: 11px;
      width: 11px;
      height: 11px;
    }
    @media (max-width: 599px) {
      table { min-width: 0; }
      .mat-column-balance,
      .mat-column-dueDate,
      .mat-column-daysLeft,
      .mat-column-paid { display: none; }
      .account-name { font-size: 0.8125rem; }
      .account-icon { display: none; }
      .account-cell { gap: 0; }
    }
  `]
})
export class MonthlyPaymentsComponent implements OnInit {
  private debtService = inject(DebtService);
  private profileService = inject(UserProfileService);
  private paymentService = inject(PaymentService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  payments = signal<MonthlyPayment[]>([]);
  totalDue = signal(0);
  paycheckDay = signal<number | null>(null);
  paycheckDateLabel = signal('');
  daysUntilPaycheck = signal(0);
  columns = ['name', 'amount', 'balance', 'paid', 'dueDate', 'status', 'actions'];

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (profile.nextPayDate) {
          const nextPay = new Date(profile.nextPayDate);
          const day = nextPay.getDate();
          this.paycheckDay.set(day);
          this.calculatePaycheckInfo(day);
        }
      },
      error: () => {}
    });

    this.loadPayments();
  }

  recordPayment(payment: MonthlyPayment): void {
    const dialogRef = this.dialog.open(RecordPaymentDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {
        debtId: payment.id,
        debtName: payment.name,
        debtType: payment.type === 'Loan' ? 'PersonalLoan' : 'CreditCard',
        currentBalance: payment.currentBalance,
        minimumPayment: payment.minimumPayment
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Payment recorded successfully');
        this.loadPayments();
      }
    });
  }

  private loadPayments(): void {
    forkJoin({
      debts: this.debtService.getAll(),
      paymentResponse: this.paymentService.getAll()
    }).subscribe(({ debts, paymentResponse }) => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const today = now.getDate();

      const monthlyPayments: MonthlyPayment[] = [];

      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      for (const debt of debts) {
        const dueDay = debt.dueDay ?? 1;
        const cycleStart = this.getCycleStart(dueDay, now);
        const paidAmount = this.sumPaymentsInCycle(paymentResponse.payments, debt.id, debt.type, cycleStart);

        const isLoan = debt.type === 'PersonalLoan';
        const hasActivePromo = !isLoan && debt.promoAprPercent === 0 && debt.promoEndDate && new Date(debt.promoEndDate) > now;
        const dueAmount = isLoan ? debt.monthlyPayment : (hasActivePromo ? debt.monthlyPayment : debt.currentBalance);

        const isPaid = roundCurrency(paidAmount) >= roundCurrency(dueAmount);
        if (isPaid) continue;

        let dueDate = new Date(currentYear, currentMonth, dueDay);
        let daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
          dueDate = new Date(currentYear, currentMonth + 1, dueDay);
          daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (daysUntilDue > 30) continue;

        let status: MonthlyPayment['status'];
        if (daysUntilDue <= 5) {
          status = 'due-soon';
        } else {
          status = 'upcoming';
        }

        const minimumPaid = !isLoan && (
          (debt.monthlyPayment === 0 && paidAmount > 0) ||
          (debt.monthlyPayment > 0 && roundCurrency(paidAmount) >= roundCurrency(debt.monthlyPayment))
        );

        monthlyPayments.push({
          id: debt.id,
          name: debt.name,
          type: isLoan ? 'Loan' : 'Credit Card',
          amount: dueAmount,
          minimumPayment: !isLoan && debt.monthlyPayment > 0 ? debt.monthlyPayment : null,
          minimumPaid,
          isAutopay: debt.isAutopay,
          currentBalance: debt.currentBalance,
          paidAmount,
          dueDate,
          nextDueDate: new Date(currentYear, currentMonth + 1, dueDay),
          daysUntilDue,
          status
        });
      }

      monthlyPayments.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
      this.payments.set(monthlyPayments);
      this.totalDue.set(sumCurrency(monthlyPayments.map(p => p.amount)));
      this.loading.set(false);
    });
  }

  private getCycleStart(dueDay: number, now: Date): Date {
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    if (today >= dueDay) {
      return new Date(year, month, dueDay);
    }
    return new Date(year, month - 1, dueDay);
  }

  private sumPaymentsInCycle(payments: any[], debtId: string | number, debtType: 'PersonalLoan' | 'CreditCard', cycleStart: Date): number {
    const typeValue = debtType === 'PersonalLoan' ? 0 : 1;
    const matched = payments
      .filter(p => p.debtId == debtId && (p.debtType === debtType || p.debtType === typeValue) && new Date(p.paymentDate) >= cycleStart)
      .map(p => p.amountPaid);
    return sumCurrency(matched);
  }

  private calculatePaycheckInfo(day: number): void {
    const now = new Date();
    const today = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let nextPaycheckDate: Date;
    if (day > today) {
      nextPaycheckDate = new Date(currentYear, currentMonth, day);
    } else {
      nextPaycheckDate = new Date(currentYear, currentMonth + 1, day);
    }

    const diffTime = nextPaycheckDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.daysUntilPaycheck.set(diffDays);
    this.paycheckDateLabel.set(nextPaycheckDate.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }));
  }
}
