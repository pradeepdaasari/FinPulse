import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { DashboardService } from '../../core/services/dashboard.service';
import { FinancialSummary } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule, MatDividerModule, CurrencyPipe],
  template: `
    @if (data()) {
      <div class="fin-summary">
        <!-- Monthly Cash Flow -->
        <mat-card class="section-card">
          <mat-card-content>
            <div class="section-title">
              <mat-icon>calendar_today</mat-icon> This Month's Cash Flow
              @if (data()!.savingsRate > 0) {
                <span class="savings-badge">
                  <mat-icon>savings</mat-icon> {{ data()!.savingsRate }}% saved
                </span>
              }
            </div>
            <div class="flow-grid">
              <div class="flow-item">
                <div class="flow-icon-wrap income-bg">
                  <mat-icon>trending_up</mat-icon>
                </div>
                <div class="flow-detail">
                  <span class="flow-label">Income</span>
                  <span class="flow-value income-value">{{ data()!.totalIncome | currency }}</span>
                </div>
              </div>
              <div class="flow-item">
                <div class="flow-icon-wrap expense-bg">
                  <mat-icon>trending_down</mat-icon>
                </div>
                <div class="flow-detail">
                  <span class="flow-label">Expenses</span>
                  <span class="flow-value expense-value">{{ data()!.totalExpenses | currency }}</span>
                </div>
              </div>
              <div class="flow-item">
                <div class="flow-icon-wrap" [class.income-bg]="data()!.netCashFlow >= 0" [class.expense-bg]="data()!.netCashFlow < 0">
                  <mat-icon>{{ data()!.netCashFlow >= 0 ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
                </div>
                <div class="flow-detail">
                  <span class="flow-label">Net Cash Flow</span>
                  <span class="flow-value" [class.income-value]="data()!.netCashFlow >= 0" [class.expense-value]="data()!.netCashFlow < 0">
                    {{ data()!.netCashFlow | currency }}
                  </span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Trading P&L -->
        @if (data()!.tradingGains > 0 || data()!.tradingLosses > 0) {
          <mat-card class="section-card trading-card">
            <mat-card-content>
              <div class="section-title">
                <mat-icon>candlestick_chart</mat-icon> Trading P&L
              </div>
              <div class="trading-grid">
                <div class="trading-item">
                  <span class="trading-label">Gains</span>
                  <span class="trading-value income-value">+{{ data()!.tradingGains | currency }}</span>
                </div>
                <div class="trading-item">
                  <span class="trading-label">Losses</span>
                  <span class="trading-value expense-value">-{{ data()!.tradingLosses | currency }}</span>
                </div>
                <div class="trading-item trading-net">
                  <span class="trading-label">Net P&L</span>
                  <span class="trading-value" [class.income-value]="data()!.tradingNetPnL >= 0" [class.expense-value]="data()!.tradingNetPnL < 0">
                    {{ data()!.tradingNetPnL | currency }}
                  </span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Account Balances -->
        @if (data()!.bankAccounts.length > 0) {
          <mat-card class="section-card">
            <mat-card-content>
              <div class="section-title">
                <mat-icon>account_balance</mat-icon> Account Balances
                <span class="section-total">{{ data()!.totalBankBalance | currency }}</span>
              </div>
              <div class="accounts-list">
                @for (account of data()!.bankAccounts; track account.id) {
                  <div class="account-row">
                    <div class="account-info">
                      <mat-icon class="account-type-icon">
                        {{ account.type === 'Brokerage' ? 'show_chart' : account.type === 'Savings' ? 'savings' : 'account_balance_wallet' }}
                      </mat-icon>
                      <div>
                        <span class="account-name">{{ account.name }}</span>
                        <span class="account-type">{{ account.type }}</span>
                      </div>
                    </div>
                    <span class="account-balance" [class.positive]="account.balance >= 0" [class.negative]="account.balance < 0">
                      {{ account.balance | currency }}
                    </span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

        <!-- Net Worth -->
        <mat-card class="section-card networth-card">
          <mat-card-content>
            <div class="section-title">
              <mat-icon>assessment</mat-icon> Net Worth
              <span class="section-total" [class.positive]="data()!.netWorth >= 0" [class.negative]="data()!.netWorth < 0">
                {{ data()!.netWorth | currency }}
              </span>
            </div>
            <div class="nw-breakdown">
              <div class="nw-row">
                <span class="nw-label"><mat-icon class="nw-icon positive">add_circle</mat-icon> Assets</span>
                <span class="nw-value positive">{{ data()!.totalBankBalance | currency }}</span>
              </div>
              <div class="nw-row">
                <span class="nw-label"><mat-icon class="nw-icon negative">remove_circle</mat-icon> Credit Card Debt</span>
                <span class="nw-value negative">{{ data()!.totalCreditCardDebt | currency }}</span>
              </div>
              <div class="nw-row">
                <span class="nw-label"><mat-icon class="nw-icon negative">remove_circle</mat-icon> Loan Debt</span>
                <span class="nw-value negative">{{ data()!.totalLoanDebt | currency }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .fin-summary {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .section-card {
      border-radius: 12px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      margin-bottom: var(--spacing-md);
      color: var(--color-on-surface, #333);
    }
    .section-title mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--color-primary, #1976d2);
    }
    .section-total {
      margin-left: auto;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-primary, #1976d2);
    }
    .savings-badge {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #2e7d32;
      background: rgba(46, 125, 50, 0.08);
      padding: 2px 10px;
      border-radius: 12px;
    }
    .savings-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #2e7d32;
    }

    /* Cash Flow Grid */
    .flow-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-md);
    }
    .flow-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .flow-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .flow-icon-wrap mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: white;
    }
    .income-bg { background: #2e7d32; }
    .expense-bg { background: #c62828; }
    .flow-detail { display: flex; flex-direction: column; }
    .flow-label { font-size: 0.75rem; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.5px; }
    .flow-value { font-size: 1.2rem; font-weight: 700; }
    .income-value { color: #2e7d32; }
    .expense-value { color: #c62828; }

    /* Trading P&L */
    .trading-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--spacing-md);
    }
    .trading-item { text-align: center; }
    .trading-label { display: block; font-size: 0.8rem; opacity: 0.6; }
    .trading-value { display: block; font-size: 1.2rem; font-weight: 700; margin-top: 4px; }
    .trading-net {
      border-left: 2px solid var(--color-primary, #1976d2);
      padding-left: var(--spacing-md);
    }

    /* Account Balances */
    .accounts-list { display: flex; flex-direction: column; gap: 8px; }
    .account-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-radius: 10px;
      background: var(--color-surface-variant, rgba(0,0,0,0.03));
      transition: background 0.15s;
    }
    .account-row:hover { background: var(--color-surface-variant-hover, rgba(0,0,0,0.06)); }
    .account-info { display: flex; align-items: center; gap: 12px; }
    .account-type-icon { color: var(--color-primary, #1976d2); font-size: 22px; width: 22px; height: 22px; }
    .account-name { display: block; font-weight: 500; }
    .account-type { display: block; font-size: 0.75rem; opacity: 0.6; text-transform: uppercase; }
    .account-balance { font-weight: 700; font-size: 1.05rem; }

    /* Net Worth */
    .nw-breakdown { display: flex; flex-direction: column; gap: 8px; }
    .nw-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
    }
    .nw-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }
    .nw-icon { font-size: 18px; width: 18px; height: 18px; }
    .nw-value { font-weight: 600; font-size: 1rem; }
    .positive { color: #2e7d32; }
    .negative { color: #c62828; }

    @media (max-width: 600px) {
      .flow-grid { grid-template-columns: 1fr; gap: var(--spacing-sm); }
      .trading-grid { grid-template-columns: 1fr; }
      .trading-net { border-left: none; border-top: 2px solid var(--color-primary, #1976d2); padding-left: 0; padding-top: 8px; text-align: center; }
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
