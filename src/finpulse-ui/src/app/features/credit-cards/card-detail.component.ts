import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CreditCardService } from '../../core/services/credit-card.service';
import { NotificationService } from '../../core/services/notification.service';
import { CreditCard } from '../../core/models/credit-card.model';
import { PayoffEntry } from '../../core/models/dashboard.model';
import { PaymentHistory } from '../../core/models/payment-history.model';
import { sumCurrency } from '../../core/utils/currency';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatTooltipModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    @if (loading()) {
      <mat-spinner></mat-spinner>
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
                <span class="value">{{ card()!.promoEndDate | date:'mediumDate' }}</span>
              </div>
            }
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
                <td mat-cell *matCellDef="let p">{{ p.paymentDate | date:'mediumDate' }}</td>
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
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class CardDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cardService = inject(CreditCardService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  card = signal<CreditCard | null>(null);
  timeline = signal<PayoffEntry[]>([]);
  paymentHistory = signal<PaymentHistory[]>([]);
  totalPaid = signal(0);
  loading = signal(true);
  timelineColumns = ['month', 'date', 'payment', 'principal', 'interest', 'remainingBalance'];
  paymentColumns = ['paymentDate', 'amountPaid', 'notes'];

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
  }

  goBack(): void {
    this.router.navigate(['/cards']);
  }

  recordPayment(): void {
    import('../../shared/record-payment-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.RecordPaymentDialogComponent, {
        width: '440px',
        data: { debtType: 'CreditCard', debtId: this.card()!.id, debtName: this.card()!.cardName, amount: this.card()!.minimumPayment }
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
        data: { card: this.card() }
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
        this.cardService.delete(this.card()!.id).subscribe({
          next: () => {
            this.notify.success('Card deleted');
            this.router.navigate(['/cards']);
          },
          error: () => this.notify.error('Failed to delete card')
        });
      });
    });
  }
}
