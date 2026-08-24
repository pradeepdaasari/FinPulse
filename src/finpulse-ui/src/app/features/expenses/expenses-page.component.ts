import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFabButton } from '@angular/material/button';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { DailyExpense, DailyExpenseCreate, ExpenseFilter, SpendingSummary } from '../../core/models/daily-expense.model';
import { AddExpenseDialogComponent, ExpenseDialogData } from './add-expense-dialog.component';
import { ExpenseFilterBarComponent } from './expense-filter-bar.component';
import { MonthComparisonComponent } from './month-comparison.component';
import { TagSummaryComponent } from './tag-summary.component';

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressBarModule, MatProgressSpinnerModule, MatChipsModule,
    MatDialogModule, MatTooltipModule, CurrencyPipe, DatePipe,
    ExpenseFilterBarComponent, MonthComparisonComponent, TagSummaryComponent
  ],
  template: `
    <div class="expenses-header">
      <h2>Transactions</h2>
      <div class="month-nav">
        <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
        <span class="month-label">{{ monthLabel() }}</span>
        <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
      </div>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else {
      <mat-tab-group animationDuration="200ms">
        <!-- Spending Summary Tab -->
        <mat-tab label="Spending Summary">
          <div class="tab-content">
            <mat-card class="totals-card">
              <mat-card-content>
                <div class="totals-row">
                  <div class="total-item">
                    <span class="total-label">Total Budgeted</span>
                    <span class="total-value budgeted">{{ totalBudgeted() | currency }}</span>
                  </div>
                  <div class="total-item">
                    <span class="total-label">Total Spent</span>
                    <span class="total-value spent">{{ totalSpent() | currency }}</span>
                  </div>
                  <div class="total-item">
                    <span class="total-label">Remaining</span>
                    <span class="total-value" [class.positive]="totalRemaining() >= 0" [class.negative]="totalRemaining() < 0">
                      {{ totalRemaining() | currency }}
                    </span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            @if (summary().length > 0) {
              <div class="summary-list">
                @for (item of summary(); track item.categoryId) {
                  <mat-card class="summary-item" (click)="addExpenseForCategory(item.categoryId)">
                    <mat-card-content>
                      <div class="summary-header">
                        <span class="cat-name">
                          @if (item.categoryIcon) {
                            <mat-icon class="cat-icon">{{ item.categoryIcon }}</mat-icon>
                          }
                          {{ item.categoryName }}
                        </span>
                        <span class="cat-amounts">{{ item.spent | currency }} / {{ item.budgeted | currency }}</span>
                      </div>
                      <mat-progress-bar
                        mode="determinate"
                        [value]="Math.min(item.percentUsed, 100)"
                        [color]="getBarColor(item.percentUsed)">
                      </mat-progress-bar>
                      <div class="summary-footer">
                        <span class="remaining" [class.over]="item.remaining < 0">
                          {{ item.remaining >= 0 ? (item.remaining | currency) + ' left' : ((-item.remaining) | currency) + ' over' }}
                        </span>
                        <span class="percent">{{ item.percentUsed }}%</span>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            } @else {
              <mat-card>
                <mat-card-content>
                  <p>No budget categories set up yet. Add variable spending categories in the Budget page first.</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- Transaction Log Tab -->
        <mat-tab label="Transaction Log">
          <div class="tab-content">
            <div class="log-header">
              <button mat-raised-button color="primary" (click)="addExpense()">
                <mat-icon>add</mat-icon> Log Transaction
              </button>
              <button mat-stroked-button (click)="exportCsv()">
                <mat-icon>download</mat-icon> Export CSV
              </button>
              <span class="expense-count">{{ expenses().length }} transactions</span>
            </div>

            <app-expense-filter-bar (filterChange)="onFilterChange($event)"></app-expense-filter-bar>

            @if (expenses().length > 0) {
              <mat-card>
                <mat-card-content>
                  <div class="table-wrapper">
                    <table mat-table [dataSource]="expenses()">
                      <ng-container matColumnDef="date">
                        <th mat-header-cell *matHeaderCellDef>Date</th>
                        <td mat-cell *matCellDef="let e">{{ e.date | date:'MMM d' }}</td>
                      </ng-container>
                      <ng-container matColumnDef="merchant">
                        <th mat-header-cell *matHeaderCellDef>Merchant</th>
                        <td mat-cell *matCellDef="let e">{{ e.merchant || '—' }}</td>
                      </ng-container>
                      <ng-container matColumnDef="description">
                        <th mat-header-cell *matHeaderCellDef>Description</th>
                        <td mat-cell *matCellDef="let e">
                          {{ e.description }}
                          @if (e.tag) {
                            <span class="tag-badge">{{ e.tag }}</span>
                          }
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="category">
                        <th mat-header-cell *matHeaderCellDef>Category</th>
                        <td mat-cell *matCellDef="let e">
                          <mat-chip>
                            @if (e.categoryIcon) {
                              <mat-icon matChipAvatar>{{ e.categoryIcon }}</mat-icon>
                            }
                            {{ e.categoryName }}
                          </mat-chip>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="source">
                        <th mat-header-cell *matHeaderCellDef>Source</th>
                        <td mat-cell *matCellDef="let e">
                          @if (e.transactionType === 'Transfer' && e.fundingSourceName && e.toFundingSourceName) {
                            <span class="source-cell transfer-source">
                              <mat-icon class="source-icon">account_balance</mat-icon>
                              {{ e.fundingSourceName }} <mat-icon class="arrow-icon">arrow_forward</mat-icon> {{ e.toFundingSourceName }}
                            </span>
                          } @else if (e.transactionType === 'CardPayment' && e.fundingSourceName && e.toFundingSourceName) {
                            <span class="source-cell card-payment-source">
                              <mat-icon class="source-icon">account_balance</mat-icon>
                              {{ e.fundingSourceName }} <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                              <mat-icon class="source-icon">credit_card</mat-icon> {{ e.toFundingSourceName }}
                            </span>
                          } @else if (e.fundingSourceName) {
                            <span class="source-cell">
                              <mat-icon class="source-icon">{{ e.fundingSourceType === 'BankAccount' ? 'account_balance' : 'credit_card' }}</mat-icon>
                              {{ e.fundingSourceName }}
                            </span>
                          } @else {
                            —
                          }
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>Amount</th>
                        <td mat-cell *matCellDef="let e" [class.amount-cell]="true"
                            [class.income-amount]="e.transactionType === 'Income'"
                            [class.transfer-amount]="e.transactionType === 'Transfer'"
                            [class.refund-amount]="e.transactionType === 'Refund'"
                            [class.card-payment-amount]="e.transactionType === 'CardPayment'">
                          @if (e.transactionType === 'Income') { +{{ e.amount | currency }} }
                          @else if (e.transactionType === 'Transfer') { ↔ {{ e.amount | currency }} }
                          @else if (e.transactionType === 'Refund') { ↩ {{ e.amount | currency }} }
                          @else if (e.transactionType === 'CardPayment') { 💳 {{ e.amount | currency }} }
                          @else { {{ e.amount | currency }} }
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef></th>
                        <td mat-cell *matCellDef="let e">
                          <button mat-icon-button (click)="duplicateExpense(e)" matTooltip="Duplicate">
                            <mat-icon>content_copy</mat-icon>
                          </button>
                          <button mat-icon-button (click)="editExpense(e)" matTooltip="Edit">
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button mat-icon-button color="warn" (click)="deleteExpense(e)" matTooltip="Delete">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="logColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: logColumns;"></tr>
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card>
                <mat-card-content>
                  <p>No expenses logged this month. Click "Log Expense" to start tracking.</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>
        <!-- Month Comparison Tab -->
        <mat-tab label="Month Comparison">
          <div class="tab-content">
            <app-month-comparison [year]="currentYear" [month]="currentMonth"></app-month-comparison>
          </div>
        </mat-tab>

        <!-- Tag Summary Tab -->
        <mat-tab label="Trips & Tags">
          <div class="tab-content">
            <app-tag-summary></app-tag-summary>
          </div>
        </mat-tab>
      </mat-tab-group>
    }
  `,
  styles: [`
    .expenses-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .expenses-header h2 { margin: 0; }
    .month-nav {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      background: var(--color-surface-secondary);
      border-radius: var(--radius-full);
      padding: 4px;
    }
    .month-label { font-size: var(--text-base); font-weight: 600; min-width: 140px; text-align: center; }
    .tab-content { padding: var(--spacing-md) 0; }

    .totals-card { margin-bottom: var(--spacing-lg); }
    .totals-row { display: flex; justify-content: space-around; flex-wrap: wrap; gap: var(--spacing-md); }
    .total-item { text-align: center; }
    .total-label { display: block; font-size: 0.85rem; opacity: 0.7; }
    .total-value { display: block; font-size: 1.75rem; font-weight: 700; margin-top: 4px; }
    .total-value.budgeted { color: var(--color-primary); }
    .total-value.spent { color: var(--color-warning); }
    .total-value.positive { color: var(--color-success); }
    .total-value.negative { color: var(--color-danger); }

    .summary-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    .summary-item { cursor: pointer; transition: box-shadow 0.2s; }
    .summary-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .summary-header { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
    .cat-name { font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .cat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .cat-amounts { font-size: 0.9rem; opacity: 0.8; }
    .summary-footer { display: flex; justify-content: space-between; margin-top: 4px; font-size: 0.85rem; }
    .remaining { color: var(--color-success); }
    .remaining.over { color: var(--color-danger); }
    .percent { opacity: 0.6; }

    .log-header { display: flex; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-md); }
    .expense-count { font-size: 0.9rem; opacity: 0.6; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 700px; }
    .amount-cell { font-weight: 600; }
    .income-amount { color: var(--color-success); }
    .transfer-amount { color: var(--color-primary); }
    .refund-amount { color: var(--color-success); font-style: italic; }
    .card-payment-amount { color: var(--color-accent); }
    .source-cell { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; }
    .source-icon { font-size: 16px; width: 16px; height: 16px; opacity: 0.7; }
    .transfer-source { color: var(--color-primary); }
    .card-payment-source { color: var(--color-accent); }
    .arrow-icon { font-size: 14px; width: 14px; height: 14px; }
    .tag-badge {
      display: inline-block;
      background: rgba(0, 122, 255, 0.08);
      color: var(--color-primary);
      font-size: 0.7rem;
      padding: 2px 10px;
      border-radius: var(--radius-full);
      margin-left: 6px;
      font-weight: 500;
      vertical-align: middle;
    }

    @media (max-width: 768px) {
      .totals-row { flex-direction: column; align-items: center; }
    }
  `]
})
export class ExpensesPageComponent implements OnInit {
  private expenseService = inject(DailyExpenseService);
  private dialog = inject(MatDialog);

