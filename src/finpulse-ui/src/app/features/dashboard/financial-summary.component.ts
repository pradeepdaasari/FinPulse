import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
        <!-- Row 1: Income / Expenses / Net Cash Flow -->
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

        <!-- Spending Pace -->
        <div class="pace-indicator">
          <mat-icon class="pace-icon" [class.on-track]="paceStatus() === 'on-track'" [class.ahead]="paceStatus() === 'ahead'" [class.over]="paceStatus() === 'over'">
            {{ paceStatus() === 'on-track' ? 'check_circle' : paceStatus() === 'ahead' ? 'savings' : 'warning' }}
          </mat-icon>
          <span class="pace-text">{{ paceMessage() }}</span>
        </div>

        <!-- Row 2: Trading P&L (always visible) -->
        <mat-card class="trading-card">
          <mat-card-content>
            <div class="trading-row">
              <div class="trading-item">
                <mat-icon class="trading-icon income-icon">show_chart</mat-icon>
                <span class="trading-label">Trading Gains</span>
                <span class="trading-value income-value">+{{ data()!.tradingGains | currency }}</span>
              </div>
              <div class="trading-item">
                <mat-icon class="trading-icon expense-icon">trending_down</mat-icon>
                <span class="trading-label">Trading Losses</span>
                <span class="trading-value expense-value">-{{ data()!.tradingLosses | currency }}</span>
              </div>
              <div class="trading-item trading-net">
                <mat-icon class="trading-icon" [class.income-icon]="data()!.tradingNetPnL >= 0" [class.expense-icon]="data()!.tradingNetPnL < 0">candlestick_chart</mat-icon>
                <span class="trading-label">Net P&L</span>
                <span class="trading-value" [class.income-value]="data()!.tradingNetPnL >= 0" [class.expense-value]="data()!.tradingNetPnL < 0">
                  {{ data()!.tradingNetPnL | currency }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Row 3: Net Worth breakdown -->
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

        <!-- Row 4: Account Balances (only if accounts exist) -->
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
      </div>
    }
  `,
  styles: [`
    .fin-summary { margin-bottom: var(--spacing-md); }

    .flow-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-sm);
    }
    .flow-card mat-card-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px !important;
      text-align: center;
    }
    .flow-card:nth-child(1) { border-top: 3px solid var(--color-success); }
    .flow-card:nth-child(2) { border-top: 3px solid var(--color-danger); }
    .flow-card:nth-child(3) { border-top: 3px solid var(--color-value-blue); }
    .flow-icon { font-size: 24px; width: 24px; height: 24px; margin-bottom: 2px; }
    .income-icon { color: var(--color-success); }
    .expense-icon { color: var(--color-danger); }
    .flow-label { font-size: 0.8rem; opacity: 0.7; }
    .flow-value { font-size: 1.4rem; font-weight: 700; margin-top: 2px; }
    .income-value { color: var(--color-success); }
    .expense-value { color: var(--color-danger); }

    /* Spending Pace */
    .pace-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      border-left: 4px solid var(--color-value-blue);
      margin-bottom: var(--spacing-md);
      box-shadow: var(--shadow-sm);
    }
    .pace-icon { font-size: 20px; width: 20px; height: 20px; }
    .pace-icon.on-track { color: var(--color-value-blue); }
    .pace-icon.ahead { color: var(--color-value-green); }
    .pace-icon.over { color: var(--color-danger); }
    .pace-text { font-size: var(--text-sm); color: var(--color-text); font-weight: 500; }

    /* Trading P&L */
    .trading-card { margin-bottom: var(--spacing-sm); }
    .trading-row {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    .trading-item { text-align: center; }
    .trading-icon { font-size: 20px; width: 20px; height: 20px; }
    .trading-label { display: block; font-size: 0.75rem; opacity: 0.7; margin-top: 2px; }
    .trading-value { display: block; font-size: 1.1rem; font-weight: 700; margin-top: 2px; }
    .trading-net {
      border-left: 2px solid var(--color-primary, #1976d2);
      padding-left: var(--spacing-lg);
    }

    /* Net Worth */
    .networth-card { margin-bottom: var(--spacing-sm); }
    .networth-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      gap: var(--spacing-sm);
    }
    .nw-item { text-align: center; }
    .nw-label { display: block; font-size: 0.8rem; opacity: 0.7; }
    .nw-value { display: block; font-size: 1.25rem; font-weight: 700; margin-top: 2px; }
    .nw-total { border-left: 2px solid var(--color-primary, #1976d2); padding-left: var(--spacing-lg); }
    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }

    /* Account Balances */
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
    .accounts-total { font-weight: 700; color: var(--color-primary, #1976d2); }
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

    @media (max-width: 600px) {
      .flow-cards { grid-template-columns: 1fr; }
      .trading-row { flex-direction: column; align-items: center; }
      .trading-net { border-left: none; border-top: 2px solid var(--color-primary, #1976d2); padding-left: 0; padding-top: var(--spacing-sm); }
      .networth-row { flex-direction: column; align-items: center; }
      .nw-total { border-left: none; border-top: 2px solid var(--color-primary, #1976d2); padding-left: 0; padding-top: var(--spacing-sm); }
    }
  `]
})
export class FinancialSummaryComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  data = signal<FinancialSummary | null>(null);

  paceStatus = computed(() => {
    const d = this.data();
    if (!d) return 'on-track';
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const paceRatio = dayOfMonth / daysInMonth;
    const spendRatio = d.totalIncome > 0 ? d.totalExpenses / d.totalIncome : 0;
    if (spendRatio <= paceRatio * 0.85) return 'ahead';
    if (spendRatio <= paceRatio * 1.1) return 'on-track';
    return 'over';
  });

  paceMessage = computed(() => {
    const d = this.data();
    if (!d) return '';
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const spent = d.totalExpenses;
    const income = d.totalIncome;
    const pct = income > 0 ? Math.round((spent / income) * 100) : 0;
    if (this.paceStatus() === 'ahead') {
      return `You've spent ${pct}% of income with ${daysLeft} days left — under budget!`;
    } else if (this.paceStatus() === 'on-track') {
      return `You've spent ${pct}% of income with ${daysLeft} days left — on track.`;
    } else {
      return `You've spent ${pct}% of income with ${daysLeft} days left — spending ahead of pace.`;
    }
  });

  ngOnInit(): void {
    this.dashboardService.getFinancialSummary().subscribe({
      next: (summary) => this.data.set(summary),
      error: () => {}
    });
  }
}
