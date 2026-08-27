import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TradingService } from '../../core/services/trading.service';
import { TradeEntry, TradingSetupSummary } from '../../core/models/trading.model';
import { TradeEntryDialogComponent, TradeEntryDialogData } from './trade-entry-dialog.component';

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  trades: TradeEntry[];
  totalPnl: number;
  tradeCount: number;
  dateStr: string;
}

@Component({
  selector: 'app-trading-calendar',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatButtonModule, MatIconModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <div class="calendar-page">
      @if (loading()) {
        <div class="loading-container"><mat-spinner></mat-spinner></div>
      } @else {
      <!-- Month Navigation -->
      <div class="month-header">
        <button mat-icon-button (click)="prevMonth()">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <h2>{{ monthLabel() }}</h2>
        <button mat-icon-button (click)="nextMonth()">
          <mat-icon>chevron_right</mat-icon>
        </button>
        <button mat-button class="today-btn" (click)="goToday()">Today</button>
      </div>

      <!-- Monthly Summary -->
      <div class="month-summary">
        <div class="stat">
          <span class="stat-value">{{ tradingDays() }}</span>
          <span class="stat-label">Days Traded</span>
        </div>
        <div class="stat">
          <span class="stat-value" [class.positive]="monthPnl() >= 0" [class.negative]="monthPnl() < 0">
            {{ monthPnl() >= 0 ? '+' : '' }}{{ monthPnl() | currency }}
          </span>
          <span class="stat-label">Month P&L</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ winRate() }}%</span>
          <span class="stat-label">Win Rate</span>
        </div>
        <div class="stat desktop-only">
          <span class="stat-value positive">{{ bestDay() | currency }}</span>
          <span class="stat-label">Best Day</span>
        </div>
        <div class="stat desktop-only">
          <span class="stat-value negative">{{ worstDay() | currency }}</span>
          <span class="stat-label">Worst Day</span>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <div class="weekday-header">
          @for (day of weekdays; track day) {
            <div class="weekday">{{ day }}</div>
          }
        </div>
        <div class="days-grid">
          @for (day of calendarDays(); track day.dateStr) {
            <div class="day-cell"
                 [class.other-month]="!day.isCurrentMonth"
                 [class.today]="day.isToday"
                 [class.has-trades]="day.tradeCount > 0"
                 [class.green-day]="day.totalPnl > 0"
                 [class.red-day]="day.totalPnl < 0"
                 (click)="day.tradeCount > 0 && selectDay(day)">
              <span class="day-number">{{ day.date }}</span>
              @if (day.tradeCount > 0) {
                <span class="day-pnl">{{ day.totalPnl >= 0 ? '+' : '' }}{{ day.totalPnl | currency:'USD':'symbol':'1.0-0' }}</span>
                <span class="day-count">{{ day.tradeCount }} {{ day.tradeCount === 1 ? 'trade' : 'trades' }}</span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Day Detail Panel -->
      @if (selectedDay()) {
        <div class="day-detail">
          <div class="detail-header">
            <h3>{{ selectedDayLabel() }}</h3>
            <div class="detail-pnl" [class.positive]="selectedDay()!.totalPnl >= 0" [class.negative]="selectedDay()!.totalPnl < 0">
              {{ selectedDay()!.totalPnl >= 0 ? '+' : '' }}{{ selectedDay()!.totalPnl | currency }}
            </div>
            <button mat-icon-button (click)="selectedDay.set(null)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="trade-list">
            @for (trade of selectedDay()!.trades; track trade.id) {
              <div class="trade-card" (click)="editTrade(trade)">
                <div class="trade-row-top">
                  <div class="trade-main">
                    <span class="trade-instrument">{{ trade.instrument }}</span>
                    <span class="trade-dir" [class.long]="trade.direction === 'long'" [class.short]="trade.direction === 'short'">
                      {{ trade.direction }}
                    </span>
                    @if (trade.spreadType && trade.spreadType !== 'Single') {
                      <span class="trade-spread">{{ trade.spreadType }}</span>
                    }
                    @if (trade.optionType) {
                      <span class="trade-option-type">{{ trade.optionType }}</span>
                    }
                  </div>
                  <span class="trade-pnl" [class.positive]="(trade.pnl ?? 0) >= 0" [class.negative]="(trade.pnl ?? 0) < 0">
                    {{ (trade.pnl ?? 0) >= 0 ? '+' : '' }}{{ trade.pnl | currency }}
                  </span>
                </div>

                <!-- Strike & Expiration -->
                @if (trade.strikePrice) {
                  <div class="trade-details">
                    <span class="detail-item">
                      <span class="detail-label">Strike</span>
                      {{ formatStrikes(trade) }}
                    </span>
                    @if (trade.expirationDate) {
                      <span class="detail-item">
                        <span class="detail-label">Exp</span>
                        {{ formatExpiry(trade.expirationDate) }}
                      </span>
                    }
                    @if (trade.entryPremium != null) {
                      <span class="detail-item">
                        <span class="detail-label">Entry</span>
                        {{ trade.entryPremium | currency }}
                      </span>
                    }
                    @if (trade.exitPremium != null) {
                      <span class="detail-item">
                        <span class="detail-label">Exit</span>
                        {{ trade.exitPremium | currency }}
                      </span>
                    }
                  </div>
                }

                <!-- Qty, Gross, Fees, Net -->
                <div class="trade-bottom">
                  <span class="trade-setup">{{ trade.setupName }}</span>
                  <span class="detail-item">{{ trade.quantity }} ct</span>
                  @if (trade.pnl != null) {
                    <span class="detail-item" [class.positive]="(trade.pnl ?? 0) >= 0" [class.negative]="(trade.pnl ?? 0) < 0">
                      Gross: {{ (trade.pnl ?? 0) >= 0 ? '+' : '' }}{{ trade.pnl | currency }}
                    </span>
                  }
                  @if (trade.totalFees) {
                    <span class="detail-item fee-item">Fees: {{ trade.totalFees | currency }}</span>
                  }
                  @if (trade.netPnl != null) {
                    <span class="detail-item net-item" [class.positive]="(trade.netPnl ?? 0) >= 0" [class.negative]="(trade.netPnl ?? 0) < 0">
                      Net: {{ (trade.netPnl ?? 0) >= 0 ? '+' : '' }}{{ trade.netPnl | currency }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
      }
    </div>
  `,
  styles: [`
    .calendar-page { padding: 16px; max-width: 900px; margin: 0 auto; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }

    .month-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
    }
    .month-header h2 { margin: 0; font-size: 1.2rem; font-weight: 700; min-width: 160px; text-align: center; }
    .today-btn { margin-left: auto; font-size: 0.8rem; }

    .month-summary {
      display: flex; gap: 16px; margin-bottom: 16px;
      padding: 12px 16px; border-radius: var(--radius-md);
      background: var(--color-surface-secondary);
    }
    .stat { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .stat-value { font-size: 1rem; font-weight: 700; }
    .stat-label { font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }

    .positive { color: var(--color-success) !important; }
    .negative { color: var(--color-danger) !important; }

    .calendar-grid {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .weekday-header {
      display: grid; grid-template-columns: repeat(7, 1fr);
      background: var(--color-surface-secondary);
      border-bottom: 1px solid var(--color-border);
    }
    .weekday {
      padding: 8px 4px; text-align: center;
      font-size: 0.7rem; font-weight: 700; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.05em;
    }

    .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); }

    .day-cell {
      min-height: 72px; padding: 6px;
      border-right: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
      display: flex; flex-direction: column;
      transition: var(--transition-fast);
      position: relative;
    }
    .day-cell:nth-child(7n) { border-right: none; }
    .day-cell.other-month { opacity: 0.35; }
    .day-cell.today { box-shadow: inset 0 0 0 2px var(--color-primary); }
    .day-cell.has-trades { cursor: pointer; }
    .day-cell.has-trades:hover { background: var(--color-surface-secondary); }

    .day-cell.green-day {
      background: color-mix(in srgb, var(--color-success) 8%, transparent);
    }
    .day-cell.green-day:hover {
      background: color-mix(in srgb, var(--color-success) 14%, transparent);
    }
    .day-cell.red-day {
      background: color-mix(in srgb, var(--color-danger) 8%, transparent);
    }
    .day-cell.red-day:hover {
      background: color-mix(in srgb, var(--color-danger) 14%, transparent);
    }

    .day-number {
      font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary);
    }
    .day-cell.green-day .day-number { color: var(--color-success); }
    .day-cell.red-day .day-number { color: var(--color-danger); }

    .day-pnl {
      font-size: 0.7rem; font-weight: 700; margin-top: auto;
    }
    .green-day .day-pnl { color: var(--color-success); }
    .red-day .day-pnl { color: var(--color-danger); }

    .day-count {
      font-size: 0.6rem; color: var(--color-text-muted);
    }

    .day-detail {
      margin-top: 16px; border: 1.5px solid var(--color-primary);
      border-radius: var(--radius-md); overflow: hidden;
    }
    .detail-header {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      background: color-mix(in srgb, var(--color-primary) 8%, transparent);
      border-bottom: 1px solid var(--color-border);
    }
    .detail-header h3 { margin: 0; font-size: 0.95rem; font-weight: 700; }
    .detail-pnl { font-size: 1rem; font-weight: 700; margin-left: auto; }
    .detail-header button { margin-left: 4px; }

    .trade-list { padding: 8px; display: flex; flex-direction: column; gap: 6px; }

    .trade-card {
      padding: 10px 12px; border-radius: var(--radius-sm);
      background: var(--color-surface-secondary);
      cursor: pointer; transition: var(--transition-fast);
    }
    .trade-card:hover { background: var(--color-surface-tertiary, var(--color-border)); }

    .trade-main { display: flex; align-items: center; gap: 8px; }
    .trade-instrument { font-weight: 700; font-size: 0.85rem; }
    .trade-dir {
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 6px; border-radius: 4px;
    }
    .trade-dir.long { background: var(--color-stat-green-bg); color: var(--color-success); }
    .trade-dir.short { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .trade-spread {
      font-size: 0.65rem; font-weight: 600; padding: 2px 6px;
      border-radius: 4px; background: var(--color-stat-purple-bg); color: var(--color-stat-purple);
    }

    .trade-row-top { display: flex; align-items: center; justify-content: space-between; }
    .trade-option-type {
      font-size: 0.65rem; font-weight: 600; padding: 2px 6px;
      border-radius: 4px; background: var(--color-surface-secondary); color: var(--color-text-secondary);
    }
    .trade-pnl { font-size: 0.9rem; font-weight: 700; }

    .trade-details {
      display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px;
      padding: 6px 8px; border-radius: var(--radius-sm);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }
    .detail-item { font-size: 0.75rem; color: var(--color-text-secondary); }
    .detail-label { font-weight: 700; color: var(--color-text-muted); margin-right: 4px; text-transform: uppercase; font-size: 0.6rem; }

    .trade-bottom {
      display: flex; align-items: center; gap: 10px; margin-top: 6px;
      font-size: 0.75rem;
    }
    .trade-setup { color: var(--color-text-muted); font-weight: 500; }
    .fee-item { color: var(--color-stat-amber); }
    .net-item { font-weight: 700; }

    @media (max-width: 599px) {
      .calendar-page { padding: 8px; }
      .day-cell { min-height: 48px; padding: 4px; }
      .day-pnl { font-size: 0.6rem; }
      .day-count { display: none; }
      .month-summary { gap: 8px; padding: 10px 12px; }
      .stat-value { font-size: 0.85rem; }
      .desktop-only { display: none; }
    }
  `]
})
export class TradingCalendarComponent implements OnInit {
  private tradingService = inject(TradingService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth());
  trades = signal<TradeEntry[]>([]);
  setups = signal<TradingSetupSummary[]>([]);
  calendarDays = signal<CalendarDay[]>([]);
  selectedDay = signal<CalendarDay | null>(null);

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  monthLabel = signal('');
  tradingDays = signal(0);
  monthPnl = signal(0);
  winRate = signal(0);
  bestDay = signal(0);
  worstDay = signal(0);

  ngOnInit(): void {
    this.tradingService.getSetups().subscribe(s => this.setups.set(s));
    this.loadMonth();
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.selectedDay.set(null);
    this.loadMonth();
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.selectedDay.set(null);
    this.loadMonth();
  }

  goToday(): void {
    const now = new Date();
    this.currentYear.set(now.getFullYear());
    this.currentMonth.set(now.getMonth());
    this.selectedDay.set(null);
    this.loadMonth();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay.set(day);
  }

  selectedDayLabel(): string {
    const d = this.selectedDay();
    if (!d) return '';
    const date = new Date(this.currentYear(), this.currentMonth(), d.date);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  formatStrikes(trade: TradeEntry): string {
    const strikes = [trade.strikePrice, trade.strikePrice2, trade.strikePrice3, trade.strikePrice4]
      .filter(s => s != null);
    return strikes.join(' / ');
  }

  formatExpiry(dateStr: string): string {
    const parts = dateStr.split('T')[0].split('-');
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  }

  editTrade(trade: TradeEntry): void {
    const dialogData: TradeEntryDialogData = { trade, setups: this.setups() };
    const ref = this.dialog.open(TradeEntryDialogComponent, {
      width: '560px', maxWidth: '95vw', data: dialogData
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadMonth();
    });
  }

  private loadMonth(): void {
    const year = this.currentYear();
    const month = this.currentMonth();

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    this.monthLabel.set(`${months[month]} ${year}`);

    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    this.tradingService.getTrades(from, to).subscribe({
      next: trades => {
        this.trades.set(trades);
        this.buildCalendar(trades, year, month);
        this.computeStats(trades);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  private buildCalendar(trades: TradeEntry[], year: number, month: number): void {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const tradesByDate = new Map<string, TradeEntry[]>();
    trades.forEach(t => {
      const dateKey = t.date.split('T')[0];
      if (!tradesByDate.has(dateKey)) tradesByDate.set(dateKey, []);
      tradesByDate.get(dateKey)!.push(t);
    });

    const days: CalendarDay[] = [];

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({ date: d, isCurrentMonth: false, isToday: false, trades: [], totalPnl: 0, tradeCount: 0, dateStr: `prev-${d}` });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTrades = tradesByDate.get(dateStr) || [];
      const totalPnl = dayTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: isCurrentMonth && today.getDate() === d,
        trades: dayTrades,
        totalPnl: Math.round(totalPnl * 100) / 100,
        tradeCount: dayTrades.length,
        dateStr
      });
    }

    // Next month leading days (fill to complete the grid)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, isCurrentMonth: false, isToday: false, trades: [], totalPnl: 0, tradeCount: 0, dateStr: `next-${d}` });
    }

    this.calendarDays.set(days);
  }

  private computeStats(trades: TradeEntry[]): void {
    const byDate = new Map<string, number>();
    trades.forEach(t => {
      const key = t.date.split('T')[0];
      byDate.set(key, (byDate.get(key) ?? 0) + (t.pnl ?? 0));
    });

    const dayPnls = [...byDate.values()];
    this.tradingDays.set(byDate.size);
    this.monthPnl.set(Math.round(dayPnls.reduce((a, b) => a + b, 0) * 100) / 100);
    this.winRate.set(dayPnls.length > 0 ? Math.round((dayPnls.filter(p => p > 0).length / dayPnls.length) * 100) : 0);
    this.bestDay.set(dayPnls.length > 0 ? Math.max(...dayPnls) : 0);
    this.worstDay.set(dayPnls.length > 0 ? Math.min(...dayPnls) : 0);
  }
}
