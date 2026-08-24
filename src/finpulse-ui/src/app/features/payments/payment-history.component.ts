import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { PaymentService } from '../../core/services/payment.service';
import { LoanService } from '../../core/services/loan.service';
import { NotificationService } from '../../core/services/notification.service';
import { PaymentHistory, PaymentSummary } from '../../core/models/payment-history.model';
import { PersonalLoan } from '../../core/models/personal-loan.model';
import { EditPaymentDialogComponent } from '../../shared/edit-payment-dialog.component';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatChipsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    <h2><mat-icon class="section-icon">receipt_long</mat-icon> Payment History</h2>

    <div class="filter-row">
      <mat-chip-set>
        <mat-chip [highlighted]="activeFilter() === 'all'" (click)="filterBy('all')">
          All
        </mat-chip>
        <mat-chip [highlighted]="activeFilter() === 'PersonalLoan'" (click)="filterBy('PersonalLoan')">
          Loans
        </mat-chip>
        <mat-chip [highlighted]="activeFilter() === 'CreditCard'" (click)="filterBy('CreditCard')">
          Credit Cards
        </mat-chip>
      </mat-chip-set>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else {
      <div class="summary-row">
        <mat-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Total Paid</span>
            <span class="summary-value">{{ summary()?.totalPaid | currency }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Loan Payments</span>
            <span class="summary-value">{{ summary()?.loanTotal | currency }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Card Payments</span>
            <span class="summary-value">{{ summary()?.cardTotal | currency }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Transactions</span>
            <span class="summary-value">{{ summary()?.count }}</span>
          </div>
        </mat-card>
      </div>

      @if (payments().length === 0) {
        <mat-card class="empty-card">
          <div class="empty-state">
            <mat-icon>receipt_long</mat-icon>
            <span>No payments recorded yet</span>
          </div>
        </mat-card>
      } @else {
        <mat-card>
          <div class="table-wrapper">
            <table mat-table [dataSource]="payments()">
              <ng-container matColumnDef="paymentDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let p">{{ p.paymentDate | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="debtType">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let p">
                  <span class="type-badge" [class]="'type-' + p.debtType">
                    {{ p.debtType === 'PersonalLoan' ? getLoanType(p.debtId) : 'Credit Card' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="amountPaid">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let p" class="amount-cell">{{ p.amountPaid | currency }}</td>
              </ng-container>

              <ng-container matColumnDef="notes">
                <th mat-header-cell *matHeaderCellDef>Notes</th>
                <td mat-cell *matCellDef="let p" class="notes-cell">{{ p.notes || '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p">
                  <button mat-icon-button (click)="editPayment(p)" aria-label="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deletePayment(p)" aria-label="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        </mat-card>
      }
    }
  `,
  styles: [`
    .filter-row {
      margin-bottom: var(--spacing-lg);
    }
    mat-chip {
      cursor: pointer;
    }
    .summary-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }
    .summary-card {
      padding: var(--spacing-md) !important;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .summary-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.05em;
    }
    .summary-value {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table { width: 100%; min-width: 400px; }
    .amount-cell {
      font-weight: 600;
      color: var(--color-success);
    }
    .notes-cell {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
    }
    .type-badge {
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .type-PersonalLoan {
      background: var(--gradient-icon-blue);
      color: var(--color-primary);
    }
    .type-CreditCard {
      background: var(--gradient-icon-amber);
      color: var(--color-warning);
    }
    .empty-card {
      padding: var(--spacing-xl) !important;
    }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: var(--color-text-muted);
    }
    .empty-state mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    @media (max-width: 768px) {
      .summary-row { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private loanService = inject(LoanService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private loanMap = new Map<number, PersonalLoan>();

  payments = signal<PaymentHistory[]>([]);
  summary = signal<PaymentSummary | null>(null);
  loading = signal(true);
  activeFilter = signal<string>('all');
  columns = ['paymentDate', 'debtType', 'amountPaid', 'notes', 'actions'];

  ngOnInit(): void {
    this.loanService.getAll().subscribe(loans => {
      loans.forEach(l => this.loanMap.set(Number(l.id), l));
    });
    this.loadPayments();
  }

  getLoanType(debtId: number): string {
    const loan = this.loanMap.get(debtId);
    return loan?.loanType ? `${loan.loanType} Loan` : 'Loan';
  }

  filterBy(filter: string): void {
    this.activeFilter.set(filter);
    this.loadPayments();
  }

  editPayment(payment: PaymentHistory): void {
    const dialogRef = this.dialog.open(EditPaymentDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: payment
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Payment updated successfully');
        this.loadPayments();
      }
    });
  }

  deletePayment(payment: PaymentHistory): void {
    if (!this.notify.confirmDelete(`payment of $${payment.amountPaid.toFixed(2)}`)) return;
    this.paymentService.delete(payment.id).subscribe(() => {
      this.notify.success('Payment deleted successfully');
      this.loadPayments();
    });
  }

  private loadPayments(): void {
    this.loading.set(true);
    const type = this.activeFilter() === 'all' ? undefined : this.activeFilter();
    this.paymentService.getAll(type).subscribe({
      next: (response) => {
        this.payments.set(response.payments);
        this.summary.set(response.summary);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }
}
