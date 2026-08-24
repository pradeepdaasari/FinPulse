import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DashboardService } from '../../core/services/dashboard.service';
import { FinancialSummary } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule, CurrencyPipe],
  template: `
    @if (data()) {
      <div class="fin-summary">
        <div class="flow-cards">
          <mat-card class="flow-card">
            <mat-card-content>
              <mat-icon class="flow-icon income-icon">trending_up</mat-icon>
              <span class="flow-label">Income</span>
              <span class="flow-value income-value">{{ data()!.totalIncome | currency }}</span>
            </mat-card-content>
          </mat-card>
          <mat-card class="flow-card">
            <mat-card-content>
              <mat-icon class="flow-icon expense-icon">trending_down</mat-icon>
              <span class="flow-label">Expenses</span>
              <span class="flow-value expense-value">{{ data()!.totalExpenses | currency }}</span>
            </mat-card-content>
          </mat-card>
          <mat-card class="flow-card">
            <mat-card-content>
              <mat-icon class="flow-icon" [class.income-icon]="data()!.netCashFlow >= 0" [class.expense-icon]="data()!.netCashFlow < 0">
                {{ data()!.netCashFlow >= 0 ? 'savings' : 'warning' }}
              </mat-icon>
              <span class="flow-label">Net Cash Flow</span>
              <span class="flow-value" [class.income-value]="data()!.netCashFlow >= 0" [class.expense-value]="data()!.netCashFlow < 0">
                {{ data()!.netCashFlow | currency }}
              </span>
            </mat-card-content>
          </mat-card>
        </div>

        @if (data()!.bankAccounts.length > 0) {
          <mat-card class="accounts-card">
            <mat-card-content>
              <div class="accounts-header">
                <span class="accounts-title"><mat-icon>account_balance</mat-icon> Account Balances</span>
                <span class="accounts-total">Total: {{ data()!.totalBankBalance | currency }}</span>
              </div>
              <div class="accounts-list">
                @for (account of data()!.bankAccounts; track account.id) {
                  <div class="account-row">
                    <span class="account-name">
                      {{ account.name }}
                      <mat-chip>{{ account.type }}</mat-chip>
                    </span>
                    <span class="account-balance" [class.positive]="account.balance >= 0" [class.negative]="account.balance < 0">
                      {{ account.balance | currency }}
                    </span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <mat-card class="networth-card">
          <mat-card-content>
            <div class="networth-row">
              <div class="nw-item">
                <span class="nw-label">Assets (Bank Accounts)</span>
                <span class="nw-value positive">{{ data()!.totalBankBalance | currency }}</span>
              </div>
              <div class="nw-item">
                <span class="nw-label">Credit Card Debt</span>
                <span class="nw-value negative">-{{ data()!.totalCreditCardDebt | currency }}</span>
              </div>
              <div class="nw-item">
                <span class="nw-label">Loan Debt</span>
                <span class="nw-value negative">-{{ data()!.totalLoanDebt | currency }}</span>
              </div>
              <div class="nw-item nw-total">
                <span class="nw-label">Net Worth</span>
                <span class="nw-value" [class.positive]="data()!.netWorth >= 0" [class.negative]="data()!.netWorth < 0">
                  {{ data()!.netWorth | currency }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .fin-summary { margin-bottom: var(--spacing-lg); }

    .flow-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    .flow-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--spacing-md) !important;
      text-align: center;
    }
    .flow-icon { font-size: 28px; width: 28px; height: 28px; margin-bottom: 4px; }
    .income-icon { color: #2e7d32; }
    .expense-icon { color: #c62828; }
    .flow-label { font-size: 0.85rem; opacity: 0.7; }
    .flow-value { font-size: 1.4rem; font-weight: 700; margin-top: 4px; }
    .income-value { color: #2e7d32; }
    .expense-value { color: #c62828; }

    .accounts-card { margin-bottom: var(--spacing-md); }
    .accounts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
    }
    .accounts-title {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .accounts-total { font-weight: 700; color: var(--color-primary); }
    .accounts-list { display: flex; flex-direction: column; gap: 8px; }
    .account-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--color-surface-variant, rgba(0,0,0,0.03));
    }
    .account-name { display: flex; align-items: center; gap: 8px; }
    .account-balance { font-weight: 600; font-size: 1.1rem; }

    .networth-card { }
    .networth-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--spacing-md);
    }
    .nw-item { text-align: center; flex: 1; min-width: 120px; }
    .nw-label { display: block; font-size: 0.8rem; opacity: 0.7; }
    .nw-value { display: block; font-size: 1.2rem; font-weight: 700; margin-top: 4px; }
    .nw-total { border-left: 2px solid var(--color-primary); padding-left: var(--spacing-md); }
    .positive { color: #2e7d32; }
    .negative { color: #c62828; }

    @media (max-width: 600px) {
      .flow-cards { grid-template-columns: 1fr; }
      .networth-row { flex-direction: column; align-items: center; }
      .nw-total { border-left: none; border-top: 2px solid var(--color-primary); padding-left: 0; padding-top: var(--spacing-sm); }
    }
  `]
})
export class FinancialSummaryComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  data = signal<FinancialSummary | null>(null);

  ngOnInit(): void {
    this.dashboardService.getFinancialSummary().subscribe({
      next: (summary) => this.data.set(summary),
      error: () => {}
    });
  }
}
