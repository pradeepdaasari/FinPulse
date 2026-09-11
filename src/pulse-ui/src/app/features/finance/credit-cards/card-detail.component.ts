import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { PaymentService } from '../../../core/services/payment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { toLocalDateString } from '../../../core/utils/date-utils';
import { DailyExpenseService } from '../../../core/services/daily-expense.service';
import { MoneyMovementService } from '../../../core/services/money-movement.service';
import { CreditCard } from '../../../core/models/credit-card.model';
import { DailyExpense } from '../../../core/models/daily-expense.model';
import { MoneyMovement, MovementType } from '../../../core/models/money-movement.model';
import { PayoffEntry } from '../../../core/models/dashboard.model';
import { PaymentHistory } from '../../../core/models/payment-history.model';
import { sumCurrency } from '../../../core/utils/currency';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { FundingSourceService } from '../../../core/services/funding-source.service';

interface CardTransaction {
  id: string | number;
  date: string;
  description: string;
  merchant: string | null;
  categoryName: string | null;
  transactionType: string;
  amount: number;
}

interface CardActivityItem {
  kind: 'transaction' | 'movement';
  date: string;
  balance: number;
  txn?: CardTransaction;
  movement?: MoneyMovement;
}

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule, MatTooltipModule, MatChipsModule, CurrencyPipe, DatePipe, DecimalPipe, LocalDatePipe, SkeletonLoaderComponent],
  template: `
    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
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

      <!-- Activity Section -->
      <div class="section-header">
        <h3>Activity</h3>
        <div class="txn-filters">
          <button mat-stroked-button [class.active-filter]="txnMonth() === null" (click)="setTxnMonth(null)">All</button>
          @for (m of availableMonths(); track m.key) {
            <button mat-stroked-button [class.active-filter]="txnMonth() === m.key" (click)="setTxnMonth(m.key)">{{ m.label }}</button>
          }
        </div>
      </div>
      @if (activityItems().length > 0) {
        <mat-card class="txn-card">
          <div class="txn-summary">
            <span class="txn-total-charge">Charges: <strong>-{{ totalCharges() | currency }}</strong></span>
            @if (totalPayments() > 0) {
              <span class="txn-total-payment">Payments: <strong>+{{ totalPayments() | currency }}</strong></span>
            }
            <span class="txn-count">{{ activityItems().length }} items</span>
          </div>
          <!-- Desktop table -->
          <div class="table-wrapper desktop-only">
            <table mat-table [dataSource]="activityItems()">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let item">
                  @if (item.kind === 'transaction') { {{ item.txn.date | date:'MMM d, y' }} }
                  @else { {{ item.movement.movementDate | date:'MMM d, y' }} }
                </td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let item">
                  @if (item.kind === 'transaction') {
                    <div class="txn-desc">
                      <span class="txn-name">{{ item.txn.description }}</span>
                      @if (item.txn.merchant) { <span class="txn-merchant">{{ item.txn.merchant }}</span> }
                    </div>
                  } @else {
                    <div class="txn-desc">
                      <span class="txn-name movement-flow-cell">
                        {{ item.movement.sourceName }} <mat-icon class="flow-arrow-inline">arrow_forward</mat-icon> {{ item.movement.destinationName }}
                      </span>
                      @if (item.movement.note) { <span class="txn-merchant">{{ item.movement.note }}</span> }
                    </div>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let item">
                  @if (item.kind === 'transaction') { {{ item.txn.categoryName || '—' }} }
                  @else { — }
                </td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let item">
                  @if (item.kind === 'transaction') {
                    <span class="type-badge"
                      [class.type-expense]="item.txn.transactionType === 'Expense'"
                      [class.type-refund]="item.txn.transactionType === 'Refund'"
                      [class.type-payment]="item.txn.transactionType === 'Payment'">
                      {{ item.txn.transactionType }}
                    </span>
                  } @else {
                    <span class="type-badge type-flow">
                      <mat-icon class="flow-badge-icon">sync_alt</mat-icon>
                      {{ movementLabel(item.movement.movementType) }}
                    </span>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let item"
                  [class.txn-charge]="(item.kind === 'transaction' && item.txn.transactionType === 'Expense') || (item.kind === 'movement' && !isMovementIncoming(item.movement))"
                  [class.txn-refund]="(item.kind === 'transaction' && item.txn.transactionType === 'Refund') || (item.kind === 'movement' && isMovementIncoming(item.movement))"
                  [class.txn-payment]="item.kind === 'transaction' && item.txn.transactionType === 'Payment'">
                  @if (item.kind === 'transaction') {
                    @if (item.txn.transactionType === 'Refund' || item.txn.transactionType === 'Payment') { +{{ item.txn.amount | currency }} }
                    @else { -{{ item.txn.amount | currency }} }
                  } @else {
                    @if (isMovementIncoming(item.movement)) { +{{ item.movement.amount | currency }} }
                    @else { -{{ item.movement.amount | currency }} }
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef>Balance</th>
                <td mat-cell *matCellDef="let item" class="balance-col"
                    [class.balance-positive]="item.balance <= 0"
                    [class.balance-negative]="item.balance > 0">
                  {{ item.balance | currency }}
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="txnColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: txnColumns;" [class.movement-row]="row.kind === 'movement'"></tr>
            </table>
          </div>
          <!-- Mobile list -->
          <div class="txn-mobile-list mobile-only">
            @for (item of activityItems(); track item.kind === 'transaction' ? 'txn-' + item.txn!.id : 'mv-' + item.movement!.id) {
              @if (item.kind === 'transaction') {
                <div class="txn-row">
                  <div class="txn-row-left">
                    <div class="txn-dot" [class.dot-refund]="item.txn!.transactionType === 'Refund'" [class.dot-payment]="item.txn!.transactionType === 'Payment'"></div>
                    <div>
                      <div class="txn-name">{{ item.txn!.description }}</div>
                      <div class="txn-meta">{{ item.txn!.date | date:'MMM d' }}{{ item.txn!.categoryName ? ' · ' + item.txn!.categoryName : '' }}{{ item.txn!.transactionType === 'Payment' ? ' · Payment' : '' }}</div>
                    </div>
                  </div>
                  <div class="txn-right-col">
                    <span [class.txn-charge]="item.txn!.transactionType === 'Expense'" [class.txn-refund]="item.txn!.transactionType === 'Refund'" [class.txn-payment]="item.txn!.transactionType === 'Payment'">
                      @if (item.txn!.transactionType === 'Refund' || item.txn!.transactionType === 'Payment') { +{{ item.txn!.amount | currency }} } @else { -{{ item.txn!.amount | currency }} }
                    </span>
                    <span class="txn-balance-mobile" [class.balance-positive]="item.balance <= 0" [class.balance-negative]="item.balance > 0">{{ item.balance | currency }}</span>
                  </div>
                </div>
              } @else {
                <div class="txn-row movement-mobile-row">
                  <div class="txn-row-left">
                    <div class="txn-dot dot-flow-card"></div>
                    <div>
                      <div class="txn-name">{{ movementLabel(item.movement!.movementType) }}</div>
                      <div class="txn-meta">
                        {{ item.movement!.movementDate | date:'MMM d' }} · {{ item.movement!.sourceName }} → {{ item.movement!.destinationName }}
                        @if (item.movement!.isAutoGenerated) { · Auto }
                      </div>
                    </div>
                  </div>
                  <div class="txn-right-col">
                    <span [class.txn-refund]="isMovementIncoming(item.movement!)" [class.txn-charge]="!isMovementIncoming(item.movement!)">
                      @if (isMovementIncoming(item.movement!)) { +{{ item.movement!.amount | currency }} }
                      @else { -{{ item.movement!.amount | currency }} }
                    </span>
                    <span class="txn-balance-mobile" [class.balance-positive]="item.balance <= 0" [class.balance-negative]="item.balance > 0">{{ item.balance | currency }}</span>
                  </div>
                </div>
              }
            }
          </div>
        </mat-card>
      } @else {
        <div class="empty-txn"><mat-icon>receipt_long</mat-icon><span>No activity for this period</span></div>
      }

      @if (paymentHistory().length > 0) {
        <h3>Payment History</h3>
        <mat-card class="history-card">
          <div class="history-summary">
            <span>Total Paid: <strong>{{ totalPaid() | currency }}</strong></span>
            <span class="history-count">{{ paymentHistory().length }} payments</span>
          </div>
          <div class="table-wrapper desktop-only">
            <table mat-table [dataSource]="paymentHistory()">
              <ng-container matColumnDef="paymentDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let p">{{ p.paymentDate | localDate:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="amountPaid">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let p" class="amount-cell">{{ p.amountPaid | currency }}</td>
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
          <div class="mobile-cards">
            @for (p of paymentHistory(); track p.id) {
              <div class="mobile-card" (click)="editPayment(p)">
                <div class="mobile-card-row">
                  <span class="mobile-card-date">{{ p.paymentDate | localDate:'mediumDate' }}</span>
                  <span class="mobile-card-amount amount-cell">{{ p.amountPaid | currency }}</span>
                </div>
                @if (p.fromAccountId) {
                  <div class="mobile-card-notes">From: {{ getAccountName(p.fromAccountId) }}</div>
                }
                @if (p.notes) {
                  <div class="mobile-card-notes">{{ p.notes }}</div>
                }
                <div class="mobile-card-actions">
                  <button mat-icon-button color="warn" (click)="deletePayment(p); $event.stopPropagation()" aria-label="Delete payment">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </mat-card>
      }

      @if (timeline().length > 0) {
        <h3>Payoff Timeline</h3>
        <mat-card>
          <div class="desktop-only">
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
          </div>
          <div class="mobile-cards">
            @for (entry of timeline(); track entry.month) {
              <div class="mobile-card timeline-card">
                <div class="mobile-card-row">
                  <span class="timeline-month">Month {{ entry.month }}</span>
                  <span class="timeline-balance">{{ entry.remainingBalance | currency }}</span>
                </div>
                <div class="mobile-card-date">{{ entry.date | date:'mediumDate' }}</div>
                <div class="timeline-details">
                  <div class="timeline-detail-item">
                    <span class="label">Payment</span>
                    <span>{{ entry.payment | currency }}</span>
                  </div>
                  <div class="timeline-detail-item">
                    <span class="label">Principal</span>
                    <span>{{ entry.principal | currency }}</span>
                  </div>
                  <div class="timeline-detail-item">
                    <span class="label">Interest</span>
                    <span class="interest-val">{{ entry.interest | currency }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </mat-card>
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
    .txn-charge { font-weight: 700; color: #c62828 !important; }
    .txn-refund { font-weight: 700; color: #2e7d32 !important; }
    .type-badge { font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); }
    .type-expense { background: #fce4ec; color: #c62828; }
    .type-refund { background: #e8f5e9; color: #2e7d32; }
    .type-payment { background: #e3f2fd; color: #1565c0; }
    .txn-payment { font-weight: 700; color: #1565c0 !important; }
    .txn-total-payment strong { color: var(--color-success); }
    .dot-payment { background: #1565c0 !important; }
    .type-flow {
      background: rgba(0,150,136,0.1); color: #00796b;
      display: inline-flex; align-items: center; gap: 3px;
    }
    .flow-badge-icon { font-size: 11px; width: 11px; height: 11px; }
    .movement-flow-cell { display: inline-flex; align-items: center; gap: 4px; }
    .flow-arrow-inline { font-size: 14px; width: 14px; height: 14px; opacity: 0.5; }
    .flow-amount { font-weight: 700; color: var(--color-stat-purple); }
    .movement-row { background: color-mix(in srgb, var(--color-stat-purple-bg) 20%, transparent); }
    .movement-mobile-row { border-left: 3px solid rgba(0,150,136,0.4); }
    .dot-flow-card { background: #00796b !important; }
    .balance-col { font-weight: 600; font-variant-numeric: tabular-nums; font-size: 0.85rem; }
    .balance-positive { color: #2e7d32 !important; }
    .balance-negative { color: #c62828 !important; }
    .txn-right-col { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
    .txn-balance-mobile { font-size: 0.68rem; color: var(--color-text-muted); font-weight: 500; font-variant-numeric: tabular-nums; }
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
    /* Mobile cards */
    .mobile-cards { display: none; }
    .mobile-card {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
    }
    .mobile-card:last-child { border-bottom: none; }
    .mobile-card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mobile-card-date {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }
    .mobile-card-amount {
      font-weight: 700;
      font-size: 1rem;
    }
    .mobile-card-notes {
      font-size: 0.8rem;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }
    .mobile-card-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 4px;
    }

    /* Timeline mobile cards */
    .timeline-month {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .timeline-balance {
      font-weight: 700;
      font-size: 0.95rem;
    }
    .timeline-details {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      font-size: 0.8rem;
    }
    .timeline-detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .timeline-detail-item .label {
      font-size: 0.65rem;
    }
    .interest-val {
      color: var(--color-danger, #f44336);
    }

    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-only { display: block !important; }
      .mobile-cards { display: block !important; }
      .txn-filters button {
        font-size: 0.7rem !important;
        padding: 0 8px !important;
        min-height: 44px !important;
        min-width: 44px !important;
      }
      .detail-actions button {
        min-height: 44px;
        min-width: 44px;
      }
      .detail-actions button[mat-icon-button],
      .mobile-card-actions button[mat-icon-button] {
        width: 44px;
        height: 44px;
      }
      .detail-actions button:active,
      .txn-filters button:active,
      .mobile-card:active,
      .mobile-card-actions button:active,
      .txn-row:active {
        opacity: 0.7;
        transition: opacity 0.1s ease;
      }
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
  private movementService = inject(MoneyMovementService);
  private dialog = inject(MatDialog);
  private paymentService = inject(PaymentService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private fundingSourceService = inject(FundingSourceService);

  card = signal<CreditCard | null>(null);
  timeline = signal<PayoffEntry[]>([]);
  paymentHistory = signal<PaymentHistory[]>([]);
  allTransactions = signal<DailyExpense[]>([]);
  allMovements = signal<MoneyMovement[]>([]);
  totalPaid = signal(0);
  loading = signal(true);
  txnMonth = signal<string | null>(null);

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

  allActivityCombined = computed<CardActivityItem[]>(() => {
    const cardId = this.card()?.id;
    const numCardId = cardId ? parseInt(cardId, 10) : undefined;
    const currentBal = this.card()?.currentBalance ?? 0;
    const txnIdSet = new Set(this.allTransactions().map(t => t.id));
    const payIdSet = new Set(this.paymentHistory().map(p => p.id));
    const txnItems = this.allCombined().map(t => ({ kind: 'transaction' as const, date: t.date, balance: 0, txn: t }));
    const mvItems = this.allMovements()
      .filter(m => (!m.relatedExpenseId || !txnIdSet.has(m.relatedExpenseId))
                 && (!m.relatedPaymentId || !payIdSet.has(m.relatedPaymentId)))
      .map(m => ({ kind: 'movement' as const, date: m.movementDate, balance: 0, movement: m }));
    const sorted = [...txnItems, ...mvItems].sort((a, b) => b.date.localeCompare(a.date));
    let bal = currentBal;
    for (const item of sorted) {
      item.balance = bal;
      bal -= this.getCardBalanceDelta(item, numCardId);
    }
    return sorted;
  });

  activityItems = computed(() => {
    const month = this.txnMonth();
    const all = this.allActivityCombined();
    if (!month) return all;
    return all.filter(item => item.date.slice(0, 7) === month);
  });

  totalCharges = computed(() =>
    this.activityItems()
      .filter(a => a.kind === 'transaction' && a.txn!.transactionType === 'Expense')
      .reduce((s, a) => s + a.txn!.amount, 0)
  );

  totalPayments = computed(() =>
    this.activityItems()
      .filter(a => a.kind === 'transaction' && a.txn!.transactionType === 'Payment')
      .reduce((s, a) => s + a.txn!.amount, 0)
  );

  availableMonths = computed(() => {
    const seen = new Set<string>();
    return this.allActivityCombined()
      .map(a => a.date.slice(0, 7))
      .filter(m => { if (seen.has(m)) return false; seen.add(m); return true; })
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 6)
      .map(key => ({ key, label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }));
  });

  timelineColumns = ['month', 'date', 'payment', 'principal', 'interest', 'remainingBalance'];
  paymentColumns = ['paymentDate', 'amountPaid', 'fromAccount', 'notes', 'actions'];
  private accountNameMap = new Map<number, string>();
  txnColumns = ['date', 'description', 'category', 'type', 'amount', 'balance'];

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
    this.fundingSourceService.getAll().subscribe(sources => {
      sources.filter(s => s.type === 'BankAccount').forEach(s => this.accountNameMap.set(s.id, s.name));
      this.cdr.detectChanges();
    });
  }

  loadCard(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const numId = parseInt(id, 10);
    this.cardService.getById(id).subscribe({
      next: (card) => {
        this.card.set(card);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
    this.cardService.getPayoffTimeline(id).subscribe({
      next: (entries) => { this.timeline.set(entries); this.cdr.detectChanges(); }
    });
    this.cardService.getPayments(id).subscribe({
      next: (payments) => {
        this.paymentHistory.set(payments);
        this.totalPaid.set(sumCurrency(payments.map(p => p.amountPaid)));
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      }
    });
    this.movementService.getAll({ entityType: 'CreditCard', entityId: numId }).subscribe({
      next: (movements) => {
        this.allMovements.set(movements);
        this.cdr.detectChanges();
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
    import('../../../shared/record-payment-dialog.component').then(m => {
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
    import('../../../shared/confirm-dialog.component').then(m => {
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
          error: () => { this.loading.set(false); this.notify.error('Failed to delete card'); this.cdr.detectChanges(); }
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
          message: `This will remove the $${payment.amountPaid.toFixed(2)} payment and add it back to the card balance.`,
          confirmText: 'Delete',
          color: 'warn'
        }
      });
      dialogRef.afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.paymentService.delete(payment.id).subscribe({
          next: () => {
            this.notify.success('Payment deleted — balance restored');
            this.loadCard();
          },
          error: () => this.notify.error('Failed to delete payment')
        });
      });
    });
  }

  editPayment(payment: PaymentHistory): void {
    import('../../../shared/record-payment-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.RecordPaymentDialogComponent, {
        width: '440px',
        data: {
          debtType: 'CreditCard',
          debtId: this.card()!.id,
          debtName: this.card()!.cardName,
          currentBalance: this.card()!.currentBalance,
          existingPayment: payment
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result) this.loadCard();
      });
    });
  }

  getAccountName(accountId?: number): string {
    if (!accountId) return 'External';
    return this.accountNameMap.get(accountId) || 'Unknown';
  }

  isMovementIncoming(m: MoneyMovement): boolean {
    const cardId = this.card()?.id ? parseInt(this.card()!.id, 10) : undefined;
    return m.destinationId === cardId;
  }

  private getCardBalanceDelta(item: CardActivityItem, cardId?: number): number {
    if (item.kind === 'transaction') {
      const t = item.txn!;
      switch (t.transactionType) {
        case 'Payment': case 'Refund': return -t.amount;
        default: return t.amount;
      }
    } else {
      const m = item.movement!;
      if (m.destinationId === cardId) return m.amount;
      if (m.sourceId === cardId) return -m.amount;
      return 0;
    }
  }

  movementLabel(type: MovementType): string {
    const labels: Record<string, string> = {
      LoanFunding: 'Funding', LoanPayment: 'Loan Payment', CardPayment: 'Card Payment',
      Transfer: 'Transfer', Deposit: 'Deposit', Withdrawal: 'Withdrawal',
      TradePnl: 'Trade P&L', TradeFee: 'Trade Fee'
    };
    return labels[type] || type;
  }
}
