import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TradingService } from '../../core/services/trading.service';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { TradeEntry, TradingSetupSummary } from '../../core/models/trading.model';
import { TradeEntryDialogComponent, TradeEntryDialogData } from './trade-entry-dialog.component';

function toLocalDateKey(utcDateStr: string): string {
  const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const d = new Date(utcDateStr);
  const parts = d.toLocaleDateString('en-CA', { timeZone: tz });
  return parts;
}

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
  imports: [CommonModule, CurrencyPipe, MatButtonModule, MatIconModule, MatDialogModule, SkeletonLoaderComponent],
  template: `
    <div class="calendar-page">
      @if (loading()) {
        <app-skeleton type="dashboard"></app-skeleton>
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
      <div class="summary-grid">
        <div class="summary-card hero-card" [class.hero-positive]="netPnl() >= 0" [class.hero-negative]="netPnl() < 0">
          <div class="hero-icon-wrap">
            <mat-icon>{{ netPnl() >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
          </div>
          <div class="hero-content">
            <span class="hero-value">{{ netPnl() >= 0 ? '+' : '' }}{{ netPnl() | currency }}</span>
            <span class="summary-label">Net P&L</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon-wrap blue"><mat-icon>bar_chart</mat-icon></div>
          <div class="summary-content">
            <span class="summary-value">{{ totalTrades() }}</span>
            <span class="summary-label">Trades</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon-wrap purple"><mat-icon>emoji_events</mat-icon></div>
          <div class="summary-content">
            <div class="wl-row">
              <span class="wl-win">{{ winningTrades() }}W</span>
              <span class="wl-sep">/</span>
              <span class="wl-loss">{{ losingTrades() }}L</span>
            </div>
            <span class="summary-label">{{ winRate() }}% Win Rate</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon-wrap" [class.green]="avgPnl() >= 0" [class.red]="avgPnl() < 0">
            <mat-icon>functions</mat-icon>
          </div>
          <div class="summary-content">
            <span class="summary-value">{{ avgPnl() >= 0 ? '+' : '' }}{{ avgPnl() | currency }}</span>
            <span class="summary-label">Avg Trade</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="summary-icon-wrap amber"><mat-icon>receipt_long</mat-icon></div>
          <div class="summary-content">
            <span class="summary-value fee-val">-{{ totalFees() | currency }}</span>
            <span class="summary-label">Fees</span>
          </div>
        </div>

        <div class="summary-card desktop-only">
          <div class="summary-icon-wrap teal"><mat-icon>checklist</mat-icon></div>
          <div class="summary-content">
            <span class="summary-value">{{ checklistRate() }}%</span>
            <span class="summary-label">Checklist</span>
          </div>
        </div>

        <div class="summary-card desktop-only">
          <div class="summary-icon-wrap green"><mat-icon>arrow_circle_up</mat-icon></div>
          <div class="summary-content">
            <span class="summary-value positive">+{{ bestDay() | currency }}</span>
            <span class="summary-label">Best Day</span>
          </div>
        </div>

        <div class="summary-card desktop-only">
          <div class="summary-icon-wrap red"><mat-icon>arrow_circle_down</mat-icon></div>
          <div class="summary-content">
            <span class="summary-value negative">{{ worstDay() | currency }}</span>
            <span class="summary-label">Worst Day</span>
          </div>
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
    .calendar-page { padding: 16px; max-width: 1100px; margin: 0 auto; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }

    .month-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
    }
    .month-header h2 { margin: 0; font-size: 1.2rem; font-weight: 700; min-width: 160px; text-align: center; }
    .today-btn { margin-left: auto; font-size: 0.8rem; }

    /* Summary Grid */
    .summary-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 10px; margin-bottom: 16px;
    }
    .summary-card {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      border: 1px solid var(--color-border);
    }
    .summary-icon-wrap {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .summary-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .summary-icon-wrap.blue { background: rgba(33,150,243,0.1); color: #1976d2; }
    .summary-icon-wrap.purple { background: rgba(156,39,176,0.1); color: #7b1fa2; }
    .summary-icon-wrap.green { background: rgba(76,175,80,0.1); color: #388e3c; }
    .summary-icon-wrap.red { background: rgba(244,67,54,0.1); color: #d32f2f; }
    .summary-icon-wrap.amber { background: rgba(255,152,0,0.1); color: #f57c00; }
    .summary-icon-wrap.teal { background: rgba(0,150,136,0.1); color: #00897b; }

    .summary-content { display: flex; flex-direction: column; min-width: 0; }
    .summary-value { font-size: 0.95rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .summary-label { font-size: 0.68rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; font-weight: 500; }
    .fee-val { color: var(--color-stat-amber); }

    .wl-row { display: flex; align-items: baseline; gap: 4px; }
    .wl-win { font-size: 0.95rem; font-weight: 700; color: var(--color-success); }
    .wl-loss { font-size: 0.95rem; font-weight: 700; color: var(--color-danger); }
    .wl-sep { font-size: 0.8rem; color: var(--color-text-muted); }

    /* Hero card (Net P&L) */
    .hero-card {
      grid-column: span 2; border: none;
    }
    .hero-card.hero-positive {
      background: linear-gradient(135deg, rgba(76,175,80,0.08), rgba(76,175,80,0.02));
      border: 1.5px solid rgba(76,175,80,0.25);
    }
    .hero-card.hero-negative {
      background: linear-gradient(135deg, rgba(244,67,54,0.08), rgba(244,67,54,0.02));
      border: 1.5px solid rgba(244,67,54,0.25);
    }
    .hero-icon-wrap {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .hero-icon-wrap mat-icon { font-size: 26px; width: 26px; height: 26px; }
    .hero-positive .hero-icon-wrap { background: rgba(76,175,80,0.15); color: #388e3c; }
    .hero-negative .hero-icon-wrap { background: rgba(244,67,54,0.15); color: #d32f2f; }
    .hero-content { display: flex; flex-direction: column; }
    .hero-value { font-size: 1.3rem; font-weight: 800; }
    .hero-positive .hero-value { color: var(--color-success); }
    .hero-negative .hero-value { color: var(--color-danger); }

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
      padding: 10px 4px; text-align: center;
      font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: 0.05em;
    }

    .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); }

    .day-cell {
      min-height: 90px; padding: 8px;
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
      font-size: 0.95rem; font-weight: 600; color: var(--color-text-secondary);
    }
    .day-cell.green-day .day-number { color: var(--color-success); }
    .day-cell.red-day .day-number { color: var(--color-danger); }

    .day-pnl {
      font-size: 0.85rem; font-weight: 700; margin-top: auto;
    }
    .green-day .day-pnl { color: var(--color-success); }
    .red-day .day-pnl { color: var(--color-danger); }

    .day-count {
      font-size: 0.75rem; color: var(--color-text-muted);
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

    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .hero-card { grid-column: span 2; }
    }
    @media (max-width: 599px) {
      .calendar-page { padding: 8px; }
      .day-cell { min-height: 56px; padding: 5px; }
      .day-number { font-size: 0.8rem; }
      .day-pnl { font-size: 0.7rem; }
      .day-count { display: none; }
      .summary-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
      .hero-card { grid-column: span 2; }
      .summary-card { padding: 10px 12px; }
      .summary-value { font-size: 0.85rem; }
      .hero-value { font-size: 1.1rem; }
      .desktop-only { display: none; }
    }
  `]
})
export class TradingCalendarComponent implements OnInit {
  private tradingService = inject(TradingService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

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
  totalTrades = signal(0);
  winningTrades = signal(0);
  losingTrades = signal(0);
  totalFees = signal(0);
  netPnl = signal(0);
  avgPnl = signal(0);
  checklistRate = signal(0);

  ngOnInit(): void {
    this.tradingService.getSetups().subscribe(s => { this.setups.set(s); this.cdr.detectChanges(); });
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
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
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
      const dateKey = toLocalDateKey(t.date);
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
      const key = toLocalDateKey(t.date);
      byDate.set(key, (byDate.get(key) ?? 0) + (t.pnl ?? 0));
    });

