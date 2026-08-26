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
import { BudgetService } from '../../core/services/budget.service';
import { BudgetPlan, BudgetExpense, BudgetExpenseCreate, PaycheckBreakdown } from '../../core/models/budget.model';
import { ExpenseDialogComponent } from './expense-dialog.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-budget-page',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressBarModule, MatProgressSpinnerModule, MatChipsModule,
    MatDialogModule, MatTooltipModule, CurrencyPipe, DatePipe
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
      <mat-spinner></mat-spinner>
    } @else if (plan()) {
      <mat-tab-group animationDuration="200ms">
        <!-- Monthly Overview Tab -->
        <mat-tab label="Monthly Overview">
          <div class="tab-content">
            <div class="stat-cards">
              <mat-card class="stat-card income">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.totalIncome | currency }}</div>
                  <div class="stat-label">Total Income ({{ plan()!.monthlyOverview.paychecksThisMonth }} paychecks)</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card fixed">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.totalFixedExpenses | currency }}</div>
                  <div class="stat-label">Fixed Bills</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card variable">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.totalVariableBudgets | currency }}</div>
                  <div class="stat-label">Variable Spending</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card debt">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.totalDebtPayments | currency }}</div>
                  <div class="stat-label">Debt Payments</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="stat-card" [class.surplus]="plan()!.monthlyOverview.surplus >= 0" [class.deficit]="plan()!.monthlyOverview.surplus < 0">
                <mat-card-content>
                  <div class="stat-value">{{ plan()!.monthlyOverview.surplus | currency }}</div>
                  <div class="stat-label">{{ plan()!.monthlyOverview.surplus >= 0 ? 'Surplus' : 'Deficit' }}</div>
                </mat-card-content>
              </mat-card>
            </div>

            @if (plan()!.monthlyOverview.byCategory.length > 0) {
              <mat-card class="category-card">
                <mat-card-header><mat-card-title>By Category</mat-card-title></mat-card-header>
                <mat-card-content>
                  <table mat-table [dataSource]="plan()!.monthlyOverview.byCategory" class="category-table">
                    <ng-container matColumnDef="categoryName">
                      <th mat-header-cell *matHeaderCellDef>Category</th>
                      <td mat-cell *matCellDef="let row">{{ row.categoryName }}</td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let row">
                        <mat-chip [highlighted]="row.isFixed">{{ row.isFixed ? 'Fixed' : 'Variable' }}</mat-chip>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Amount</th>
                      <td mat-cell *matCellDef="let row">{{ row.amount | currency }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="categoryColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: categoryColumns;"></tr>
                  </table>
                </mat-card-content>
              </mat-card>
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

        <!-- Manage Expenses Tab -->
        <mat-tab label="Manage Expenses">
          <div class="tab-content">
            <div class="manage-header">
              <button mat-raised-button color="primary" (click)="addExpense()">
                <mat-icon>add</mat-icon> Add Expense
              </button>
            </div>

            @if (expenses().length > 0) {
              <mat-card>
                <mat-card-content>
                  <table mat-table [dataSource]="expenses()" class="expense-manage-table">
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let e">{{ e.name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="category">
                      <th mat-header-cell *matHeaderCellDef>Category</th>
                      <td mat-cell *matCellDef="let e">{{ e.categoryName }}</td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef>Amount</th>
                      <td mat-cell *matCellDef="let e">{{ e.amount | currency }}</td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let e">
                        <mat-chip [highlighted]="e.isFixed">{{ e.isFixed ? 'Fixed' : 'Variable' }}</mat-chip>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="dueDay">
                      <th mat-header-cell *matHeaderCellDef>Due</th>
                      <td mat-cell *matCellDef="let e">{{ e.dueDay ? 'Day ' + e.dueDay : '—' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let e">
                        <button mat-icon-button (click)="editExpense(e)" matTooltip="Edit">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteExpense(e)" matTooltip="Delete">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="manageColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: manageColumns;"></tr>
                  </table>
                </mat-card-content>
              </mat-card>
            } @else {
              <mat-card>
                <mat-card-content>
                  <p>No expenses added yet. Click "Add Expense" to set up your bills and spending categories.</p>
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
    .budget-header {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }
    .month-nav {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }
    .month-label { font-size: 1.1rem; font-weight: 500; min-width: 140px; text-align: center; }
    .tab-content { padding: var(--spacing-sm) 0; }

    .stat-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    .stat-card .stat-value { font-size: 1.2rem; font-weight: 700; }
    .stat-card .stat-label { font-size: 0.85rem; opacity: 0.7; margin-top: 4px; }
    .stat-card.income .stat-value { color: var(--color-primary); }
    .stat-card.fixed .stat-value { color: var(--color-accent); }
    .stat-card.variable .stat-value { color: var(--color-warning); }
    .stat-card.debt .stat-value { color: var(--color-danger); }
    .stat-card.surplus .stat-value { color: var(--color-success); }
    .stat-card.deficit .stat-value { color: var(--color-danger); }

    .category-card { margin-top: var(--spacing-md); }
    .category-table { width: 100%; }

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

    .manage-header { margin-bottom: var(--spacing-md); }
    .expense-manage-table { width: 100%; }

    @media (max-width: 768px) {
      .stat-cards { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
      .stat-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class BudgetPageComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private dialog = inject(MatDialog);

  plan = signal<BudgetPlan | null>(null);
  expenses = signal<BudgetExpense[]>([]);
  loading = signal(true);

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  categoryColumns = ['categoryName', 'type', 'amount'];
  paycheckExpenseColumns = ['name', 'dueDay', 'amount'];
  manageColumns = ['name', 'category', 'amount', 'type', 'dueDay', 'actions'];

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
    this.budgetService.getExpenses().subscribe({
      next: (expenses) => this.expenses.set(expenses),
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

  getSpendPercent(pc: PaycheckBreakdown): number {
    if (pc.grossPay === 0) return 0;
    return Math.min(100, (pc.totalExpenses / pc.grossPay) * 100);
  }

  addExpense(): void {
    const ref = this.dialog.open(ExpenseDialogComponent, { data: null });
    ref.afterClosed().subscribe((result: BudgetExpenseCreate | undefined) => {
      if (result) {
        this.budgetService.createExpense(result).subscribe(() => this.loadData());
      }
    });
  }

  editExpense(expense: BudgetExpense): void {
    const ref = this.dialog.open(ExpenseDialogComponent, { data: expense });
    ref.afterClosed().subscribe((result: BudgetExpenseCreate | undefined) => {
      if (result) {
        this.budgetService.updateExpense(expense.id, result).subscribe(() => this.loadData());
      }
    });
  }

  deleteExpense(expense: BudgetExpense): void {
    import('../../shared/confirm-dialog.component').then(m => {
      this.dialog.open(m.ConfirmDialogComponent, {
        width: '400px',
        data: { title: 'Delete Budget Item?', message: `"${expense.name}" will be removed from your budget.`, confirmText: 'Delete', color: 'warn' }
      }).afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.budgetService.deleteExpense(expense.id).subscribe(() => this.loadData());
      });
    });
  }
}
