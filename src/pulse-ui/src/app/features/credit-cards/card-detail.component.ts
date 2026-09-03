import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { CreditCardService } from '../../core/services/credit-card.service';
import { NotificationService } from '../../core/services/notification.service';
import { toLocalDateString } from '../../core/utils/date-utils';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { CreditCard } from '../../core/models/credit-card.model';
import { DailyExpense } from '../../core/models/daily-expense.model';
import { PayoffEntry } from '../../core/models/dashboard.model';
import { PaymentHistory } from '../../core/models/payment-history.model';
import { sumCurrency } from '../../core/utils/currency';

interface CardTransaction {
  id: string | number;
  date: string;
  description: string;
  merchant: string | null;
  categoryName: string | null;
  transactionType: string;
  amount: number;
}

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltipModule, MatChipsModule, CurrencyPipe, DatePipe, DecimalPipe, LocalDatePipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (card()) {
      <div class="header-row">
        <div class="header-left">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> Back to Cards
          </button>
          <h2>{{ card()!.cardName }}</h2>
        </div>
        <div class="detail-actions">
          <button mat-raised-button color="primary" (click)="recordPayment()" aria-label="Record payment">
            <mat-icon>payments</mat-icon> Record Payment
          </button>
          <button mat-stroked-button (click)="updateBalance()" aria-label="Update balance">
            <mat-icon>account_balance_wallet</mat-icon> Update Balance
          </button>
          <button mat-stroked-button color="warn" (click)="deleteCard()" aria-label="Delete card">
            <mat-icon>delete</mat-icon> Delete
          </button>
        </div>
      </div>

      <mat-card class="detail-card">
        <mat-card-content>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Current Balance</span>
              <span class="value">{{ card()!.currentBalance | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Credit Limit</span>
              <span class="value">{{ card()!.creditLimit | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Utilization</span>
              <span class="value">
                <div class="util-detail">
                  <div class="util-bar-detail">
                    <div class="util-fill-detail" [style.width.%]="getUtilization()" [class]="getUtilColor()"></div>
                  </div>
                  <span [class]="getUtilColor()">{{ getUtilization() | number:'1.0-0' }}%</span>
                </div>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">APR</span>
              <span class="value">{{ card()!.aprPercent }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Minimum Payment</span>
              <span class="value">{{ card()!.minimumPayment | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Due Day</span>
              <span class="value">{{ card()!.dueDay }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Billing Cycle</span>
              <span class="value">{{ card()!.billingCycleDays }} days</span>
            </div>
            @if (card()!.promoAprPercent != null) {
              <div class="detail-item">
                <span class="label">Promo APR</span>
                <span class="value">{{ card()!.promoAprPercent }}%</span>
              </div>
              <div class="detail-item">
                <span class="label">Promo End Date</span>
                <span class="value">{{ card()!.promoEndDate | localDate:'mediumDate' }}</span>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Transactions Section -->
      <div class="section-header">
        <h3>Transactions</h3>
        <div class="txn-filters">
          <button mat-stroked-button [class.active-filter]="txnMonth() === null" (click)="setTxnMonth(null)">All</button>
          @for (m of availableMonths(); track m.key) {
            <button mat-stroked-button [class.active-filter]="txnMonth() === m.key" (click)="setTxnMonth(m.key)">{{ m.label }}</button>
          }
        </div>
      </div>
      @if (transactions().length > 0) {
        <mat-card class="txn-card">
          <div class="txn-summary">
            <span class="txn-total-charge">Charges: <strong>-{{ totalCharges() | currency }}</strong></span>
            @if (totalPayments() > 0) {
              <span class="txn-total-payment">Payments: <strong>+{{ totalPayments() | currency }}</strong></span>
            }
            <span class="txn-count">{{ transactions().length }} transaction{{ transactions().length !== 1 ? 's' : '' }}</span>
          </div>
          <!-- Desktop table -->
          <div class="table-wrapper desktop-only">
            <table mat-table [dataSource]="transactions()">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">{{ t.date | date:'MMM d, y' }}</td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let t">
                  <div class="txn-desc">
                    <span class="txn-name">{{ t.description }}</span>
                    @if (t.merchant) { <span class="txn-merchant">{{ t.merchant }}</span> }
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let t">{{ t.categoryName || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let t">
                  <span class="type-badge"
                    [class.type-expense]="t.transactionType === 'Expense'"
                    [class.type-refund]="t.transactionType === 'Refund'"
                    [class.type-payment]="t.transactionType === 'Payment'">
                    {{ t.transactionType }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let t"
                  [class.txn-charge]="t.transactionType === 'Expense'"
                  [class.txn-refund]="t.transactionType === 'Refund'"
                  [class.txn-payment]="t.transactionType === 'Payment'">
                  @if (t.transactionType === 'Refund' || t.transactionType === 'Payment') { +{{ t.amount | currency }} }
                  @else { -{{ t.amount | currency }} }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="txnColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: txnColumns;"></tr>
            </table>
          </div>
          <!-- Mobile list -->
          <div class="txn-mobile-list mobile-only">
            @for (t of transactions(); track t.id) {
              <div class="txn-row">
                <div class="txn-row-left">
                  <div class="txn-dot" [class.dot-refund]="t.transactionType === 'Refund'" [class.dot-payment]="t.transactionType === 'Payment'"></div>
                  <div>
                    <div class="txn-name">{{ t.description }}</div>
                    <div class="txn-meta">{{ t.date | date:'MMM d' }}{{ t.categoryName ? ' · ' + t.categoryName : '' }}{{ t.transactionType === 'Payment' ? ' · Payment' : '' }}</div>
                  </div>
                </div>
                <span [class.txn-charge]="t.transactionType === 'Expense'" [class.txn-refund]="t.transactionType === 'Refund'" [class.txn-payment]="t.transactionType === 'Payment'">
                  @if (t.transactionType === 'Refund' || t.transactionType === 'Payment') { +{{ t.amount | currency }} } @else { -{{ t.amount | currency }} }
                </span>
              </div>
            }
          </div>
        </mat-card>
      } @else {
        <div class="empty-txn"><mat-icon>receipt_long</mat-icon><span>No transactions for this period</span></div>
      }

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

              <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: paymentColumns;"></tr>
            </table>
          </div>
        </mat-card>
      }

      @if (timeline().length > 0) {
        <h3>Payoff Timeline</h3>
        <mat-card>
          <table mat-table [dataSource]="timeline()">
            <ng-container matColumnDef="month">
              <th mat-header-cell *matHeaderCellDef>Month</th>
              <td mat-cell *matCellDef="let entry">{{ entry.month }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let entry">{{ entry.date | date:'mediumDate' }}</td>
            </ng-container>
            <ng-container matColumnDef="payment">
              <th mat-header-cell *matHeaderCellDef>Payment</th>
              <td mat-cell *matCellDef="let entry">{{ entry.payment | currency }}</td>
            </ng-container>
            <ng-container matColumnDef="principal">
              <th mat-header-cell *matHeaderCellDef>Principal</th>
              <td mat-cell *matCellDef="let entry">{{ entry.principal | currency }}</td>
            </ng-container>
            <ng-container matColumnDef="interest">
              <th mat-header-cell *matHeaderCellDef>Interest</th>
              <td mat-cell *matCellDef="let entry">{{ entry.interest | currency }}</td>
            </ng-container>
            <ng-container matColumnDef="remainingBalance">
              <th mat-header-cell *matHeaderCellDef>Balance</th>
              <td mat-cell *matCellDef="let entry">{{ entry.remainingBalance | currency }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="timelineColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: timelineColumns;"></tr>
          </table>
          <mat-paginator [pageSize]="12" [pageSizeOptions]="[12, 24, 60]" showFirstLastButtons></mat-paginator>
        </mat-card>
      }
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
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
    table { width: 100%; min-width: 500px; }
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
    .util-detail {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .util-bar-detail {
      width: 80px;
      height: 8px;
      background: var(--color-border);
      border-radius: 4px;
      overflow: hidden;
    }
    .util-fill-detail {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .util-green { background: #4caf50; color: #4caf50; }
    .util-orange { background: #ff9800; color: #ff9800; }
    .util-red { background: #f44336; color: #f44336; }

    /* Transactions */
    .section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .section-header h3 { margin: 0; }
    .txn-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .txn-filters button { font-size: 0.75rem !important; padding: 0 10px !important; min-height: 30px !important; border-radius: var(--radius-full) !important; }
    .txn-filters button.active-filter { background: var(--color-primary) !important; color: #fff !important; }
    .txn-card { margin-bottom: var(--spacing-lg); overflow: hidden; padding: 0 !important; }
    .txn-summary { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; font-size: 0.875rem; border-bottom: 1px solid var(--color-border); }
    .txn-total-charge strong { color: var(--color-danger, #f44336); }
    .txn-count { color: var(--color-text-muted); }
    .txn-desc { display: flex; flex-direction: column; }
    .txn-name { font-weight: 500; }
    .txn-merchant { font-size: 0.75rem; color: var(--color-text-muted); }
    .txn-charge { font-weight: 700; color: var(--color-action-delete, #f44336); }
    .txn-refund { font-weight: 700; color: var(--color-success); }
    .type-badge { font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); }
    .type-expense { background: #fce4ec; color: #c62828; }
    .type-refund { background: #e8f5e9; color: #2e7d32; }
    .type-payment { background: #e3f2fd; color: #1565c0; }
    .txn-payment { font-weight: 700; color: #1565c0; }
    .txn-total-payment strong { color: var(--color-success); }
    .dot-payment { background: #1565c0 !important; }
    .empty-txn { display: flex; align-items: center; gap: 10px; padding: 24px 0; color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: var(--spacing-lg); }
    .empty-txn mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .desktop-only { display: block; }
    .mobile-only { display: none; }
    .txn-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
    .txn-row:last-child { border-bottom: none; }
    .txn-row-left { display: flex; align-items: center; gap: 10px; }
    .txn-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--color-action-delete, #f44336); flex-shrink: 0; }
    .dot-refund { background: var(--color-success); }
    .txn-meta { font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px; }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-only { display: block !important; }
      .txn-filters button { font-size: 0.7rem !important; padding: 0 8px !important; }
    }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class CardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CreditCardService);
  private expenseService = inject(DailyExpenseService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  card = signal<CreditCard | null>(null);
  timeline = signal<PayoffEntry[]>([]);
  paymentHistory = signal<PaymentHistory[]>([]);
  allTransactions = signal<DailyExpense[]>([]);
  totalPaid = signal(0);
  loading = signal(true);
  txnMonth = signal<string | null>(null); // 'YYYY-MM' or null for all

  allCombined = computed(() => {
    const expenses: CardTransaction[] = this.allTransactions().map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      merchant: t.merchant,
      categoryName: t.categoryName,
      transactionType: t.transactionType === 'CardPayment' ? 'Payment' : (t.transactionType || 'Expense'),
      amount: t.amount
    }));
    const payments: CardTransaction[] = this.paymentHistory().map(p => ({
      id: `pay-${p.id}`,
      date: typeof p.paymentDate === 'string' ? p.paymentDate.slice(0, 10) : toLocalDateString(new Date(p.paymentDate)),
      description: p.notes || 'Card Payment',
      merchant: null,
      categoryName: null,
      transactionType: 'Payment',
      amount: p.amountPaid
    }));
    return [...expenses, ...payments].sort((a, b) => b.date.localeCompare(a.date));
  });

  transactions = computed(() => {
    const month = this.txnMonth();
    const all = this.allCombined();
    if (!month) return all;
    return all.filter(t => t.date.slice(0, 7) === month);
  });

  totalCharges = computed(() =>
    this.transactions()
      .filter(t => t.transactionType === 'Expense')
      .reduce((s, t) => s + t.amount, 0)
  );

  totalPayments = computed(() =>
    this.transactions()
      .filter(t => t.transactionType === 'Payment')
      .reduce((s, t) => s + t.amount, 0)
  );

  availableMonths = computed(() => {
    const seen = new Set<string>();
    return this.allCombined()
      .map(t => t.date.slice(0, 7))
      .filter(m => { if (seen.has(m)) return false; seen.add(m); return true; })
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 6)
      .map(key => ({ key, label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }));
  });

  timelineColumns = ['month', 'date', 'payment', 'principal', 'interest', 'remainingBalance'];
  paymentColumns = ['paymentDate', 'amountPaid', 'notes'];
  txnColumns = ['date', 'description', 'category', 'type', 'amount'];

  getUtilization(): number {
    const c = this.card();
    if (!c || !c.creditLimit || c.creditLimit === 0) return 0;
    return Math.min(100, (c.currentBalance / c.creditLimit) * 100);
  }

  getUtilColor(): string {
    const util = this.getUtilization();
    if (util > 70) return 'util-red';
    if (util > 30) return 'util-orange';
    return 'util-green';
  }

  ngOnInit(): void {
    this.loadCard();
  }

  loadCard(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const numId = parseInt(id, 10);
    this.cardService.getById(id).subscribe({
      next: (card) => {
        this.card.set(card);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
    this.cardService.getPayoffTimeline(id).subscribe({
      next: (entries) => { this.timeline.set(entries); }
    });
    this.cardService.getPayments(id).subscribe({
      next: (payments) => {
        this.paymentHistory.set(payments);
        this.totalPaid.set(sumCurrency(payments.map(p => p.amountPaid)));
      }
    });
    forkJoin({
      purchases: this.expenseService.getExpenses({ fundingSourceId: numId, fundingSourceType: 'CreditCard', allTime: true }),
      cardPayments: this.expenseService.getExpenses({ toFundingSourceId: numId, allTime: true })
    }).subscribe({
      next: ({ purchases, cardPayments }) => {
        const seenIds = new Set(purchases.map(t => t.id));
        const merged = [...purchases, ...cardPayments.filter(t => !seenIds.has(t.id))];
        const sorted = merged.sort((a, b) => b.date.localeCompare(a.date));
        this.allTransactions.set(sorted);
        const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const curMonth = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);
        if (sorted.some(t => t.date.slice(0, 7) === curMonth)) {
          this.txnMonth.set(curMonth);
        }
      }
    });
  }

  setTxnMonth(month: string | null): void {
    this.txnMonth.set(month);
  }

  goBack(): void {
    this.router.navigate(['/cards']);
  }

  recordPayment(): void {
    import('../../shared/record-payment-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.RecordPaymentDialogComponent, {
        width: '440px',
        data: { debtType: 'CreditCard', debtId: this.card()!.id, debtName: this.card()!.cardName, currentBalance: this.card()!.currentBalance, minimumPayment: this.card()!.minimumPayment }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadCard();
      });
    });
  }

  updateBalance(): void {
    import('./update-balance-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.UpdateBalanceDialogComponent, {
        width: '440px',
        data: this.card()
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadCard();
      });
    });
  }

  deleteCard(): void {
    import('../../shared/confirm-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.ConfirmDialogComponent, {
        width: '400px',
        data: { title: 'Delete Credit Card?', message: 'This action cannot be undone. All payment history for this card will be permanently removed.', confirmText: 'Delete', color: 'warn' }
      });
      dialogRef.afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.loading.set(true);
        this.cardService.delete(this.card()!.id).subscribe({
          next: () => {
            this.notify.success('Card deleted');
            this.router.navigate(['/cards']);
          },
          error: () => { this.loading.set(false); this.notify.error('Failed to delete card'); }
        });
      });
    });
  }
}
