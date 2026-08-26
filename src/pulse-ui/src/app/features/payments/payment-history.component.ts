import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { PaymentService } from '../../core/services/payment.service';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';

import { DebtService } from '../../core/services/debt.service';
import { NotificationService } from '../../core/services/notification.service';
import { PaymentHistory, PaymentSummary } from '../../core/models/payment-history.model';
import { DebtItem } from '../../core/models/debt-item.model';
import { EditPaymentDialogComponent } from '../../shared/edit-payment-dialog.component';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatTableModule, MatChipsModule, MatIconModule, MatButtonModule, SkeletonLoaderComponent, CurrencyPipe, DatePipe],
  template: `
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
          @for (debt of visibleDebts(); track debt.key) {
            <mat-chip [highlighted]="isDebtSelected(debt)" (click)="toggleDebt(debt)">
              <mat-icon matChipAvatar>{{ debt.type === 'PersonalLoan' ? 'account_balance' : 'credit_card' }}</mat-icon>
              {{ debt.name }}
            </mat-chip>
          }
        </mat-chip-set>
        @if (selectedDebtKeys().size > 0) {
          <button mat-button class="clear-btn" (click)="clearDebtFilter()">
            <mat-icon>close</mat-icon> Clear
          </button>
        }
      </div>
    }

    @if (loading()) {
      <app-skeleton type="table" [count]="6"></app-skeleton>
    } @else {
      <div class="summary-row">
        <mat-card class="summary-card stat-total">
          <div class="summary-item">
            <div class="stat-icon-pill green-pill">
              <mat-icon>payments</mat-icon>
            </div>
            <div class="stat-content">
              <span class="summary-value">{{ filteredSummary().totalPaid | currency }}</span>
              <span class="summary-label">Total Paid</span>
            </div>
          </div>
        </mat-card>
        <mat-card class="summary-card stat-loans">
          <div class="summary-item">
            <div class="stat-icon-pill blue-pill">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div class="stat-content">
              <span class="summary-value">{{ filteredSummary().loanTotal | currency }}</span>
              <span class="summary-label">Loan Payments</span>
            </div>
          </div>
        </mat-card>
        <mat-card class="summary-card stat-cards">
          <div class="summary-item">
            <div class="stat-icon-pill purple-pill">
              <mat-icon>credit_card</mat-icon>
            </div>
            <div class="stat-content">
              <span class="summary-value">{{ filteredSummary().cardTotal | currency }}</span>
              <span class="summary-label">Card Payments</span>
            </div>
          </div>
        </mat-card>
        <mat-card class="summary-card stat-count">
          <div class="summary-item">
            <div class="stat-icon-pill amber-pill">
              <mat-icon>receipt</mat-icon>
            </div>
            <div class="stat-content">
              <span class="summary-value">{{ filteredSummary().count }}</span>
              <span class="summary-label">Transactions</span>
            </div>
          </div>
        </mat-card>
      </div>

      @if (filteredPayments().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap blue">
            <mat-icon>payments</mat-icon>
          </div>
          <h3>Ready to crush your debt?</h3>
          <p>Record your first payment and watch your progress grow. Every payment brings you closer to financial freedom.</p>
          <button mat-raised-button color="primary" routerLink="/loans">
            <mat-icon>trending_down</mat-icon> View Debts
          </button>
        </div>
      } @else {
        <!-- Desktop table view -->
        <mat-card class="desktop-table">
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
                    {{ p.debtType === 'PersonalLoan' ? getLoanType(p) : 'Credit Card' }}
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
                  <button mat-icon-button class="action-edit" (click)="editPayment(p)" aria-label="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button class="action-delete" (click)="deletePayment(p)" aria-label="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          </div>
        </mat-card>

        <!-- Mobile card view -->
        <div class="mobile-cards">
          @for (p of filteredPayments(); track p.id) {
            <div class="payment-card">
              <div class="payment-card-top">
                <div class="payment-card-icon" [class]="'card-icon-' + p.debtType">
                  <mat-icon>{{ p.debtType === 'PersonalLoan' ? 'account_balance' : 'credit_card' }}</mat-icon>
                </div>
                <div class="payment-card-info">
                  <span class="payment-card-name">{{ getDebtName(p) }}</span>
                  <span class="payment-card-date">{{ p.paymentDate | date:'mediumDate' }}</span>
                  <span class="type-badge" [class]="'type-' + p.debtType">
                    {{ p.debtType === 'PersonalLoan' ? getLoanType(p) : 'Credit Card' }}
                  </span>
                </div>
                <div class="payment-card-amount">{{ p.amountPaid | currency }}</div>
              </div>
              <div class="payment-card-actions">
                <button mat-icon-button class="action-edit" (click)="editPayment(p)" aria-label="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-delete" (click)="deletePayment(p)" aria-label="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
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
      margin-bottom: var(--spacing-md);
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

    /* Summary stat cards */
    .summary-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    .summary-card {
      padding: var(--spacing-sm) var(--spacing-md) !important;
    }
    .summary-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }
    .stat-icon-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      border-radius: 12px;
    }
    .stat-icon-pill mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .green-pill {
      background: var(--color-stat-green-bg);
      color: var(--color-stat-green);
    }
    .blue-pill {
      background: var(--color-stat-blue-bg);
      color: var(--color-stat-blue);
    }
    .purple-pill {
      background: var(--color-stat-purple-bg);
      color: var(--color-stat-purple);
    }
    .amber-pill {
      background: var(--color-stat-amber-bg);
      color: var(--color-stat-amber);
    }
    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .summary-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 500;
      letter-spacing: 0.05em;
    }
    .summary-value {
      font-size: 1.1rem;
      font-weight: 700;
    }
    .stat-total {
      border-left: 4px solid var(--color-value-green);
    }
    .stat-total .summary-value {
      color: var(--color-value-green);
    }
    .stat-loans {
      border-left: 4px solid var(--color-value-blue);
    }
    .stat-loans .summary-value {
      color: var(--color-value-blue);
    }
    .stat-cards {
      border-left: 4px solid var(--color-value-purple);
    }
    .stat-cards .summary-value {
      color: var(--color-value-purple);
    }
    .stat-count {
      border-left: 4px solid var(--color-value-amber);
    }
    .stat-count .summary-value {
      color: var(--color-value-amber);
    }

    /* Action buttons */
    .action-edit {
      color: var(--color-action-edit) !important;
      width: 34px !important;
      height: 34px !important;
      border-radius: 8px !important;
    }
    .action-edit mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .action-edit:hover {
      background: var(--color-action-edit-bg) !important;
    }
    .action-delete {
      color: var(--color-action-delete) !important;
      width: 34px !important;
      height: 34px !important;
      border-radius: 8px !important;
    }
    .action-delete mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .action-delete:hover {
      background: var(--color-action-delete-bg) !important;
    }

    /* Table */
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
    }
    .type-PersonalLoan {
      background: var(--gradient-icon-blue);
      color: var(--color-primary);
    }
    .type-CreditCard {
      background: var(--gradient-icon-amber);
      color: var(--color-warning);
    }

    /* Mobile cards - hidden on desktop */
    .mobile-cards {
      display: none;
    }

    /* Desktop/mobile breakpoint */
    @media (max-width: 599px) {
      .desktop-table {
        display: none !important;
      }
      .mobile-cards {
        display: block;
      }
      .summary-row {
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (min-width: 600px) and (max-width: 768px) {
      .summary-row { grid-template-columns: 1fr 1fr; }
    }

    /* Mobile payment cards */
    .payment-card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      margin-bottom: 10px;
      padding: 14px;
      box-shadow: var(--shadow-sm);
    }
    .payment-card-top {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .payment-card-icon {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .payment-card-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .card-icon-PersonalLoan {
      background: var(--color-stat-blue-bg);
      color: var(--color-stat-blue);
    }
    .card-icon-CreditCard {
      background: var(--color-stat-amber-bg);
      color: var(--color-stat-amber);
    }
    .payment-card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .payment-card-name {
      font-weight: 600;
      font-size: 0.9375rem;
      color: var(--color-text-primary);
    }
    .payment-card-date {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    .payment-card-info .type-badge {
      align-self: flex-start;
      margin-top: 2px;
    }
    .payment-card-amount {
      font-weight: 700;
      font-size: 1rem;
      color: var(--color-success);
      white-space: nowrap;
    }
    .payment-card-actions {
      display: flex;
      gap: 6px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--color-border);
      justify-content: flex-end;
    }

  `]
})
export class PaymentHistoryComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private debtService = inject(DebtService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private debtMap = new Map<string, DebtItem>();

  allPayments = signal<PaymentHistory[]>([]);
  loading = signal(true);
  activeFilter = signal<string>('all');
  selectedDebtKeys = signal<Set<string>>(new Set());
  debtItems = signal<DebtItem[]>([]);
  columns = ['paymentDate', 'debtName', 'debtType', 'amountPaid', 'notes', 'actions'];

  visibleDebts = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.debtItems();
    return this.debtItems().filter(d => d.type === filter);
  });

  filteredPayments = computed(() => {
    let payments = this.allPayments();
    const filter = this.activeFilter();
    const selected = this.selectedDebtKeys();

    if (filter !== 'all') {
      payments = payments.filter(p => p.debtType === filter);
    }

    if (selected.size > 0) {
      payments = payments.filter(p => selected.has(`${p.debtType}:${p.debtId}`));
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
    this.debtService.getAll().subscribe(debts => {
      debts.forEach(d => this.debtMap.set(d.key, d));
      this.debtItems.set(debts);
    });
    this.loadPayments();
  }

  getDebtName(payment: PaymentHistory): string {
    const debt = this.debtMap.get(`${payment.debtType}:${payment.debtId}`);
    return debt?.name ?? (payment.debtType === 'PersonalLoan' ? 'Loan' : 'Card');
  }

  getLoanType(payment: PaymentHistory): string {
    const debt = this.debtMap.get(`${payment.debtType}:${payment.debtId}`);
    return debt?.subType ? `${debt.subType} Loan` : 'Loan';
  }

  filterByType(filter: string): void {
    this.activeFilter.set(filter);
    this.selectedDebtKeys.set(new Set());
  }

  toggleDebt(debt: DebtItem): void {
    const current = new Set(this.selectedDebtKeys());
    if (current.has(debt.key)) {
      current.delete(debt.key);
    } else {
      current.add(debt.key);
    }
    this.selectedDebtKeys.set(current);
  }

  isDebtSelected(debt: DebtItem): boolean {
    return this.selectedDebtKeys().has(debt.key);
  }

  clearDebtFilter(): void {
    this.selectedDebtKeys.set(new Set());
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
