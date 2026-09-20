import { Component, OnInit, ViewChild, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
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
import { toLocalDateString } from '../../../core/utils/date-utils';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DailyExpenseService } from '../../../core/services/daily-expense.service';
import { DailyExpense, DailyExpenseCreate, ExpenseFilter, SpendingSummary } from '../../../core/models/daily-expense.model';
import { BankAccountService } from '../../../core/services/bank-account.service';
import { AddExpenseDialogComponent, ExpenseDialogData } from './add-expense-dialog.component';
import { ExpenseFilterBarComponent } from './expense-filter-bar.component';
import { MonthComparisonComponent } from './month-comparison.component';
import { TagSummaryComponent } from './tag-summary.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';

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
          <button mat-icon-button (click)="prevMonth()" aria-label="Previous month"><mat-icon>chevron_left</mat-icon></button>
          <span class="month-label">{{ monthLabel() }}</span>
          <button mat-icon-button (click)="nextMonth()" aria-label="Next month"><mat-icon>chevron_right</mat-icon></button>
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
                    <table class="grouped-table">
                      <thead>
                        <tr>
                          <th>Type</th><th>Time</th><th>Merchant</th><th>Description</th>
                          <th>Category</th><th>Source</th><th class="col-amount">Amount</th><th class="col-actions"></th>
                        </tr>
                      </thead>
                      @for (group of groupedExpenses(); track group.label) {
                        <tbody>
                          <tr class="day-group-row">
                            <td [attr.colspan]="7" class="day-group-label">{{ group.label }}</td>
                            <td class="day-group-total" [class.positive]="getDayNet(group.items) > 0" [class.negative]="getDayNet(group.items) < 0">
                              {{ getDayNet(group.items) >= 0 ? '+' : '' }}{{ getDayNet(group.items) | currency }}
                            </td>
                          </tr>
                          @for (e of group.items; track e.id) {
                            <tr class="data-row"
                                [class.row-expense]="e.transactionType === 'Expense' || !e.transactionType"
                                [class.row-income]="e.transactionType === 'Income'"
                                [class.row-transfer]="e.transactionType === 'Transfer'"
                                [class.row-refund]="e.transactionType === 'Refund'"
                                [class.row-card]="e.transactionType === 'CardPayment'"
                                [class.row-loan]="e.transactionType === 'LoanPayment'">
                              <td>
                                <span class="type-badge"
                                      [class.type-expense]="e.transactionType === 'Expense' || !e.transactionType"
                                      [class.type-income]="e.transactionType === 'Income'"
                                      [class.type-transfer]="e.transactionType === 'Transfer'"
                                      [class.type-refund]="e.transactionType === 'Refund'"
                                      [class.type-card]="e.transactionType === 'CardPayment'"
                                      [class.type-loan]="e.transactionType === 'LoanPayment'">
                                  {{ e.transactionType === 'LoanPayment' ? 'Loan Payment' : e.transactionType === 'CardPayment' ? 'Card Payment' : (e.transactionType || 'Expense') }}
                                </span>
                              </td>
                              <td>{{ e.date | date:'h:mm a' }}</td>
                              <td>{{ e.merchant || '—' }}</td>
                              <td>
                                {{ e.description }}
                                @if (e.tag) { <span class="tag-badge">{{ e.tag }}</span> }
                              </td>
                              <td>
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
                              <td>
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
                                } @else if (e.transactionType === 'LoanPayment' && e.fundingSourceName && e.toFundingSourceName) {
                                  <span class="source-cell loan-payment-source">
                                    <mat-icon class="source-icon">{{ getSourceIcon(e.fundingSourceId, e.fundingSourceType) }}</mat-icon>
                                    {{ e.fundingSourceName }} <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                                    <mat-icon class="source-icon">account_balance</mat-icon> {{ e.toFundingSourceName }}
                                  </span>
                                } @else if (e.fundingSourceName) {
                                  <span class="source-cell">
                                    <mat-icon class="source-icon">{{ getSourceIcon(e.fundingSourceId, e.fundingSourceType) }}</mat-icon>
                                    {{ e.fundingSourceName }}
                                  </span>
                                } @else { — }
                              </td>
                              <td [class.amount-cell]="true"
                                  [class.expense-amount]="e.transactionType === 'Expense' || !e.transactionType"
                                  [class.income-amount]="e.transactionType === 'Income'"
                                  [class.transfer-amount]="e.transactionType === 'Transfer'"
                                  [class.refund-amount]="e.transactionType === 'Refund'"
                                  [class.card-payment-amount]="e.transactionType === 'CardPayment'"
                                  [class.loan-payment-amount]="e.transactionType === 'LoanPayment'">
                                @if (e.transactionType === 'Income') { +{{ e.amount | currency }} }
                                @else if (e.transactionType === 'Transfer') { ⇔ {{ e.amount | currency }} }
                                @else if (e.transactionType === 'Refund') { ↩ {{ e.amount | currency }} }
                                @else if (e.transactionType === 'CardPayment') { 💳 {{ e.amount | currency }} }
                                @else if (e.transactionType === 'LoanPayment') { 🏦 {{ e.amount | currency }} }
                                @else { {{ e.amount | currency }} }
                              </td>
                              <td>
                                @if (e.source === 'payment') {
                                  <span class="auto-trade-badge" matTooltip="Payment — manage from Cards/Loans section">
                                    <mat-icon class="auto-trade-icon">{{ e.transactionType === 'CardPayment' ? 'credit_card' : 'account_balance' }}</mat-icon> Payment
                                  </span>
                                } @else if (e.linkedToTrade) {
                                  <span class="auto-trade-badge" matTooltip="Linked to trade journal — edit/delete from Trading">
                                    <mat-icon class="auto-trade-icon">link</mat-icon> Trade
                                  </span>
                                } @else {
                                  <button mat-icon-button class="action-btn action-edit" (click)="editExpense(e)" matTooltip="Edit">
                                    <mat-icon>edit</mat-icon>
                                  </button>
                                  <button mat-icon-button class="action-btn action-delete" (click)="deleteExpense(e)" matTooltip="Delete">
                                    <mat-icon>delete_outline</mat-icon>
                                  </button>
                                }
                              </td>
                            </tr>
                          }
                        </tbody>
                      }
                    </table>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Mobile card view -->
              <div class="mobile-feed">
                @for (group of groupedExpenses(); track group.label) {
                  <div class="date-group">
                    <div class="date-header">
                      <span>{{ group.label }}</span>
                      <span class="date-total" [class.positive]="getDayNet(group.items) > 0" [class.negative]="getDayNet(group.items) < 0">
                        {{ getDayNet(group.items) >= 0 ? '+' : '' }}{{ getDayNet(group.items) | currency }}
                      </span>
                    </div>
                    @for (e of group.items; track e.id) {
                      <div class="txn-card" (click)="onCardClick(e)" [class.auto-trade-card]="e.linkedToTrade || e.source === 'payment'">
                        <div class="txn-left">
                          <div class="txn-cat-dot" [class.dot-income]="e.transactionType === 'Income'"
                               [class.dot-transfer]="e.transactionType === 'Transfer'"
                               [class.dot-refund]="e.transactionType === 'Refund'"
                               [class.dot-card]="e.transactionType === 'CardPayment'"
                               [class.dot-loan]="e.transactionType === 'LoanPayment'">
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
                                  [class.type-card]="e.transactionType === 'CardPayment'"
                                  [class.type-loan]="e.transactionType === 'LoanPayment'">{{ e.transactionType === 'LoanPayment' ? 'Loan Payment' : e.transactionType === 'CardPayment' ? 'Card Payment' : (e.transactionType || 'Expense') }}</span>
                            · {{ e.date | date:'shortTime' }}{{ e.categoryName ? ' · ' + e.categoryName : '' }}{{ e.merchant ? ' · ' + e.merchant : '' }}
                          </span>
                        </div>
                        <div class="txn-right">
                          <span class="txn-amount"
                                [class.expense-amount]="e.transactionType === 'Expense' || !e.transactionType"
                                [class.income-amount]="e.transactionType === 'Income'"
                                [class.transfer-amount]="e.transactionType === 'Transfer'"
                                [class.refund-amount]="e.transactionType === 'Refund'"
                                [class.card-payment-amount]="e.transactionType === 'CardPayment'"
                                [class.loan-payment-amount]="e.transactionType === 'LoanPayment'">
                            @if (e.transactionType === 'Income') { +{{ e.amount | currency }} }
                            @else if (e.transactionType === 'Transfer') { {{ e.amount | currency }} }
                            @else if (e.transactionType === 'Refund') { +{{ e.amount | currency }} }
                            @else if (e.transactionType === 'CardPayment') { 💳 {{ e.amount | currency }} }
                            @else if (e.transactionType === 'LoanPayment') { 🏦 {{ e.amount | currency }} }
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

            @if (insight(); as ins) {
              <div class="insight-banner" [class]="'insight-' + ins.level">
                <div class="insight-icon-wrap">
                  <mat-icon>{{ ins.icon }}</mat-icon>
                </div>
                <div class="insight-body">
                  <span class="insight-title">{{ ins.title }}</span>
                  <span class="insight-text">{{ ins.message }}</span>
                </div>
              </div>
            }

            @if (overBudgetCategories().length > 0) {
              <div class="alert-chips">
                @for (cat of overBudgetCategories(); track cat.categoryId) {
                  <span class="alert-chip">
                    <mat-icon>warning</mat-icon>
                    {{ cat.categoryName }}: {{ (-cat.remaining) | currency }} over
                  </span>
                }
              </div>
            }

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
      background: var(--color-surface-hover);
      border-radius: var(--radius-full);
      padding: 4px;
    }
    .month-label { font-size: var(--text-base); font-weight: var(--weight-semibold); min-width: 140px; text-align: center; }
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
      background: var(--color-surface-solid);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      box-shadow: var(--shadow-xs);
      border: 1px solid var(--color-border);
      transition: box-shadow var(--transition-base);
    }
    .stat-card > mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
      padding: 10px;
      border-radius: var(--radius-sm);
      flex-shrink: 0;
      box-sizing: content-box;
      overflow: visible;
    }
    .stat-card.stat-blue > mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-card.stat-green > mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-card.stat-red > mat-icon { color: var(--color-stat-red); background: var(--color-stat-red-bg); }
    .stat-card.stat-amber > mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-card.stat-purple > mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .stat-content { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.25rem; font-weight: var(--weight-bold); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.02em; line-height: var(--leading-tight); }
    .stat-value-danger { color: var(--color-danger); }
    .stat-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: var(--tracking-wide); margin-top: 2px; }

    .summary-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
    .summary-item { cursor: pointer; transition: box-shadow var(--transition-base); }
    .summary-item:hover { box-shadow: var(--shadow-md); }
    .summary-header { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
    .cat-name { font-weight: var(--weight-medium); display: flex; align-items: center; gap: 8px; }
    .cat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .cat-amounts { font-size: var(--text-sm); opacity: 0.8; }
    .summary-footer { display: flex; justify-content: space-between; margin-top: 4px; font-size: var(--text-sm); }
    .remaining { color: var(--color-success-text); }
    .remaining.over { color: var(--color-danger-text); }
    .percent { opacity: 0.6; }

    .log-header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); flex-wrap: wrap; }
    .expense-count { font-size: var(--text-sm); color: var(--color-text-muted); }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 700px; }
    td.mat-column-actions { white-space: nowrap; text-align: right; }
    .action-btn { width: 34px; height: 34px; border-radius: var(--radius-xs) !important; transition: background var(--transition-fast) !important; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-edit { color: var(--color-action-edit) !important; }
    .action-edit:hover { background: var(--color-action-edit-bg) !important; }
    .action-delete { color: var(--color-action-delete) !important; }
    .action-delete:hover { background: var(--color-action-delete-bg) !important; }
    .amount-cell { font-weight: var(--weight-semibold); font-variant-numeric: tabular-nums; }
    .expense-amount { color: var(--color-danger) !important; }
    .income-amount { color: var(--color-success) !important; }
    .transfer-amount { color: var(--color-primary) !important; }
    .refund-amount { color: var(--color-success) !important; font-style: italic; }
    .card-payment-amount { color: var(--color-accent); }
    .loan-payment-amount { color: var(--color-stat-purple); }

    /* Type badge */
    .type-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.625rem;
      font-weight: var(--weight-semibold);
      padding: 3px 9px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      white-space: nowrap;
      line-height: 1.3;
    }
    .type-expense { background: var(--color-danger-bg); color: var(--color-danger-text); }
    .type-income { background: var(--color-success-bg); color: var(--color-success-text); }
    .type-transfer { background: var(--color-primary-subtle); color: var(--color-primary); }
    .type-refund { background: var(--color-warning-bg); color: var(--color-warning-text); }
    .type-card { background: var(--color-accent-subtle); color: var(--color-accent); }
    .type-loan { background: rgba(88, 86, 214, 0.10); color: #5856D6; }

    /* Grouped table */
    .grouped-table {
      width: 100%; border-collapse: collapse;
      font-size: 0.85rem;
    }
    .grouped-table thead th {
      text-align: left;
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-text-muted);
      padding: 10px 16px;
      border-bottom: 2px solid var(--color-border);
    }
    .grouped-table .col-amount { text-align: right; }
    .grouped-table .col-actions { width: 80px; }
    .day-group-row {
      background: var(--color-bg);
    }
    .day-group-label {
      font-size: var(--text-xs);
      font-weight: var(--weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      padding: 12px 16px 8px;
      border-bottom: 1px solid var(--color-border);
    }
    .day-group-total {
      font-size: 0.78rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      text-align: right;
      padding: 12px 16px 8px;
      border-bottom: 1px solid var(--color-border);
      white-space: nowrap;
    }
    .day-group-total.positive { color: var(--color-success); }
    .day-group-total.negative { color: var(--color-danger); }
    .grouped-table .data-row td {
      padding: 10px 16px;
      border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
      vertical-align: middle;
    }
    .grouped-table .data-row:last-child td {
      border-bottom: none;
    }
    .grouped-table .data-row:hover td {
      background: color-mix(in srgb, var(--color-primary) 3%, var(--color-surface));
    }

    /* Row left border by type */
    tr.data-row { border-left: 3px solid transparent; }
    tr.row-expense { border-left-color: var(--color-danger); }
    tr.row-income { border-left-color: var(--color-success); }
    tr.row-transfer { border-left-color: var(--color-primary); }
    tr.row-refund { border-left-color: var(--color-warning); }
    tr.row-card { border-left-color: var(--color-accent); }
    tr.row-loan { border-left-color: #5856D6; }

    .cat-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }
    .cat-chip-icon { font-size: 14px; width: 14px; height: 14px; }
    .cat-chip-none { background: var(--color-surface-hover); color: var(--color-text-muted); }

    .source-cell { display: flex; align-items: center; gap: 4px; font-size: var(--text-sm); }
    .source-icon { font-size: 16px; width: 16px; height: 16px; opacity: 0.65; }
    .transfer-source { color: var(--color-primary); }
    .card-payment-source { color: var(--color-accent); }
    .loan-payment-source { color: #5856D6; }
    .arrow-icon { font-size: 14px; width: 14px; height: 14px; }
    .tag-badge {
      display: inline-block;
      background: var(--color-primary-subtle);
      color: var(--color-primary);
      font-size: 0.625rem;
      padding: 2px 10px;
      border-radius: var(--radius-full);
      margin-left: 6px;
      font-weight: var(--weight-medium);
      vertical-align: middle;
    }

    /* Insight Banner */
    .insight-banner {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 18px; margin-bottom: var(--spacing-sm);
      border-radius: var(--radius-md); border-left: 4px solid;
    }
    .insight-success { background: var(--color-success-bg); border-left-color: var(--color-success); }
    .insight-info { background: var(--color-info-bg); border-left-color: var(--color-primary); }
    .insight-warn { background: var(--color-warning-bg); border-left-color: var(--color-warning); }
    .insight-danger { background: var(--color-danger-bg); border-left-color: var(--color-danger); }
    .insight-icon-wrap {
      width: 36px; height: 36px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .insight-success .insight-icon-wrap { background: rgba(52,199,89,0.15); }
    .insight-success .insight-icon-wrap mat-icon { color: var(--color-success); }
    .insight-info .insight-icon-wrap { background: rgba(0,122,255,0.15); }
    .insight-info .insight-icon-wrap mat-icon { color: var(--color-primary); }
    .insight-warn .insight-icon-wrap { background: rgba(255,149,0,0.15); }
    .insight-warn .insight-icon-wrap mat-icon { color: var(--color-warning); }
    .insight-danger .insight-icon-wrap { background: rgba(255,59,48,0.15); }
    .insight-danger .insight-icon-wrap mat-icon { color: var(--color-danger); }
    .insight-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .insight-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .insight-title { font-weight: var(--weight-bold); font-size: var(--text-sm); }
    .insight-text { font-size: var(--text-xs); color: var(--color-text-secondary); line-height: var(--leading-normal); }

    /* Over-budget Alert Chips */
    .alert-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: var(--spacing-sm); }
    .alert-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: var(--radius-full);
      background: var(--color-danger-bg); color: var(--color-danger-text);
      font-size: var(--text-xs); font-weight: var(--weight-semibold); white-space: nowrap;
    }
    .alert-chip mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Mobile card feed */
    .mobile-feed { display: none; }
    .desktop-only { display: block; }
    .date-group { margin-bottom: 4px; }
    .date-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--text-xs);
      font-weight: var(--weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      padding: 14px 4px 8px;
      position: sticky;
      top: 0;
      background: var(--color-bg);
      z-index: 2;
    }
    .date-total {
      font-size: 0.75rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      text-transform: none;
      letter-spacing: normal;
    }
    .date-total.positive { color: var(--color-success); }
    .date-total.negative { color: var(--color-danger); }
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
    .auto-trade-badge { display: inline-flex; align-items: center; gap: 4px; font-size: var(--text-xs); color: var(--color-primary); font-weight: var(--weight-medium); white-space: nowrap; }
    .auto-trade-icon { font-size: 16px; width: 16px; height: 16px; }
    .txn-cat-dot {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-danger-bg);
      flex-shrink: 0;
    }
    .txn-cat-dot mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-danger); }
    .txn-cat-dot.dot-income { background: var(--color-success-bg); }
    .txn-cat-dot.dot-income mat-icon { color: var(--color-success); }
    .txn-cat-dot.dot-transfer { background: var(--color-primary-subtle); }
    .txn-cat-dot.dot-transfer mat-icon { color: var(--color-primary); }
    .txn-cat-dot.dot-refund { background: var(--color-warning-bg); }
    .txn-cat-dot.dot-refund mat-icon { color: var(--color-warning); }
    .txn-cat-dot.dot-card { background: var(--color-accent-subtle); }
    .txn-cat-dot.dot-card mat-icon { color: var(--color-accent); }
    .txn-cat-dot.dot-loan { background: rgba(88, 86, 214, 0.10); }
    .txn-cat-dot.dot-loan mat-icon { color: #5856D6; }
    .txn-mid { flex: 1; min-width: 0; }
    .txn-desc { display: block; font-weight: var(--weight-semibold); font-size: var(--text-base); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: var(--leading-snug); }
    .txn-meta { display: block; font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .txn-type-label { font-weight: var(--weight-semibold); font-size: 0.625rem; padding: 2px 7px; border-radius: var(--radius-full); }
    .txn-right { flex-shrink: 0; text-align: right; }
    .txn-amount { font-weight: var(--weight-bold); font-size: 1.0625rem; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 1199px) {
      .desktop-only { display: none !important; }
      .mobile-feed { display: block; }
    }
    @media (max-width: 599px) {
      .expenses-header { flex-direction: column; align-items: stretch; gap: 6px; }
      .view-toggle { margin-right: 0; align-self: center; }
      .range-nav { justify-content: center; }
      .range-field { width: 130px; }
      .month-nav { background: transparent; padding: 0; justify-content: center; }
      .month-label { font-size: var(--text-lg); font-weight: var(--weight-bold); min-width: 110px; }
      .mobile-feed { display: block; }
      .desktop-only { display: none !important; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; gap: 10px; }
      .stat-card > mat-icon { font-size: 22px; width: 22px; height: 22px; }
      .stat-value { font-size: 1rem; }
      .log-header { justify-content: center; }
      .log-header button[mat-raised-button] { display: none; }
      .expense-count { width: 100%; text-align: center; font-size: var(--text-xs); }
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

  overBudgetCategories = computed(() =>
    this.summary().filter(s => s.remaining < 0).sort((a, b) => a.remaining - b.remaining)
  );

  insight = computed(() => {
    const budgeted = this.totalBudgeted();
    const spent = this.totalSpent();
    if (budgeted <= 0) return null;

    const now = new Date();
    const viewingCurrent = this.currentYear === now.getFullYear() && this.currentMonth === (now.getMonth() + 1);
    const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const dayOfMonth = viewingCurrent ? now.getDate() : daysInMonth;
    const monthProgress = dayOfMonth / daysInMonth;
    const spentPercent = spent / budgeted;
    const paceRatio = spentPercent / monthProgress;
    const remaining = budgeted - spent;
    const daysLeft = daysInMonth - dayOfMonth;
    const dailyBudgetLeft = daysLeft > 0 ? remaining / daysLeft : 0;

    if (spent === 0) {
      return { level: 'success', icon: 'rocket_launch', title: 'Fresh start!', message: `You have ${this.fmtCurrency(budgeted)} budgeted this month. Make every dollar count.` };
    }
    if (spentPercent >= 1) {
      return { level: 'danger', icon: 'account_balance_wallet', title: 'Budget exceeded', message: `You've spent ${this.fmtCurrency(spent - budgeted)} over budget. Focus on essentials for the rest of the month.` };
    }
    if (spentPercent >= 0.9) {
      return { level: 'warn', icon: 'speed', title: 'Almost at limit', message: `Only ${this.fmtCurrency(remaining)} left with ${daysLeft} days to go. That's ${this.fmtCurrency(dailyBudgetLeft)}/day — you've got this.` };
    }
    if (paceRatio > 1.15) {
      return { level: 'warn', icon: 'trending_up', title: 'Spending ahead of pace', message: `You're ${Math.round((paceRatio - 1) * 100)}% ahead of pace. Slow down a bit — ${this.fmtCurrency(dailyBudgetLeft)}/day keeps you on track.` };
    }
    if (paceRatio < 0.7 && monthProgress > 0.25) {
      return { level: 'success', icon: 'emoji_events', title: 'Great discipline!', message: `You're well under pace — ${this.fmtCurrency(remaining)} remaining with ${daysLeft} days left. Keep it up!` };
    }
    if (paceRatio <= 1.15) {
      return { level: 'info', icon: 'check_circle', title: 'On track', message: `You're right on pace. ${this.fmtCurrency(dailyBudgetLeft)}/day available for the next ${daysLeft} days.` };
    }
    return null;
  });

  private fmtCurrency(val: number): string {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

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
    this.accountService.getAll().subscribe({
      next: (accounts) => {
        accounts.forEach(a => {
          switch (a.accountType) {
            case 'Savings': this.accountIconMap.set(a.id, 'savings'); break;
            case 'Brokerage': this.accountIconMap.set(a.id, 'trending_up'); break;
            default: this.accountIconMap.set(a.id, 'account_balance'); break;
          }
        });
      },
      error: () => {}
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

  getDayNet(items: DailyExpense[]): number {
    return items.reduce((sum, e) => {
      if (e.transactionType === 'Income' || e.transactionType === 'Refund') return sum + e.amount;
      if (e.transactionType === 'Transfer') return sum;
      return sum - e.amount;
    }, 0);
  }

  getCategoryIcon(e: DailyExpense): string {
    if (e.categoryIcon) return e.categoryIcon;
    switch (e.transactionType) {
      case 'Income': return 'trending_up';
      case 'Transfer': return 'swap_horiz';
      case 'Refund': return 'undo';
      case 'CardPayment': return 'credit_card';
      case 'LoanPayment': return 'account_balance';
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
      if (result.loanPayment) {
        this.notify.success(`${result.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} payment recorded for ${result.debtName}`);
        this.loadData();
        return;
      }
      if (result.saved) {
        this.notify.success(result.isEdit ? 'Transaction updated' : 'Transaction saved');
        this.loadData();
      }
    });
  }

  addExpenseForCategory(categoryId: number): void {
    const data: ExpenseDialogData = { expense: null, prefilledCategoryId: categoryId };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data, panelClass: 'expense-dialog-panel' });
    ref.afterClosed().subscribe((result: any) => {
      if (!result?.saved) return;
      this.notify.success('Transaction saved');
      this.loadData();
    });
  }

  onCardClick(expense: DailyExpense): void {
    if (expense.linkedToTrade || expense.source === 'payment') return;
    this.editExpense(expense);
  }

  editExpense(expense: DailyExpense): void {
    const data: ExpenseDialogData = { expense };
    const ref = this.dialog.open(AddExpenseDialogComponent, { data, panelClass: 'expense-dialog-panel' });
    ref.afterClosed().subscribe((result: any) => {
      if (result === 'delete') {
        this.deleteExpense(expense);
        return;
      }
      if (!result?.saved) return;
      this.notify.success('Transaction updated');
      this.loadData();
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
