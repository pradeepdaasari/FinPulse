import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetPlan, PaycheckBreakdown } from '../../core/models/budget.model';
import { RouterLink } from '@angular/router';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressBarModule, MatChipsModule,
    MatTooltipModule, CurrencyPipe, DatePipe, DecimalPipe,
    SkeletonLoaderComponent, PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    <div class="budget-header">
      <div class="month-nav">
        <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
        <span class="month-label">{{ monthLabel() }}</span>
        <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
      </div>
    </div>

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else if (plan()) {
      <mat-tab-group animationDuration="200ms">
        <!-- Monthly Overview Tab -->
        <mat-tab label="Monthly Overview">
          <div class="tab-content">
            <!-- Stat Cards -->
            <div class="stat-cards">
              <div class="stat-card income">
                <div class="stat-icon-wrap income-icon"><mat-icon>account_balance_wallet</mat-icon></div>
                <div class="stat-info">
                  <span class="stat-value">{{ plan()!.monthlyOverview.totalIncome | currency }}</span>
                  <span class="stat-label">Income <span class="stat-sub">({{ plan()!.monthlyOverview.paychecksThisMonth }} paychecks)</span></span>
                </div>
              </div>
              <div class="stat-card budgeted">
                <div class="stat-icon-wrap budgeted-icon"><mat-icon>assignment</mat-icon></div>
                <div class="stat-info">
                  <span class="stat-value">{{ plan()!.monthlyOverview.totalExpenses | currency }}</span>
                  <span class="stat-label">Budgeted</span>
                </div>
              </div>
              <div class="stat-card spent">
                <div class="stat-icon-wrap spent-icon"><mat-icon>shopping_cart</mat-icon></div>
                <div class="stat-info">
                  <span class="stat-value">{{ plan()!.monthlyOverview.totalSpent | currency }}</span>
                  <span class="stat-label">Spent</span>
                </div>
              </div>
              <div class="stat-card" [class.surplus]="plan()!.monthlyOverview.totalRemaining >= 0" [class.deficit]="plan()!.monthlyOverview.totalRemaining < 0">
                <div class="stat-icon-wrap" [class.surplus-icon]="plan()!.monthlyOverview.totalRemaining >= 0" [class.deficit-icon]="plan()!.monthlyOverview.totalRemaining < 0">
                  <mat-icon>{{ plan()!.monthlyOverview.totalRemaining >= 0 ? 'savings' : 'warning' }}</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ plan()!.monthlyOverview.totalRemaining | currency }}</span>
                  <span class="stat-label">{{ plan()!.monthlyOverview.totalRemaining >= 0 ? 'Remaining' : 'Over Budget' }}</span>
                </div>
              </div>
            </div>

            <!-- Overall Progress -->
            <div class="overall-progress-section" [class.over]="overallPercent() > 100">
              <div class="overall-progress-header">
                <div class="progress-title-row">
                  <mat-icon class="progress-icon">donut_large</mat-icon>
                  <span class="progress-title">Monthly Spending</span>
                </div>
                <span class="progress-amounts">{{ plan()!.monthlyOverview.totalSpent | currency }} <span class="of-label">of</span> {{ plan()!.monthlyOverview.totalExpenses | currency }}</span>
              </div>
              <div class="progress-bar-wrap">
                <mat-progress-bar mode="determinate"
                  [value]="overallPercent()"
                  [color]="overallPercent() > 100 ? 'warn' : overallPercent() > 80 ? 'accent' : 'primary'">
                </mat-progress-bar>
              </div>
              <div class="overall-progress-footer">
                <span class="remaining-badge" [class.over-budget]="plan()!.monthlyOverview.totalRemaining < 0" [class.under-budget]="plan()!.monthlyOverview.totalRemaining >= 0">
                  <mat-icon class="remaining-icon">{{ plan()!.monthlyOverview.totalRemaining >= 0 ? 'check_circle' : 'error' }}</mat-icon>
                  {{ plan()!.monthlyOverview.totalRemaining >= 0
                    ? (plan()!.monthlyOverview.totalRemaining | currency) + ' remaining'
                    : ((-plan()!.monthlyOverview.totalRemaining) | currency) + ' over budget' }}
                </span>
                <span class="percent-badge" [class.pct-danger]="overallPercent() > 100" [class.pct-warn]="overallPercent() > 80 && overallPercent() <= 100">{{ overallPercent() | number:'1.0-0' }}%</span>
              </div>
            </div>

            <!-- Recurring Categories -->
            @if (recurringCategories().length > 0) {
              <div class="section-block">
                <div class="section-header">
                  <div class="section-title"><span class="section-icon-wrap recurring-wrap"><mat-icon>autorenew</mat-icon></span> Recurring</div>
                  <span class="section-total recurring">{{ recurringTotal() | currency }}</span>
                </div>
                <!-- Desktop table -->
                <div class="desktop-only">
                  <table mat-table [dataSource]="recurringCategories()" class="category-table">
                    <ng-container matColumnDef="categoryName">
                      <th mat-header-cell *matHeaderCellDef>Category</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="category-name-cell">
                          <mat-icon class="category-icon">{{ row.icon || 'autorenew' }}</mat-icon>
                          {{ row.categoryName }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="progress">
                      <th mat-header-cell *matHeaderCellDef>Progress</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="progress-cell">
                          <mat-progress-bar mode="determinate"
                            [value]="Math.min(row.percentUsed, 100)"
                            [color]="row.percentUsed > 100 ? 'warn' : row.percentUsed > 80 ? 'accent' : 'primary'">
                          </mat-progress-bar>
                          <span class="progress-percent">{{ row.percentUsed | number:'1.0-0' }}%</span>
                        </div>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="amounts">
                      <th mat-header-cell *matHeaderCellDef>Spent / Budget</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="amounts-cell">
                          <span class="amounts-main">{{ row.spent | currency }} / {{ row.amount | currency }}</span>
                          <span class="amounts-remaining" [class.over-budget]="row.remaining < 0" [class.under-budget]="row.remaining >= 0">
                            {{ row.remaining >= 0 ? (row.remaining | currency) + ' left' : ((-row.remaining) | currency) + ' over' }}
                          </span>
                        </div>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
                  </table>
                </div>
                <!-- Mobile cards -->
                <div class="mobile-only">
                  @for (row of recurringCategories(); track row.categoryId) {
                    <div class="budget-card" [class.over]="row.remaining < 0">
                      <div class="budget-card-top">
                        <span class="category-name-cell"><mat-icon class="category-icon">{{ row.icon || 'autorenew' }}</mat-icon> {{ row.categoryName }}</span>
                        <span class="budget-card-amount">{{ row.spent | currency }} / {{ row.amount | currency }}</span>
                      </div>
                      <mat-progress-bar mode="determinate" [value]="Math.min(row.percentUsed, 100)"
                        [color]="row.percentUsed > 100 ? 'warn' : row.percentUsed > 80 ? 'accent' : 'primary'">
                      </mat-progress-bar>
                      <div class="budget-card-bottom">
                        <span class="amounts-remaining" [class.over-budget]="row.remaining < 0" [class.under-budget]="row.remaining >= 0">
                          {{ row.remaining >= 0 ? (row.remaining | currency) + ' left' : ((-row.remaining) | currency) + ' over' }}
                        </span>
                        <span class="progress-percent">{{ row.percentUsed | number:'1.0-0' }}%</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Bills & Spending Categories -->
            @if (billCategories().length > 0) {
              <div class="section-block">
                <div class="section-header">
                  <div class="section-title"><span class="section-icon-wrap bills-wrap"><mat-icon>receipt_long</mat-icon></span> Bills & Spending</div>
                  <span class="section-total bills">{{ billsTotal() | currency }}</span>
                </div>
                <div class="desktop-only">
                  <table mat-table [dataSource]="billCategories()" class="category-table">
                    <ng-container matColumnDef="categoryName">
                      <th mat-header-cell *matHeaderCellDef>Category</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="category-name-cell">
                          <mat-icon class="category-icon">{{ row.icon || (row.isFixed ? 'payments' : 'shopping_bag') }}</mat-icon>
                          {{ row.categoryName }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="progress">
                      <th mat-header-cell *matHeaderCellDef>Progress</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="progress-cell">
                          <mat-progress-bar mode="determinate"
                            [value]="Math.min(row.percentUsed, 100)"
                            [color]="row.percentUsed > 100 ? 'warn' : row.percentUsed > 80 ? 'accent' : 'primary'">
                          </mat-progress-bar>
                          <span class="progress-percent">{{ row.percentUsed | number:'1.0-0' }}%</span>
                        </div>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="amounts">
                      <th mat-header-cell *matHeaderCellDef>Spent / Budget</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="amounts-cell">
                          <span class="amounts-main">{{ row.spent | currency }} / {{ row.amount | currency }}</span>
                          <span class="amounts-remaining" [class.over-budget]="row.remaining < 0" [class.under-budget]="row.remaining >= 0">
                            {{ row.remaining >= 0 ? (row.remaining | currency) + ' left' : ((-row.remaining) | currency) + ' over' }}
                          </span>
                        </div>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
                  </table>
                </div>
                <div class="mobile-only">
                  @for (row of billCategories(); track row.categoryId) {
                    <div class="budget-card" [class.over]="row.remaining < 0">
                      <div class="budget-card-top">
                        <span class="category-name-cell"><mat-icon class="category-icon">{{ row.icon || (row.isFixed ? 'payments' : 'shopping_bag') }}</mat-icon> {{ row.categoryName }}</span>
                        <span class="budget-card-amount">{{ row.spent | currency }} / {{ row.amount | currency }}</span>
                      </div>
                      <mat-progress-bar mode="determinate" [value]="Math.min(row.percentUsed, 100)"
                        [color]="row.percentUsed > 100 ? 'warn' : row.percentUsed > 80 ? 'accent' : 'primary'">
                      </mat-progress-bar>
                      <div class="budget-card-bottom">
                        <span class="amounts-remaining" [class.over-budget]="row.remaining < 0" [class.under-budget]="row.remaining >= 0">
                          {{ row.remaining >= 0 ? (row.remaining | currency) + ' left' : ((-row.remaining) | currency) + ' over' }}
                        </span>
                        <span class="progress-percent">{{ row.percentUsed | number:'1.0-0' }}%</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Debt Payments -->
            @if (debtCategories().length > 0) {
              <div class="section-block">
                <div class="section-header">
                  <div class="section-title"><span class="section-icon-wrap debt-wrap"><mat-icon>credit_score</mat-icon></span> Debt Payments</div>
                  <span class="section-total debt">{{ debtTotal() | currency }}</span>
                </div>
                <div class="desktop-only">
                  <table mat-table [dataSource]="debtCategories()" class="category-table">
                    <ng-container matColumnDef="categoryName">
                      <th mat-header-cell *matHeaderCellDef>Lender</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="category-name-cell">
                          <mat-icon class="category-icon debt">credit_score</mat-icon>
                          {{ row.categoryName }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="progress">
                      <th mat-header-cell *matHeaderCellDef>Progress</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="progress-cell">
                          <mat-progress-bar mode="determinate"
                            [value]="Math.min(row.percentUsed, 100)"
                            [color]="row.percentUsed >= 100 ? 'primary' : row.percentUsed > 0 ? 'accent' : 'warn'">
                          </mat-progress-bar>
                          <span class="progress-percent">{{ row.percentUsed | number:'1.0-0' }}%</span>
                        </div>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="amounts">
                      <th mat-header-cell *matHeaderCellDef>Paid / Min. Payment</th>
                      <td mat-cell *matCellDef="let row">
                        <div class="amounts-cell">
                          <span class="amounts-main">{{ row.spent | currency }} / {{ row.amount | currency }}</span>
                          <span class="amounts-remaining" [class.debt-paid]="row.spent >= row.amount" [class.debt-pending]="row.spent < row.amount">
                            {{ row.spent >= row.amount ? 'Paid' : (row.amount - row.spent | currency) + ' pending' }}
                          </span>
                        </div>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
                  </table>
                </div>
                <div class="mobile-only">
                  @for (row of debtCategories(); track row.categoryName) {
                    <div class="budget-card" [class.debt-done]="row.spent >= row.amount">
                      <div class="budget-card-top">
                        <span class="category-name-cell"><mat-icon class="category-icon debt">credit_score</mat-icon> {{ row.categoryName }}</span>
                        <span class="budget-card-amount">{{ row.spent | currency }} / {{ row.amount | currency }}</span>
                      </div>
                      <mat-progress-bar mode="determinate" [value]="Math.min(row.percentUsed, 100)"
                        [color]="row.percentUsed >= 100 ? 'primary' : row.percentUsed > 0 ? 'accent' : 'warn'">
                      </mat-progress-bar>
                      <div class="budget-card-bottom">
                        <span class="amounts-remaining" [class.debt-paid]="row.spent >= row.amount" [class.debt-pending]="row.spent < row.amount">
                          {{ row.spent >= row.amount ? 'Paid' : (row.amount - row.spent | currency) + ' pending' }}
                        </span>
                        <span class="progress-percent">{{ row.percentUsed | number:'1.0-0' }}%</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </mat-tab>

        <!-- Paycheck Breakdown Tab -->
        <mat-tab label="Paycheck Breakdown">
          <div class="tab-content">
            @for (pc of plan()!.paycheckBreakdowns; track pc.payDate) {
              <mat-card class="paycheck-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon>event</mat-icon>
                    {{ pc.payDate | date:'EEEE, MMM d' }}
                  </mat-card-title>
                  <mat-card-subtitle>
                    Take-home: {{ pc.grossPay | currency }}
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="paycheck-progress">
                    <mat-progress-bar mode="determinate" [value]="getSpendPercent(pc)"></mat-progress-bar>
                    <div class="progress-labels">
                      <span>{{ pc.totalExpenses | currency }} allocated</span>
                      <span class="leftover" [class.negative]="pc.leftover < 0">{{ pc.leftover | currency }} left</span>
                    </div>
                  </div>

                  @if (pc.expenses.length > 0) {
                    <table mat-table [dataSource]="pc.expenses" class="expense-table">
                      <ng-container matColumnDef="name">
                        <th mat-header-cell *matHeaderCellDef>Expense</th>
                        <td mat-cell *matCellDef="let e">
                          {{ e.name }}
                          @if (e.isDebtPayment) {
                            <mat-icon class="debt-icon" matTooltip="Debt Payment">credit_score</mat-icon>
                          }
                          @if (e.isAutopay) {
                            <mat-icon class="autopay-icon" matTooltip="Autopay">autorenew</mat-icon>
                          }
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="dueDay">
                        <th mat-header-cell *matHeaderCellDef>Due</th>
                        <td mat-cell *matCellDef="let e">{{ e.dueDay ? 'Day ' + e.dueDay : '—' }}</td>
                      </ng-container>
                      <ng-container matColumnDef="amount">
                        <th mat-header-cell *matHeaderCellDef>Amount</th>
                        <td mat-cell *matCellDef="let e">{{ e.amount | currency }}</td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="paycheckExpenseColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: paycheckExpenseColumns;"></tr>
                    </table>
                  } @else {
                    <p class="no-expenses">No expenses assigned to this paycheck.</p>
                  }
                </mat-card-content>
              </mat-card>
            }

            @if (plan()!.paycheckBreakdowns.length === 0) {
              <mat-card>
                <mat-card-content>
                  <p>No paychecks found for this month. Please set your pay frequency and next pay date in the Setup wizard.</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    } @else {
      <mat-card>
        <mat-card-content>
          <p>Set up your profile with pay information to see your budget plan.</p>
          <a mat-raised-button color="primary" routerLink="/setup">Go to Setup</a>
        </mat-card-content>
      </mat-card>
    }
    </div>
  `,
  styles: [`
    .budget-header {
      display: flex; align-items: center; justify-content: flex-end;
      flex-wrap: wrap; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);
    }
    .month-nav { display: flex; align-items: center; gap: var(--spacing-xs); }
    .month-label { font-size: 1.15rem; font-weight: 700; min-width: 160px; text-align: center; }
    .tab-content { padding: var(--spacing-sm) 0; }

    /* Stat Cards */
    .stat-cards {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 12px; margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
      transition: var(--transition-fast);
    }
    .stat-card:hover { box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08)); transform: translateY(-1px); }
    .stat-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .income-icon { background: rgba(33,150,243,0.12); color: #1976d2; }
    .budgeted-icon { background: rgba(255,152,0,0.12); color: #f57c00; }
    .spent-icon { background: rgba(156,39,176,0.12); color: #7b1fa2; }
    .surplus-icon { background: rgba(76,175,80,0.12); color: #388e3c; }
    .deficit-icon { background: rgba(244,67,54,0.12); color: #d32f2f; }
    .stat-info { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.15rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .stat-label { font-size: 0.72rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; font-weight: 500; margin-top: 2px; }
    .stat-sub { text-transform: none; font-weight: 400; }
    .stat-card.income .stat-value { color: #1976d2; }
    .stat-card.budgeted .stat-value { color: #f57c00; }
    .stat-card.spent .stat-value { color: #7b1fa2; }
    .stat-card.surplus .stat-value { color: var(--color-success); }
    .stat-card.deficit .stat-value { color: var(--color-danger); }
    .stat-card.surplus { border-color: rgba(76,175,80,0.3); background: linear-gradient(135deg, rgba(76,175,80,0.04), transparent); }
    .stat-card.deficit { border-color: rgba(244,67,54,0.3); background: linear-gradient(135deg, rgba(244,67,54,0.04), transparent); }

    /* Overall Progress */
    .overall-progress-section {
      background: var(--color-surface); border-radius: var(--radius-md);
      padding: 18px 20px; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
    }
    .overall-progress-section.over { border-color: rgba(244,67,54,0.3); }
    .overall-progress-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    }
    .progress-title-row { display: flex; align-items: center; gap: 8px; }
    .progress-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .progress-title { font-weight: 700; font-size: 0.95rem; }
    .progress-amounts { font-size: 0.9rem; font-weight: 600; }
    .of-label { font-weight: 400; opacity: 0.5; font-size: 0.8rem; }
    .progress-bar-wrap { margin-bottom: 10px; }
    .progress-bar-wrap ::ng-deep .mdc-linear-progress__bar-inner { border-radius: 4px; }
    .overall-progress-footer {
      display: flex; justify-content: space-between; align-items: center;
    }
    .remaining-badge {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 0.82rem; font-weight: 600;
      padding: 4px 10px; border-radius: var(--radius-full);
    }
    .remaining-icon { font-size: 16px; width: 16px; height: 16px; }
    .remaining-badge.over-budget { color: var(--color-danger); background: rgba(244,67,54,0.08); }
    .remaining-badge.under-budget { color: var(--color-success); background: rgba(76,175,80,0.08); }
    .percent-badge {
      font-size: 0.85rem; font-weight: 700; padding: 4px 12px;
      border-radius: var(--radius-full); background: var(--color-surface-secondary);
    }
    .percent-badge.pct-danger { background: rgba(244,67,54,0.1); color: var(--color-danger); }
    .percent-badge.pct-warn { background: rgba(255,152,0,0.1); color: #f57c00; }

    /* Section Blocks */
    .section-block {
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-md); overflow: hidden;
      border: 1px solid var(--color-border);
    }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
    }
    .section-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1rem; }
    .section-icon-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .section-icon-wrap mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .recurring-wrap { background: rgba(156,39,176,0.1); color: #7b1fa2; }
    .bills-wrap { background: rgba(33,150,243,0.1); color: #1976d2; }
    .debt-wrap { background: rgba(244,67,54,0.1); color: #d32f2f; }
    .section-total { font-size: 1rem; font-weight: 800; }
    .section-total.recurring { color: #7b1fa2; }
    .section-total.bills { color: #1976d2; }
    .section-total.debt { color: #d32f2f; }

    /* Category Table */
    .category-table { width: 100%; }
    .category-name-cell { display: flex; align-items: center; gap: 8px; }
    .category-icon { font-size: 18px; height: 18px; width: 18px; opacity: 0.6; }
    .category-icon.debt { color: var(--color-danger); opacity: 0.8; }

    .progress-cell { display: flex; align-items: center; gap: 10px; min-width: 160px; }
    .progress-cell mat-progress-bar { flex: 1; }
    .progress-percent { font-size: 0.78rem; font-weight: 700; opacity: 0.7; white-space: nowrap; }

    .amounts-cell { display: flex; flex-direction: column; gap: 2px; }
    .amounts-main { font-size: 0.85rem; font-weight: 500; }
    .amounts-remaining { font-size: 0.75rem; }
    .over-budget { color: var(--color-danger); font-weight: 600; }
    .under-budget { color: var(--color-success); }

    /* Mobile Budget Cards */
    .mobile-only { display: none; }
    .budget-card {
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
    }
    .budget-card:last-child { border-bottom: none; }
    .budget-card.over { background: color-mix(in srgb, var(--color-danger) 5%, transparent); }
    .budget-card-top {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 8px;
    }
    .budget-card-amount { font-size: 0.82rem; font-weight: 500; opacity: 0.8; }
    .budget-card-bottom {
      display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.78rem;
    }
    .debt-paid { color: var(--color-success); font-weight: 600; }
    .debt-pending { color: var(--color-warning); font-weight: 500; }
    .budget-card.debt-done { background: color-mix(in srgb, var(--color-success) 5%, transparent); }

    /* Paycheck Breakdown */
    .paycheck-card { margin-bottom: var(--spacing-md); }
    .paycheck-card mat-card-title { display: flex; align-items: center; gap: 8px; }
    .paycheck-progress { margin: var(--spacing-md) 0; }
    .progress-labels { display: flex; justify-content: space-between; margin-top: 4px; font-size: 0.85rem; }
    .leftover { font-weight: 600; color: var(--color-success); }
    .leftover.negative { color: var(--color-danger); }
    .expense-table { width: 100%; }
    .autopay-icon, .debt-icon { font-size: 16px; height: 16px; width: 16px; vertical-align: middle; margin-left: 4px; opacity: 0.6; }
    .debt-icon { color: var(--color-accent); }
    .no-expenses { opacity: 0.6; font-style: italic; }

    @media (max-width: 768px) {
      .stat-cards { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 599px) {
      .stat-cards { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px; gap: 10px; }
      .stat-icon-wrap { width: 36px; height: 36px; }
      .stat-icon-wrap mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .stat-value { font-size: 1rem; }
      .desktop-only { display: none !important; }
      .mobile-only { display: block; }
    }
  `]
})
export class BudgetPageComponent implements OnInit {
  protected Math = Math;
  private budgetService = inject(BudgetService);
  private cdr = inject(ChangeDetectorRef);

  plan = signal<BudgetPlan | null>(null);
  loading = signal(true);

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

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  categoryColumns = ['categoryName', 'progress', 'amounts'];
  paycheckExpenseColumns = ['name', 'dueDay', 'amount'];

  monthLabel = signal('');

  ngOnInit(): void {
    this.updateMonthLabel();
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.budgetService.getPlan(this.currentYear, this.currentMonth).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.plan.set(null);
        this.loading.set(false);
        this.cdr.detectChanges();
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

  private updateMonthLabel(): void {
    const date = new Date(this.currentYear, this.currentMonth - 1, 1);
    this.monthLabel.set(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }

  getSpendPercent(pc: PaycheckBreakdown): number {
    if (pc.grossPay === 0) return 0;
    return Math.min(100, (pc.totalExpenses / pc.grossPay) * 100);
  }
}