    const dayPnls = [...byDate.values()];
    const closed = trades.filter(t => t.pnl != null);
    this.tradingDays.set(byDate.size);
    this.monthPnl.set(Math.round(dayPnls.reduce((a, b) => a + b, 0) * 100) / 100);
    this.winRate.set(dayPnls.length > 0 ? Math.round((dayPnls.filter(p => p > 0).length / dayPnls.length) * 100) : 0);
    this.bestDay.set(dayPnls.length > 0 ? Math.max(...dayPnls) : 0);
    this.worstDay.set(dayPnls.length > 0 ? Math.min(...dayPnls) : 0);
    this.totalTrades.set(trades.length);
    this.winningTrades.set(closed.filter(t => (t.pnl ?? 0) > 0).length);
    this.losingTrades.set(closed.filter(t => (t.pnl ?? 0) <= 0).length);
    this.totalFees.set(Math.round(trades.reduce((s, t) => s + (t.totalFees ?? 0), 0) * 100) / 100);
    this.netPnl.set(Math.round(trades.reduce((s, t) => s + (t.netPnl ?? t.pnl ?? 0), 0) * 100) / 100);
    this.avgPnl.set(closed.length > 0 ? Math.round(closed.reduce((s, t) => s + (t.netPnl ?? t.pnl ?? 0), 0) / closed.length * 100) / 100 : 0);
    this.checklistRate.set(trades.length > 0 ? Math.round(trades.filter(t => t.checklistCompleted).length / trades.length * 100) : 0);
  }
}
