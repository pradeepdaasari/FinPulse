import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { BankAccountService } from '../../core/services/bank-account.service';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { BankAccount, CommissionSchedule } from '../../core/models/bank-account.model';
import { DailyExpense } from '../../core/models/daily-expense.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatTableModule, MatProgressSpinnerModule, MatTooltipModule, CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (account()) {
      <!-- Header -->
      <div class="header-row">
        <div class="header-left">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> Bank Accounts
          </button>
          <h2>{{ account()!.accountName }}</h2>
        </div>
        <div class="detail-actions">
          <button mat-stroked-button (click)="editAccount()">
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-stroked-button color="warn" (click)="deleteAccount()">
            <mat-icon>delete</mat-icon> Delete
          </button>
        </div>
      </div>

      <!-- Account Info Card -->
      <mat-card class="detail-card">
        <mat-card-content>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Account Type</span>
              <span class="value">
                <span class="acct-type-badge"
                      [class.acct-checking]="account()!.accountType === 'Checking'"
                      [class.acct-savings]="account()!.accountType === 'Savings'"
                      [class.acct-brokerage]="account()!.accountType === 'Brokerage'">
                  {{ account()!.accountType }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <span class="label">Current Balance</span>
              <span class="value balance-value">{{ account()!.currentBalance | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Transactions</span>
              <span class="value">{{ transactions().length }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Added On</span>
              <span class="value">{{ account()!.createdAt | date:'MMM d, yyyy' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Commission History (Brokerage only) -->
      @if (account()!.accountType === 'Brokerage' && commissionHistory().length > 0) {
        <h3 class="section-title">Commission History</h3>
        <mat-card class="commission-card">
          <div class="commission-list">
            @for (schedule of commissionHistory(); track schedule.id; let i = $index) {
              <div class="commission-entry" [class.current]="i === 0">
                <div class="commission-date">
                  <span class="date-badge">{{ schedule.effectiveFrom | date:'MMM d, yyyy' }}</span>
                  @if (i === 0) {
                    <span class="current-badge">Current</span>
                  }
                </div>
                <div class="commission-rates">
                  @if (schedule.optionsCommissionPerContract != null) {
                    <span class="rate-item">Options: {{ schedule.optionsCommissionPerContract | currency:'USD':'symbol':'1.2-4' }}</span>
                  }
                  @if (schedule.optionsRegFeePerContract != null) {
                    <span class="rate-item">+ {{ schedule.optionsRegFeePerContract | currency:'USD':'symbol':'1.3-4' }} reg</span>
                  }
                  @if (schedule.futuresCommissionPerContract != null) {
                    <span class="rate-item sep">Futures: {{ schedule.futuresCommissionPerContract | currency:'USD':'symbol':'1.2-4' }}</span>
                  }
                  @if (schedule.futuresRegFeePerContract != null) {
                    <span class="rate-item">+ {{ schedule.futuresRegFeePerContract | currency:'USD':'symbol':'1.3-4' }} reg</span>
                  }
                </div>
                <div class="commission-actions">
                  <button mat-icon-button (click)="editSchedule(schedule)" matTooltip="Edit & recalculate">
                    <mat-icon>edit</mat-icon>
                  </button>
                  @if (i > 0 && commissionHistory().length > 1) {
                    <button mat-icon-button (click)="deleteSchedule(schedule)" matTooltip="Delete">
                      <mat-icon>close</mat-icon>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </mat-card>
      }

      <!-- Transaction History -->
      @if (transactions().length > 0) {
        <h3 class="section-title">Transaction History</h3>
        <mat-card class="history-card">
          <div class="history-summary">
            <div class="summary-stats">
              <span class="summary-item">
                <span class="summary-label">Income</span>
                <span class="summary-val income">+{{ totalIncome() | currency }}</span>
              </span>
              <span class="summary-item">
                <span class="summary-label">Spent</span>
                <span class="summary-val expense">-{{ totalExpense() | currency }}</span>
              </span>
              <span class="summary-item">
                <span class="summary-label">Transfers</span>
                <span class="summary-val transfer">{{ totalTransfer() | currency }}</span>
              </span>
            </div>
            <span class="history-count">{{ transactions().length }} transactions</span>
          </div>

          <!-- Desktop Table -->
          <div class="table-wrapper desktop-only">
            <table mat-table [dataSource]="transactions()">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">{{ t.date | date:'MMM d, h:mm a' }}</td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let t">
                  {{ t.description }}
                  @if (t.merchant) {
                    <span class="merchant-text">· {{ t.merchant }}</span>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let t">
                  <span class="type-badge"
                        [class.type-expense]="t.transactionType === 'Expense' || !t.transactionType"
                        [class.type-income]="t.transactionType === 'Income'"
                        [class.type-transfer]="t.transactionType === 'Transfer'"
                        [class.type-refund]="t.transactionType === 'Refund'"
                        [class.type-card]="t.transactionType === 'CardPayment'">
                    {{ t.transactionType || 'Expense' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="source">
                <th mat-header-cell *matHeaderCellDef>Source</th>
                <td mat-cell *matCellDef="let t">
                  @if (t.transactionType === 'Transfer' && t.fundingSourceName && t.toFundingSourceName) {
                    <span class="source-cell transfer-source">
                      <mat-icon class="source-icon">{{ getSourceIcon(t.fundingSourceId, t.fundingSourceType) }}</mat-icon>
                      {{ t.fundingSourceName }} <mat-icon class="arrow-icon">arrow_forward</mat-icon> {{ t.toFundingSourceName }}
                    </span>
                  } @else if (t.transactionType === 'CardPayment' && t.fundingSourceName && t.toFundingSourceName) {
                    <span class="source-cell card-payment-source">
                      <mat-icon class="source-icon">{{ getSourceIcon(t.fundingSourceId, t.fundingSourceType) }}</mat-icon>
                      {{ t.fundingSourceName }} <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                      <mat-icon class="source-icon">credit_card</mat-icon> {{ t.toFundingSourceName }}
                    </span>
                  } @else if (t.fundingSourceName) {
                    <span class="source-cell">
                      <mat-icon class="source-icon">{{ getSourceIcon(t.fundingSourceId, t.fundingSourceType) }}</mat-icon>
                      {{ t.fundingSourceName }}
                    </span>
                  } @else {
                    —
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let t">{{ t.categoryName || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let t" class="amount-cell"
                    [class.income-amount]="t.transactionType === 'Income' || t.transactionType === 'Refund'"
                    [class.transfer-amount]="t.transactionType === 'Transfer'"
                    [class.card-amount]="t.transactionType === 'CardPayment'">
                  @if (t.transactionType === 'Income' || t.transactionType === 'Refund') { +{{ t.amount | currency }} }
                  @else if (t.transactionType === 'Transfer') { ⇔ {{ t.amount | currency }} }
                  @else { -{{ t.amount | currency }} }
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let t">
                  <button mat-icon-button (click)="editTransaction(t)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="mobile-feed">
            @for (t of transactions(); track t.id) {
              <div class="txn-card" (click)="editTransaction(t)">
                <div class="txn-dot"
                     [class.dot-income]="t.transactionType === 'Income'"
                     [class.dot-transfer]="t.transactionType === 'Transfer'"
                     [class.dot-refund]="t.transactionType === 'Refund'"
                     [class.dot-card]="t.transactionType === 'CardPayment'">
                  <mat-icon>{{ getTxnIcon(t) }}</mat-icon>
                </div>
                <div class="txn-mid">
                  <span class="txn-desc">{{ t.description }}</span>
                  <span class="txn-meta">
                    {{ t.transactionType || 'Expense' }} · {{ t.date | date:'MMM d, h:mm a' }}{{ t.categoryName ? ' · ' + t.categoryName : '' }}
                  </span>
                  @if (t.fundingSourceName) {
                    <span class="txn-source">
                      <mat-icon class="txn-source-icon">{{ getSourceIcon(t.fundingSourceId, t.fundingSourceType) }}</mat-icon>
                      {{ t.fundingSourceName }}
                      @if (t.transactionType === 'Transfer' && t.toFundingSourceName) {
                        → {{ t.toFundingSourceName }}
                      }
                    </span>
                  }
                </div>
                <div class="txn-right">
                  <span class="txn-amount"
                        [class.income-amount]="t.transactionType === 'Income' || t.transactionType === 'Refund'"
                        [class.transfer-amount]="t.transactionType === 'Transfer'">
                    @if (t.transactionType === 'Income' || t.transactionType === 'Refund') { +{{ t.amount | currency }} }
                    @else { -{{ t.amount | currency }} }
                  </span>
                </div>
              </div>
            }
          </div>
        </mat-card>
      } @else {
        <div class="empty-history">
          <mat-icon>receipt_long</mat-icon>
          <p>No transactions recorded for this account yet.</p>
        </div>
      }
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    /* Header */
    .header-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .header-row h2 { margin: 0; font-size: 1.3rem; }
    .header-left { display: flex; align-items: center; gap: var(--spacing-sm); }
    .detail-actions { display: flex; gap: 8px; align-items: center; }
    .detail-actions button mat-icon { margin-right: 4px; font-size: 18px; width: 18px; height: 18px; }

    /* Detail Card */
    .detail-card { margin-bottom: var(--spacing-lg); }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--spacing-md);
    }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
    .value { font-size: 1rem; font-weight: 600; }
    .balance-value { font-size: 1.3rem; font-weight: 700; color: var(--color-success); }
    .acct-type-badge {
      display: inline-block; font-size: 0.72rem; font-weight: 600;
      padding: 3px 10px; border-radius: var(--radius-full);
    }
    .acct-checking { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .acct-savings { background: var(--color-stat-green-bg); color: var(--color-stat-green); }
    .acct-brokerage { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }

    /* Section Title */
    .section-title { font-size: 1rem; font-weight: 700; margin-bottom: 12px; }

    /* History Card */
    .history-card { overflow: hidden; }
    .history-summary {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 20px; border-bottom: 1px solid var(--color-border);
      flex-wrap: wrap; gap: 12px;
    }
    .summary-stats { display: flex; gap: 20px; }
    .summary-item { display: flex; flex-direction: column; }
    .summary-label { font-size: 0.68rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .summary-val { font-size: 0.95rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .summary-val.income { color: var(--color-success); }
    .summary-val.expense { color: var(--color-danger); }
    .summary-val.transfer { color: var(--color-primary); }
    .history-count { font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500; }

    /* Table */
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 600px; }
    .source-cell { display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem; white-space: nowrap; }
    .source-icon { font-size: 16px; width: 16px; height: 16px; opacity: 0.7; }
    .arrow-icon { font-size: 14px; width: 14px; height: 14px; opacity: 0.5; }
    .transfer-source { color: var(--color-primary); }
    .card-payment-source { color: var(--color-stat-purple); }
    .merchant-text { color: var(--color-text-muted); font-size: 0.85rem; }
    .amount-cell { font-weight: 700; font-variant-numeric: tabular-nums; }
    .income-amount { color: var(--color-success); }
    .transfer-amount { color: var(--color-primary); }
    .card-amount { color: var(--color-stat-purple); }

    /* Type Badge */
    .type-badge {
      display: inline-block; font-size: 0.65rem; font-weight: 600;
      padding: 3px 8px; border-radius: var(--radius-full);
      text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap;
    }
    .type-expense { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .type-income { background: var(--color-stat-green-bg); color: var(--color-success); }
    .type-transfer { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .type-refund { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .type-card { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }

    /* Mobile Feed */
    .mobile-feed { display: none; }
    .txn-card {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.04);
      cursor: pointer; transition: background var(--transition-fast);
    }
    .txn-card:active { background: var(--color-surface-hover); }
    .txn-dot {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-red-bg); flex-shrink: 0;
    }
    .txn-dot mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-danger); }
    .txn-dot.dot-income { background: var(--color-stat-green-bg); }
    .txn-dot.dot-income mat-icon { color: var(--color-success); }
    .txn-dot.dot-transfer { background: var(--color-stat-blue-bg); }
    .txn-dot.dot-transfer mat-icon { color: var(--color-primary); }
    .txn-dot.dot-refund { background: var(--color-stat-amber-bg); }
    .txn-dot.dot-refund mat-icon { color: var(--color-warning); }
    .txn-dot.dot-card { background: var(--color-stat-purple-bg); }
    .txn-dot.dot-card mat-icon { color: var(--color-stat-purple); }
    .txn-mid { flex: 1; min-width: 0; }
    .txn-desc { display: block; font-weight: 500; font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .txn-meta { display: block; font-size: 0.7rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .txn-source { display: flex; align-items: center; gap: 3px; font-size: 0.68rem; color: var(--color-text-muted); margin-top: 1px; }
    .txn-source-icon { font-size: 12px; width: 12px; height: 12px; opacity: 0.7; }
    .txn-right { flex-shrink: 0; text-align: right; }
    .txn-amount { font-weight: 700; font-size: 0.9rem; }

    /* Empty */
    .empty-history {
      text-align: center; padding: 48px 24px; color: var(--color-text-muted);
    }
    .empty-history mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }
    .empty-history p { margin-top: 12px; }

    /* Commission History */
    .commission-card { margin-bottom: var(--spacing-lg); }
    .commission-list { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .commission-entry {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: var(--radius-sm);
      background: var(--color-surface-secondary);
      position: relative;
    }
    .commission-entry.current {
      border: 1.5px solid var(--color-stat-purple);
      background: color-mix(in srgb, var(--color-stat-purple-bg) 40%, transparent);
    }
    .commission-date { display: flex; align-items: center; gap: 8px; min-width: 120px; }
    .date-badge { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); }
    .current-badge {
      font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 6px; border-radius: var(--radius-full);
      background: var(--color-stat-purple-bg); color: var(--color-stat-purple);
    }
    .commission-rates { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
    .rate-item { font-size: 0.75rem; color: var(--color-text-secondary); }
    .rate-item.sep { margin-left: 8px; }
    .commission-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
    .commission-actions mat-icon { font-size: 16px; width: 16px; height: 16px; }

    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
      .summary-stats { gap: 14px; }
    }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-feed { display: block; }
      .detail-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
      .detail-actions { flex-wrap: wrap; }
      .summary-stats { gap: 10px; }
      .commission-entry { flex-direction: column; align-items: flex-start; gap: 6px; }
      .commission-date { min-width: unset; }
    }
  `]
})
export class AccountDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accountService = inject(BankAccountService);
  private expenseService = inject(DailyExpenseService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  account = signal<BankAccount | null>(null);
  transactions = signal<DailyExpense[]>([]);
  commissionHistory = signal<CommissionSchedule[]>([]);
  loading = signal(true);
  displayedColumns = ['date', 'description', 'type', 'source', 'category', 'amount', 'actions'];

  totalIncome = signal(0);
  totalExpense = signal(0);
  totalTransfer = signal(0);

  ngOnInit(): void {
    this.loadAccount();
  }

  loadAccount(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.accountService.getById(id).subscribe({
      next: (account) => {
        this.account.set(account);
        this.loadTransactions(id);
        if (account.accountType === 'Brokerage') {
          this.loadCommissionHistory(id);
        }
      },
      error: () => {
        this.notify.error('Account not found');
        this.goBack();
      }
    });
  }

  private loadTransactions(accountId: number): void {
    this.expenseService.getExpenses({ fundingSourceId: accountId }).subscribe({
      next: (txns) => {
        this.transactions.set(txns);
        this.totalIncome.set(txns.filter(t => t.transactionType === 'Income' || t.transactionType === 'Refund').reduce((s, t) => s + t.amount, 0));
        this.totalExpense.set(txns.filter(t => t.transactionType === 'Expense' || !t.transactionType).reduce((s, t) => s + t.amount, 0));
        this.totalTransfer.set(txns.filter(t => t.transactionType === 'Transfer').reduce((s, t) => s + t.amount, 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadCommissionHistory(accountId: number): void {
    this.accountService.getCommissionHistory(accountId).subscribe({
      next: (history) => this.commissionHistory.set(history)
    });
  }

  editSchedule(schedule: CommissionSchedule): void {
    import('./edit-commission-dialog.component').then(m => {
      const ref = this.dialog.open(m.EditCommissionDialogComponent, {
        width: '460px',
        maxWidth: '95vw',
        data: {
          accountId: this.account()!.id,
          accountName: this.account()!.accountName,
          schedule
        }
      });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.loadCommissionHistory(this.account()!.id);
          this.loadAccount();
        }
      });
    });
  }

  deleteSchedule(schedule: CommissionSchedule): void {
    const confirmed = confirm('Delete this commission schedule? Trades will keep their current calculated fees.');
    if (confirmed) {
      this.loading.set(true);
      this.accountService.deleteCommissionSchedule(this.account()!.id, schedule.id).subscribe({
        next: () => {
          this.notify.success('Schedule deleted');
          this.loadCommissionHistory(this.account()!.id);
        },
        error: () => { this.loading.set(false); this.notify.error('Failed to delete schedule'); }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/accounts']);
  }

  editAccount(): void {
    import('./add-account-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddAccountDialogComponent, {
        width: '500px', maxWidth: '95vw', data: this.account()
      });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.notify.success('Account updated');
          this.loadAccount();
        }
      });
    });
  }

  deleteAccount(): void {
    const confirmed = confirm(`Delete "${this.account()!.accountName}"? This cannot be undone.`);
    if (confirmed) {
      this.loading.set(true);
      this.accountService.delete(this.account()!.id).subscribe({
        next: () => { this.notify.success('Account deleted'); this.goBack(); },
        error: () => { this.loading.set(false); this.notify.error('Failed to delete'); }
      });
    }
  }

  editTransaction(txn: DailyExpense): void {
    import('../expenses/add-expense-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddExpenseDialogComponent, {
        width: '480px', maxWidth: '95vw', data: { expense: txn }
      });
      ref.afterClosed().subscribe(result => {
        if (result) {
          if (result.id) {
            this.expenseService.update(result.id, result).subscribe({
              next: () => { this.notify.success('Transaction updated'); this.loadAccount(); },
              error: () => this.notify.error('Failed to update')
            });
          }
        }
      });
    });
  }

  getSourceIcon(fundingSourceId: number | null, fundingSourceType: string | null): string {
    if (fundingSourceType === 'CreditCard') return 'credit_card';
    const acct = this.account();
    if (acct && fundingSourceId === acct.id) {
      switch (acct.accountType) {
        case 'Savings': return 'savings';
        case 'Brokerage': return 'trending_up';
        default: return 'account_balance';
      }
    }
    return 'account_balance';
  }

  getTxnIcon(t: DailyExpense): string {
    switch (t.transactionType) {
      case 'Income': return 'arrow_downward';
      case 'Transfer': return 'swap_horiz';
      case 'Refund': return 'undo';
      case 'CardPayment': return 'credit_card';
      default: return 'arrow_upward';
    }
  }
}
