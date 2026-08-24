import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, CurrencyPipe],
  template: `
    <div class="header-row">
      <h2>My Credit Cards</h2>
      <button mat-raised-button color="primary" (click)="openAddCard()">
        <mat-icon>add</mat-icon> Add Card
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else {
      <mat-card>
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

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let card">
              <button mat-icon-button (click)="recordPayment(card)" aria-label="Record Payment">
                <mat-icon>price_check</mat-icon>
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
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        </div>
      </mat-card>
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
    mat-card {
      overflow: hidden;
      padding: 0 !important;
    }
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table { width: 100%; min-width: 550px; }
    .promo-chip {
      margin-left: 8px;
      font-size: 10px;
    }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
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
  displayedColumns = ['cardName', 'currentBalance', 'aprPercent', 'minimumPayment', 'dueDay', 'actions'];

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
        currentBalance: card.currentBalance
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
