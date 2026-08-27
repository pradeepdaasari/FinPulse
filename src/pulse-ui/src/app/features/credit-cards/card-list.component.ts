import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CreditCardService } from '../../core/services/credit-card.service';
import { CreditCard } from '../../core/models/credit-card.model';
import { NotificationService } from '../../core/services/notification.service';
import { AddCardDialogComponent } from './add-card-dialog.component';
import { UpdateBalanceDialogComponent } from './update-balance-dialog.component';
import { RecordPaymentDialogComponent } from '../../shared/record-payment-dialog.component';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatTooltipModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAddCard()">
        <mat-icon>add</mat-icon> Add Card
      </button>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (cards().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap purple">
          <mat-icon>credit_card</mat-icon>
        </div>
        <h3>Add your credit cards</h3>
        <p>Track balances, payments, and interest to take control of your card debt.</p>
        <button mat-raised-button color="primary" (click)="openAddCard()">
          <mat-icon>add</mat-icon> Add Card
        </button>
      </div>
    } @else {
      <!-- Summary Stats -->
      <div class="stats-row">
        <div class="stat-card stat-red">
          <mat-icon>credit_card</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ totalBalance() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="stat-label">Total Balance</span>
          </div>
        </div>
        <div class="stat-card stat-green">
          <mat-icon>account_balance_wallet</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ totalLimit() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="stat-label">Total Credit</span>
          </div>
        </div>
        <div class="stat-card stat-blue">
          <mat-icon>donut_small</mat-icon>
          <div class="stat-content">
            <span class="stat-value" [class.util-text-healthy]="avgUtilization() <= 30" [class.util-text-warning]="avgUtilization() > 30 && avgUtilization() <= 70" [class.util-text-danger]="avgUtilization() > 70">{{ avgUtilization() | number:'1.0-0' }}%</span>
            <span class="stat-label">Avg Utilization</span>
          </div>
        </div>
        <div class="stat-card stat-amber">
          <mat-icon>event</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ totalMinPayment() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="stat-label">Min Payments</span>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <mat-card class="desktop-only">
        <div class="table-wrapper">
        <table mat-table [dataSource]="cards()">
          <ng-container matColumnDef="cardName">
            <th mat-header-cell *matHeaderCellDef>Card Name</th>
            <td mat-cell *matCellDef="let card">
              <div class="card-name-cell">
                <mat-icon class="card-brand-icon" [style.color]="getCardColor(card)">credit_card</mat-icon>
                <span class="card-name-text">{{ card.cardName }}</span>
                @if (isPromoActive(card)) {
                  <span class="promo-pill">PROMO</span>
                }
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="currentBalance">
            <th mat-header-cell *matHeaderCellDef>Balance</th>
            <td mat-cell *matCellDef="let card">
              <span class="value-balance">{{ card.currentBalance | currency }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="utilization">
            <th mat-header-cell *matHeaderCellDef>Utilization</th>
            <td mat-cell *matCellDef="let card">
              <div class="util-cell">
                <div class="util-bar">
                  <div class="util-fill" [style.width.%]="getUtilization(card)" [class]="getUtilColor(card)"></div>
                </div>
                <span class="util-pct" [class]="'pct-' + getUtilColor(card)">{{ getUtilization(card) | number:'1.0-0' }}%</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="aprPercent">
            <th mat-header-cell *matHeaderCellDef>APR</th>
            <td mat-cell *matCellDef="let card">
              <span class="apr-badge" [class.apr-high]="card.aprPercent >= 20" [class.apr-mid]="card.aprPercent >= 10 && card.aprPercent < 20" [class.apr-low]="card.aprPercent < 10">
                {{ card.aprPercent }}%
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="minimumPayment">
            <th mat-header-cell *matHeaderCellDef>Min Payment</th>
            <td mat-cell *matCellDef="let card">
              <span class="value-monthly">{{ card.minimumPayment | currency }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="dueDay">
            <th mat-header-cell *matHeaderCellDef>Due Day</th>
            <td mat-cell *matCellDef="let card">
              <span class="due-badge">{{ card.dueDay }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="promoEndDate">
            <th mat-header-cell *matHeaderCellDef>Promo Ends</th>
            <td mat-cell *matCellDef="let card">
              @if (isPromoActive(card)) {
                <span class="promo-date">{{ card.promoEndDate | date:'MMM d, y' }}</span>
              } @else {
                <span class="no-promo">—</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let card">
              <div class="action-group">
                <button mat-icon-button class="action-btn action-pay" (click)="recordPayment(card)" matTooltip="Record Payment">
                  <mat-icon>payments</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-edit" (click)="updateBalance(card)" matTooltip="Update Balance">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-view" (click)="viewCard(card.id)" matTooltip="View Details">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-delete" (click)="deleteCard(card)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"
              [class.row-healthy]="getUtilization(row) <= 30"
              [class.row-warning]="getUtilization(row) > 30 && getUtilization(row) <= 70"
              [class.row-danger]="getUtilization(row) > 70"></tr>
        </table>
        </div>
      </mat-card>

      <!-- Mobile cards -->
      <div class="mobile-cards">
        @for (card of cards(); track card.id) {
          <div class="cc-card" [class.card-healthy]="getUtilization(card) <= 30" [class.card-warning]="getUtilization(card) > 30 && getUtilization(card) <= 70" [class.card-danger]="getUtilization(card) > 70" (click)="viewCard(card.id)">
            <div class="cc-top">
              <div class="cc-icon" [style.background]="getCardIconBg(card)">
                <mat-icon [style.color]="getCardColor(card)">credit_card</mat-icon>
              </div>
              <div class="cc-info">
                <span class="cc-name">{{ card.cardName }}</span>
                <span class="cc-meta">Due day {{ card.dueDay }}
                  @if (isPromoActive(card)) {
                    · <span class="cc-promo">PROMO</span>
                  }
                </span>
              </div>
              <div class="cc-balance">
                <span class="cc-amount">{{ card.currentBalance | currency }}</span>
                <span class="cc-limit">of {{ card.creditLimit | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            </div>
            <div class="cc-util-row">
              <div class="cc-util-bar">
                <div class="cc-util-fill" [style.width.%]="getUtilization(card)" [class]="getUtilColor(card)"></div>
              </div>
              <span class="cc-util-pct" [class]="'pct-' + getUtilColor(card)">{{ getUtilization(card) | number:'1.0-0' }}%</span>
            </div>
            <div class="cc-detail-row">
              <span class="cc-detail-item">
                <span class="detail-label">APR</span>
                <span class="apr-badge" [class.apr-high]="card.aprPercent >= 20" [class.apr-mid]="card.aprPercent >= 10 && card.aprPercent < 20" [class.apr-low]="card.aprPercent < 10">{{ card.aprPercent }}%</span>
              </span>
              <span class="cc-detail-item">
                <span class="detail-label">Min Payment</span>
                <span class="detail-value">{{ card.minimumPayment | currency }}</span>
              </span>
            </div>
            <div class="cc-actions" (click)="$event.stopPropagation()">
              <button mat-icon-button class="action-btn action-pay" (click)="recordPayment(card)">
                <mat-icon>payments</mat-icon>
              </button>
              <button mat-icon-button class="action-btn action-edit" (click)="updateBalance(card)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button class="action-btn action-delete" (click)="deleteCard(card)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    .header-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    /* Summary Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .stat-card mat-icon {
      font-size: 28px; width: 28px; height: 28px;
      padding: 10px;
      border-radius: 12px;
    }
    .stat-red mat-icon { color: var(--color-stat-red); background: var(--color-stat-red-bg); }
    .stat-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.2rem; font-weight: 700; color: var(--color-text); }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }
    .util-text-healthy { color: var(--color-success) !important; }
    .util-text-warning { color: var(--color-warning) !important; }
    .util-text-danger { color: var(--color-danger) !important; }

    /* Table */
    mat-card {
      overflow: hidden;
      padding: 0 !important;
    }
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table { width: 100%; min-width: 550px; }
    tr.mat-mdc-row { border-left: 3px solid transparent; }
    tr.row-healthy { border-left-color: var(--color-success); }
    tr.row-warning { border-left-color: var(--color-warning); }
    tr.row-danger { border-left-color: var(--color-danger); }

    .card-name-cell { display: flex; align-items: center; gap: 8px; }
    .card-brand-icon { font-size: 20px; width: 20px; height: 20px; }
    .card-name-text { font-weight: 500; }
    .promo-pill {
      font-size: 0.6rem; font-weight: 700;
      padding: 2px 6px; border-radius: var(--radius-full);
      background: var(--color-success-bg); color: var(--color-success);
    }
    .value-balance { font-weight: 700; color: var(--color-text); }
    .value-monthly { font-weight: 600; color: var(--color-primary); }
    .no-promo { color: var(--color-text-muted); }
    .promo-date { color: var(--color-success); font-weight: 500; font-size: 0.85rem; }
    .due-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 8px;
      background: var(--color-stat-blue-bg); font-weight: 700; font-size: 0.85rem;
      color: var(--color-primary);
    }

    /* APR Badge */
    .apr-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: var(--radius-full);
    }
    .apr-low { background: var(--color-apr-low-bg); color: var(--color-apr-low); }
    .apr-mid { background: var(--color-apr-mid-bg); color: var(--color-apr-mid); }
    .apr-high { background: var(--color-apr-high-bg); color: var(--color-apr-high); }

    /* Utilization */
    .util-cell { display: flex; align-items: center; gap: 8px; }
    .util-bar {
      width: 60px; height: 6px;
      background: var(--color-border);
      border-radius: 3px; overflow: hidden;
    }
    .util-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
    .util-green { background: var(--color-success); }
    .util-orange { background: var(--color-warning); }
    .util-red { background: var(--color-danger); }
    .util-pct { font-size: 12px; font-weight: 600; min-width: 32px; }
    .pct-util-green { color: var(--color-success); }
    .pct-util-orange { color: var(--color-warning); }
    .pct-util-red { color: var(--color-danger); }

    /* Action Buttons */
    .action-group { display: flex; gap: 2px; }
    .action-btn { width: 34px; height: 34px; border-radius: 8px !important; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-pay { color: var(--color-action-pay) !important; }
    .action-pay:hover { background: var(--color-action-pay-bg) !important; }
    .action-edit { color: var(--color-action-edit) !important; }
    .action-edit:hover { background: var(--color-action-edit-bg) !important; }
    .action-view { color: var(--color-action-view) !important; }
    .action-view:hover { background: var(--color-action-view-bg) !important; }
    .action-delete { color: var(--color-action-delete) !important; }
    .action-delete:hover { background: var(--color-action-delete-bg) !important; }

    /* Mobile Cards */
    .mobile-cards { display: none; }
    .cc-card {
      background: var(--color-surface);
      border-radius: var(--radius-md);
      margin-bottom: 10px;
      padding: 16px 14px 10px;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: box-shadow var(--transition-fast);
      border-left: 3px solid transparent;
    }
    .cc-card.card-healthy { border-left-color: var(--color-success); }
    .cc-card.card-warning { border-left-color: var(--color-warning); }
    .cc-card.card-danger { border-left-color: var(--color-danger); }
    .cc-card:active { box-shadow: var(--shadow-md); }
    .cc-top { display: flex; align-items: center; gap: 12px; }
    .cc-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .cc-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .cc-info { flex: 1; min-width: 0; }
    .cc-name { display: block; font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cc-meta { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .cc-promo { color: var(--color-success); font-weight: 600; }
    .cc-balance { text-align: right; }
    .cc-amount { display: block; font-weight: 700; font-size: 1.05rem; }
    .cc-limit { display: block; font-size: 0.7rem; color: var(--color-text-muted); }
    .cc-util-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 0 4px;
    }
    .cc-util-bar {
      flex: 1; height: 6px;
      background: var(--color-border);
      border-radius: 3px; overflow: hidden;
    }
    .cc-util-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
    .cc-util-pct { font-size: 12px; font-weight: 700; min-width: 32px; text-align: right; }
    .cc-detail-row {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid var(--color-border);
    }
    .cc-detail-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .detail-label { font-size: 0.65rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 0.82rem; font-weight: 600; color: var(--color-text); }
    .cc-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0;
      margin-top: 8px;
    }

    /* Empty State */
    .empty-state { text-align: center; padding: 48px 24px; }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .empty-icon-wrap.purple { background: var(--color-stat-purple-bg); }
    .empty-icon-wrap.purple mat-icon { color: var(--color-stat-purple); font-size: 32px; width: 32px; height: 32px; }

    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px 10px; gap: 8px; }
      .stat-card mat-icon { font-size: 22px; width: 22px; height: 22px; padding: 8px; border-radius: 10px; }
      .stat-value { font-size: 1rem; }
      table { min-width: 0; }
      .mat-column-apr,
      .mat-column-promoApr,
      .mat-column-minimumPayment { display: none; }
      .util-bar { width: 40px; }
    }

  `]
})
export class CardListComponent implements OnInit {
  private cardService = inject(CreditCardService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  cards = signal<CreditCard[]>([]);
  loading = signal(true);
  displayedColumns = ['cardName', 'currentBalance', 'utilization', 'aprPercent', 'minimumPayment', 'dueDay', 'promoEndDate', 'actions'];

  totalBalance = computed(() => this.cards().reduce((sum, c) => sum + c.currentBalance, 0));
  totalLimit = computed(() => this.cards().reduce((sum, c) => sum + (c.creditLimit || 0), 0));
  totalMinPayment = computed(() => this.cards().reduce((sum, c) => sum + c.minimumPayment, 0));
  avgUtilization = computed(() => {
    const cards = this.cards();
    if (!cards.length) return 0;
    const totalUtil = cards.reduce((sum, c) => sum + this.getUtilization(c), 0);
    return Math.round(totalUtil / cards.length);
  });

  ngOnInit(): void {
    this.loadCards();
  }

  loadCards(): void {
    this.cardService.getAll().subscribe({
      next: (cards) => {
        this.cards.set(cards);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  getUtilization(card: CreditCard): number {
    if (!card.creditLimit || card.creditLimit === 0) return 0;
    return Math.min(100, (card.currentBalance / card.creditLimit) * 100);
  }

  getUtilColor(card: CreditCard): string {
    const util = this.getUtilization(card);
    if (util > 70) return 'util-red';
    if (util > 30) return 'util-orange';
    return 'util-green';
  }

  isPromoActive(card: CreditCard): boolean {
    if (!card.promoEndDate) return false;
    return new Date(card.promoEndDate) > new Date();
  }

  viewCard(id: string): void {
    this.router.navigate(['/cards', id]);
  }

  recordPayment(card: CreditCard): void {
    const dialogRef = this.dialog.open(RecordPaymentDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {
        debtId: card.id,
        debtName: card.cardName,
        debtType: 'CreditCard',
        currentBalance: card.currentBalance,
        minimumPayment: card.minimumPayment
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Payment recorded successfully');
        this.loadCards();
      }
    });
  }

  updateBalance(card: CreditCard): void {
    const dialogRef = this.dialog.open(UpdateBalanceDialogComponent, {
      width: '420px',
      maxWidth: '95vw',
      data: card
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Balance updated successfully');
        this.loadCards();
      }
    });
  }

  deleteCard(card: CreditCard): void {
    if (!this.notify.confirmDelete(card.cardName)) return;
    this.cardService.delete(card.id).subscribe(() => {
      this.notify.success('Card deleted successfully');
      this.loadCards();
    });
  }

  openAddCard(): void {
    const dialogRef = this.dialog.open(AddCardDialogComponent, {
      width: '600px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Card added successfully');
        this.loadCards();
      }
    });
  }

  getCardColor(card: CreditCard): string {
    const util = this.getUtilization(card);
    if (util > 70) return '#FF3B30';
    if (util > 30) return '#FF9500';
    return '#007AFF';
  }

  getCardIconBg(card: CreditCard): string {
    const util = this.getUtilization(card);
    if (util > 70) return 'rgba(255,59,48,0.1)';
    if (util > 30) return 'rgba(255,149,0,0.1)';
    return 'rgba(0,122,255,0.1)';
  }
}
