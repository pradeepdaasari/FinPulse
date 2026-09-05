import { Component, OnInit, ViewChild, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFabButton } from '@angular/material/button';
import { toLocalDateString } from '../../core/utils/date-utils';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { DailyExpense, DailyExpenseCreate, ExpenseFilter, SpendingSummary } from '../../core/models/daily-expense.model';
import { BankAccountService } from '../../core/services/bank-account.service';
import { AddExpenseDialogComponent, ExpenseDialogData } from './add-expense-dialog.component';
import { ExpenseFilterBarComponent } from './expense-filter-bar.component';
import { MonthComparisonComponent } from './month-comparison.component';
import { TagSummaryComponent } from './tag-summary.component';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';

function compare(a: number | string, b: number | string, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressBarModule, MatChipsModule,
    MatDialogModule, MatTooltipModule, MatSortModule, MatButtonToggleModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule,
    CurrencyPipe, DatePipe,
    ExpenseFilterBarComponent, MonthComparisonComponent, TagSummaryComponent,
    SkeletonLoaderComponent, PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    <div class="expenses-header">
      <mat-button-toggle-group [value]="viewMode()" (change)="setViewMode($event.value)" class="view-toggle">
        <mat-button-toggle value="month">Month</mat-button-toggle>
        <mat-button-toggle value="range">Date Range</mat-button-toggle>
      </mat-button-toggle-group>

      @if (viewMode() === 'month') {
        <div class="month-nav">
          <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
          <span class="month-label">{{ monthLabel() }}</span>
          <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
        </div>
      } @else {
        <div class="range-nav">
          <mat-form-field appearance="outline" class="range-field">
            <mat-label>From</mat-label>
            <input matInput [matDatepicker]="rangeFrom" [(ngModel)]="rangeStartDate" (dateChange)="onRangeChange()">
            <mat-datepicker-toggle matIconSuffix [for]="rangeFrom"></mat-datepicker-toggle>
            <mat-datepicker #rangeFrom></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="range-field">
            <mat-label>To</mat-label>
            <input matInput [matDatepicker]="rangeTo" [(ngModel)]="rangeEndDate" (dateChange)="onRangeChange()">
            <mat-datepicker-toggle matIconSuffix [for]="rangeTo"></mat-datepicker-toggle>
            <mat-datepicker #rangeTo></mat-datepicker>
          </mat-form-field>
        </div>
      }
    </div>

    @if (loading()) {
      <app-skeleton type="table"></app-skeleton>
    } @else {
      <mat-tab-group animationDuration="200ms">
        <!-- Transaction Log Tab -->
        <mat-tab label="Transaction Log">
          <div class="tab-content">
            <div class="log-header">
              <button mat-raised-button color="primary" (click)="addExpense()">
                <mat-icon>add</mat-icon> Log Transaction
              </button>
              <button mat-stroked-button (click)="exportCsv()" class="desktop-only">
                <mat-icon>download</mat-icon> Export CSV
              </button>
              <span class="expense-count">{{ filteredExpenses().length }} transactions</span>
            </div>

            <app-expense-filter-bar (filterChange)="onFilterChange($event)"></app-expense-filter-bar>

            @if (filteredExpenses().length > 0) {
              <!-- Desktop table view -->
              <mat-card class="desktop-only">
                <mat-card-content>
                  <div class="table-wrapper">
                    <table mat-table [dataSource]="filteredExpenses()" matSort (matSortChange)="sortData($event)">
                      <ng-container matColumnDef="type">
                        <th mat-header-cell *matHeaderCellDef>Type</th>
                        <td mat-cell *matCellDef="let e">
                          <span class="type-badge"
                                [class.type-expense]="e.transactionType === 'Expense' || !e.transactionType"
                                [class.type-income]="e.transactionType === 'Income'"
                                [class.type-transfer]="e.transactionType === 'Transfer'"
                                [class.type-refund]="e.transactionType === 'Refund'"
                                [class.type-card]="e.transactionType === 'CardPayment'">
                            {{ e.transactionType || 'Expense' }}
                          </span>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="date">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
                        <td mat-cell *matCellDef="let e">{{ e.date | date:'MMM d, h:mm a' }}</td>
                      </ng-container>
                      <ng-container matColumnDef="merchant">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Merchant</th>
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
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
                        <td mat-cell *matCellDef="let e">
                          @if (e.categoryName) {
                            <span class="cat-chip" [style.background]="getCategoryBg(e.categoryName)" [style.color]="getCategoryColor(e.categoryName)">
                              @if (e.categoryIcon) {
                                <mat-icon class="cat-chip-icon" [style.color]="getCategoryColor(e.categoryName)">{{ e.categoryIcon }}</mat-icon>
                              }
                              {{ e.categoryName }}
                            </span>
                          } @else {
                            <span class="cat-chip cat-chip-none">—</span>
                          }
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="source">
                        <th mat-header-cell *matHeaderCellDef>Source</th>
                        <td mat-cell *matCellDef="let e">
                          @if (e.transactionType === 'Transfer' && e.fundingSourceName && e.toFundingSourceName) {
                            <span class="source-cell transfer-source">
                              <mat-icon class="source-icon">{{ getSourceIcon(e.fundingSourceId, e.fundingSourceType) }}</mat-icon>
                              {{ e.fundingSourceName }} <mat-icon class="arrow-icon">arrow_forward</mat-icon> {{ e.toFundingSourceName }}
                            </span>
                          } @else if (e.transactionType === 'CardPayment' && e.fundingSourceName && e.toFundingSourceName) {
                            <span class="source-cell card-payment-source">
                              <mat-icon class="source-icon">{{ getSourceIcon(e.fundingSourceId, e.fundingSourceType) }}</mat-icon>
                              {{ e.fundingSourceName }} <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                              <mat-icon class="source-icon">credit_card</mat-icon> {{ e.toFundingSourceName }}
                            </span>
                          } @else if (e.fundingSourceName) {
                            <span class="source-cell">
                              <mat-icon class="source-icon">{{ getSourceIcon(e.fundingSourceId, e.fundingSourceType) }}</mat-icon>
                              {{ e.fundingSourceName }}
                            </span>
                          } @else {
                            —
                          }
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Amount</th>
                        <td mat-cell *matCellDef="let e" [class.amount-cell]="true"
                            [class.income-amount]="e.transactionType === 'Income'"
                            [class.transfer-amount]="e.transactionType === 'Transfer'"
                            [class.refund-amount]="e.transactionType === 'Refund'"
                            [class.card-payment-amount]="e.transactionType === 'CardPayment'">
                          @if (e.transactionType === 'Income') { +{{ e.amount | currency }} }
                          @else if (e.transactionType === 'Transfer') { ⇔ {{ e.amount | currency }} }
                          @else if (e.transactionType === 'Refund') { ↩ {{ e.amount | currency }} }
                          @else if (e.transactionType === 'CardPayment') { 💳 {{ e.amount | currency }} }
                          @else { {{ e.amount | currency }} }
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="actions">
                        <th mat-header-cell *matHeaderCellDef></th>
                        <td mat-cell *matCellDef="let e">
                          @if (e.linkedToTrade) {
                            <span class="auto-trade-badge" matTooltip="Linked to trade journal — edit/delete from Trading">
                              <mat-icon class="auto-trade-icon">link</mat-icon> Trade
                            </span>
                          } @else {
                            <button mat-icon-button (click)="duplicateExpense(e)" matTooltip="Duplicate">
                              <mat-icon>content_copy</mat-icon>
                            </button>
                            <button mat-icon-button (click)="editExpense(e)" matTooltip="Edit">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button mat-icon-button color="warn" (click)="deleteExpense(e)" matTooltip="Delete">
                              <mat-icon>delete</mat-icon>
                            </button>
                          }
                        </td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="logColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: logColumns;"
                          [class.row-expense]="row.transactionType === 'Expense' || !row.transactionType"
                          [class.row-income]="row.transactionType === 'Income'"
                          [class.row-transfer]="row.transactionType === 'Transfer'"
                          [class.row-refund]="row.transactionType === 'Refund'"
                          [class.row-card]="row.transactionType === 'CardPayment'"></tr>
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Mobile card view -->
              <div class="mobile-feed">
                @for (group of groupedExpenses(); track group.label) {
                  <div class="date-group">
                    <div class="date-header">{{ group.label }}</div>
                    @for (e of group.items; track e.id) {
                      <div class="txn-card" (click)="!e.linkedToTrade && editExpense(e)" [class.auto-trade-card]="e.linkedToTrade">
                        <div class="txn-left">
                          <div class="txn-cat-dot" [class.dot-income]="e.transactionType === 'Income'"
                               [class.dot-transfer]="e.transactionType === 'Transfer'"
                               [class.dot-refund]="e.transactionType === 'Refund'"
                               [class.dot-card]="e.transactionType === 'CardPayment'">
                            <mat-icon>{{ getCategoryIcon(e) }}</mat-icon>
                          </div>
                        </div>
                        <div class="txn-mid">
                          <span class="txn-desc">{{ e.description }}</span>
                          <span class="txn-meta">
                            <span class="txn-type-label"
                                  [class.type-expense]="e.transactionType === 'Expense' || !e.transactionType"
                                  [class.type-income]="e.transactionType === 'Income'"
                                  [class.type-transfer]="e.transactionType === 'Transfer'"
                                  [class.type-refund]="e.transactionType === 'Refund'"
                                  [class.type-card]="e.transactionType === 'CardPayment'">{{ e.transactionType || 'Expense' }}</span>
                            · {{ e.date | date:'shortTime' }}{{ e.categoryName ? ' · ' + e.categoryName : '' }}{{ e.merchant ? ' · ' + e.merchant : '' }}
                          </span>
                        </div>
                        <div class="txn-right">
                          <span class="txn-amount"
                                [class.income-amount]="e.transactionType === 'Income'"
                                [class.transfer-amount]="e.transactionType === 'Transfer'"
                                [class.refund-amount]="e.transactionType === 'Refund'"
                                [class.card-payment-amount]="e.transactionType === 'CardPayment'">
                            @if (e.transactionType === 'Income') { +{{ e.amount | currency }} }
                            @else if (e.transactionType === 'Transfer') { {{ e.amount | currency }} }
                            @else if (e.transactionType === 'Refund') { +{{ e.amount | currency }} }
                            @else { -{{ e.amount | currency }} }
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <mat-card>
                <mat-card-content>
                  <p>No transactions found. Click "Log Transaction" to start tracking.</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>

        <!-- Spending Summary Tab -->
        <mat-tab label="Spending Summary">
          <div class="tab-content">
            <div class="stats-row">
              <div class="stat-card stat-blue">
                <mat-icon>account_balance_wallet</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ totalBudgeted() | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="stat-label">Budgeted</span>
                </div>
              </div>
              <div class="stat-card stat-amber">
                <mat-icon>shopping_cart</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ totalSpent() | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="stat-label">Spent</span>
                </div>
              </div>
              <div class="stat-card stat-green">
                <mat-icon>savings</mat-icon>
                <div class="stat-content">
                  <span class="stat-value" [class.stat-value-danger]="totalRemaining() < 0">{{ totalRemaining() | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="stat-label">Remaining</span>
                </div>
              </div>
              <div class="stat-card stat-purple">
                <mat-icon>receipt_long</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ filteredExpenses().length }}</span>
                  <span class="stat-label">Transactions</span>
                </div>
              </div>
            </div>

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
    </div>
  `,
  styles: [`
    .expenses-header {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }
    .view-toggle { margin-right: auto; }
    .month-nav {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      background: var(--color-surface-secondary);
      border-radius: var(--radius-full);
      padding: 4px;
    }
    .month-label { font-size: var(--text-base); font-weight: 600; min-width: 140px; text-align: center; }
    .range-nav { display: flex; gap: 8px; align-items: center; }
    .range-field { width: 150px; }
    .range-field .mat-mdc-form-field-infix { padding-top: 8px !important; padding-bottom: 8px !important; }
    .tab-content { padding: var(--spacing-sm) 0; }

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
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: 16px;
      box-shadow: var(--shadow-sm);
    }
    .stat-card > mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .stat-card.stat-blue > mat-icon { color: var(--color-stat-blue); }
    .stat-card.stat-green > mat-icon { color: var(--color-stat-green); }
    .stat-card.stat-red > mat-icon { color: var(--color-stat-red); }
    .stat-card.stat-amber > mat-icon { color: var(--color-stat-amber); }
    .stat-card.stat-purple > mat-icon { color: var(--color-stat-purple); }
    .stat-content { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.2rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .stat-value-danger { color: var(--color-danger); }
    .stat-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.02em; }

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

    .log-header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); flex-wrap: wrap; }
    .expense-count { font-size: 0.9rem; opacity: 0.6; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 700px; }
    .amount-cell { font-weight: 600; }
    .income-amount { color: var(--color-success); }
    .transfer-amount { color: var(--color-primary); }
    .refund-amount { color: var(--color-success); font-style: italic; }
    .card-payment-amount { color: var(--color-accent); }

    /* Type badge */
    .type-badge {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .type-expense { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .type-income { background: var(--color-stat-green-bg); color: var(--color-success); }
    .type-transfer { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .type-refund { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .type-card { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }

    /* Row left border by type */
    tr.mat-mdc-row { border-left: 3px solid transparent; }
    tr.row-expense { border-left-color: var(--color-danger); }
    tr.row-income { border-left-color: var(--color-success); }
    tr.row-transfer { border-left-color: var(--color-primary); }
    tr.row-refund { border-left-color: var(--color-warning); }
    tr.row-card { border-left-color: var(--color-stat-purple); }

    .cat-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }
    .cat-chip-icon { font-size: 14px; width: 14px; height: 14px; }
    .cat-chip-none { background: rgba(0,0,0,0.04); color: var(--color-text-muted); }

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

    /* Mobile card feed */
    .mobile-feed { display: none; }
    .desktop-only { display: block; }
    .date-group { margin-bottom: 4px; }
    .date-header {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary);
      padding: 14px 4px 8px;
      position: sticky;
      top: 0;
      background: var(--color-bg);
      z-index: 2;
    }
    .txn-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 4px;
      cursor: pointer;
      transition: background var(--transition-fast);
      -webkit-tap-highlight-color: transparent;
      border-bottom: none;
    }
    .txn-card + .txn-card {
      border-top: 1px solid var(--color-border);
    }
    .txn-card:active { background: var(--color-surface-hover); }
    .txn-card.auto-trade-card { cursor: default; opacity: 0.7; }
    .txn-card.auto-trade-card:active { background: none; }
    .auto-trade-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--color-primary); font-weight: 500; white-space: nowrap; }
    .auto-trade-icon { font-size: 16px; width: 16px; height: 16px; }
    .txn-cat-dot {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-stat-red-bg);
      flex-shrink: 0;
    }
    .txn-cat-dot mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-danger); }
    .txn-cat-dot.dot-income { background: var(--color-stat-green-bg); }
    .txn-cat-dot.dot-income mat-icon { color: var(--color-success); }
    .txn-cat-dot.dot-transfer { background: var(--color-stat-blue-bg); }
    .txn-cat-dot.dot-transfer mat-icon { color: var(--color-primary); }
    .txn-cat-dot.dot-refund { background: var(--color-stat-amber-bg); }
    .txn-cat-dot.dot-refund mat-icon { color: var(--color-warning); }
    .txn-cat-dot.dot-card { background: var(--color-stat-purple-bg); }
    .txn-cat-dot.dot-card mat-icon { color: var(--color-stat-purple); }
    .txn-mid { flex: 1; min-width: 0; }
    .txn-desc { display: block; font-weight: 600; font-size: 1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }
    .txn-meta { display: block; font-size: 0.8rem; color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .txn-type-label { font-weight: 600; font-size: 0.6875rem; padding: 2px 6px; border-radius: var(--radius-full); }
    .txn-right { flex-shrink: 0; text-align: right; }
    .txn-amount { font-weight: 700; font-size: 1.1rem; letter-spacing: -0.01em; }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 599px) {
      .expenses-header { flex-direction: column; align-items: stretch; gap: 6px; }
      .view-toggle { margin-right: 0; align-self: center; }
      .range-nav { justify-content: center; }
      .range-field { width: 130px; }
      .month-nav { background: transparent; padding: 0; justify-content: center; }
      .month-label { font-size: 1.05rem; font-weight: 700; min-width: 110px; }
      .mobile-feed { display: block; }
      .desktop-only { display: none !important; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; gap: 10px; }
      .stat-card > mat-icon { font-size: 22px; width: 22px; height: 22px; }
      .stat-value { font-size: 1rem; }
      .log-header { justify-content: center; }
      .log-header button[mat-raised-button] { display: none; }
      .expense-count { width: 100%; text-align: center; font-size: 0.8rem; }
      .tab-content { padding: 4px 0; }
    }
  `]
})
export class ExpensesPageComponent implements OnInit {
  private expenseService = inject(DailyExpenseService);
  private accountService = inject(BankAccountService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  private accountIconMap = new Map<number, string>();

  @ViewChild(MatSort) sort!: MatSort;

  Math = Math;

  summary = signal<SpendingSummary[]>([]);
  expenses = signal<DailyExpense[]>([]);
  filteredExpenses = signal<DailyExpense[]>([]);
  groupedExpenses = signal<{ label: string; items: DailyExpense[] }[]>([]);
  loading = signal(true);
  totalBudgeted = signal(0);
  totalSpent = signal(0);
  totalRemaining = signal(0);

  viewMode = signal<'month' | 'range'>('month');
  rangeStartDate: Date | null = null;
  rangeEndDate: Date | null = null;

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  monthLabel = signal('');

  activeFilter: Partial<ExpenseFilter> = {};
  logColumns = ['type', 'date', 'merchant', 'description', 'category', 'source', 'amount', 'actions'];

  ngOnInit(): void {
    this.updateMonthLabel();
    this.loadData();
    this.accountService.getAll().subscribe(accounts => {
      accounts.forEach(a => {
        switch (a.accountType) {
          case 'Savings': this.accountIconMap.set(a.id, 'savings'); break;
          case 'Brokerage': this.accountIconMap.set(a.id, 'trending_up'); break;
          default: this.accountIconMap.set(a.id, 'account_balance'); break;
        }
      });
    });
  }

  loadData(): void {
    this.loading.set(true);

    const filter: Partial<ExpenseFilter> = { ...this.activeFilter };
    if (this.viewMode() === 'month') {
      filter.year = this.currentYear;
      filter.month = this.currentMonth;
    } else {
      if (this.rangeStartDate) filter.dateFrom = toLocalDateString(this.rangeStartDate);
      if (this.rangeEndDate) filter.dateTo = toLocalDateString(this.rangeEndDate);
    }

    if (this.viewMode() === 'month') {
      this.expenseService.getSummary(this.currentYear, this.currentMonth).subscribe({
        next: (data) => {
          this.summary.set(data);
          this.totalBudgeted.set(data.reduce((sum, d) => sum + d.budgeted, 0));
          this.totalSpent.set(data.reduce((sum, d) => sum + d.spent, 0));
          this.totalRemaining.set(this.totalBudgeted() - this.totalSpent());
          this.loading.set(false);
          this.cdr.detectChanges();
        },
        error: () => { this.loading.set(false); this.cdr.detectChanges(); }
      });
    } else {
      this.loading.set(false);
    }

    this.expenseService.getExpenses(filter).subscribe({
      next: (data) => {
        this.expenses.set(data);
        this.filteredExpenses.set(data);
        this.buildGroupedExpenses(data);
        this.cdr.detectChanges();
      },
      error: () => {
        this.expenses.set([]);
        this.filteredExpenses.set([]);
        this.groupedExpenses.set([]);
        this.cdr.detectChanges();
      }
    });
  }

  setViewMode(mode: 'month' | 'range'): void {
    this.viewMode.set(mode);
    if (mode === 'range' && !this.rangeStartDate) {
      this.rangeStartDate = new Date(this.currentYear, this.currentMonth - 1, 1);
      this.rangeEndDate = new Date(this.currentYear, this.currentMonth, 0);
    }
    this.loadData();
  }

  onRangeChange(): void {
    if (this.rangeStartDate && this.rangeEndDate) {
      this.loadData();
    }
  }

  getSourceIcon(fundingSourceId: number | null, fundingSourceType: string | null): string {
    if (fundingSourceType === 'CreditCard') return 'credit_card';
    if (fundingSourceId && this.accountIconMap.has(fundingSourceId)) {
      return this.accountIconMap.get(fundingSourceId)!;
    }
    return 'account_balance';
  }

  getCategoryIcon(e: DailyExpense): string {
    if (e.categoryIcon) return e.categoryIcon;
    switch (e.transactionType) {
      case 'Income': return 'trending_up';
      case 'Transfer': return 'swap_horiz';
      case 'Refund': return 'undo';
      case 'CardPayment': return 'credit_card';
      default: return 'shopping_cart';
    }
  }

  getCategoryColor(name: string | null): string {
    if (!name) return 'hsl(0, 0%, 60%)';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = ((hash % 360) + 360) % 360;
    return `hsl(${hue}, 55%, 45%)`;
  }

  getCategoryBg(name: string | null): string {
    if (!name) return 'rgba(0,0,0,0.06)';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = ((hash % 360) + 360) % 360;
    return `hsl(${hue}, 60%, 94%)`;
  }

  private buildGroupedExpenses(expenses: DailyExpense[]): void {
    const groups = new Map<string, DailyExpense[]>();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    for (const e of expenses) {
      const d = new Date(e.date);
      let label: string;
      if (d.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(e);
    }

    this.groupedExpenses.set(Array.from(groups.entries()).map(([label, items]) => ({ label, items })));
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

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.filteredExpenses.set([...this.expenses()]);
      this.buildGroupedExpenses(this.expenses());
      return;
    }
    const sorted = [...this.expenses()].sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'date': return compare(new Date(a.date).getTime(), new Date(b.date).getTime(), isAsc);
        case 'amount': return compare(a.amount, b.amount, isAsc);
        case 'category': return compare(a.categoryName || '', b.categoryName || '', isAsc);
        case 'merchant': return compare(a.merchant || '', b.merchant || '', isAsc);
        default: return 0;
      }
    });
    this.filteredExpenses.set(sorted);
    this.buildGroupedExpenses(sorted);
  }

  addExpense(): void {
    const data: ExpenseDialogData = { expense: null };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data, panelClass: 'expense-dialog-panel' });
    ref.afterClosed().subscribe((result: any) => {
      if (!result) return;
      if (result.splits) {
        this.expenseService.createSplit(result.splits).subscribe({
          next: () => { this.notify.success('Transaction saved'); this.loadData(); },
          error: (err) => this.notify.error(err.error?.message || 'Failed to save transaction')
        });
      } else {
        this.expenseService.create(result).subscribe({
          next: () => { this.notify.success('Transaction saved'); this.loadData(); },
          error: (err) => this.notify.error(err.error?.message || 'Failed to save transaction')
        });
      }
    });
  }

  addExpenseForCategory(categoryId: number): void {
    const data: ExpenseDialogData = { expense: null, prefilledCategoryId: categoryId };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data, panelClass: 'expense-dialog-panel' });
    ref.afterClosed().subscribe((result: DailyExpenseCreate | undefined) => {
      if (!result) return;
      this.expenseService.create(result).subscribe({
        next: () => { this.notify.success('Transaction saved'); this.loadData(); },
        error: (err) => this.notify.error(err.error?.message || 'Failed to save transaction')
      });
    });
  }

  duplicateExpense(expense: DailyExpense): void {
    const data: ExpenseDialogData = { expense: null, prefill: expense };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data, panelClass: 'expense-dialog-panel' });
    ref.afterClosed().subscribe((result: DailyExpenseCreate | undefined) => {
      if (!result) return;
      this.expenseService.create(result).subscribe({
        next: () => { this.notify.success('Transaction saved'); this.loadData(); },
        error: (err) => this.notify.error(err.error?.message || 'Failed to save transaction')
      });
    });
  }

  editExpense(expense: DailyExpense): void {
    const data: ExpenseDialogData = { expense };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data, panelClass: 'expense-dialog-panel' });
    ref.afterClosed().subscribe((result: DailyExpenseCreate | undefined) => {
      if (!result) return;
      this.expenseService.update(expense.id, result).subscribe({
        next: () => { this.notify.success('Transaction updated'); this.loadData(); },
        error: (err) => this.notify.error(err.error?.message || 'Failed to update transaction')
      });
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
    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Delete Transaction?', message: `"${expense.description}" will be permanently removed.`, confirmText: 'Delete', color: 'warn' }
    }).afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.loading.set(true);
      this.expenseService.delete(expense.id).subscribe({
        next: () => {
          this.notify.success('Transaction deleted');
          this.loadData();
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err?.error?.error || err?.message || 'Unknown error';
          this.notify.error(`Delete failed: ${msg}`);
          this.cdr.detectChanges();
        }
      });
    });
  }
}