  Math = Math;

  summary = signal<SpendingSummary[]>([]);
  expenses = signal<DailyExpense[]>([]);
  loading = signal(true);
  totalBudgeted = signal(0);
  totalSpent = signal(0);
  totalRemaining = signal(0);

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  monthLabel = signal('');

  activeFilter: Partial<ExpenseFilter> = {};
  logColumns = ['date', 'merchant', 'description', 'category', 'source', 'amount', 'actions'];

  ngOnInit(): void {
    this.updateMonthLabel();
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.expenseService.getSummary(this.currentYear, this.currentMonth).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.totalBudgeted.set(data.reduce((sum, d) => sum + d.budgeted, 0));
        this.totalSpent.set(data.reduce((sum, d) => sum + d.spent, 0));
        this.totalRemaining.set(this.totalBudgeted() - this.totalSpent());
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
    this.expenseService.getExpenses({ year: this.currentYear, month: this.currentMonth, ...this.activeFilter }).subscribe({
      next: (data) => this.expenses.set(data),
      error: () => this.expenses.set([])
    });
  }

  prevMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 1) { this.currentMonth = 12; this.currentYear--; }
    this.updateMonthLabel();
    this.loadData();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 12) { this.currentMonth = 1; this.currentYear++; }
    this.updateMonthLabel();
    this.loadData();
  }

  private updateMonthLabel(): void {
    const date = new Date(this.currentYear, this.currentMonth - 1, 1);
    this.monthLabel.set(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }

  getBarColor(percent: number): 'primary' | 'accent' | 'warn' {
    if (percent >= 100) return 'warn';
    if (percent >= 80) return 'accent';
    return 'primary';
  }

  addExpense(): void {
    const data: ExpenseDialogData = { expense: null };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data });
    ref.afterClosed().subscribe((result: any) => {
      if (!result) return;
      if (result.splits) {
        this.expenseService.createSplit(result.splits).subscribe(() => this.loadData());
      } else {
        this.expenseService.create(result).subscribe(() => this.loadData());
      }
    });
  }

  addExpenseForCategory(categoryId: number): void {
    const data: ExpenseDialogData = { expense: null, prefilledCategoryId: categoryId };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data });
    ref.afterClosed().subscribe((result: DailyExpenseCreate | undefined) => {
      if (result) {
        this.expenseService.create(result).subscribe(() => this.loadData());
      }
    });
  }

  duplicateExpense(expense: DailyExpense): void {
    const data: ExpenseDialogData = { expense: null, prefill: expense };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data });
    ref.afterClosed().subscribe((result: DailyExpenseCreate | undefined) => {
      if (result) {
        this.expenseService.create(result).subscribe(() => this.loadData());
      }
    });
  }

  editExpense(expense: DailyExpense): void {
    const data: ExpenseDialogData = { expense };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data });
    ref.afterClosed().subscribe((result: DailyExpenseCreate | undefined) => {
      if (result) {
        this.expenseService.update(expense.id, result).subscribe(() => this.loadData());
      }
    });
  }

  onFilterChange(filter: Partial<ExpenseFilter>): void {
    this.activeFilter = filter;
    this.loadData();
  }

  exportCsv(): void {
    this.expenseService.exportCsv(this.currentYear, this.currentMonth);
  }

  deleteExpense(expense: DailyExpense): void {
    if (confirm(`Delete "${expense.description}"?`)) {
      this.expenseService.delete(expense.id).subscribe(() => this.loadData());
    }
  }
}
