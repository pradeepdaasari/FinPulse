import { Component, ChangeDetectorRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoanService } from '../../core/services/loan.service';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';
import { PersonalLoan } from '../../core/models/personal-loan.model';
import { AmortizationSchedule } from '../../core/models/dashboard.model';
import { PaymentHistory } from '../../core/models/payment-history.model';
import { sumCurrency } from '../../core/utils/currency';
import { AmortizationTableComponent } from './amortization-table.component';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatTooltipModule, CurrencyPipe, DatePipe, LocalDatePipe, AmortizationTableComponent, SkeletonLoaderComponent],
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
        </div>
        <div class="detail-actions">
          <button mat-raised-button color="primary" (click)="recordPayment()" aria-label="Record payment">
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
              <span class="label">Monthly Payment</span>
              <span class="value">{{ loan()!.monthlyPayment | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Due Day</span>
              <span class="value">{{ loan()!.dueDay }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Frequency</span>
              <span class="value">{{ loan()!.paymentFrequency }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (paymentHistory().length > 0) {
        <h3>Payment History</h3>
        <mat-card class="history-card">
          <div class="history-summary">
            <span>Total Paid: <strong>{{ totalPaid() | currency }}</strong></span>
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
              <ng-container matColumnDef="notes">
                <th mat-header-cell *matHeaderCellDef>Notes</th>
                <td mat-cell *matCellDef="let p">{{ p.notes || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p">
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

      @if (amortizationSchedule()) {
        <h3>Amortization Schedule</h3>
        <app-amortization-table [schedule]="amortizationSchedule()!"></app-amortization-table>
      }
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
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 599px) {
      .detail-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .detail-actions { flex-wrap: wrap; }
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
  private cdr = inject(ChangeDetectorRef);

  loan = signal<PersonalLoan | null>(null);
  amortizationSchedule = signal<AmortizationSchedule | null>(null);
  paymentHistory = signal<PaymentHistory[]>([]);
  totalPaid = signal(0);
  loading = signal(true);
  paymentColumns = ['paymentDate', 'amountPaid', 'notes', 'actions'];

  ngOnInit(): void {
    this.loadLoan();
  }

  loadLoan(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loanService.getById(id).subscribe({
      next: (loan) => {
        this.loan.set(loan);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
    this.loanService.getAmortization(id).subscribe({
      next: (schedule) => { this.amortizationSchedule.set(schedule); this.cdr.detectChanges(); }
    });
    this.loanService.getPayments(id).subscribe({
      next: (payments) => {
        this.paymentHistory.set(payments);
        this.totalPaid.set(sumCurrency(payments.map(p => p.amountPaid)));
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/loans']);
  }

  recordPayment(): void {
    import('../../shared/record-payment-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.RecordPaymentDialogComponent, {
        width: '440px',
        data: { debtType: 'PersonalLoan', debtId: this.loan()!.id, debtName: this.loan()!.lenderName, currentBalance: this.loan()!.currentBalance, minimumPayment: this.loan()!.monthlyPayment }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadLoan();
      });
    });
  }

  editLoan(): void {
    import('./edit-loan-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.EditLoanDialogComponent, {
        width: '500px',
        data: this.loan()
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadLoan();
      });
    });
  }

  deleteLoan(): void {
    import('../../shared/confirm-dialog.component').then(m => {
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
    import('../../shared/confirm-dialog.component').then(m => {
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
}
