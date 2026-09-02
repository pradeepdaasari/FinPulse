import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetPlan, PaycheckBreakdown } from '../../core/models/budget.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressBarModule, MatProgressSpinnerModule, MatChipsModule,
    MatTooltipModule, CurrencyPipe, DatePipe, DecimalPipe
  ],
  template: `
    <div class="budget-header">
      <div class="month-nav">
        <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
        <span class="month-label">{{ monthLabel() }}</span>
        <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (plan()) {
      <mat-tab-group animationDuration="200ms">
        <!-- Monthly Overview Tab -->
        <mat-tab label="Monthly Overview">
          <div class="tab-content">
            <!-- Stat Cards -->
            <div class="stat-cards">
              <mat-card class="stat-card income">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.totalIncome | currency }}</div>
                  <div class="stat-label">Total Income ({{ plan()!.monthlyOverview.paychecksThisMonth }} paychecks)</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card budgeted">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.totalExpenses | currency }}</div>
                  <div class="stat-label">Total Budgeted</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card spent">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.totalSpent | currency }}</div>
                  <div class="stat-label">Total Spent</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card" [class.surplus]="plan()!.monthlyOverview.totalRemaining >= 0" [class.deficit]="plan()!.monthlyOverview.totalRemaining < 0">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.totalRemaining | currency }}</div>
                  <div class="stat-label">{{ plan()!.monthlyOverview.totalRemaining >= 0 ? 'Remaining' : 'Over Budget' }}</div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Overall Progress -->
            <div class="overall-progress-section">
              <div class="overall-progress-header">
                <span>Monthly Spending</span>
                <span>{{ plan()!.monthlyOverview.totalSpent | currency }} / {{ plan()!.monthlyOverview.totalExpenses | currency }}</span>
              </div>
              <mat-progress-bar mode="determinate"
                [value]="overallPercent()"
                [color]="overallPercent() > 100 ? 'warn' : overallPercent() > 80 ? 'accent' : 'primary'">
              </mat-progress-bar>
              <div class="overall-progress-footer">
                <span [class.over-budget]="plan()!.monthlyOverview.totalRemaining < 0">
                  {{ plan()!.monthlyOverview.totalRemaining >= 0
                    ? (plan()!.monthlyOverview.totalRemaining | currency) + ' remaining'
                    : ((-plan()!.monthlyOverview.totalRemaining) | currency) + ' over budget' }}
                </span>
                <span class="percent-label">{{ overallPercent() | number:'1.0-0' }}%</span>
              </div>
            </div>

            <!-- Recurring Categories -->
            @if (recurringCategories().length > 0) {
              <div class="section-block">
                <div class="section-header">
                  <div class="section-title"><mat-icon class="section-icon recurring">autorenew</mat-icon> Recurring</div>
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
                  <div class="section-title"><mat-icon class="section-icon bills">receipt_long</mat-icon> Bills & Spending</div>
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
                  <div class="section-title"><mat-icon class="section-icon debt">credit_score</mat-icon> Debt Payments</div>
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
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef></td>
                    </ng-container>
                    <ng-container matColumnDef="amounts">
                      <th mat-header-cell *matHeaderCellDef>Min. Payment</th>
                      <td mat-cell *matCellDef="let row">
                        <span class="amounts-main">{{ row.amount | currency }}</span>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
                  </table>
                </div>
                <div class="mobile-only">
                  @for (row of debtCategories(); track row.categoryName) {
                    <div class="budget-card debt-card">
                      <div class="budget-card-top">
                        <span class="category-name-cell"><mat-icon class="category-icon debt">credit_score</mat-icon> {{ row.categoryName }}</span>
                        <span class="budget-card-amount">{{ row.amount | currency }}</span>
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
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    .budget-header {
      display: flex; align-items: center; justify-content: flex-end;
      flex-wrap: wrap; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm);
    }
    .month-nav { display: flex; align-items: center; gap: var(--spacing-xs); }
    .month-label { font-size: 1.1rem; font-weight: 500; min-width: 140px; text-align: center; }
    .tab-content { padding: var(--spacing-sm) 0; }

    /* Stat Cards */
    .stat-cards {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm); margin-bottom: var(--spacing-md);
    }
    .stat-card .stat-value { font-size: 1.2rem; font-weight: 700; }
    .stat-card .stat-label { font-size: 0.85rem; opacity: 0.7; margin-top: 4px; }
    .stat-card.income .stat-value { color: var(--color-primary); }
    .stat-card.budgeted .stat-value { color: var(--color-stat-amber); }
    .stat-card.spent .stat-value { color: var(--color-accent); }
    .stat-card.surplus .stat-value { color: var(--color-success); }
    .stat-card.deficit .stat-value { color: var(--color-danger); }

    /* Overall Progress */
    .overall-progress-section {
      background: var(--color-surface); border-radius: var(--radius-md);
      padding: 16px; margin-bottom: var(--spacing-md); box-shadow: var(--shadow-sm);
    }
    .overall-progress-header {
      display: flex; justify-content: space-between; margin-bottom: 8px;
      font-weight: 500; font-size: 0.9rem;
    }
    .overall-progress-footer {
      display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.82rem;
    }
    .percent-label { opacity: 0.6; font-weight: 600; }
    .over-budget { color: var(--color-danger); font-weight: 600; }
    .under-budget { color: var(--color-success); }

    /* Section Blocks */
    .section-block {
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-md); overflow: hidden;
    }
    .section-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
    }
    .section-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 1rem; }
    .section-total { font-size: 1rem; font-weight: 700; }
    .section-total.recurring { color: var(--color-stat-purple); }
    .section-total.bills { color: var(--color-primary); }
    .section-total.debt { color: var(--color-danger); }
    .section-icon { font-size: 20px; height: 20px; width: 20px; }
    .section-icon.recurring { color: var(--color-stat-purple); }
    .section-icon.bills { color: var(--color-primary); }
    .section-icon.debt { color: var(--color-danger); }

    /* Category Table */
    .category-table { width: 100%; }
    .category-name-cell { display: flex; align-items: center; gap: 8px; }
    .category-icon { font-size: 18px; height: 18px; width: 18px; opacity: 0.7; }
    .category-icon.debt { color: var(--color-danger); opacity: 0.8; }

    .progress-cell { display: flex; align-items: center; gap: 10px; min-width: 160px; }
    .progress-cell mat-progress-bar { flex: 1; }
    .progress-percent { font-size: 0.8rem; font-weight: 600; opacity: 0.7; white-space: nowrap; }

    .amounts-cell { display: flex; flex-direction: column; gap: 2px; }
    .amounts-main { font-size: 0.85rem; font-weight: 500; }
    .amounts-remaining { font-size: 0.75rem; }

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
    .debt-card { padding: 12px 16px; }

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
      .desktop-only { display: none !important; }
      .mobile-only { display: block; }
    }
  `]
})
export class BudgetPageComponent implements OnInit {
  protected Math = Math;
  private budgetService = inject(BudgetService);

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
      },
      error: () => {
        this.plan.set(null);
        this.loading.set(false);
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
