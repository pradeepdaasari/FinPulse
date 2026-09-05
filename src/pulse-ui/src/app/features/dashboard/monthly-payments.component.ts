import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, LocalDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="32"></mat-spinner></div>
    } @else {
    <mat-card class="payments-card">
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
          <div class="payment-header">
            <span class="col-account">Account</span>
            <span class="col-due">Due</span>
            <span class="col-balance">Balance</span>
            <span class="col-paid">Paid</span>
            <span class="col-date">Due Date</span>
            <span class="col-status">Status</span>
            <span class="col-actions"></span>
          </div>

          @for (p of payments(); track p.id) {
            <div class="payment-row" (click)="recordPayment(p)">
              <div class="col-account">
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
              <div class="col-due">
                <span class="due-amount">{{ p.amount | currency }}</span>
                @if (p.minimumPayment != null && p.minimumPayment > 0) {
                  <span class="min-label">Min: {{ p.minimumPayment | currency }}</span>
                }
              </div>
              <div class="col-balance">{{ p.currentBalance | currency }}</div>
              <div class="col-paid">
                @if (p.paidAmount > 0) {
                  <span class="paid-amount">{{ p.paidAmount | currency }}</span>
                  <span class="paid-remaining">({{ p.amount - p.paidAmount | currency }} left)</span>
                } @else {
                  <span class="paid-remaining">({{ p.amount | currency }} left)</span>
                }
              </div>
              <div class="col-date">{{ p.dueDate | date:'MMM d, y' }}</div>
              <div class="col-status">
                <span class="status-badge" [class]="'status-' + p.status">
                  @if (p.status === 'due-soon') {
                    Due in {{ p.daysUntilDue }}d
                  } @else {
                    {{ p.daysUntilDue }} days
                  }
                </span>
              </div>
              <div class="col-actions">
                @if (p.minimumPaid) {
                  <mat-icon class="min-paid-check" matTooltip="Minimum paid">check_circle_outline</mat-icon>
                }
                <button mat-icon-button color="primary" (click)="recordPayment(p); $event.stopPropagation()" aria-label="Record Payment">
                  <mat-icon>payments</mat-icon>
                </button>
              </div>
            </div>
          }

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
    .payments-card { margin-top: var(--spacing-md); }
    .card-title-row {
      display: flex; justify-content: space-between; align-items: center; width: 100%;
    }
    .card-title-text { display: flex; align-items: center; }
    .card-title-icon { font-size: 20px; width: 20px; height: 20px; margin-right: 8px; color: #5856D6; }
    .payment-count {
      font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary);
      background: var(--color-bg); padding: 4px 12px; border-radius: 20px;
    }

    /* Desktop table layout */
    .payment-header, .payment-row {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr 1.2fr 1fr 0.8fr 70px;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }
    .payment-header {
      font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.04em;
      border-bottom: 1px solid var(--color-border);
    }
    .payment-row {
      border-bottom: 1px solid var(--color-border-light, rgba(0,0,0,0.04));
    }
    .payment-row:last-of-type { border-bottom: none; }

    .col-account { display: flex; align-items: center; gap: 10px; }
    .account-icon { color: var(--color-primary); font-size: 20px; width: 20px; height: 20px; }
    .account-name { display: block; font-weight: 500; }
    .account-type { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .due-amount { font-weight: 600; }
    .min-label { display: block; font-size: 0.7rem; color: var(--color-text-muted); }
    .col-balance { font-weight: 500; color: var(--color-text-secondary); }
    .col-date { white-space: nowrap; }
    .paid-amount { font-weight: 600; color: var(--color-success); }
    .paid-remaining { color: var(--color-text-muted); font-size: 0.75rem; display: block; }
    .col-actions { display: flex; align-items: center; gap: 2px; justify-content: flex-end; }
    .min-paid-check { color: var(--color-success); font-size: 20px; width: 20px; height: 20px; }

    .status-badge {
      padding: 4px 10px; border-radius: 20px; font-size: 0.6875rem;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;
    }
    .status-overdue { background-color: var(--color-danger-bg); color: var(--color-danger); }
    .status-due-soon { background-color: var(--color-warning-bg); color: var(--color-warning); }
    .status-upcoming { background-color: var(--color-success-bg); color: var(--color-success); }
    .status-paid { background-color: var(--color-success-bg); color: var(--color-success); }

    .autopay-badge {
      display: inline-flex; align-items: center; gap: 2px; margin-left: 6px;
      font-size: 0.625rem; font-weight: 600; color: var(--color-primary-dark);
      background: var(--gradient-icon-blue); padding: 1px 5px; border-radius: 8px;
    }
    .autopay-badge mat-icon { font-size: 11px; width: 11px; height: 11px; }

    .total-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--spacing-md) var(--spacing-md) 0; margin-top: var(--spacing-md);
      border-top: 1px solid var(--color-border); font-weight: 600;
    }
    .total-amount { font-size: 1.125rem; color: var(--color-primary); }

    .empty-state {
      display: flex; align-items: center; gap: 12px;
      padding: var(--spacing-md); color: var(--color-success);
    }
    .empty-state mat-icon { font-size: 28px; width: 28px; height: 28px; }

    .paycheck-info {
      display: flex; align-items: center; gap: 10px;
      padding: var(--spacing-sm) var(--spacing-md); margin-bottom: var(--spacing-md);
      background: var(--gradient-icon-blue); border: 1px solid rgba(21, 101, 192, 0.15);
      border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--color-primary-dark);
    }
    .paycheck-info mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .paycheck-days { color: var(--color-text-secondary); font-size: 0.8125rem; }

    @media (max-width: 599px) {
      .payment-header { display: none; }
      .payment-row {
        grid-template-columns: 1fr auto;
        gap: 4px 12px;
        padding: 12px 4px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .payment-row:active { opacity: 0.7; }
      .col-balance, .col-paid, .col-date, .col-status, .col-actions { display: none; }
      .col-account { grid-column: 1; }
      .col-due { grid-column: 2; text-align: right; }
      .account-name { font-size: 0.9375rem; }
      .account-icon { font-size: 20px; width: 20px; height: 20px; }
      .due-amount { font-size: 1rem; }
      .card-title-row { flex-direction: column; align-items: flex-start; gap: 4px; }
      .payment-count { font-size: 0.75rem; }
      .paycheck-info { flex-wrap: wrap; font-size: 0.8rem; }
      .total-row { padding: var(--spacing-sm) 0 0; font-size: 0.9rem; }
    }
  `]
})
export class MonthlyPaymentsComponent implements OnInit {
  private debtService = inject(DebtService);
  private profileService = inject(UserProfileService);
  private paymentService = inject(PaymentService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  payments = signal<MonthlyPayment[]>([]);
  totalDue = signal(0);
  paycheckDay = signal<number | null>(null);
  paycheckDateLabel = signal('');
  daysUntilPaycheck = signal(0);

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        if (profile.nextPayDate) {
          const anchor = new Date(profile.nextPayDate);
          this.paycheckDay.set(anchor.getDate());
          this.calculatePaycheckInfo(anchor, profile.payFrequency);
          this.cdr.detectChanges();
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

      const monthlyPayments: MonthlyPayment[] = [];

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
      this.cdr.detectChanges();
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

  private calculatePaycheckInfo(anchor: Date, frequency: string): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let nextPaycheckDate: Date;

    if (frequency === 'Biweekly' || frequency === 'Weekly') {
      const intervalDays = frequency === 'Biweekly' ? 14 : 7;
      nextPaycheckDate = new Date(anchor);
      if (nextPaycheckDate > today) {
        while (nextPaycheckDate.getTime() - intervalDays * 86400000 > today.getTime()) {
          nextPaycheckDate = new Date(nextPaycheckDate.getTime() - intervalDays * 86400000);
        }
      } else {
        while (nextPaycheckDate <= today) {
          nextPaycheckDate = new Date(nextPaycheckDate.getTime() + intervalDays * 86400000);
        }
      }
    } else {
      const day = anchor.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      if (day > now.getDate()) {
        nextPaycheckDate = new Date(currentYear, currentMonth, day);
      } else {
        nextPaycheckDate = new Date(currentYear, currentMonth + 1, day);
      }
    }

    const diffTime = nextPaycheckDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.daysUntilPaycheck.set(diffDays);
    this.paycheckDateLabel.set(nextPaycheckDate.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    }));
  }
}
