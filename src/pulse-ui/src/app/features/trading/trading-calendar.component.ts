import { Component, inject, signal, computed, OnInit, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TradingService } from '../../core/services/trading.service';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { TradeEntry, TradingSetupSummary, GoalProgress, GoalHistory } from '../../core/models/trading.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradeEntryDialogComponent, TradeEntryDialogData } from './trade-entry-dialog.component';

function toLocalDateKey(utcDateStr: string): string {
  let tz: string;
  try { tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone; }
  catch { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; }
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

interface GoalCalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string;
}

interface GoalCalendarResult {
  goalId: number;
  metric: string;
  operator: string;
  currentValue: number;
  targetValue: number;
  achieved: boolean;
  percentage: number;
}

interface GoalCalendarWeek {
  weekKey: string;
  weekStart: Date;
  weekEnd: Date;
  days: GoalCalendarDay[];
  goalResults: GoalCalendarResult[];
  status: 'achieved' | 'missed' | 'nodata' | 'future';
  rangeLabel: string;
  weekPnl: number | null;
}

interface MetricDef {
  key: string;
  label: string;
  icon: string;
  format: 'currency' | 'percent' | 'number';
}

@Component({
  selector: 'app-trading-calendar',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, MatButtonModule, MatIconModule, MatDialogModule, SkeletonLoaderComponent],
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

      <!-- View Toggle -->
      <div class="view-toggle">
        <button class="toggle-seg" [class.active]="viewMode() === 'daily'" (click)="viewMode.set('daily')">
          <mat-icon>bar_chart</mat-icon>
          <span>Daily P&L</span>
        </button>
        <button class="toggle-seg" [class.active]="viewMode() === 'goals'" (click)="switchToGoals()">
          <mat-icon>military_tech</mat-icon>
          <span>Weekly Goals</span>
        </button>
      </div>

      <!-- ═══════ DAILY P&L VIEW ═══════ -->
      @if (viewMode() === 'daily') {

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

      <!-- ═══════ WEEKLY GOALS VIEW ═══════ -->
      @if (viewMode() === 'goals') {

        @if (goalProgress().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrap"><mat-icon>military_tech</mat-icon></div>
            <h3>Set Your Trading Standards</h3>
            <p>The best traders set clear targets and measure everything. Start with one goal — consistency beats ambition.</p>
            <button mat-raised-button color="primary" (click)="goToGoalsPage()">
              <mat-icon>add</mat-icon> Define Your First Goal
            </button>
          </div>
        } @else {

        <!-- Discipline Scorecard -->
        <div class="discipline-scorecard">
          @if (goalMonthlySummary(); as ms) {
            <div class="scorecard-stats">
              <div class="sc-stat">
                <div class="sc-icon-wrap" [class.sc-green]="ms.rate >= 70" [class.sc-amber]="ms.rate >= 40 && ms.rate < 70" [class.sc-red]="ms.rate < 40">
                  <mat-icon>verified</mat-icon>
                </div>
                <span class="sc-value" [class.rate-good]="ms.rate >= 70" [class.rate-ok]="ms.rate >= 40 && ms.rate < 70" [class.rate-low]="ms.rate < 40">{{ ms.rate }}%</span>
                <span class="sc-label">Achievement Rate</span>
              </div>
              <div class="sc-stat">
                <div class="sc-icon-wrap sc-amber">
                  <mat-icon>local_fire_department</mat-icon>
                </div>
                <span class="sc-value streak-val">{{ ms.streak }}</span>
                <span class="sc-label">Week Streak</span>
              </div>
              <div class="sc-stat">
                <div class="sc-icon-wrap sc-blue">
                  <mat-icon>check_circle</mat-icon>
                </div>
                <span class="sc-value">{{ ms.achieved }}<span class="sc-of">/{{ ms.total }}</span></span>
                <span class="sc-label">Goals Hit</span>
              </div>
              <div class="sc-stat">
                <div class="sc-icon-wrap sc-purple">
                  <mat-icon>emoji_events</mat-icon>
                </div>
                <span class="sc-value">{{ goalBestStreak() }}</span>
                <span class="sc-label">Best Streak</span>
              </div>
            </div>
          }
          @if (goalCoachingMessage(); as cm) {
            <div class="mentor-message" [class.mentor-success]="cm.type === 'success'" [class.mentor-good]="cm.type === 'good'" [class.mentor-building]="cm.type === 'building'" [class.mentor-encourage]="cm.type === 'encourage'">
              <mat-icon class="mentor-icon">{{ cm.icon }}</mat-icon>
              <span class="mentor-text">{{ cm.text }}</span>
            </div>
          }
        </div>

        <!-- Goal Calendar -->
        <div class="goal-calendar">
          <div class="cal-weekday-header">
            @for (d of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; track d) {
              <span class="cal-weekday">{{ d }}</span>
            }
          </div>
          <div class="cal-grid">
            @for (week of goalCalendarWeeks(); track week.weekKey) {
              <div class="cal-week-wrapper"
                [class.week-achieved]="week.status === 'achieved'"
                [class.week-missed]="week.status === 'missed'"
                [class.week-nodata]="week.status === 'nodata'"
                [class.week-future]="week.status === 'future'"
                [class.week-selected]="goalSelectedWeek()?.weekKey === week.weekKey"
                (click)="selectGoalWeek(week)">
                <div class="cal-week-days">
                  @for (day of week.days; track day.dateStr) {
                    <div class="cal-day" [class.other-month]="!day.isCurrentMonth" [class.is-today]="day.isToday">
                      <span class="cal-day-num">{{ day.date }}</span>
                    </div>
                  }
                </div>
                @if (week.status !== 'future' && week.status !== 'nodata') {
                  <div class="cal-week-summary-bar">
                    @if (week.status === 'achieved') {
                      <mat-icon class="wb-icon wb-pass">check_circle</mat-icon>
                      <span class="wb-label wb-pass-text">Goals Hit</span>
                    } @else if (week.status === 'missed') {
                      <mat-icon class="wb-icon wb-miss">pending</mat-icon>
                      <span class="wb-label wb-miss-text">Keep Working</span>
                    }
                    @if (week.weekPnl !== null) {
                      <span class="week-pnl" [class.pnl-positive]="week.weekPnl >= 0" [class.pnl-negative]="week.weekPnl < 0">
                        {{ formatGoalPnl(week.weekPnl) }}
                      </span>
                    }
                  </div>
                }
              </div>

              @if (goalSelectedWeek()?.weekKey === week.weekKey) {
                <div class="week-detail" [class.wd-achieved]="week.status === 'achieved'" [class.wd-missed-panel]="week.status === 'missed'">
                  <div class="wd-header">
                    <mat-icon class="wd-icon">date_range</mat-icon>
                    <span class="wd-range">{{ week.rangeLabel }}</span>
                    @if (week.status === 'achieved') {
                      <span class="wd-badge wd-achieved">All Goals Hit!</span>
                    } @else if (week.status === 'missed') {
                      <span class="wd-badge wd-keep-working">Keep Working</span>
                    } @else {
                      <span class="wd-badge wd-nodata">No Data</span>
                    }
                  </div>
                  @if (week.goalResults.length > 0) {
                    <div class="wd-goals">
                      @for (gr of week.goalResults; track gr.goalId) {
                        <div class="wd-goal-row" [class.wd-goal-hit]="gr.achieved" [class.wd-goal-miss]="!gr.achieved">
                          <div class="wd-goal-icon-wrap" [class.wd-icon-hit]="gr.achieved" [class.wd-icon-miss]="!gr.achieved">
                            <mat-icon>{{ getMetricIcon(gr.metric) }}</mat-icon>
                          </div>
                          <div class="wd-goal-info">
                            <span class="wd-goal-name">{{ getMetricLabel(gr.metric) }}</span>
                            <span class="wd-goal-target-sub">Target: {{ gr.operator === 'gte' ? '≥' : '≤' }} {{ formatGoalValue(gr.targetValue, gr.metric) }}</span>
                          </div>
                          <span class="wd-goal-value" [class.wd-val-hit]="gr.achieved" [class.wd-val-miss]="!gr.achieved">{{ formatGoalValue(gr.currentValue, gr.metric) }}</span>
                          @if (gr.achieved) {
                            <mat-icon class="wd-result-icon wd-result-pass">check_circle</mat-icon>
                          } @else {
                            <mat-icon class="wd-result-icon wd-result-progress">radio_button_unchecked</mat-icon>
                          }
                        </div>
                      }
                      @if (week.status === 'missed') {
                        <p class="wd-encouragement">Progress, not perfection. You showed up — that's what matters.</p>
                      }
                    </div>
                  } @else {
                    <p class="wd-empty">No trading data for this week</p>
                  }
                </div>
              }
            }
          </div>

          <div class="cal-legend">
            <span class="cal-legend-item"><span class="cal-legend-dot cal-lg-achieved"></span> Achieved</span>
            <span class="cal-legend-item"><span class="cal-legend-dot cal-lg-missed"></span> In Progress</span>
            <span class="cal-legend-item"><span class="cal-legend-dot cal-lg-nodata"></span> No data</span>
          </div>
        </div>

        <!-- Live Progress -->
        @if (goalProgress().length > 0) {
          <div class="live-progress" [class.live-all-hit]="goalAchievedCount() === goalProgress().length" [class.live-mixed]="goalAchievedCount() > 0 && goalAchievedCount() < goalProgress().length">
            <div class="live-header">
              <mat-icon class="live-dot">fiber_manual_record</mat-icon>
              <span class="live-title">This Week — Your Discipline Check</span>
              <span class="live-summary-badge">{{ goalAchievedCount() }}/{{ goalProgress().length }} on track</span>
            </div>
            @for (p of goalProgress(); track p.goal.id) {
              <div class="live-goal-card" [class.lgc-achieved]="p.achieved">
                <div class="lgc-top">
                  <div class="lgc-icon-wrap" [class.lgc-icon-hit]="p.achieved" [class.lgc-icon-progress]="!p.achieved">
                    <mat-icon>{{ getMetricIcon(p.goal.metric) }}</mat-icon>
                  </div>
                  <div class="lgc-info">
                    <span class="lgc-name">{{ getMetricLabel(p.goal.metric) }}</span>
                    <span class="lgc-target">Target: {{ p.goal.operator === 'gte' ? '≥' : '≤' }} {{ formatGoalValue(p.goal.targetValue, p.goal.metric) }}</span>
                  </div>
                  <div class="lgc-value-wrap">
                    <span class="lgc-value" [class.lgc-val-hit]="p.achieved" [class.lgc-val-danger]="!p.achieved && p.percentage < 50">{{ formatGoalValue(p.currentValue, p.goal.metric) }}</span>
                    @if (p.achieved) {
                      <mat-icon class="lgc-check">check_circle</mat-icon>
                    } @else {
                      <span class="lgc-pct">{{ p.percentage | number:'1.0-0' }}%</span>
                    }
                  </div>
                </div>
                <div class="lgc-bar-row">
                  <div class="progress-bar-track lgc-track">
                    <div class="progress-bar-fill" [class.fill-green]="p.achieved" [class.fill-amber]="!p.achieved && p.percentage >= 50"
                      [class.fill-red]="!p.achieved && p.percentage < 50"
                      [style.width.%]="Math.min(p.percentage, 100)"></div>
                  </div>
                </div>
                <span class="lgc-encouragement">{{ getProgressEncouragement(p) }}</span>
              </div>
            }
          </div>
        }

        <!-- Manage Goals Link -->
        <div class="manage-goals-row">
          <button mat-stroked-button color="primary" class="manage-goals-btn" (click)="goToGoalsPage()">
            <mat-icon>tune</mat-icon> Manage Goals
          </button>
        </div>

        }
      }

      }
    </div>
  `,
  styles: [`
    .calendar-page { padding: 16px; max-width: 1100px; margin: 0 auto; }

    .month-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
    }
    .month-header h2 { margin: 0; font-size: 1.2rem; font-weight: 700; min-width: 160px; text-align: center; }
    .today-btn { margin-left: auto; font-size: 0.8rem; }

    /* View Toggle */
    .view-toggle {
      display: flex; gap: 0; margin-bottom: 16px;
      background: var(--color-surface-secondary); border-radius: var(--radius-full);
      padding: 3px; border: 1px solid var(--color-border);
    }
    .toggle-seg {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 0; height: 40px; border: none; border-radius: var(--radius-full);
      background: transparent; cursor: pointer; font-size: 0.82rem; font-weight: 600;
      color: var(--color-text-muted); transition: all 0.2s;
      font-family: inherit;
    }
    .toggle-seg mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .toggle-seg.active {
      background: var(--color-primary); color: #fff; box-shadow: var(--shadow-sm);
    }
    .toggle-seg:not(.active):hover {
      background: var(--color-surface-tertiary, var(--color-border)); color: var(--color-text);
    }

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

    /* ═══════ GOALS VIEW STYLES ═══════ */

    /* Empty State */
    .empty-state { text-align: center; padding: 48px 24px; }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, var(--color-stat-blue-bg), var(--color-stat-purple-bg));
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-icon-wrap mat-icon { font-size: 34px; width: 34px; height: 34px; color: var(--color-primary); }
    .empty-state h3 { margin: 0 0 8px; font-size: 1.15rem; font-weight: 700; }
    .empty-state p { margin: 0 0 24px; color: var(--color-text-muted); font-size: 0.88rem; max-width: 340px; margin-left: auto; margin-right: auto; line-height: 1.5; }

    /* Discipline Scorecard */
    .discipline-scorecard { margin-bottom: var(--spacing-md); }
    .scorecard-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
      margin-bottom: 12px;
    }
    .sc-stat {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 14px 8px; background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); border: 1px solid var(--color-border);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .sc-stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .sc-icon-wrap {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .sc-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .sc-green { background: var(--color-stat-green-bg); }
    .sc-green mat-icon { color: var(--color-stat-green); }
    .sc-amber { background: var(--color-stat-amber-bg); }
    .sc-amber mat-icon { color: var(--color-stat-amber); }
    .sc-blue { background: var(--color-stat-blue-bg); }
    .sc-blue mat-icon { color: var(--color-stat-blue); }
    .sc-purple { background: var(--color-stat-purple-bg); }
    .sc-purple mat-icon { color: var(--color-stat-purple); }
    .sc-red { background: var(--color-stat-red-bg); }
    .sc-red mat-icon { color: var(--color-stat-red); }
    .sc-value { font-size: 1.3rem; font-weight: 800; font-variant-numeric: tabular-nums; }
    .sc-of { font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted); }
    .sc-label { font-size: 0.68rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; text-align: center; }
    .rate-good { color: var(--color-success); }
    .rate-ok { color: var(--color-warning); }
    .rate-low { color: var(--color-danger); }
    .streak-val { color: #FF9500; }

    /* Mentor / Coaching Message */
    .mentor-message {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      border-left: 4px solid var(--color-stat-purple);
      margin-bottom: var(--spacing-md);
    }
    .mentor-message.mentor-success { border-left-color: var(--color-success); background: rgba(52, 199, 89, 0.04); }
    .mentor-message.mentor-good { border-left-color: var(--color-stat-blue); background: rgba(0, 122, 255, 0.04); }
    .mentor-message.mentor-building { border-left-color: var(--color-warning); background: rgba(255, 149, 0, 0.04); }
    .mentor-message.mentor-encourage { border-left-color: var(--color-stat-purple); background: rgba(175, 82, 222, 0.04); }
    .mentor-icon { font-size: 22px; width: 22px; height: 22px; color: var(--color-stat-purple); flex-shrink: 0; }
    .mentor-success .mentor-icon { color: var(--color-success); }
    .mentor-good .mentor-icon { color: var(--color-stat-blue); }
    .mentor-building .mentor-icon { color: var(--color-warning); }
    .mentor-encourage .mentor-icon { color: var(--color-stat-purple); }
    .mentor-text { font-size: 0.85rem; font-weight: 500; line-height: 1.5; color: var(--color-text-secondary); }

    /* Goal Calendar */
    .goal-calendar {
      padding: 16px; margin-bottom: var(--spacing-md);
      background: var(--color-surface); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm); border: 1px solid var(--color-border);
    }
    .cal-weekday-header {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; margin-bottom: 2px;
    }
    .cal-weekday {
      text-align: center; font-size: 0.72rem; font-weight: 600;
      color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; padding: 6px 0;
    }
    .cal-grid { display: flex; flex-direction: column; gap: 4px; }
    .cal-week-wrapper {
      border-radius: var(--radius-sm); padding: 2px;
      border-left: 4px solid transparent; cursor: pointer;
      transition: all 0.2s;
    }
    .cal-week-wrapper:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
    .cal-week-wrapper.week-achieved { background: rgba(52, 199, 89, 0.08); border-left-color: var(--color-success); }
    .cal-week-wrapper.week-achieved:hover { background: rgba(52, 199, 89, 0.14); }
    .cal-week-wrapper.week-missed { background: rgba(255, 149, 0, 0.06); border-left-color: var(--color-warning); }
    .cal-week-wrapper.week-missed:hover { background: rgba(255, 149, 0, 0.12); }
    .cal-week-wrapper.week-nodata { background: var(--color-surface-secondary); }
    .cal-week-wrapper.week-future { background: transparent; opacity: 0.4; cursor: default; }
    .cal-week-wrapper.week-future:hover { transform: none; box-shadow: none; }
    .cal-week-wrapper.week-selected { box-shadow: inset 0 0 0 2px var(--color-primary); }
    .cal-week-days {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px;
    }
    .cal-day {
      text-align: center; padding: 8px 0; min-height: 36px;
      display: flex; align-items: center; justify-content: center;
    }
    .cal-day-num { font-size: 0.82rem; font-weight: 500; }
    .cal-day.other-month .cal-day-num { color: var(--color-text-muted); opacity: 0.4; }
    .cal-day.is-today .cal-day-num {
      background: var(--color-primary); color: #fff; border-radius: 50%;
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      font-weight: 700;
    }
    .cal-week-summary-bar {
      display: flex; align-items: center; gap: 6px;
      padding: 4px 10px; margin-top: 2px;
      border-radius: 0 0 var(--radius-xs) var(--radius-xs);
    }
    .wb-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    .wb-pass { color: var(--color-success); }
    .wb-miss { color: var(--color-warning); }
    .wb-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
    .wb-pass-text { color: var(--color-success); }
    .wb-miss-text { color: var(--color-warning); }
    .week-pnl { font-size: 0.78rem; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; margin-left: auto; }
    .pnl-positive { color: var(--color-success); }
    .pnl-negative { color: var(--color-danger); }

    /* Week Detail Panel */
    .week-detail {
      padding: 14px 16px; margin: 4px 0;
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); border: 1px solid var(--color-border);
      border-left: 4px solid var(--color-border);
      animation: slideDown 0.15s ease;
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .week-detail.wd-achieved { border-left-color: var(--color-success); }
    .week-detail.wd-missed-panel { border-left-color: var(--color-warning); }
    .wd-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .wd-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); }
    .wd-range { font-size: 0.9rem; font-weight: 700; flex: 1; }
    .wd-badge {
      font-size: 0.72rem; font-weight: 700; padding: 3px 10px;
      border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.03em;
    }
    .wd-achieved { background: rgba(52, 199, 89, 0.12); color: var(--color-success); }
    .wd-keep-working { background: rgba(255, 149, 0, 0.12); color: var(--color-warning); }
    .wd-nodata { background: var(--color-surface-secondary); color: var(--color-text-muted); }
    .wd-goals { display: flex; flex-direction: column; gap: 6px; }
    .wd-goal-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border-radius: var(--radius-sm); font-size: 0.85rem;
    }
    .wd-goal-hit { background: rgba(52, 199, 89, 0.06); }
    .wd-goal-miss { background: rgba(255, 149, 0, 0.05); }
    .wd-goal-icon-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .wd-goal-icon-wrap mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .wd-icon-hit { background: var(--color-stat-green-bg); }
    .wd-icon-hit mat-icon { color: var(--color-stat-green); }
    .wd-icon-miss { background: var(--color-stat-amber-bg); }
    .wd-icon-miss mat-icon { color: var(--color-stat-amber); }
    .wd-goal-info { flex: 1; min-width: 0; }
    .wd-goal-name { display: block; font-weight: 600; }
    .wd-goal-target-sub { display: block; font-size: 0.72rem; color: var(--color-text-muted); }
    .wd-goal-value { font-weight: 700; font-variant-numeric: tabular-nums; }
    .wd-val-hit { color: var(--color-success); }
    .wd-val-miss { color: var(--color-warning); }
    .wd-result-icon { font-size: 18px; width: 18px; height: 18px; }
    .wd-result-pass { color: var(--color-success); }
    .wd-result-progress { color: var(--color-text-muted); }
    .wd-empty { text-align: center; color: var(--color-text-muted); font-size: 0.85rem; margin: 8px 0; }
    .wd-encouragement {
      text-align: center; font-size: 0.78rem; font-weight: 500;
      color: var(--color-text-muted); font-style: italic;
      margin: 10px 0 2px; padding-top: 8px;
      border-top: 1px solid var(--color-border);
    }

    .cal-legend {
      display: flex; gap: 14px; justify-content: center; margin-top: 10px; padding-top: 10px;
      border-top: 1px solid var(--color-border);
    }
    .cal-legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; color: var(--color-text-muted); }
    .cal-legend-dot { width: 12px; height: 12px; border-radius: 3px; }
    .cal-lg-achieved { background: rgba(52, 199, 89, 0.15); border: 1.5px solid var(--color-success); }
    .cal-lg-missed { background: rgba(255, 149, 0, 0.12); border: 1.5px solid var(--color-warning); }
    .cal-lg-nodata { background: var(--color-surface-secondary); border: 1.5px solid var(--color-border); }

    /* Live Progress */
    .live-progress {
      margin-top: var(--spacing-md); padding: 16px;
      background: var(--color-surface); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm); border: 1px solid var(--color-border);
      border-top: 3px solid var(--color-border);
    }
    .live-progress.live-all-hit { border-top-color: var(--color-success); }
    .live-progress.live-mixed { border-top-color: var(--color-warning); }
    .live-header { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
    .live-dot { font-size: 10px; width: 10px; height: 10px; color: var(--color-success); animation: pulse-dot 2s infinite; }
    @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .live-title { font-size: 0.78rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .live-summary-badge {
      margin-left: auto; font-size: 0.72rem; font-weight: 700;
      padding: 3px 10px; border-radius: var(--radius-full);
      background: var(--color-primary-subtle); color: var(--color-primary);
    }

    .live-goal-card {
      padding: 12px; margin-bottom: 8px;
      background: var(--color-surface-secondary); border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      transition: border-color 0.2s;
    }
    .live-goal-card:last-child { margin-bottom: 0; }
    .live-goal-card.lgc-achieved { border-color: rgba(52, 199, 89, 0.3); background: rgba(52, 199, 89, 0.04); }
    .lgc-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .lgc-icon-wrap {
      width: 34px; height: 34px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .lgc-icon-wrap mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .lgc-icon-hit { background: var(--color-stat-green-bg); }
    .lgc-icon-hit mat-icon { color: var(--color-stat-green); }
    .lgc-icon-progress { background: var(--color-stat-blue-bg); }
    .lgc-icon-progress mat-icon { color: var(--color-stat-blue); }
    .lgc-info { flex: 1; min-width: 0; }
    .lgc-name { display: block; font-size: 0.85rem; font-weight: 700; }
    .lgc-target { display: block; font-size: 0.72rem; color: var(--color-text-muted); }
    .lgc-value-wrap { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .lgc-value { font-size: 1rem; font-weight: 800; font-variant-numeric: tabular-nums; }
    .lgc-val-hit { color: var(--color-success); }
    .lgc-val-danger { color: var(--color-danger); }
    .lgc-check { font-size: 20px; width: 20px; height: 20px; color: var(--color-success); }
    .lgc-pct { font-size: 0.78rem; font-weight: 700; color: var(--color-text-muted); }
    .lgc-bar-row { margin-bottom: 6px; }
    .lgc-track { height: 10px; border-radius: 5px; margin-bottom: 0; }
    .lgc-encouragement {
      font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted);
      font-style: italic;
    }
    .lgc-achieved .lgc-encouragement { color: var(--color-success); }

    .progress-bar-track {
      height: 8px; border-radius: 4px; background: var(--color-surface-secondary);
      overflow: hidden; margin-bottom: 6px;
    }
    .progress-bar-fill {
      height: 100%; border-radius: 4px; transition: width 0.6s ease;
    }
    .fill-green { background: var(--color-success); }
    .fill-amber { background: var(--color-warning); }
    .fill-red { background: var(--color-danger); }

    /* Manage Goals Link */
    .manage-goals-row {
      display: flex; justify-content: center; margin-top: var(--spacing-md); padding-bottom: 8px;
    }
    .manage-goals-btn {
      border-radius: var(--radius-full) !important; padding: 0 20px !important;
      height: 40px; font-weight: 600 !important;
    }
    .manage-goals-btn mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 6px; }

    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .hero-card { grid-column: span 2; }
    }
    @media (max-width: 1199px) {
      .desktop-only { display: none; }
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
      .toggle-seg { font-size: 0.75rem; height: 38px; }
      .toggle-seg mat-icon { font-size: 16px; width: 16px; height: 16px; }
      .scorecard-stats { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .sc-stat { padding: 10px 6px; }
      .sc-value { font-size: 1.1rem; }
      .mentor-message { padding: 10px 12px; }
      .mentor-text { font-size: 0.8rem; }
      .cal-day { padding: 6px 0; min-height: 32px; }
      .cal-day-num { font-size: 0.75rem; }
      .cal-day.is-today .cal-day-num { width: 24px; height: 24px; }
      .week-pnl { font-size: 0.72rem; }
      .cal-week-summary-bar { padding: 3px 8px; }
      .wb-label { font-size: 0.65rem; }
      .wd-goal-row { flex-wrap: wrap; }
      .lgc-top { flex-wrap: wrap; }
      .lgc-info { min-width: calc(100% - 100px); }
    }
  `]
})
export class TradingCalendarComponent implements OnInit {
  private tradingService = inject(TradingService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  Math = Math;

  loading = signal(true);
  viewMode = signal<'daily' | 'goals'>('daily');
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

  // Goal signals
  goalProgress = signal<GoalProgress[]>([]);
  goalHistoryMap = signal<Map<number, GoalHistory>>(new Map());
  goalSelectedWeek = signal<GoalCalendarWeek | null>(null);
  private goalDataLoaded = false;

  goalAchievedCount = computed(() => this.goalProgress().filter(p => p.achieved).length);

  goalMetrics: MetricDef[] = [
    { key: 'netPnl', label: 'Net P&L', icon: 'attach_money', format: 'currency' },
    { key: 'totalTrades', label: 'Total Trades', icon: 'swap_horiz', format: 'number' },
    { key: 'winRate', label: 'Win Rate', icon: 'emoji_events', format: 'percent' },
    { key: 'maxLoss', label: 'Max Single Loss', icon: 'trending_down', format: 'currency' },
    { key: 'profitFactor', label: 'Profit Factor', icon: 'balance', format: 'number' },
    { key: 'maxConsecutiveLosses', label: 'Max Consecutive Losses', icon: 'warning', format: 'number' },
    { key: 'avgWinLossRatio', label: 'Avg Win/Loss Ratio', icon: 'compare_arrows', format: 'number' },
    { key: 'checklistCompliance', label: 'Checklist Compliance', icon: 'checklist', format: 'percent' },
  ];

  goalCalendarWeeks = computed((): GoalCalendarWeek[] => {
    const year = this.currentYear();
    const mo = this.currentMonth();
    const hMap = this.goalHistoryMap();
    const progs = this.goalProgress();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const firstDay = new Date(year, mo, 1);
    const lastDay = new Date(year, mo + 1, 0);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const calStart = new Date(firstDay);
    calStart.setDate(calStart.getDate() - startOffset);

    const weeks: GoalCalendarWeek[] = [];
    const current = new Date(calStart);

    while (current <= lastDay || current.getDay() !== 1) {
      if (weeks.length > 0 && current > lastDay && current.getDay() === 1) break;
      const weekDays: GoalCalendarDay[] = [];
      const weekStart = new Date(current);

      for (let i = 0; i < 7; i++) {
        const d = new Date(current);
        weekDays.push({
          date: d.getDate(),
          isCurrentMonth: d.getMonth() === mo,
          isToday: d.toDateString() === today.toDateString(),
          dateStr: d.toISOString().split('T')[0],
        });
        current.setDate(current.getDate() + 1);
      }
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() - 1);

      const mondayKey = weekStart.toISOString().split('T')[0];
      const isFuture = weekStart > today;

      const goalResults: GoalCalendarResult[] = [];
      let allAchieved = true;
      let hasData = false;

      for (const p of progs) {
        const h = hMap.get(p.goal.id);
        if (!h) continue;
        const snap = h.snapshots.find(s => {
          const snapDate = new Date(s.periodStart);
          return snapDate.toISOString().split('T')[0] === mondayKey;
        });
        if (snap) {
          hasData = true;
          if (!snap.achieved) allAchieved = false;
          goalResults.push({
            goalId: p.goal.id,
            metric: p.goal.metric,
            operator: p.goal.operator,
            currentValue: snap.currentValue,
            targetValue: snap.targetValue,
            achieved: snap.achieved,
            percentage: snap.percentage,
          });
        }
      }

      const status: 'achieved' | 'missed' | 'nodata' | 'future' =
        isFuture ? 'future' : hasData ? (allAchieved ? 'achieved' : 'missed') : 'nodata';

      const pnlResult = goalResults.find(g => g.metric === 'netPnl');
      weeks.push({
        weekKey: mondayKey,
        weekStart,
        weekEnd,
        days: weekDays,
        goalResults,
        status,
        rangeLabel: `${fmt(weekStart)} – ${fmt(weekEnd)}`,
        weekPnl: pnlResult ? pnlResult.currentValue : null,
      });
    }
    return weeks;
  });

  goalMonthlySummary = computed(() => {
    const weeks = this.goalCalendarWeeks();
    const dataWeeks = weeks.filter(w => w.status === 'achieved' || w.status === 'missed');
    const achieved = dataWeeks.filter(w => w.status === 'achieved').length;
    const total = dataWeeks.length;
    const rate = total > 0 ? Math.round(achieved / total * 100) : 0;
    let streak = 0;
    for (const w of [...dataWeeks].reverse()) {
      if (w.status === 'achieved') streak++;
      else break;
    }
    return { achieved, total, rate, streak };
  });

  goalBestStreak = computed(() => {
    const hMap = this.goalHistoryMap();
    let best = 0;
    for (const [, h] of hMap) {
      let current = 0;
      for (const s of h.snapshots) {
        if (s.achieved) { current++; if (current > best) best = current; }
        else current = 0;
      }
    }
    return best;
  });

  goalCoachingMessage = computed(() => {
    const ms = this.goalMonthlySummary();
    if (!ms || ms.total === 0) return { icon: 'psychology', text: 'Your journey starts now. Set achievable goals and trust the process.', type: 'neutral' };
    if (ms.rate >= 80) return { icon: 'emoji_events', text: 'Outstanding discipline! You\'re in the top tier. Keep this momentum going.', type: 'success' };
    if (ms.rate >= 60) return { icon: 'trending_up', text: 'Good consistency. A few more disciplined weeks and you\'ll be unstoppable.', type: 'good' };
    if (ms.rate >= 40) return { icon: 'psychology', text: 'You\'re building the habit. Focus on process over outcomes this week.', type: 'building' };
    return { icon: 'favorite', text: 'Every expert was once a beginner. Review your goals — are they realistic? Adjust and recommit.', type: 'encourage' };
  });

  ngOnInit(): void {
    this.tradingService.getSetups().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: s => { this.setups.set(s); this.cdr.detectChanges(); },
      error: () => {}
    });
    this.loadMonth();
  }

  switchToGoals(): void {
    this.viewMode.set('goals');
    if (!this.goalDataLoaded) {
      this.loadGoalData();
    }
  }

  prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.selectedDay.set(null);
    this.goalSelectedWeek.set(null);
    this.loadMonth();
    if (this.goalDataLoaded) {
      this.loadGoalCalendarHistory();
    }
  }

  nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.selectedDay.set(null);
    this.goalSelectedWeek.set(null);
    this.loadMonth();
    if (this.goalDataLoaded) {
      this.loadGoalCalendarHistory();
    }
  }

  goToday(): void {
    const now = new Date();
    this.currentYear.set(now.getFullYear());
    this.currentMonth.set(now.getMonth());
    this.selectedDay.set(null);
    this.goalSelectedWeek.set(null);
    this.loadMonth();
    if (this.goalDataLoaded) {
      this.loadGoalCalendarHistory();
    }
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay.set(day);
  }

  selectGoalWeek(week: GoalCalendarWeek): void {
    if (week.status === 'future') return;
    this.goalSelectedWeek.set(this.goalSelectedWeek()?.weekKey === week.weekKey ? null : week);
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
      panelClass: 'responsive-dialog-panel', data: dialogData
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadMonth();
    });
  }

  goToGoalsPage(): void {
    this.router.navigate(['/trading/goals']);
  }

  getMetricLabel(key: string): string {
    return this.goalMetrics.find(m => m.key === key)?.label || key;
  }

  getMetricIcon(key: string): string {
    return this.goalMetrics.find(m => m.key === key)?.icon || 'flag';
  }

  formatGoalValue(value: number, metric: string): string {
    const def = this.goalMetrics.find(m => m.key === metric);
    if (!def) return value.toString();
    if (def.format === 'currency') return '$' + Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (def.format === 'percent') return value.toFixed(1) + '%';
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  formatGoalPnl(value: number): string {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }

  getProgressEncouragement(p: GoalProgress): string {
    if (p.achieved) return 'Goal hit! Keep this discipline.';
    if (p.percentage >= 80) return 'Almost there — stay disciplined.';
    if (p.percentage >= 50) return `${Math.round(100 - p.percentage)}% to go. You've got this.`;
    return 'Keep going. Every trade counts.';
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

  private loadGoalData(): void {
    this.tradingService.getGoalProgress('weekly').subscribe({
      next: (data) => {
        this.goalProgress.set(data);
        this.goalDataLoaded = true;
        this.loadGoalCalendarHistory();
        this.cdr.detectChanges();
      },
      error: () => {
        this.goalProgress.set([]);
        this.goalDataLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  private loadGoalCalendarHistory(): void {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const calStart = new Date(firstDay);
    calStart.setDate(calStart.getDate() - startOffset);
    const fromDate = calStart.toISOString().split('T')[0];

    for (const p of this.goalProgress()) {
      this.tradingService.getGoalHistory(p.goal.id, undefined, fromDate).subscribe({
        next: (history) => {
          const map = new Map(this.goalHistoryMap());
          const existing = map.get(p.goal.id);
          if (existing) {
            const merged = [...existing.snapshots];
            for (const s of history.snapshots) {
              if (!merged.find(m => m.periodStart === s.periodStart)) {
                merged.push(s);
              }
            }
            merged.sort((a, b) => a.periodStart.localeCompare(b.periodStart));
            map.set(p.goal.id, { ...history, snapshots: merged });
          } else {
            map.set(p.goal.id, history);
          }
          this.goalHistoryMap.set(map);
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
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

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({ date: d, isCurrentMonth: false, isToday: false, trades: [], totalPnl: 0, tradeCount: 0, dateStr: `prev-${d}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTrades = tradesByDate.get(dateStr) || [];
      const totalPnl = dayTrades.reduce((sum, t) => sum + (t.netPnl ?? t.pnl ?? 0), 0);
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
