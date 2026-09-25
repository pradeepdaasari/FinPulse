import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoanService } from '../../../core/services/loan.service';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PersonalLoan } from '../../../core/models/personal-loan.model';
import { AmortizationSchedule } from '../../../core/models/dashboard.model';
import { PaymentHistory } from '../../../core/models/payment-history.model';
import { AmortizationTableComponent } from './amortization-table.component';

import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { EntityMovementsComponent } from '../../../shared/entity-movements.component';
import { FundingSourceService } from '../../../core/services/funding-source.service';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule, MatChipsModule, MatProgressBarModule, CurrencyPipe, DecimalPipe, LocalDatePipe, AmortizationTableComponent, SkeletonLoaderComponent, EntityMovementsComponent],
  template: `
    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else if (loan()) {
      <div class="header-row">
        <div class="header-left">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> Back to Loans
          </button>
          <h2>{{ loan()!.lenderName }}</h2>
          @if (loan()!.isAutopay) {
            <mat-chip highlighted color="primary"><mat-icon>autorenew</mat-icon> Autopay</mat-chip>
          }
          @if (loan()!.rateType === 'Variable') {
            <mat-chip highlighted color="accent">Variable Rate</mat-chip>
          }
        </div>
        <div class="detail-actions">
          <button mat-raised-button color="primary" (click)="recordPayment()" aria-label="Record payment" [disabled]="loan()!.currentBalance <= 0">
            <mat-icon>payments</mat-icon> Record Payment
          </button>
          <button mat-stroked-button (click)="editLoan()" aria-label="Edit loan">
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-stroked-button color="warn" (click)="deleteLoan()" aria-label="Delete loan">
            <mat-icon>delete</mat-icon> Delete
          </button>
        </div>
      </div>

      @if (dueSoonDays() !== null && dueSoonDays()! <= 3 && dueSoonDays()! >= 0) {
        <div class="due-soon-banner">
          <mat-icon>warning</mat-icon>
          @if (dueSoonDays() === 0) {
            Payment due today!
          } @else if (dueSoonDays() === 1) {
            Payment due tomorrow!
          } @else {
            Payment due in {{ dueSoonDays() }} days
          }
        </div>
      }

      <mat-card class="detail-card">
        <mat-card-content>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Original Amount</span>
              <span class="value">{{ loan()!.originalAmount | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Current Balance</span>
              <span class="value">{{ loan()!.currentBalance | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">APR</span>
              <span class="value">{{ loan()!.aprPercent }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Duration</span>
              <span class="value">{{ loan()!.durationMonths }} months</span>
            </div>
            <div class="detail-item">
              <span class="label">Start Date</span>
              <span class="value">{{ loan()!.startDate | localDate:'mediumDate' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">{{ paymentLabel() }}</span>
              <span class="value">{{ loan()!.monthlyPayment | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Due Day</span>
              <span class="value">{{ dueDayDisplay() }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Frequency</span>
              <span class="value">{{ loan()!.paymentFrequency }}</span>
            </div>
            @if (loan()!.nextPaymentDate) {
              <div class="detail-item">
                <span class="label">Next Payment Date</span>
                <span class="value" [class.deferred-value]="isDeferred()">{{ loan()!.nextPaymentDate | localDate:'mediumDate' }}</span>
              </div>
            }
            @if (projectedPayoffDate()) {
              <div class="detail-item">
                <span class="label">Projected Payoff</span>
                <span class="value">{{ projectedPayoffDate() | localDate:'mediumDate' }}</span>
              </div>
            }
          </div>
          <div class="progress-section">
            <div class="progress-label-row">
              <span class="label">Payoff Progress</span>
              <span class="progress-pct">{{ payoffProgress() | number:'1.1-1' }}%</span>
            </div>
            <mat-progress-bar mode="determinate" [value]="payoffProgress()"></mat-progress-bar>
            <div class="progress-amounts">
              <span>{{ loan()!.originalAmount - loan()!.currentBalance | currency }} paid</span>
              <span>{{ loan()!.currentBalance | currency }} remaining</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (paymentHistory().length > 0) {
        <h3>Payment History</h3>
        <mat-card class="history-card">
          <div class="history-summary">
            <div class="summary-stats">
              <div class="stat"><span class="stat-label">Total Paid</span><span class="stat-value">{{ totalPaid() | currency }}</span></div>
              <div class="stat"><span class="stat-label">Principal</span><span class="stat-value principal-color">{{ totalPrincipalPaid() | currency }}</span></div>
              <div class="stat"><span class="stat-label">Interest</span><span class="stat-value interest-color">{{ totalInterestPaid() | currency }}</span></div>
            </div>
            <span class="history-count">{{ paymentHistory().length }} payments</span>
          </div>
          <div class="table-wrapper">
            <table mat-table [dataSource]="paymentHistory()">
              <ng-container matColumnDef="paymentDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let p">{{ p.paymentDate | localDate:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="amountPaid">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let p" class="amount-cell">{{ p.amountPaid | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="principal">
                <th mat-header-cell *matHeaderCellDef>Principal</th>
                <td mat-cell *matCellDef="let p" class="principal-color">{{ (p.principalAmount ?? p.amountPaid) | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="interest">
                <th mat-header-cell *matHeaderCellDef>Interest</th>
                <td mat-cell *matCellDef="let p" class="interest-color">{{ (p.interestAmount ?? 0) | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="fromAccount">
                <th mat-header-cell *matHeaderCellDef>From Account</th>
                <td mat-cell *matCellDef="let p">{{ getAccountName(p.fromAccountId) }}</td>
              </ng-container>
              <ng-container matColumnDef="notes">
                <th mat-header-cell *matHeaderCellDef>Notes</th>
                <td mat-cell *matCellDef="let p">{{ p.notes || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p">
                  <button mat-icon-button (click)="editPayment(p)" matTooltip="Edit payment" aria-label="Edit payment">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deletePayment(p)" matTooltip="Delete payment" aria-label="Delete payment">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: paymentColumns;"></tr>
            </table>
          </div>
        </mat-card>
      }

      <app-entity-movements entityType="Loan" [entityId]="loan()!.id" />

      @if (amortizationSchedule()) {
        <h3>Amortization Schedule</h3>
        <app-amortization-table [schedule]="amortizationSchedule()!"></app-amortization-table>
      }
    } @else {
      <div class="empty-state">
        <div class="empty-icon-wrap">
          <mat-icon>error_outline</mat-icon>
        </div>
        <h3>Loan not found</h3>
        <p>This loan may have been deleted or you don't have access to it.</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon> Back to Loans
        </button>
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    .header-row h2 { margin: 0; }
    .header-left { display: flex; align-items: center; gap: var(--spacing-sm); }
    .detail-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .detail-actions button mat-icon {
      margin-right: 4px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .detail-card { margin-bottom: var(--spacing-lg); }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--spacing-md);
    }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 500; letter-spacing: 0.05em; }
    .value { font-size: 1rem; font-weight: 600; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 400px; }
    .history-card { margin-bottom: var(--spacing-lg); }
    .history-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      margin-bottom: var(--spacing-sm);
      font-size: 0.875rem;
    }
    .history-count { color: var(--color-text-secondary); }
    .amount-cell { font-weight: 600; color: var(--color-success); }
    .principal-color { color: #2e7d32; font-weight: 500; }
    .interest-color { color: #c62828; font-weight: 500; }
    .deferred-value { color: #e65100; }
    .due-soon-banner {
      display: flex; align-items: center; gap: 8px; padding: 10px 16px;
      background: rgba(255,152,0,0.12); color: #e65100; border-radius: var(--radius-sm);
      font-weight: 600; font-size: 0.875rem; margin-bottom: var(--spacing-md);
    }
    .due-soon-banner mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .progress-section { margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--color-border, rgba(0,0,0,0.08)); }
    .progress-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .progress-pct { font-weight: 600; font-size: 0.875rem; }
    .progress-amounts { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; }
    .summary-stats { display: flex; gap: var(--spacing-lg); }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .stat-label { font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-weight: 600; font-size: 0.9rem; }
    mat-chip mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 599px) {
      .detail-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .detail-actions { flex-wrap: wrap; }
      .summary-stats { flex-wrap: wrap; gap: var(--spacing-sm); }
      table { min-width: 0; }
    }
  `]
})
export class LoanDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loanService = inject(LoanService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private paymentService = inject(PaymentService);
  private fundingSourceService = inject(FundingSourceService);
  private cdr = inject(ChangeDetectorRef);

  loan = signal<PersonalLoan | null>(null);
  amortizationSchedule = signal<AmortizationSchedule | null>(null);
  paymentHistory = signal<PaymentHistory[]>([]);
  totalPaid = signal(0);
  totalPrincipalPaid = signal(0);
  totalInterestPaid = signal(0);
  loading = signal(true);
  paymentColumns = ['paymentDate', 'amountPaid', 'principal', 'interest', 'fromAccount', 'notes', 'actions'];
  payoffProgress = computed(() => {
    const l = this.loan();
    if (!l || l.originalAmount <= 0) return 0;
    return Math.max(0, Math.min(100, (1 - l.currentBalance / l.originalAmount) * 100));
  });
  dueSoonDays = computed(() => {
    const l = this.loan();
    if (!l) return null;
    if (l.currentBalance <= 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const freq = l.paymentFrequency;
    if (freq === 'Weekly' || freq === 'Biweekly') {
      const interval = freq === 'Biweekly' ? 14 : 7;
      const anchor = new Date(l.startDate);
      anchor.setHours(0, 0, 0, 0);
      while (anchor < today) anchor.setDate(anchor.getDate() + interval);
      return Math.floor((anchor.getTime() - today.getTime()) / 86400000);
    }
    if (!l.dueDay) return null;
    let dueDate = new Date(today.getFullYear(), today.getMonth(), l.dueDay);
    if (dueDate < today) dueDate = new Date(today.getFullYear(), today.getMonth() + 1, l.dueDay);
    return Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
  });
  projectedPayoffDate = computed(() => {
    const sched = this.amortizationSchedule();
    if (!sched?.entries?.length) return null;
    const last = sched.entries[sched.entries.length - 1];
    return last.paymentDate;
  });
  private accountNameMap = new Map<number, string>();
  private weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  paymentLabel = computed(() => {
    const f = this.loan()?.paymentFrequency;
    if (f === 'Weekly') return 'Weekly Payment';
    if (f === 'Biweekly') return 'Biweekly Payment';
    return 'Monthly Payment';
  });
  isDeferred = computed(() => {
    const d = this.loan()?.nextPaymentDate;
    return !!d && new Date(d) > new Date();
  });
  dueDayDisplay = computed(() => {
    const l = this.loan();
    if (!l) return '';
    const f = l.paymentFrequency;
    if ((f === 'Weekly' || f === 'Biweekly') && l.dueDay >= 0 && l.dueDay <= 6) {
      return this.weekDays[l.dueDay];
    }
    return String(l.dueDay);
  });

  ngOnInit(): void {
    this.loadLoan();
    this.fundingSourceService.getAll().subscribe(sources => {
      sources.filter(s => s.type === 'BankAccount').forEach(s => this.accountNameMap.set(s.id, s.name));
      this.cdr.detectChanges();
    });
  }

  loadLoan(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loanService.getById(id).subscribe({
      next: (loan) => {
        this.loan.set(loan);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.notify.error('Failed to load loan details'); this.cdr.detectChanges(); }
    });
    this.loanService.getAmortization(id).subscribe({
      next: (schedule) => { this.amortizationSchedule.set(schedule); this.cdr.detectChanges(); },
      error: () => {}
    });
    this.loanService.getPayments(id).subscribe({
      next: (result) => {
        this.paymentHistory.set(result.payments);
        this.totalPaid.set(result.totalPaid);
        this.totalPrincipalPaid.set(result.totalPrincipalPaid);
        this.totalInterestPaid.set(result.totalInterestPaid);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  goBack(): void {
    this.router.navigate(['/loans']);
  }

  recordPayment(): void {
    import('../../finance/expenses/add-expense-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.AddExpenseDialogComponent, {
        width: '520px',
        maxHeight: '90vh',
        data: {
          expense: null,
          preselectedType: 'LoanPayment',
          preselectedDebtKey: `PersonalLoan:${this.loan()!.id}`
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadLoan();
      });
    });
  }

  editLoan(): void {
    import('./edit-loan-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.EditLoanDialogComponent, {
        panelClass: 'responsive-dialog-panel',
        data: this.loan()
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadLoan();
      });
    });
  }

  deleteLoan(): void {
    import('../../../shared/confirm-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.ConfirmDialogComponent, {
        width: '400px',
        data: { title: 'Delete Loan?', message: 'This action cannot be undone. All payment history for this loan will be permanently removed.', confirmText: 'Delete', color: 'warn' }
      });
      dialogRef.afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.loading.set(true);
        this.loanService.delete(this.loan()!.id).subscribe({
          next: () => {
            this.notify.success('Loan deleted');
            this.router.navigate(['/loans']);
          },
          error: () => { this.loading.set(false); this.notify.error('Failed to delete loan'); this.cdr.detectChanges(); }
        });
      });
    });
  }

  deletePayment(payment: PaymentHistory): void {
    import('../../../shared/confirm-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Delete Payment?',
          message: `This will remove the $${payment.amountPaid.toFixed(2)} payment and add it back to the loan balance.`,
          confirmText: 'Delete',
          color: 'warn'
        }
      });
      dialogRef.afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.paymentService.delete(payment.id).subscribe({
          next: () => {
            this.notify.success('Payment deleted — balance restored');
            this.loadLoan();
          },
          error: () => this.notify.error('Failed to delete payment')
        });
      });
    });
  }

  editPayment(payment: PaymentHistory): void {
    const loan = this.loan()!;
    import('../../finance/expenses/add-expense-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.AddExpenseDialogComponent, {
        width: '520px',
        maxHeight: '90vh',
        data: {
          expense: null,
          preselectedType: 'LoanPayment',
          preselectedDebtKey: `PersonalLoan:${loan.id}`,
          existingPayment: payment
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadLoan();
      });
    });
  }

  private computeBalanceAtPayment(target: PaymentHistory): number {
    const loan = this.loan();
    if (!loan) return 0;
    const sorted = [...this.paymentHistory()].sort(
      (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );
    let balance = loan.originalAmount;
    for (const p of sorted) {
      if (p.id === target.id) return balance;
      balance -= p.principalAmount ?? p.amountPaid;
    }
    return Math.max(0, balance);
  }

  getAccountName(accountId?: number): string {
    if (!accountId) return 'External';
    return this.accountNameMap.get(accountId) || 'Unknown';
  }
}
