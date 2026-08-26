import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { RecurringService } from '../../core/services/recurring.service';
import { RecurringTransaction } from '../../core/models/recurring.model';
import { NotificationService } from '../../core/services/notification.service';
import { RecurringDialogComponent } from './recurring-dialog.component';

@Component({
  selector: 'app-recurring-page',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, MatSlideToggleModule, CurrencyPipe, DatePipe],
  template: `
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAdd()">
        <mat-icon>add</mat-icon> Add Recurring
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (items().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap amber">
          <mat-icon>repeat</mat-icon>
        </div>
        <h3>Automate your tracking</h3>
        <p>Set up recurring transactions so your regular bills and subscriptions are logged automatically.</p>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Recurring
        </button>
      </div>
    } @else {
      <mat-card>
        <div class="table-wrapper">
        <table mat-table [dataSource]="items()">
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let r">
              <div class="desc-cell">
                <mat-icon class="cat-icon">{{ r.categoryIcon }}</mat-icon>
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
              <span class="freq-badge" [class.freq-daily]="r.frequency === 'Daily'"
                    [class.freq-weekly]="r.frequency === 'Weekly'"
                    [class.freq-biweekly]="r.frequency === 'Biweekly'"
                    [class.freq-monthly]="r.frequency === 'Monthly'"
                    [class.freq-yearly]="r.frequency === 'Yearly'">{{ r.frequency }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="nextRunDate">
            <th mat-header-cell *matHeaderCellDef>Next Run</th>
            <td mat-cell *matCellDef="let r">{{ r.nextRunDate | date:'mediumDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let r">
              <mat-slide-toggle
                [checked]="r.isActive"
                (change)="toggleStatus(r)"
                [aria-label]="r.isActive ? 'Pause ' + r.description : 'Activate ' + r.description"
                color="primary">
                <span class="toggle-label">{{ r.isActive ? 'Active' : 'Paused' }}</span>
              </mat-slide-toggle>
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
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    mat-card { overflow: hidden; padding: 0 !important; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; min-width: 600px; }
    .amount { font-weight: 600; color: var(--color-primary); }
    .desc-cell { display: flex; align-items: center; gap: 8px; }
    .cat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .desc-text { font-weight: 500; }
    .merchant-text { font-size: 0.8rem; color: var(--color-text-secondary); }
    .toggle-label { font-size: var(--text-xs); font-weight: 500; }
    .freq-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }
    .freq-daily { background: rgba(230,81,0,0.1); color: #e65100; }
    .freq-weekly { background: rgba(21,101,192,0.1); color: #1565c0; }
    .freq-biweekly { background: rgba(0,105,92,0.1); color: #00695c; }
    .freq-monthly { background: rgba(106,27,154,0.1); color: #6a1b9a; }
    .freq-yearly { background: rgba(46,125,50,0.1); color: #2e7d32; }
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

  toggleStatus(item: RecurringTransaction): void {
    const updated = {
      description: item.description,
      merchant: item.merchant,
      amount: item.amount,
      categoryId: item.categoryId,
      transactionType: this.transactionTypeToNumber(item.transactionType),
      fundingSourceType: item.fundingSourceType ? this.fundingSourceToNumber(item.fundingSourceType) : undefined,
      fundingSourceId: item.fundingSourceId,
      frequency: this.frequencyToNumber(item.frequency),
      nextRunDate: item.nextRunDate,
      endDate: item.endDate,
      isActive: !item.isActive
    };
    this.service.update(item.id, updated as any).subscribe({
      next: () => {
        this.notify.success(item.isActive ? 'Paused' : 'Activated');
        this.loadData();
      },
      error: () => this.notify.error('Failed to update status')
    });
  }

  private frequencyToNumber(freq: string): number {
    const map: Record<string, number> = { Daily: 0, Weekly: 1, Biweekly: 2, Monthly: 3 };
    return map[freq] ?? 3;
  }

  private transactionTypeToNumber(type: string): number {
    const map: Record<string, number> = { Expense: 0, Income: 1, Transfer: 2, Refund: 3, CardPayment: 4 };
    return map[type] ?? 0;
  }

  private fundingSourceToNumber(type: string): number {
    const map: Record<string, number> = { BankAccount: 0, CreditCard: 1 };
    return map[type] ?? 0;
  }

  deleteItem(item: RecurringTransaction): void {
    this.notify.confirmDeleteAsync(item.description).subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(item.id).subscribe({
        next: () => { this.notify.success('Recurring transaction deleted'); this.loadData(); },
        error: (err) => this.notify.error(err.error?.message || 'Failed to delete')
      });
    });
  }
}
