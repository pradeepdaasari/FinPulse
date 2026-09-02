import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { RecurringService } from '../../core/services/recurring.service';
import { RecurringTransaction } from '../../core/models/recurring.model';
import { DailyExpense, DailyExpenseCreate, TransactionType, FundingSourceType } from '../../core/models/daily-expense.model';
import { NotificationService } from '../../core/services/notification.service';
import { RecurringDialogComponent } from './recurring-dialog.component';
import { AddExpenseDialogComponent, ExpenseDialogData } from '../expenses/add-expense-dialog.component';

@Component({
  selector: 'app-recurring-page',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, MatSlideToggleModule, MatTooltipModule, CurrencyPipe, DatePipe],
  template: `
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAdd()">
        <mat-icon>add</mat-icon> Add Recurring
      </button>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
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
        @if (overdueItems().length > 0) {
          <div class="stat-card stat-red">
            <mat-icon>warning</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ overdueItems().length }}</span>
              <span class="stat-label">Past Due</span>
            </div>
          </div>
        } @else {
          <div class="stat-card stat-purple">
            <mat-icon>pause_circle</mat-icon>
            <div class="stat-content">
              <span class="stat-value">{{ pausedCount() }}</span>
              <span class="stat-label">Paused</span>
            </div>
          </div>
        }
      </div>

      <!-- Overdue Section -->
      @if (overdueItems().length > 0) {
        <div class="due-section overdue-section">
          <div class="due-header overdue-header">
            <mat-icon>warning</mat-icon>
            <span>{{ overdueItems().length }} payment{{ overdueItems().length > 1 ? 's' : '' }} past due</span>
          </div>
          @for (r of overdueItems(); track r.id) {
            <div class="due-card">
              <div class="due-left">
                <div class="cat-icon-wrap overdue-icon-wrap">
                  <mat-icon class="cat-icon">{{ r.categoryIcon }}</mat-icon>
                </div>
                <div>
                  <div class="desc-text">{{ r.description }}</div>
                  <div class="overdue-date-text">{{ daysOverdue(r) }} day{{ daysOverdue(r) > 1 ? 's' : '' }} overdue &middot; Was due {{ r.nextRunDate | date:'MMM d' }}</div>
                </div>
              </div>
              <div class="due-right">
                <span class="due-amount overdue-amount">{{ r.amount | currency }}</span>
                <button mat-raised-button color="warn" class="pay-btn" (click)="markPaid(r)">
                  <mat-icon>check_circle</mat-icon> Mark Paid
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Due Today Section -->
      @if (dueTodayItems().length > 0) {
        <div class="due-section">
          <div class="due-header">
            <mat-icon>notifications_active</mat-icon>
            <span>{{ dueTodayItems().length }} payment{{ dueTodayItems().length > 1 ? 's' : '' }} due today</span>
          </div>
          @for (r of dueTodayItems(); track r.id) {
            <div class="due-card">
              <div class="due-left">
                <div class="cat-icon-wrap due-icon-wrap">
                  <mat-icon class="cat-icon">{{ r.categoryIcon }}</mat-icon>
                </div>
                <div>
                  <div class="desc-text">{{ r.description }}</div>
                  <div class="due-date-text">Due today</div>
                </div>
              </div>
              <div class="due-right">
                <span class="due-amount">{{ r.amount | currency }}</span>
                <button mat-raised-button color="primary" class="pay-btn" (click)="markPaid(r)">
                  <mat-icon>check_circle</mat-icon> Mark Paid
                </button>
              </div>
            </div>
          }
        </div>
      }

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
            <td mat-cell *matCellDef="let r">
              <span [class.due-highlight]="isDue(r) && !isOverdue(r)" [class.overdue-highlight]="isOverdue(r)">{{ r.nextRunDate | date:'mediumDate' }}</span>
              @if (isOverdue(r)) { <span class="overdue-badge">{{ daysOverdue(r) }}d overdue</span> }
            </td>
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
                @if (isCurrentMonth(r)) {
                  <button mat-icon-button class="action-btn action-pay" (click)="markPaid(r)" [matTooltip]="isDue(r) ? 'Mark Paid' : 'Pay Now'">
                    <mat-icon>{{ isDue(r) ? 'check_circle' : 'payments' }}</mat-icon>
                  </button>
                }
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
          <div class="rec-card" [class.rec-paused]="!r.isActive" [class.rec-due]="isDue(r) && !isOverdue(r)" [class.rec-overdue]="isOverdue(r)">
            <div class="rec-top">
              <div class="rec-icon-wrap">
                <mat-icon>{{ r.categoryIcon }}</mat-icon>
              </div>
              <div class="rec-info">
                <span class="rec-name">{{ r.description }}</span>
                @if (r.merchant) { <span class="rec-merchant">{{ r.merchant }}</span> }
              </div>
              <div class="rec-amount-col">
                <span class="rec-amount" [class.overdue-amount]="isOverdue(r)">{{ r.amount | currency }}</span>
                <span class="freq-badge" [class.freq-daily]="r.frequency === 'Daily'" [class.freq-weekly]="r.frequency === 'Weekly'" [class.freq-biweekly]="r.frequency === 'Biweekly'" [class.freq-monthly]="r.frequency === 'Monthly'" >{{ r.frequency }}</span>
              </div>
            </div>
            <div class="rec-bottom">
              @if (isOverdue(r)) {
                <span class="overdue-date-text">{{ daysOverdue(r) }}d overdue &middot; Due {{ r.nextRunDate | date:'MMM d' }}</span>
              } @else {
                <span class="rec-next">Next: {{ r.nextRunDate | date:'MMM d' }}</span>
              }
              <div class="rec-actions">
                @if (isCurrentMonth(r)) {
                  <button mat-raised-button color="primary" class="pay-btn-sm" (click)="markPaid(r)">
                    <mat-icon>{{ isDue(r) ? 'check_circle' : 'payments' }}</mat-icon> {{ isDue(r) ? 'Pay' : 'Pay Now' }}
                  </button>
                }
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
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
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
      font-size: 24px; width: 44px; height: 44px; min-width: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px;
    }
    .stat-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-purple mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .stat-red mat-icon { color: var(--color-danger); background: var(--color-danger-bg); }
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

    /* Due Section */
    .due-section {
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-md);
      border-left: 4px solid var(--color-warning);
      overflow: hidden;
    }
    .due-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; font-weight: 600; font-size: 0.9rem;
      background: var(--color-stat-amber-bg); color: var(--color-stat-amber);
    }
    .due-header mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .due-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--color-border);
    }
    .due-card:last-child { border-bottom: none; }
    .due-left { display: flex; align-items: center; gap: 12px; }
    .due-icon-wrap { background: var(--color-stat-amber-bg) !important; }
    .due-date-text { font-size: 0.75rem; color: var(--color-text-muted); }
    .due-right { display: flex; align-items: center; gap: 12px; }
    .due-amount { font-weight: 700; font-size: 1.05rem; }
    .pay-btn { border-radius: var(--radius-sm) !important; font-size: 0.8rem !important; padding: 0 14px !important; }
    .pay-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    .pay-btn-sm { font-size: 0.72rem !important; padding: 0 10px !important; min-height: 30px !important; line-height: 30px !important; border-radius: var(--radius-sm) !important; }
    .pay-btn-sm mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 3px; }
    .due-highlight { color: var(--color-warning); font-weight: 600; }
    .action-pay { color: var(--color-success) !important; }
    .action-pay:hover { background: var(--color-stat-green-bg) !important; }
    .rec-card.rec-due { border-left-color: var(--color-warning); }
    .rec-card.rec-overdue { border-left-color: var(--color-danger); }

    /* Overdue Section */
    .overdue-section { border-left-color: var(--color-danger); }
    .overdue-header { background: var(--color-danger-bg); color: var(--color-danger); }
    .overdue-icon-wrap { background: var(--color-danger-bg) !important; }
    .overdue-icon-wrap .cat-icon { color: var(--color-danger) !important; }
    .overdue-date-text { font-size: 0.75rem; color: var(--color-danger); font-weight: 500; }
    .overdue-amount { color: var(--color-danger) !important; }
    .overdue-highlight { color: var(--color-danger); font-weight: 600; }
    .overdue-badge { font-size: 0.65rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); background: var(--color-danger-bg); color: var(--color-danger); }

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
  private todayStr = computed(() => {
    const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  });
  dueItems = computed(() => this.items().filter(i => i.isActive && i.nextRunDate.slice(0, 10) <= this.todayStr()));
  overdueItems = computed(() => this.items().filter(i => i.isActive && i.nextRunDate.slice(0, 10) < this.todayStr()));
  dueTodayItems = computed(() => this.items().filter(i => i.isActive && i.nextRunDate.slice(0, 10) === this.todayStr()));
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

  isCurrentMonth(item: RecurringTransaction): boolean {
    if (!item.isActive) return false;
    const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit' });
    const currentYM = formatter.format(now).slice(0, 7);
    return item.nextRunDate.slice(0, 7) === currentYM;
  }

  isDue(item: RecurringTransaction): boolean {
    if (!item.isActive) return false;
    return item.nextRunDate.slice(0, 10) <= this.todayStr();
  }

  isOverdue(item: RecurringTransaction): boolean {
    if (!item.isActive) return false;
    return item.nextRunDate.slice(0, 10) < this.todayStr();
  }

  daysOverdue(item: RecurringTransaction): number {
    const due = new Date(item.nextRunDate.slice(0, 10) + 'T00:00:00');
    const today = new Date(this.todayStr() + 'T00:00:00');
    return Math.floor((today.getTime() - due.getTime()) / 86400000);
  }

  markPaid(item: RecurringTransaction): void {
    const prefill: Partial<DailyExpense> = {
      categoryId: item.categoryId,
      amount: item.amount,
      merchant: item.merchant,
      description: item.description,
      transactionType: item.transactionType as TransactionType,
      fundingSourceType: item.fundingSourceType as FundingSourceType | null,
      fundingSourceId: item.fundingSourceId
    };
    const data: ExpenseDialogData = { expense: null, prefill };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data, panelClass: 'expense-dialog-panel' });
    ref.afterClosed().subscribe((result: DailyExpenseCreate | undefined) => {
      if (!result) return;
      this.service.pay(item.id, result).subscribe({
        next: () => { this.notify.success(`${item.description} marked as paid`); this.loadData(); },
        error: (err: any) => this.notify.error(err.error?.message || 'Failed to mark paid')
      });
    });
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
