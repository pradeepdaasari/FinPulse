import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { CreditCardService } from '../../core/services/credit-card.service';
import { NotificationService } from '../../core/services/notification.service';
import { PaymentHistory, PaymentSummary } from '../../core/models/payment-history.model';
import { PersonalLoan } from '../../core/models/personal-loan.model';
import { CreditCard } from '../../core/models/credit-card.model';
import { EditPaymentDialogComponent } from '../../shared/edit-payment-dialog.component';

interface DebtFilterItem {
  id: number;
  name: string;
  type: 'PersonalLoan' | 'CreditCard';
}

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatChipsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    <h2><mat-icon class="section-icon">receipt_long</mat-icon> Payment History</h2>

    <div class="filter-row">
      <mat-chip-set>
        <mat-chip [highlighted]="activeFilter() === 'all'" (click)="filterByType('all')">
          All
        </mat-chip>
        <mat-chip [highlighted]="activeFilter() === 'PersonalLoan'" (click)="filterByType('PersonalLoan')">
          Loans
        </mat-chip>
        <mat-chip [highlighted]="activeFilter() === 'CreditCard'" (click)="filterByType('CreditCard')">
          Credit Cards
        </mat-chip>
      </mat-chip-set>
    </div>

    @if (visibleDebts().length > 0) {
      <div class="debt-filter-row">
        <span class="debt-filter-label">Filter by:</span>
        <mat-chip-set>
          @for (debt of visibleDebts(); track debt.id) {
            <mat-chip [highlighted]="isDebtSelected(debt)" (click)="toggleDebt(debt)">
              <mat-icon matChipAvatar>{{ debt.type === 'PersonalLoan' ? 'account_balance' : 'credit_card' }}</mat-icon>
              {{ debt.name }}
            </mat-chip>
          }
        </mat-chip-set>
        @if (selectedDebtIds().size > 0) {
          <button mat-button class="clear-btn" (click)="clearDebtFilter()">
            <mat-icon>close</mat-icon> Clear
          </button>
        }
      </div>
    }

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else {
      <div class="summary-row">
        <mat-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Total Paid</span>
            <span class="summary-value">{{ filteredSummary().totalPaid | currency }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Loan Payments</span>
            <span class="summary-value">{{ filteredSummary().loanTotal | currency }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Card Payments</span>
            <span class="summary-value">{{ filteredSummary().cardTotal | currency }}</span>
          </div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">Transactions</span>
            <span class="summary-value">{{ filteredSummary().count }}</span>
          </div>
        </mat-card>
      </div>

      @if (filteredPayments().length === 0) {
        <mat-card class="empty-card">
          <div class="empty-state">
            <mat-icon>receipt_long</mat-icon>
            <span>No payments recorded yet</span>
          </div>
        </mat-card>
      } @else {
        <mat-card>
          <div class="table-wrapper">
            <table mat-table [dataSource]="filteredPayments()">
              <ng-container matColumnDef="paymentDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let p">{{ p.paymentDate | date:'mediumDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="debtName">
                <th mat-header-cell *matHeaderCellDef>Account</th>
                <td mat-cell *matCellDef="let p">
                  <span class="debt-name">
                    <mat-icon class="debt-icon" [class]="'icon-' + p.debtType">{{ p.debtType === 'PersonalLoan' ? 'account_balance' : 'credit_card' }}</mat-icon>
                    {{ getDebtName(p) }}
                  </span>
                </td>
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
      margin-bottom: var(--spacing-sm);
    }
    mat-chip {
      cursor: pointer;
    }
    .debt-filter-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
    }
    .debt-filter-label {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }
    .clear-btn {
      font-size: 0.75rem;
      line-height: 1;
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
    .debt-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
    }
    .debt-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .icon-PersonalLoan { color: var(--color-primary); }
    .icon-CreditCard { color: var(--color-warning); }
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
  private cardService = inject(CreditCardService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private loanMap = new Map<number, PersonalLoan>();
  private cardMap = new Map<number, CreditCard>();

  allPayments = signal<PaymentHistory[]>([]);
  loading = signal(true);
  activeFilter = signal<string>('all');
  selectedDebtIds = signal<Set<number>>(new Set());
  debtItems = signal<DebtFilterItem[]>([]);
  columns = ['paymentDate', 'debtName', 'debtType', 'amountPaid', 'notes', 'actions'];

  visibleDebts = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.debtItems();
    return this.debtItems().filter(d => d.type === filter);
  });

  filteredPayments = computed(() => {
    let payments = this.allPayments();
    const filter = this.activeFilter();
    const selected = this.selectedDebtIds();

    if (filter !== 'all') {
      payments = payments.filter(p => p.debtType === filter);
    }

    if (selected.size > 0) {
      payments = payments.filter(p => selected.has(p.debtId));
    }

    return payments;
  });

  filteredSummary = computed(() => {
    const payments = this.filteredPayments();
    const loanTotal = payments.filter(p => p.debtType === 'PersonalLoan').reduce((sum, p) => sum + p.amountPaid, 0);
    const cardTotal = payments.filter(p => p.debtType === 'CreditCard').reduce((sum, p) => sum + p.amountPaid, 0);
    return {
      totalPaid: loanTotal + cardTotal,
      loanTotal,
      cardTotal,
      count: payments.length
    };
  });

  ngOnInit(): void {
    forkJoin({
      loans: this.loanService.getAll(),
      cards: this.cardService.getAll()
    }).subscribe(({ loans, cards }) => {
      const items: DebtFilterItem[] = [];
      loans.forEach(l => {
        this.loanMap.set(Number(l.id), l);
        items.push({ id: Number(l.id), name: l.lenderName, type: 'PersonalLoan' });
      });
      cards.forEach(c => {
        this.cardMap.set(Number(c.id), c);
        items.push({ id: Number(c.id), name: c.cardName, type: 'CreditCard' });
      });
      this.debtItems.set(items);
    });
    this.loadPayments();
  }

  getDebtName(payment: PaymentHistory): string {
    if (payment.debtType === 'PersonalLoan') {
      return this.loanMap.get(payment.debtId)?.lenderName ?? 'Loan';
    }
    return this.cardMap.get(payment.debtId)?.cardName ?? 'Card';
  }

  getLoanType(debtId: number): string {
    const loan = this.loanMap.get(debtId);
    return loan?.loanType ? `${loan.loanType} Loan` : 'Loan';
  }

  filterByType(filter: string): void {
    this.activeFilter.set(filter);
    this.selectedDebtIds.set(new Set());
  }

  toggleDebt(debt: DebtFilterItem): void {
    const current = new Set(this.selectedDebtIds());
    if (current.has(debt.id)) {
      current.delete(debt.id);
    } else {
      current.add(debt.id);
    }
    this.selectedDebtIds.set(current);
  }

  isDebtSelected(debt: DebtFilterItem): boolean {
    return this.selectedDebtIds().has(debt.id);
  }

  clearDebtFilter(): void {
    this.selectedDebtIds.set(new Set());
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
    this.paymentService.getAll().subscribe({
      next: (response) => {
        this.allPayments.set(response.payments);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }
}
