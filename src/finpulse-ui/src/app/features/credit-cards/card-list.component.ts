import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
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
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, DecimalPipe],
  template: `
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAddCard()">
        <mat-icon>add</mat-icon> Add Card
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
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
      <!-- Desktop table -->
      <mat-card class="desktop-only">
        <div class="table-wrapper">
        <table mat-table [dataSource]="cards()">
          <ng-container matColumnDef="cardName">
            <th mat-header-cell *matHeaderCellDef>Card Name</th>
            <td mat-cell *matCellDef="let card">
              {{ card.cardName }}
              @if (isPromoActive(card)) {
                <mat-chip class="promo-chip">PROMO</mat-chip>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="currentBalance">
            <th mat-header-cell *matHeaderCellDef>Balance</th>
            <td mat-cell *matCellDef="let card">{{ card.currentBalance | currency }}</td>
          </ng-container>

          <ng-container matColumnDef="utilization">
            <th mat-header-cell *matHeaderCellDef>Utilization</th>
            <td mat-cell *matCellDef="let card">
              <div class="util-cell">
                <div class="util-bar">
                  <div class="util-fill" [style.width.%]="getUtilization(card)" [class]="getUtilColor(card)"></div>
                </div>
                <span class="util-pct">{{ getUtilization(card) | number:'1.0-0' }}%</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="aprPercent">
            <th mat-header-cell *matHeaderCellDef>APR</th>
            <td mat-cell *matCellDef="let card">{{ card.aprPercent }}%</td>
          </ng-container>

          <ng-container matColumnDef="minimumPayment">
            <th mat-header-cell *matHeaderCellDef>Min Payment</th>
            <td mat-cell *matCellDef="let card">{{ card.minimumPayment | currency }}</td>
          </ng-container>

          <ng-container matColumnDef="dueDay">
            <th mat-header-cell *matHeaderCellDef>Due Day</th>
            <td mat-cell *matCellDef="let card">{{ card.dueDay }}</td>
          </ng-container>

          <ng-container matColumnDef="promoEndDate">
            <th mat-header-cell *matHeaderCellDef>Promo Ends</th>
            <td mat-cell *matCellDef="let card">
              @if (isPromoActive(card)) {
                {{ card.promoEndDate | date:'MMM d, y' }}
              } @else {
                <span class="no-promo">—</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let card">
              <button mat-icon-button (click)="recordPayment(card)" aria-label="Record Payment">
                <mat-icon>payments</mat-icon>
              </button>
              <button mat-icon-button (click)="updateBalance(card)" aria-label="Update Balance">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="viewCard(card.id)" aria-label="View">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteCard(card)" aria-label="Delete">
                <mat-icon>delete</mat-icon>
              </button>
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
          <div class="cc-card" (click)="viewCard(card.id)">
            <div class="cc-top">
              <div class="cc-icon">
                <mat-icon>credit_card</mat-icon>
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
              </div>
            </div>
            <div class="cc-util-row">
              <div class="cc-util-bar">
                <div class="cc-util-fill" [style.width.%]="getUtilization(card)" [class]="getUtilColor(card)"></div>
              </div>
              <span class="cc-util-pct">{{ getUtilization(card) | number:'1.0-0' }}%</span>
            </div>
            <div class="cc-actions" (click)="$event.stopPropagation()">
              <button mat-icon-button (click)="recordPayment(card)" aria-label="Record Payment">
                <mat-icon>payments</mat-icon>
              </button>
              <button mat-icon-button (click)="updateBalance(card)" aria-label="Update Balance">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteCard(card)" aria-label="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
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
    tr.row-healthy { border-left-color: #4caf50; }
    tr.row-warning { border-left-color: #ff9800; }
    tr.row-danger { border-left-color: #f44336; }
    .promo-chip {
      margin-left: 8px;
      font-size: 10px;
    }
    .no-promo { color: var(--color-text-muted); }
    .util-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .util-bar {
      width: 60px;
      height: 6px;
      background: var(--color-border);
      border-radius: 3px;
      overflow: hidden;
    }
    .util-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .util-green { background: #4caf50; }
    .util-orange { background: #ff9800; }
    .util-red { background: #f44336; }
    .util-pct {
      font-size: 12px;
      font-weight: 600;
      min-width: 32px;
    }
    .mobile-cards { display: none; }
    .cc-card {
      background: var(--color-surface);
      border-radius: var(--radius-sm);
      margin-bottom: 8px;
      padding: 14px 12px 8px;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: box-shadow var(--transition-fast);
    }
    .cc-card:active { box-shadow: var(--shadow-md); }
    .cc-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .cc-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--gradient-icon-purple, linear-gradient(135deg, #e8daef 0%, #d2b4de 100%));
    }
    .cc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .cc-info { flex: 1; min-width: 0; }
    .cc-name { display: block; font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cc-meta { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .cc-promo { color: #4caf50; font-weight: 600; }
    .cc-balance { text-align: right; }
    .cc-amount { font-weight: 700; font-size: 1rem; }
    .cc-util-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      padding: 0 4px;
    }
    .cc-util-bar {
      flex: 1;
      height: 6px;
      background: var(--color-border);
      border-radius: 3px;
      overflow: hidden;
    }
    .cc-util-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .cc-util-pct { font-size: 12px; font-weight: 600; min-width: 32px; text-align: right; }
    .cc-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0;
      margin-top: 4px;
    }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
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
}
