import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MonthlyPulseService } from '../../../core/services/monthly-pulse.service';
import { MonthlyPulseData, LaneMonth, LoanPaymentMonth, TradingMonth, NetWorthMonth, DetailRow } from '../../../core/models/monthly-pulse.model';

type Period = '3' | '6' | 'ytd';

@Component({
  selector: 'app-monthly-pulse',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="pulse-container">
      <div class="pulse-header">
        <div class="period-chips">
          <button class="period-chip" [class.active]="selectedPeriod() === '3'" (click)="setPeriod('3')">3 Months</button>
          <button class="period-chip" [class.active]="selectedPeriod() === '6'" (click)="setPeriod('6')">6 Months</button>
          <button class="period-chip" [class.active]="selectedPeriod() === 'ytd'" (click)="setPeriod('ytd')">YTD</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-wrap"><mat-spinner diameter="48"></mat-spinner></div>
      } @else if (data(); as d) {

        <!-- Net Worth Delta Lane -->
        <div class="lane-card lane-networth">
          <div class="lane-header" (click)="toggleLane('networth')">
            <div class="lane-title">
              <span class="lane-icon-pill pill-green"><mat-icon>account_balance_wallet</mat-icon></span>
              <span class="lane-name">Net Worth</span>
            </div>
            <div class="lane-header-right">
              <span class="trend-badge" [class.trend-good]="d.netWorth.trend >= 0" [class.trend-bad]="d.netWorth.trend < 0">
                <mat-icon class="trend-icon">{{ d.netWorth.trend >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                {{ abs(d.netWorth.trend) | number:'1.1-1' }}%
              </span>
              <mat-icon class="expand-icon" [class.expanded]="isExpanded('networth')">expand_more</mat-icon>
            </div>
          </div>
          <div class="month-columns">
            @for (m of d.netWorth.monthly; track $index) {
              <div class="month-col">
                <span class="month-label">{{ d.months[$index].label }}</span>
                @if (asNW(m).value !== null) {
                  <span class="month-value" [class.pnl-positive]="asNW(m).delta > 0" [class.pnl-negative]="asNW(m).delta < 0">
                    {{ asNW(m).delta >= 0 ? '+' : '' }}{{ asNW(m).delta | currency:'USD':'symbol':'1.0-0' }}
                  </span>
                } @else {
                  <span class="month-value muted">—</span>
                }
              </div>
            }
          </div>
          @if (isExpanded('networth') && d.netWorth.details?.length) {
            <div class="detail-section">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th class="detail-name-col">Component</th>
                    @for (mo of d.months; track $index) {
                      <th class="detail-month-col">{{ mo.label }}</th>
                    }
                    <th class="detail-total-col">Current</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of d.netWorth.details; track row.name) {
                    <tr>
                      <td class="detail-name">
                        @if (row.icon) { <mat-icon class="detail-row-icon">{{ row.icon }}</mat-icon> }
                        {{ row.name }}
                      </td>
                      @for (val of row.monthly; track $index) {
                        <td class="detail-val" [class.pnl-positive]="val > 0" [class.pnl-negative]="val < 0">
                          {{ val >= 0 ? '+' : '' }}{{ val | currency:'USD':'symbol':'1.0-0' }}
                        </td>
                      }
                      <td class="detail-total">{{ (row.balance ?? row.total) | currency:'USD':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          <div class="lane-summary">
            <span>Current: <strong>{{ d.netWorth.currentNetWorth | currency:'USD':'symbol':'1.0-0' }}</strong></span>
            <span>Change: <strong [class.pnl-positive]="d.netWorth.totalChange > 0" [class.pnl-negative]="d.netWorth.totalChange < 0">
              {{ d.netWorth.totalChange >= 0 ? '+' : '' }}{{ d.netWorth.totalChange | currency:'USD':'symbol':'1.0-0' }}
            </strong></span>
          </div>
        </div>

        <!-- Trading P&L Lane -->
        <div class="lane-card lane-trading">
          <div class="lane-header" (click)="toggleLane('trading')">
            <div class="lane-title">
              <span class="lane-icon-pill pill-indigo"><mat-icon>candlestick_chart</mat-icon></span>
              <span class="lane-name">Trading P&L</span>
            </div>
            <div class="lane-header-right">
              <span class="trend-badge" [class.trend-good]="d.trading.trend >= 0" [class.trend-bad]="d.trading.trend < 0">
                <mat-icon class="trend-icon">{{ d.trading.trend >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                {{ abs(d.trading.trend) | number:'1.1-1' }}%
              </span>
              <mat-icon class="expand-icon" [class.expanded]="isExpanded('trading')">expand_more</mat-icon>
            </div>
          </div>
          <div class="month-columns">
            @for (m of d.trading.monthly; track $index) {
              <div class="month-col">
                <span class="month-label">{{ d.months[$index].label }}</span>
                <span class="month-value" [class.pnl-positive]="asTrading(m).netPnl > 0" [class.pnl-negative]="asTrading(m).netPnl < 0">
                  {{ asTrading(m).netPnl >= 0 ? '+' : '' }}{{ asTrading(m).netPnl | currency:'USD':'symbol':'1.0-0' }}
                </span>
                <span class="month-sub">
                  {{ asTrading(m).trades }} trades · {{ asTrading(m).winRate | number:'1.0-0' }}% win
                </span>
              </div>
            }
          </div>
          @if (isExpanded('trading') && d.trading.details?.length) {
            <div class="detail-section">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th class="detail-name-col">Instrument</th>
                    @for (mo of d.months; track $index) {
                      <th class="detail-month-col">{{ mo.label }}</th>
                    }
                    <th class="detail-total-col">Net P&L</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of d.trading.details; track row.name) {
                    <tr>
                      <td class="detail-name">{{ row.name }}</td>
                      @for (val of row.monthly; track $index) {
                        <td class="detail-val" [class.pnl-positive]="val > 0" [class.pnl-negative]="val < 0">
                          {{ val >= 0 ? '+' : '' }}{{ val | currency:'USD':'symbol':'1.0-0' }}
                        </td>
                      }
                      <td class="detail-total" [class.pnl-positive]="row.total > 0" [class.pnl-negative]="row.total < 0">
                        {{ row.total >= 0 ? '+' : '' }}{{ row.total | currency:'USD':'symbol':'1.0-0' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          <div class="lane-summary">
            <span>Net P&L: <strong [class.pnl-positive]="d.trading.totalNetPnl > 0" [class.pnl-negative]="d.trading.totalNetPnl < 0">
              {{ d.trading.totalNetPnl >= 0 ? '+' : '' }}{{ d.trading.totalNetPnl | currency:'USD':'symbol':'1.0-0' }}
            </strong></span>
            <span>{{ d.trading.totalTrades }} trades · {{ d.trading.overallWinRate | number:'1.0-0' }}% win rate</span>
          </div>
        </div>

        <!-- Expenses Lane -->
        <div class="lane-card lane-expenses">
          <div class="lane-header" (click)="toggleLane('expenses')">
            <div class="lane-title">
              <span class="lane-icon-pill pill-amber"><mat-icon>shopping_cart</mat-icon></span>
              <span class="lane-name">Expenses</span>
            </div>
            <div class="lane-header-right">
              <span class="trend-badge" [class.trend-good]="d.expenses.trend <= 0" [class.trend-bad]="d.expenses.trend > 0">
                <mat-icon class="trend-icon">{{ d.expenses.trend <= 0 ? 'trending_down' : 'trending_up' }}</mat-icon>
                {{ abs(d.expenses.trend) | number:'1.1-1' }}%
              </span>
              <mat-icon class="expand-icon" [class.expanded]="isExpanded('expenses')">expand_more</mat-icon>
            </div>
          </div>
          <div class="month-columns">
            @for (m of d.expenses.monthly; track $index) {
              <div class="month-col">
                <span class="month-label">{{ d.months[$index].label }}</span>
                <span class="month-value">{{ asLane(m).total | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
          @if (isExpanded('expenses') && d.expenses.details?.length) {
            <div class="detail-section">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th class="detail-name-col">Category</th>
                    @for (mo of d.months; track $index) {
                      <th class="detail-month-col">{{ mo.label }}</th>
                    }
                    <th class="detail-total-col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of d.expenses.details; track row.name) {
                    <tr>
                      <td class="detail-name">{{ row.name }}</td>
                      @for (val of row.monthly; track $index) {
                        <td class="detail-val">{{ val | currency:'USD':'symbol':'1.0-0' }}</td>
                      }
                      <td class="detail-total">{{ row.total | currency:'USD':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          <div class="lane-summary">
            <span>Avg: <strong>{{ d.expenses.avgMonthly | currency:'USD':'symbol':'1.0-0' }}</strong></span>
            <span>Total: <strong>{{ d.expenses.grandTotal | currency:'USD':'symbol':'1.0-0' }}</strong></span>
          </div>
        </div>

        <!-- Loan Payments Lane -->
        <div class="lane-card lane-loans">
          <div class="lane-header" (click)="toggleLane('loans')">
            <div class="lane-title">
              <span class="lane-icon-pill pill-purple"><mat-icon>account_balance</mat-icon></span>
              <span class="lane-name">Loan Payments</span>
            </div>
            <div class="lane-header-right">
              <span class="trend-badge" [class.trend-good]="d.loanPayments.trend >= 0" [class.trend-bad]="d.loanPayments.trend < 0">
                <mat-icon class="trend-icon">{{ d.loanPayments.trend >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                {{ abs(d.loanPayments.trend) | number:'1.1-1' }}%
              </span>
              <mat-icon class="expand-icon" [class.expanded]="isExpanded('loans')">expand_more</mat-icon>
            </div>
          </div>
          <div class="month-columns">
            @for (m of d.loanPayments.monthly; track $index) {
              <div class="month-col">
                <span class="month-label">{{ d.months[$index].label }}</span>
                <span class="month-value">{{ asLoan(m).total | currency:'USD':'symbol':'1.0-0' }}</span>
                @if (asLoan(m).principal > 0) {
                  <span class="month-sub">P: {{ asLoan(m).principal | currency:'USD':'symbol':'1.0-0' }} · I: {{ asLoan(m).interest | currency:'USD':'symbol':'1.0-0' }}</span>
                }
              </div>
            }
          </div>
          @if (isExpanded('loans') && d.loanPayments.details?.length) {
            <div class="detail-section">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th class="detail-name-col">Loan</th>
                    @for (mo of d.months; track $index) {
                      <th class="detail-month-col">{{ mo.label }}</th>
                    }
                    <th class="detail-total-col">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of d.loanPayments.details; track row.name) {
                    <tr>
                      <td class="detail-name">{{ row.name }}</td>
                      @for (val of row.monthly; track $index) {
                        <td class="detail-val">{{ val | currency:'USD':'symbol':'1.0-0' }}</td>
                      }
                      <td class="detail-total">{{ (row.balance ?? row.total) | currency:'USD':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          <div class="lane-summary">
            <span>Avg: <strong>{{ d.loanPayments.avgMonthly | currency:'USD':'symbol':'1.0-0' }}</strong></span>
            <span>Remaining: <strong>{{ d.loanPayments.remainingBalance | currency:'USD':'symbol':'1.0-0' }}</strong></span>
          </div>
        </div>

        <!-- Credit Card Payments Lane -->
        <div class="lane-card lane-cards">
          <div class="lane-header" (click)="toggleLane('cards')">
            <div class="lane-title">
              <span class="lane-icon-pill pill-pink"><mat-icon>credit_card</mat-icon></span>
              <span class="lane-name">Credit Card Payments</span>
            </div>
            <div class="lane-header-right">
              <span class="trend-badge" [class.trend-good]="d.cardPayments.trend >= 0" [class.trend-bad]="d.cardPayments.trend < 0">
                <mat-icon class="trend-icon">{{ d.cardPayments.trend >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                {{ abs(d.cardPayments.trend) | number:'1.1-1' }}%
              </span>
              <mat-icon class="expand-icon" [class.expanded]="isExpanded('cards')">expand_more</mat-icon>
            </div>
          </div>
          <div class="month-columns">
            @for (m of d.cardPayments.monthly; track $index) {
              <div class="month-col">
                <span class="month-label">{{ d.months[$index].label }}</span>
                <span class="month-value">{{ asLane(m).total | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
          @if (isExpanded('cards') && d.cardPayments.details?.length) {
            <div class="detail-section">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th class="detail-name-col">Card</th>
                    @for (mo of d.months; track $index) {
                      <th class="detail-month-col">{{ mo.label }}</th>
                    }
                    <th class="detail-total-col">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of d.cardPayments.details; track row.name) {
                    <tr>
                      <td class="detail-name">{{ row.name }}</td>
                      @for (val of row.monthly; track $index) {
                        <td class="detail-val">{{ val | currency:'USD':'symbol':'1.0-0' }}</td>
                      }
                      <td class="detail-total">{{ (row.balance ?? row.total) | currency:'USD':'symbol':'1.0-0' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          <div class="lane-summary">
            <span>Avg: <strong>{{ d.cardPayments.avgMonthly | currency:'USD':'symbol':'1.0-0' }}</strong></span>
            <span>Balance: <strong>{{ d.cardPayments.remainingBalance | currency:'USD':'symbol':'1.0-0' }}</strong></span>
          </div>
        </div>

      }
    </div>
  `,
  styles: [`
    .pulse-container { max-width: 900px; margin: 0 auto; padding: var(--spacing-md); }
    .pulse-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .period-chips { display: flex; gap: 8px; }
    .period-chip {
      padding: 8px 20px; border-radius: var(--radius-full); border: 1.5px solid rgba(0,0,0,0.12);
      background: var(--color-surface); font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .period-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .period-chip.active {
      background: var(--color-primary); color: #fff; border-color: var(--color-primary);
    }

    .loading-wrap { display: flex; justify-content: center; align-items: center; min-height: 50vh; }

    .lane-card {
      background: var(--color-surface); border-radius: var(--radius-md); padding: 20px 24px;
      margin-bottom: var(--spacing-md); box-shadow: var(--shadow-sm); border-left: 4px solid;
      transition: box-shadow 0.2s;
    }
    .lane-card:hover { box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.08)); }
    .lane-expenses { border-left-color: #f59e0b; }
    .lane-loans { border-left-color: #8b5cf6; }
    .lane-cards { border-left-color: #ec4899; }
    .lane-trading { border-left-color: #6366f1; }
    .lane-networth { border-left-color: #10b981; }

    .lane-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 16px; cursor: pointer; user-select: none;
    }
    .lane-header:hover .expand-icon { color: var(--color-primary); }
    .lane-header-right { display: flex; align-items: center; gap: 8px; }
    .lane-title { display: flex; align-items: center; gap: 10px; }
    .lane-icon-pill {
      width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
    }
    .lane-icon-pill mat-icon { font-size: 20px; width: 20px; height: 20px; color: #fff; }
    .pill-amber { background: #f59e0b; }
    .pill-purple { background: #8b5cf6; }
    .pill-pink { background: #ec4899; }
    .pill-indigo { background: #6366f1; }
    .pill-green { background: #10b981; }
    .lane-name { font-size: 1.05rem; font-weight: 700; }

    .expand-icon {
      font-size: 22px; width: 22px; height: 22px;
      color: var(--color-text-muted); transition: transform 0.25s ease, color 0.2s;
    }
    .expand-icon.expanded { transform: rotate(180deg); }

    .trend-badge {
      display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px;
      border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 700;
    }
    .trend-icon { font-size: 16px; width: 16px; height: 16px; }
    .trend-good { background: rgba(16, 185, 129, 0.1); color: #059669; }
    .trend-bad { background: rgba(239, 68, 68, 0.1); color: #dc2626; }

    .month-columns {
      display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
    }
    .month-col {
      flex: 1; min-width: 120px; text-align: center; padding: 12px 8px;
      background: rgba(0,0,0,0.02); border-radius: var(--radius-sm);
      display: flex; flex-direction: column; gap: 4px;
    }
    .month-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .month-value { font-size: 1.25rem; font-weight: 800; }
    .month-value.muted { color: var(--color-text-muted); font-weight: 400; }
    .month-sub { font-size: 0.7rem; color: var(--color-text-muted); }

    .pnl-positive { color: #059669; }
    .pnl-negative { color: #dc2626; }

    .detail-section {
      margin-top: 16px; padding-top: 12px; border-top: 1px dashed rgba(0,0,0,0.08);
      overflow-x: auto;
    }
    .detail-table {
      width: 100%; border-collapse: collapse; font-size: 0.82rem;
    }
    .detail-table th {
      text-align: right; padding: 6px 10px; font-weight: 600; font-size: 0.72rem;
      color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.4px;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .detail-table th.detail-name-col { text-align: left; }
    .detail-table td { padding: 8px 10px; border-bottom: 1px solid rgba(0,0,0,0.04); }
    .detail-name {
      text-align: left; font-weight: 600; white-space: nowrap;
      display: flex; align-items: center; gap: 6px;
    }
    .detail-row-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-text-muted); }
    .detail-val { text-align: right; font-variant-numeric: tabular-nums; }
    .detail-total { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
    .detail-table tbody tr:hover { background: rgba(0,0,0,0.02); }

    .lane-summary {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.06);
      font-size: 0.85rem; color: var(--color-text-secondary);
    }

    @media (max-width: 599px) {
      .pulse-container { padding: 10px; }
      .pulse-header { margin-bottom: var(--spacing-md); }
      .period-chips { width: 100%; justify-content: center; }
      .period-chip { padding: 10px 18px; font-size: 0.9rem; min-height: 44px; }
      .lane-card { padding: 14px 14px; margin-bottom: 12px; }
      .lane-header { margin-bottom: 12px; min-height: 44px; }
      .lane-icon-pill { width: 32px; height: 32px; border-radius: 8px; }
      .lane-icon-pill mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .lane-name { font-size: 0.9rem; }
      .trend-badge { padding: 4px 8px; font-size: 0.75rem; }
      .expand-icon { font-size: 20px; width: 20px; height: 20px; }
      .month-columns {
        gap: 6px; margin: 0 -14px; padding: 0 14px 8px;
        -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory;
      }
      .month-col {
        min-width: 90px; padding: 10px 6px; scroll-snap-align: start;
      }
      .month-label { font-size: 0.7rem; }
      .month-value { font-size: 1rem; font-weight: 700; }
      .month-sub { font-size: 0.65rem; }
      .lane-summary { font-size: 0.8rem; flex-wrap: wrap; gap: 4px; }
      .detail-section { margin: 12px -14px 0; padding: 10px 14px 0; }
      .detail-table { font-size: 0.72rem; }
      .detail-table th { padding: 5px 6px; font-size: 0.65rem; }
      .detail-table td { padding: 7px 6px; }
      .detail-name { font-size: 0.72rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
      .detail-val, .detail-total { font-size: 0.72rem; }
    }
  `]
})
export class MonthlyPulseComponent implements OnInit {
  private pulseService = inject(MonthlyPulseService);
  private cdr = inject(ChangeDetectorRef);

  data = signal<MonthlyPulseData | null>(null);
  loading = signal(true);
  selectedPeriod = signal<Period>('3');
  expandedLanes = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadData();
  }

  setPeriod(period: Period): void {
    this.selectedPeriod.set(period);
    this.loadData();
  }

  toggleLane(lane: string): void {
    const current = new Set(this.expandedLanes());
    current.has(lane) ? current.delete(lane) : current.add(lane);
    this.expandedLanes.set(current);
  }

  isExpanded(lane: string): boolean {
    return this.expandedLanes().has(lane);
  }

  loadData(): void {
    this.loading.set(true);
    const period = this.selectedPeriod();
    const mode = period === 'ytd' ? 'ytd' : undefined;
    const months = period === 'ytd' ? 12 : parseInt(period);

    this.pulseService.getPulse(months, undefined, undefined, mode).subscribe({
      next: (result) => {
        this.data.set(result);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  abs(val: number): number { return Math.abs(val); }
  asLane(m: any): LaneMonth { return m as LaneMonth; }
  asLoan(m: any): LoanPaymentMonth { return m as LoanPaymentMonth; }
  asTrading(m: any): TradingMonth { return m as TradingMonth; }
  asNW(m: any): NetWorthMonth { return m as NetWorthMonth; }
}
