import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { RecurringService } from '../../core/services/recurring.service';
import { RecurringTransaction } from '../../core/models/recurring.model';
import { NotificationService } from '../../core/services/notification.service';
import { RecurringDialogComponent } from './recurring-dialog.component';

@Component({
  selector: 'app-recurring-page',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    <div class="header-row">
      <h2><mat-icon class="section-icon">repeat</mat-icon> Recurring Transactions</h2>
      <button mat-raised-button color="primary" (click)="openAdd()">
        <mat-icon>add</mat-icon> Add Recurring
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (items().length === 0) {
      <mat-card class="empty-state">
        <mat-icon>repeat</mat-icon>
        <p>No recurring transactions yet. Set up auto-logging for paychecks, rent, subscriptions, etc.</p>
      </mat-card>
    } @else {
      <mat-card>
        <div class="table-wrapper">
        <table mat-table [dataSource]="items()">
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let r">
              <div class="desc-cell">
                <span class="cat-icon">{{ r.categoryIcon }}</span>
                <div>
                  <div class="desc-text">{{ r.description }}</div>
                  @if (r.merchant) { <div class="merchant-text">{{ r.merchant }}</div> }
                </div>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let r" class="amount">{{ r.amount | currency }}</td>
          </ng-container>

          <ng-container matColumnDef="frequency">
            <th mat-header-cell *matHeaderCellDef>Frequency</th>
            <td mat-cell *matCellDef="let r">
              <mat-chip>{{ r.frequency }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="nextRunDate">
            <th mat-header-cell *matHeaderCellDef>Next Run</th>
            <td mat-cell *matCellDef="let r">{{ r.nextRunDate | date:'mediumDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let r">
              <mat-chip [class.active-chip]="r.isActive" [class.inactive-chip]="!r.isActive">
                {{ r.isActive ? 'Active' : 'Paused' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button (click)="edit(r)" aria-label="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteItem(r)" aria-label="Delete">
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
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .header-row h2 { margin: 0; }
    mat-card { overflow: hidden; padding: 0 !important; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; min-width: 600px; }
    .amount { font-weight: 600; color: var(--color-primary); }
    .desc-cell { display: flex; align-items: center; gap: 8px; }
    .cat-icon { font-size: 1.2rem; }
    .desc-text { font-weight: 500; }
    .merchant-text { font-size: 0.8rem; color: var(--color-text-secondary); }
    .active-chip { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .inactive-chip { background-color: #fff3e0 !important; color: #e65100 !important; }
    .empty-state {
      text-align: center; padding: var(--spacing-xl) !important;
    }
    .empty-state mat-icon { font-size: 48px; height: 48px; width: 48px; opacity: 0.4; }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class RecurringPageComponent implements OnInit {
  private service = inject(RecurringService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  items = signal<RecurringTransaction[]>([]);
  loading = signal(true);
  displayedColumns = ['description', 'amount', 'frequency', 'nextRunDate', 'status', 'actions'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.service.getAll().subscribe({
      next: (items) => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openAdd(): void {
    const dialogRef = this.dialog.open(RecurringDialogComponent, {
      width: '600px', maxWidth: '95vw', data: null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.create(result).subscribe({
          next: () => { this.notify.success('Recurring transaction created'); this.loadData(); },
          error: (err) => this.notify.error(err.error?.message || 'Failed to create')
        });
      }
    });
  }

  edit(item: RecurringTransaction): void {
    const dialogRef = this.dialog.open(RecurringDialogComponent, {
      width: '600px', maxWidth: '95vw', data: item
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.update(item.id, result).subscribe({
          next: () => { this.notify.success('Recurring transaction updated'); this.loadData(); },
          error: (err) => this.notify.error(err.error?.message || 'Failed to update')
        });
      }
    });
  }

  deleteItem(item: RecurringTransaction): void {
    if (!this.notify.confirmDelete(item.description)) return;
    this.service.delete(item.id).subscribe({
      next: () => { this.notify.success('Recurring transaction deleted'); this.loadData(); },
      error: (err) => this.notify.error(err.error?.message || 'Failed to delete')
    });
  }
}
