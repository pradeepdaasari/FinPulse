import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
      <!-- Summary Stats -->
      <div class="stats-row">
        <div class="stat-card stat-blue">
          <mat-icon>repeat</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ items().length }}</span>
            <span class="stat-label">Total Recurring</span>
          </div>
        </div>
        <div class="stat-card stat-green">
          <mat-icon>check_circle</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card stat-amber">
          <mat-icon>payments</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ monthlyTotal() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="stat-label">Monthly Total</span>
          </div>
        </div>
        <div class="stat-card stat-purple">
          <mat-icon>pause_circle</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ pausedCount() }}</span>
            <span class="stat-label">Paused</span>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <mat-card class="desktop-only">
        <div class="table-wrapper">
        <table mat-table [dataSource]="items()">
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let r">
              <div class="desc-cell">
                <div class="cat-icon-wrap">
                  <mat-icon class="cat-icon">{{ r.categoryIcon }}</mat-icon>
                </div>
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
                    >{{ r.frequency }}</span>
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
              <div class="action-group">
                <button mat-icon-button class="action-btn action-edit" (click)="edit(r)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-delete" (click)="deleteItem(r)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        </div>
      </mat-card>

      <!-- Mobile cards -->
      <div class="mobile-cards">
        @for (r of items(); track r.id) {
          <div class="rec-card" [class.rec-paused]="!r.isActive">
            <div class="rec-top">
              <div class="rec-icon-wrap">
                <mat-icon>{{ r.categoryIcon }}</mat-icon>
              </div>
              <div class="rec-info">
                <span class="rec-name">{{ r.description }}</span>
                @if (r.merchant) { <span class="rec-merchant">{{ r.merchant }}</span> }
              </div>
              <div class="rec-amount-col">
                <span class="rec-amount">{{ r.amount | currency }}</span>
                <span class="freq-badge" [class.freq-daily]="r.frequency === 'Daily'" [class.freq-weekly]="r.frequency === 'Weekly'" [class.freq-biweekly]="r.frequency === 'Biweekly'" [class.freq-monthly]="r.frequency === 'Monthly'" >{{ r.frequency }}</span>
              </div>
            </div>
            <div class="rec-bottom">
              <span class="rec-next">Next: {{ r.nextRunDate | date:'MMM d' }}</span>
              <div class="rec-actions">
                <mat-slide-toggle [checked]="r.isActive" (change)="toggleStatus(r)" color="primary"></mat-slide-toggle>
                <button mat-icon-button class="action-btn action-edit" (click)="edit(r)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-delete" (click)="deleteItem(r)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }

    /* Summary Stats */
    .stats-row {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm); margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px; padding: 16px;
      border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-sm);
    }
    .stat-card mat-icon {
      font-size: 28px; width: 28px; height: 28px; padding: 10px; border-radius: 12px;
    }
    .stat-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-purple mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.2rem; font-weight: 700; color: var(--color-text); }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }

    mat-card { overflow: hidden; padding: 0 !important; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 600px; }
    .amount { font-weight: 700; color: var(--color-primary); }
    .desc-cell { display: flex; align-items: center; gap: 10px; }
    .cat-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-blue-bg);
    }
    .cat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); }
    .desc-text { font-weight: 500; }
    .merchant-text { font-size: 0.8rem; color: var(--color-text-secondary); }
    .toggle-label { font-size: var(--text-xs); font-weight: 500; }
    .freq-badge {
      display: inline-block; font-size: 0.68rem; font-weight: 700;
      padding: 3px 10px; border-radius: var(--radius-full); white-space: nowrap;
    }
    .freq-daily { background: var(--color-freq-daily-bg); color: var(--color-freq-daily); }
    .freq-weekly { background: var(--color-freq-weekly-bg); color: var(--color-freq-weekly); }
    .freq-biweekly { background: var(--color-freq-biweekly-bg); color: var(--color-freq-biweekly); }
    .freq-monthly { background: var(--color-freq-monthly-bg); color: var(--color-freq-monthly); }

    /* Action Buttons */
    .action-group { display: flex; gap: 2px; }
    .action-btn { width: 34px; height: 34px; border-radius: 8px !important; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-edit { color: var(--color-action-edit) !important; }
    .action-edit:hover { background: var(--color-action-edit-bg) !important; }
    .action-delete { color: var(--color-action-delete) !important; }
    .action-delete:hover { background: var(--color-action-delete-bg) !important; }

    /* Mobile Cards */
    .mobile-cards { display: none; }
    .rec-card {
      background: var(--color-surface); border-radius: var(--radius-md);
      margin-bottom: 10px; padding: 14px; box-shadow: var(--shadow-sm);
      border-left: 3px solid var(--color-success);
    }
    .rec-card.rec-paused { border-left-color: var(--color-border); opacity: 0.7; }
    .rec-top { display: flex; align-items: center; gap: 12px; }
    .rec-icon-wrap {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-blue-bg);
    }
    .rec-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .rec-info { flex: 1; min-width: 0; }
    .rec-name { display: block; font-weight: 600; font-size: 0.9rem; }
    .rec-merchant { display: block; font-size: 0.72rem; color: var(--color-text-muted); }
    .rec-amount-col { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .rec-amount { font-weight: 700; font-size: 1rem; color: var(--color-primary); }
    .rec-bottom {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--color-border);
    }
    .rec-next { font-size: 0.75rem; color: var(--color-text-muted); }
    .rec-actions { display: flex; align-items: center; gap: 2px; }

    /* Empty State */
    .empty-state { text-align: center; padding: 48px 24px; }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-icon-wrap.amber { background: var(--color-stat-amber-bg); }
    .empty-icon-wrap.amber mat-icon { color: var(--color-stat-amber); font-size: 32px; width: 32px; height: 32px; }

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

  activeCount = computed(() => this.items().filter(i => i.isActive).length);
  pausedCount = computed(() => this.items().filter(i => !i.isActive).length);
  monthlyTotal = computed(() => {
    return this.items()
      .filter(i => i.isActive)
      .reduce((sum, i) => {
        switch (i.frequency) {
          case 'Daily': return sum + i.amount * 30;
          case 'Weekly': return sum + i.amount * 4.33;
          case 'Biweekly': return sum + i.amount * 2.17;
          case 'Monthly': return sum + i.amount;
          default: return sum + i.amount;
        }
      }, 0);
  });

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
