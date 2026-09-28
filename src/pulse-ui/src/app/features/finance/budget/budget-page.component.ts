import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { BudgetService } from '../../../core/services/budget.service';
import { BudgetPlan, PaycheckBreakdown } from '../../../core/models/budget.model';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';
import { inferCategoryIcon } from '../../../core/utils/category-icon';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatTooltipModule, CurrencyPipe, LocalDatePipe, DecimalPipe,
    SkeletonLoaderComponent, PullToRefreshDirective, RouterLink
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    <!-- Month Navigator -->
    <div class="month-nav-row">
      <div class="month-nav">
        <button mat-icon-button (click)="prevMonth()" aria-label="Previous month"><mat-icon>chevron_left</mat-icon></button>
        <span class="month-label">{{ monthLabel() }}</span>
        <button mat-icon-button (click)="nextMonth()" aria-label="Next month"><mat-icon>chevron_right</mat-icon></button>
      </div>
      @if (!isCurrentMonth()) {
        <button mat-stroked-button class="today-btn" (click)="goToCurrentMonth()">
          <mat-icon>today</mat-icon> Today
        </button>
      }
    </div>

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else if (hasError()) {
      <div class="error-state">
        <mat-icon class="error-icon">cloud_off</mat-icon>
        <h3>Couldn't load your budget</h3>
        <p>Something went wrong. Check your connection and try again.</p>
        <button mat-raised-button color="primary" (click)="loadData()">
          <mat-icon>refresh</mat-icon> Try Again
        </button>
      </div>
    } @else if (plan()) {
      <mat-tab-group animationDuration="200ms">
        <!-- Monthly Overview Tab -->
        <mat-tab label="Monthly Overview">
          <div class="tab-content">
            <!-- Stat Cards -->
            <div class="stats-row">
              <div class="stat-card stat-blue">
                <mat-icon>account_balance_wallet</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ plan()!.monthlyOverview.totalIncome | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="stat-label">Income <span class="stat-sub">({{ plan()!.monthlyOverview.paychecksThisMonth }})</span></span>
                </div>
              </div>
              <div class="stat-card stat-amber">
                <mat-icon>assignment</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ plan()!.monthlyOverview.totalExpenses | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="stat-label">Budgeted</span>
                </div>
              </div>
              <div class="stat-card stat-purple">
                <mat-icon>shopping_cart</mat-icon>
                <div class="stat-content">
                  <span class="stat-value">{{ plan()!.monthlyOverview.totalSpent | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="stat-label">Spent</span>
                </div>
              </div>
              @if (plan()!.monthlyOverview.totalRemaining >= 0) {
                <div class="stat-card stat-green">
                  <mat-icon>savings</mat-icon>
                  <div class="stat-content">
                    <span class="stat-value">{{ plan()!.monthlyOverview.totalRemaining | currency:'USD':'symbol':'1.0-0' }}</span>
                    <span class="stat-label">Remaining</span>
                  </div>
                </div>
              } @else {
                <div class="stat-card stat-red">
                  <mat-icon>trending_down</mat-icon>
                  <div class="stat-content">
                    <span class="stat-value">{{ -plan()!.monthlyOverview.totalRemaining | currency:'USD':'symbol':'1.0-0' }}</span>
                    <span class="stat-label">Over Budget</span>
                  </div>
                </div>
              }
            </div>

            <!-- Overall Progress -->
            <div class="progress-card" [class.over]="overallPercent() > 100">
              <div class="progress-card-header">
                <div class="progress-title-row">
                  <mat-icon class="progress-icon">donut_large</mat-icon>
                  <div>
                    <span class="progress-title">Monthly Spending</span>
                    <span class="progress-message" [class.msg-success]="overallPercent() <= 75" [class.msg-warn]="overallPercent() > 75 && overallPercent() <= 100" [class.msg-danger]="overallPercent() > 100">{{ progressMessage() }}</span>
                  </div>
                </div>
                <div class="progress-meta">
                  <span class="progress-amounts">{{ plan()!.monthlyOverview.totalSpent | currency:'USD':'symbol':'1.0-0' }} <span class="of-text">of</span> {{ plan()!.monthlyOverview.totalExpenses | currency:'USD':'symbol':'1.0-0' }}</span>
                  @if (isCurrentMonth()) {
                    <span class="days-left">{{ daysRemaining() }} day{{ daysRemaining() !== 1 ? 's' : '' }} left</span>
                  }
                </div>
              </div>
              <div class="progress-bar-wrap">
                <mat-progress-bar mode="determinate"
                  [value]="Math.min(overallPercent(), 100)"
                  [color]="overallPercent() > 100 ? 'warn' : overallPercent() > 80 ? 'accent' : 'primary'">
                </mat-progress-bar>
              </div>
              <div class="progress-card-footer">
                <span class="remaining-pill" [class.pill-success]="plan()!.monthlyOverview.totalRemaining >= 0" [class.pill-danger]="plan()!.monthlyOverview.totalRemaining < 0">
                  <mat-icon class="pill-icon">{{ plan()!.monthlyOverview.totalRemaining >= 0 ? 'check_circle' : 'error' }}</mat-icon>
                  {{ plan()!.monthlyOverview.totalRemaining >= 0
                    ? (plan()!.monthlyOverview.totalRemaining | currency:'USD':'symbol':'1.0-0') + ' remaining'
                    : ((-plan()!.monthlyOverview.totalRemaining) | currency:'USD':'symbol':'1.0-0') + ' over budget' }}
                </span>
                <span class="pct-pill" [class.pct-danger]="overallPercent() > 100" [class.pct-warn]="overallPercent() > 80 && overallPercent() <= 100">{{ overallPercent() | number:'1.0-0' }}%</span>
              </div>
            </div>

            <!-- Recurring Categories -->
            @if (recurringCategories().length > 0) {
              <div class="section-block">
                <div class="section-header">
                  <div class="section-title"><span class="section-icon-wrap recurring-wrap"><mat-icon>autorenew</mat-icon></span> Recurring</div>
                  <span class="section-total recurring">{{ recurringTotal() | currency:'USD':'symbol':'1.0-0' }}</span>
                </div>
                @for (row of recurringCategories(); track row.categoryId) {
                  <div class="cat-row" [class.cat-over]="row.remaining < 0">
                    <div class="cat-row-top">
                      <span class="cat-name-cell"><mat-icon class="cat-icon">{{ getIcon(row.categoryName, row.icon) }}</mat-icon> {{ row.categoryName }}</span>
                      <div class="cat-amounts">
                        <span class="cat-spent">{{ row.spent | currency:'USD':'symbol':'1.0-0' }} / {{ row.amount | currency:'USD':'symbol':'1.0-0' }}</span>
                        <span class="cat-remaining" [class.over-budget]="row.remaining < 0" [class.under-budget]="row.remaining >= 0">
                          {{ row.remaining >= 0 ? (row.remaining | currency:'USD':'symbol':'1.0-0') + ' left' : ((-row.remaining) | currency:'USD':'symbol':'1.0-0') + ' over' }}
                        </span>
                      </div>
                    </div>
                    <div class="cat-progress-row">
                      <mat-progress-bar mode="determinate"
                        [value]="Math.min(row.percentUsed, 100)"
                        [color]="row.percentUsed > 100 ? 'warn' : row.percentUsed > 80 ? 'accent' : 'primary'">
                      </mat-progress-bar>
                      <span class="cat-pct">{{ row.percentUsed | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Bills & Spending Categories -->
            @if (billCategories().length > 0) {
              <div class="section-block">
                <div class="section-header">
                  <div class="section-title"><span class="section-icon-wrap bills-wrap"><mat-icon>receipt_long</mat-icon></span> Bills & Spending</div>
                  <span class="section-total bills">{{ billsTotal() | currency:'USD':'symbol':'1.0-0' }}</span>
                </div>
                @for (row of billCategories(); track row.categoryId) {
                  <div class="cat-row" [class.cat-over]="row.remaining < 0">
                    <div class="cat-row-top">
                      <span class="cat-name-cell"><mat-icon class="cat-icon">{{ getIcon(row.categoryName, row.icon) }}</mat-icon> {{ row.categoryName }}</span>
                      <div class="cat-amounts">
                        <span class="cat-spent">{{ row.spent | currency:'USD':'symbol':'1.0-0' }} / {{ row.amount | currency:'USD':'symbol':'1.0-0' }}</span>
                        <span class="cat-remaining" [class.over-budget]="row.remaining < 0" [class.under-budget]="row.remaining >= 0">
                          {{ row.remaining >= 0 ? (row.remaining | currency:'USD':'symbol':'1.0-0') + ' left' : ((-row.remaining) | currency:'USD':'symbol':'1.0-0') + ' over' }}
                        </span>
                      </div>
                    </div>
                    <div class="cat-progress-row">
                      <mat-progress-bar mode="determinate"
                        [value]="Math.min(row.percentUsed, 100)"
                        [color]="row.percentUsed > 100 ? 'warn' : row.percentUsed > 80 ? 'accent' : 'primary'">
                      </mat-progress-bar>
                      <span class="cat-pct">{{ row.percentUsed | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Debt Payments -->
            @if (debtCategories().length > 0) {
              <div class="section-block">
                <div class="section-header">
                  <div class="section-title"><span class="section-icon-wrap debt-wrap"><mat-icon>credit_score</mat-icon></span> Debt Payments</div>
                  <span class="section-total debt">{{ debtTotal() | currency:'USD':'symbol':'1.0-0' }}</span>
                </div>
                @for (row of debtCategories(); track row.categoryName) {
                  <div class="cat-row" [class.cat-paid]="row.spent >= row.amount">
                    <div class="cat-row-top">
                      <span class="cat-name-cell"><mat-icon class="cat-icon debt-icon">credit_score</mat-icon> {{ row.categoryName }}</span>
                      <div class="cat-amounts">
                        <span class="cat-spent">{{ row.spent | currency:'USD':'symbol':'1.0-0' }} / {{ row.amount | currency:'USD':'symbol':'1.0-0' }}</span>
                        <span class="cat-remaining" [class.debt-paid]="row.spent >= row.amount" [class.debt-pending]="row.spent < row.amount">
                          {{ row.spent >= row.amount ? 'Paid' : (row.amount - row.spent | currency:'USD':'symbol':'1.0-0') + ' pending' }}
                        </span>
                      </div>
                    </div>
                    <div class="cat-progress-row">
                      <mat-progress-bar mode="determinate"
                        [value]="Math.min(row.percentUsed, 100)"
                        [color]="row.percentUsed >= 100 ? 'primary' : row.percentUsed > 0 ? 'accent' : 'warn'">
                      </mat-progress-bar>
                      <span class="cat-pct">{{ row.percentUsed | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>

        <!-- Paycheck Breakdown Tab -->
        <mat-tab label="Paycheck Breakdown">
          <div class="tab-content">
            @for (pc of plan()!.paycheckBreakdowns; track pc.payDate) {
              <div class="paycheck-card">
                <div class="paycheck-header">
                  <div class="paycheck-title">
                    <mat-icon class="paycheck-cal-icon">event</mat-icon>
                    <span>{{ pc.payDate | localDate:'EEEE, MMM d' }}</span>
                  </div>
                  <span class="paycheck-take-home">{{ pc.grossPay | currency:'USD':'symbol':'1.0-0' }}</span>
                </div>
                <div class="paycheck-progress-row">
                  <mat-progress-bar mode="determinate" [value]="getSpendPercent(pc)"
                    [color]="pc.leftover < 0 ? 'warn' : 'primary'">
                  </mat-progress-bar>
                  <div class="paycheck-labels">
                    <span class="paycheck-allocated">{{ pc.totalExpenses | currency:'USD':'symbol':'1.0-0' }} allocated</span>
                    <span class="paycheck-leftover" [class.negative]="pc.leftover < 0">{{ pc.leftover | currency:'USD':'symbol':'1.0-0' }} left</span>
                  </div>
                </div>
                @if (pc.expenses.length > 0) {
                  <div class="paycheck-expenses">
                    @for (e of pc.expenses; track e.expenseId; let odd = $odd) {
                      <div class="expense-row" [class.alt-row]="odd">
                        <div class="expense-name">
                          {{ e.name }}
                          @if (e.isDebtPayment) { <mat-icon class="inline-badge debt-badge" matTooltip="Debt Payment">credit_score</mat-icon> }
                          @if (e.isAutopay) { <mat-icon class="inline-badge auto-badge" matTooltip="Autopay">autorenew</mat-icon> }
                        </div>
                        <span class="expense-due">{{ e.dueDay ? 'Day ' + e.dueDay : '' }}</span>
                        <span class="expense-amount">{{ e.amount | currency }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="paycheck-empty">
                    <mat-icon>check_circle</mat-icon>
                    <span>No expenses assigned to this paycheck</span>
                  </div>
                }
              </div>
            }

            @if (plan()!.paycheckBreakdowns.length === 0) {
              <div class="empty-state">
                <div class="empty-icon-wrap blue">
                  <mat-icon>calendar_today</mat-icon>
                </div>
                <h3>No paychecks found</h3>
                <p>Set your pay frequency and next pay date in Setup to see your paycheck breakdown.</p>
                <a mat-raised-button color="primary" routerLink="/setup">
                  <mat-icon>settings</mat-icon> Go to Setup
                </a>
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    } @else {
      <div class="empty-state">
        <div class="empty-icon-wrap amber">
          <mat-icon>account_balance_wallet</mat-icon>
        </div>
        <h3>Set up your budget</h3>
        <p>Add your pay information and budget items to start tracking your spending.</p>
        <a mat-raised-button color="primary" routerLink="/setup">
          <mat-icon>settings</mat-icon> Go to Setup
        </a>
      </div>
    }
    </div>
  `,
  styles: [`
    /* Month Navigator */
    .month-nav-row {
      display: flex; align-items: center; justify-content: flex-end;
      gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); flex-wrap: wrap;
    }
    .month-nav { display: flex; align-items: center; gap: var(--spacing-xs); }
    .month-label {
      font-size: var(--text-lg); font-weight: var(--weight-bold);
      min-width: 160px; text-align: center; letter-spacing: -0.01em;
    }
    .today-btn {
      font-size: var(--text-xs) !important; padding: 0 12px !important;
      height: 32px !important; line-height: 32px !important;
      border-radius: var(--radius-full) !important;
    }
    .today-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    .tab-content { padding: var(--spacing-sm) 0; }

    /* Stats Row */
    .stats-row {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm); margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px; padding: 16px;
      border-radius: var(--radius-md); background: var(--color-surface-solid);
      border: 1px solid var(--color-border); box-shadow: var(--shadow-xs);
      transition: box-shadow var(--transition-base), transform var(--transition-base);
    }
    @media (hover: hover) {
      .stat-card:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
    }
    .stat-card mat-icon {
      font-size: 26px; width: 26px; height: 26px; padding: 10px;
      border-radius: var(--radius-sm); box-sizing: content-box; overflow: visible; flex-shrink: 0;
    }
    .stat-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-purple mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .stat-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-red mat-icon { color: var(--color-danger); background: var(--color-danger-bg); }
    .stat-content { display: flex; flex-direction: column; min-width: 0; }
    .stat-value {
      font-size: 1.25rem; font-weight: var(--weight-bold); color: var(--color-text);
      letter-spacing: -0.02em; line-height: var(--leading-tight);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .stat-label {
      font-size: var(--text-xs); color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: var(--tracking-wide);
      font-weight: var(--weight-semibold); margin-top: 2px;
    }
    .stat-sub { text-transform: none; font-weight: var(--weight-normal); }

    /* Overall Progress Card */
    .progress-card {
      background: var(--color-surface-solid); border-radius: var(--radius-md);
      padding: 18px 20px; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-xs);
      border: 1px solid var(--color-border);
    }
    .progress-card.over { border-color: var(--color-danger-bg); }
    .progress-card-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 14px; gap: 12px; flex-wrap: wrap;
    }
    .progress-title-row { display: flex; align-items: center; gap: 10px; }
    .progress-icon { font-size: 22px; width: 22px; height: 22px; color: var(--color-primary); }
    .progress-title { font-weight: var(--weight-bold); font-size: var(--text-base); display: block; }
    .progress-message {
      font-size: var(--text-xs); font-weight: var(--weight-semibold); display: block; margin-top: 2px;
    }
    .msg-success { color: var(--color-success-text); }
    .msg-warn { color: var(--color-warning-text); }
    .msg-danger { color: var(--color-danger-text); }
    .progress-meta { text-align: right; }
    .progress-amounts { font-size: var(--text-sm); font-weight: var(--weight-semibold); display: block; }
    .of-text { font-weight: var(--weight-normal); opacity: 0.5; font-size: var(--text-xs); }
    .days-left {
      font-size: var(--text-xs); color: var(--color-text-muted);
      font-weight: var(--weight-medium); display: block; margin-top: 2px;
    }
    .progress-bar-wrap { margin-bottom: 12px; }
    .progress-card-footer {
      display: flex; justify-content: space-between; align-items: center;
    }
    .remaining-pill {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: var(--text-sm); font-weight: var(--weight-semibold);
      padding: 4px 10px; border-radius: var(--radius-full);
    }
    .pill-icon { font-size: 16px; width: 16px; height: 16px; }
    .pill-success { color: var(--color-success-text); background: var(--color-success-bg); }
    .pill-danger { color: var(--color-danger-text); background: var(--color-danger-bg); }
    .pct-pill {
      font-size: var(--text-sm); font-weight: var(--weight-bold); padding: 4px 12px;
      border-radius: var(--radius-full); background: var(--color-surface-secondary);
    }
    .pct-danger { background: var(--color-danger-bg) !important; color: var(--color-danger-text) !important; }
    .pct-warn { background: var(--color-warning-bg) !important; color: var(--color-warning-text) !important; }

    /* Section Blocks */
    .section-block {
      background: var(--color-surface-solid); border-radius: var(--radius-md);
      box-shadow: var(--shadow-xs); margin-bottom: var(--spacing-md); overflow: hidden;
      border: 1px solid var(--color-border);
    }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
    }
    .section-title {
      display: flex; align-items: center; gap: 10px;
      font-weight: var(--weight-bold); font-size: var(--text-base);
    }
    .section-icon-wrap {
      width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .section-icon-wrap mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .recurring-wrap { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }
    .bills-wrap { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .debt-wrap { background: var(--color-danger-bg); color: var(--color-danger-text); }
    .section-total { font-size: var(--text-base); font-weight: var(--weight-bold); }
    .section-total.recurring { color: var(--color-stat-purple); }
    .section-total.bills { color: var(--color-stat-blue); }
    .section-total.debt { color: var(--color-danger-text); }

    /* Category Rows (unified responsive) */
    .cat-row {
      padding: 12px 16px; border-bottom: 1px solid var(--color-border);
      transition: background var(--transition-fast);
    }
    .cat-row:last-child { border-bottom: none; }
    .cat-row.cat-over { background: var(--color-danger-bg); }
    .cat-row.cat-paid { background: var(--color-success-bg); }
    @media (hover: hover) {
      .cat-row:hover { background: var(--color-surface-hover); }
      .cat-row.cat-over:hover { background: var(--color-danger-bg); }
      .cat-row.cat-paid:hover { background: var(--color-success-bg); }
    }
    .cat-row-top {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; margin-bottom: 8px;
    }
    .cat-name-cell {
      display: flex; align-items: center; gap: 8px;
      font-weight: var(--weight-medium); font-size: var(--text-sm);
      min-width: 0; flex: 1;
    }
    .cat-icon { font-size: 18px; width: 18px; height: 18px; opacity: 0.6; flex-shrink: 0; }
    .cat-icon.debt-icon { color: var(--color-danger); opacity: 0.8; }
    .cat-amounts { text-align: right; flex-shrink: 0; }
    .cat-spent { font-size: var(--text-sm); font-weight: var(--weight-medium); display: block; }
    .cat-remaining { font-size: var(--text-xs); display: block; margin-top: 1px; }
    .cat-remaining.over-budget { color: var(--color-danger-text); font-weight: var(--weight-semibold); }
    .cat-remaining.under-budget { color: var(--color-success-text); }
    .cat-remaining.debt-paid { color: var(--color-success-text); font-weight: var(--weight-semibold); }
    .cat-remaining.debt-pending { color: var(--color-warning-text); font-weight: var(--weight-medium); }
    .cat-progress-row { display: flex; align-items: center; gap: 10px; }
    .cat-progress-row mat-progress-bar { flex: 1; }
    .cat-pct { font-size: var(--text-xs); font-weight: var(--weight-bold); opacity: 0.7; min-width: 32px; text-align: right; }

    /* Paycheck Breakdown */
    .paycheck-card {
      background: var(--color-surface-solid); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); box-shadow: var(--shadow-xs);
      margin-bottom: var(--spacing-md); overflow: hidden;
    }
    .paycheck-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
    }
    .paycheck-title {
      display: flex; align-items: center; gap: 8px;
      font-weight: var(--weight-bold); font-size: var(--text-base);
    }
    .paycheck-cal-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .paycheck-take-home { font-weight: var(--weight-bold); font-size: var(--text-base); color: var(--color-primary); }
    .paycheck-progress-row { padding: 14px 16px; }
    .paycheck-labels {
      display: flex; justify-content: space-between; margin-top: 6px; font-size: var(--text-xs);
    }
    .paycheck-allocated { color: var(--color-text-muted); font-weight: var(--weight-medium); }
    .paycheck-leftover { font-weight: var(--weight-semibold); color: var(--color-success-text); }
    .paycheck-leftover.negative { color: var(--color-danger-text); }
    .paycheck-expenses { border-top: 1px solid var(--color-border); }
    .expense-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 16px; font-size: var(--text-sm); gap: 8px;
    }
    .alt-row { background: var(--color-surface-secondary); }
    .expense-name {
      flex: 1; min-width: 0; font-weight: var(--weight-medium);
      display: flex; align-items: center; gap: 4px;
    }
    .inline-badge { font-size: 15px; width: 15px; height: 15px; opacity: 0.5; }
    .debt-badge { color: var(--color-accent); }
    .auto-badge { color: var(--color-text-muted); }
    .expense-due { font-size: var(--text-xs); color: var(--color-text-muted); min-width: 48px; text-align: center; }
    .expense-amount { font-weight: var(--weight-semibold); white-space: nowrap; }
    .paycheck-empty {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 24px 16px; color: var(--color-text-muted); font-size: var(--text-sm);
      border-top: 1px solid var(--color-border);
    }
    .paycheck-empty mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-success); }

    /* Empty & Error States */
    .empty-state { text-align: center; padding: 48px 24px; }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-icon-wrap.amber { background: var(--color-stat-amber-bg); }
    .empty-icon-wrap.amber mat-icon { color: var(--color-stat-amber); font-size: 32px; width: 32px; height: 32px; }
    .empty-icon-wrap.blue { background: var(--color-stat-blue-bg); }
    .empty-icon-wrap.blue mat-icon { color: var(--color-stat-blue); font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { font-weight: var(--weight-bold); margin-bottom: 8px; }
    .empty-state p { color: var(--color-text-muted); font-size: var(--text-sm); max-width: 320px; margin: 0 auto 20px; line-height: var(--leading-relaxed); }
    .error-state { text-align: center; padding: 48px 24px; }
    .error-icon { font-size: 48px; width: 48px; height: 48px; color: var(--color-text-muted); margin-bottom: 12px; }
    .error-state h3 { font-weight: var(--weight-bold); margin-bottom: 8px; }
    .error-state p { color: var(--color-text-muted); font-size: var(--text-sm); max-width: 320px; margin: 0 auto 20px; }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .progress-card-header { flex-direction: column; }
      .progress-meta { text-align: left; }
      .paycheck-header { flex-direction: column; align-items: flex-start; gap: 4px; }
    }
    @media (max-width: 599px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px 10px; gap: 8px; }
      .stat-card mat-icon { font-size: 22px; width: 22px; height: 22px; padding: 8px; }
      .stat-value { font-size: 1rem; }
      .cat-row-top { flex-direction: column; align-items: flex-start; gap: 4px; }
      .cat-amounts { text-align: left; }
      .expense-due { display: none; }
    }
  `]
})
export class BudgetPageComponent implements OnInit {
  protected Math = Math;
  private budgetService = inject(BudgetService);
  getIcon = (name: string, icon?: string | null) => inferCategoryIcon(name, icon);

  plan = signal<BudgetPlan | null>(null);
  loading = signal(true);
  hasError = signal(false);

  recurringCategories = computed(() => this.plan()?.monthlyOverview.byCategory.filter(c => c.isRecurring) ?? []);
  billCategories = computed(() => this.plan()?.monthlyOverview.byCategory.filter(c => !c.isDebt && !c.isRecurring) ?? []);
  debtCategories = computed(() => this.plan()?.monthlyOverview.byCategory.filter(c => c.isDebt) ?? []);
  recurringTotal = computed(() => this.recurringCategories().reduce((sum, c) => sum + c.amount, 0));
  debtTotal = computed(() => this.debtCategories().reduce((sum, c) => sum + c.amount, 0));
  billsTotal = computed(() => this.billCategories().reduce((sum, c) => sum + c.amount, 0));
  overallPercent = computed(() => {
    const overview = this.plan()?.monthlyOverview;
    if (!overview || overview.totalExpenses === 0) return 0;
    return Math.round(overview.totalSpent / overview.totalExpenses * 100);
  });

  isCurrentMonth = computed(() => {
    const now = new Date();
    return this.currentYear === now.getFullYear() && this.currentMonth === now.getMonth() + 1;
  });

  daysRemaining = computed(() => {
    const now = new Date();
    const lastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    return Math.max(0, lastDay - now.getDate());
  });

  progressMessage = computed(() => {
    const pct = this.overallPercent();
    if (pct > 100) return 'Over budget — review your spending';
    if (pct > 90) return 'Approaching your limit';
    if (pct > 75) return 'Watch your spending';
    if (pct > 50) return 'On track — keep it up!';
    return 'Great control this month!';
  });

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  monthLabel = signal('');

  ngOnInit(): void {
    this.updateMonthLabel();
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.hasError.set(false);
    this.budgetService.getPlan(this.currentYear, this.currentMonth).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
      },
      error: () => {
        this.plan.set(null);
        this.loading.set(false);
        this.hasError.set(true);
      }
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

  goToCurrentMonth(): void {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;
    this.updateMonthLabel();
    this.loadData();
  }

  private updateMonthLabel(): void {
    const date = new Date(this.currentYear, this.currentMonth - 1, 1);
    this.monthLabel.set(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }

  getSpendPercent(pc: PaycheckBreakdown): number {
    if (pc.grossPay === 0) return 0;
    return Math.min(100, (pc.totalExpenses / pc.grossPay) * 100);
  }
}
