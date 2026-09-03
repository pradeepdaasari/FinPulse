import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TradingService } from '../../core/services/trading.service';
import { WeeklySummary } from '../../core/models/trading.model';
import { toLocalDateString } from '../../core/utils/date-utils';

@Component({
  selector: 'app-weekly-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe, LocalDatePipe],
  template: `
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>analytics</mat-icon></div>
        <h2>Weekly Summary</h2>
        <p class="banner-subtitle">Learn from your data. Improve every week.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner></mat-spinner></div>
    } @else {
    <!-- Week Navigator -->
    <div class="week-nav">
      <button mat-icon-button (click)="prevWeek()"><mat-icon>chevron_left</mat-icon></button>
      <span class="week-label">
        {{ summary()?.weekStart | localDate:'MMM d' }} — {{ summary()?.weekEnd | localDate:'MMM d, y' }}
      </span>
      <button mat-icon-button (click)="nextWeek()" [disabled]="isCurrentWeek()"><mat-icon>chevron_right</mat-icon></button>
    </div>

    @if (!summary()) {
      <mat-card class="empty-card">
        <mat-card-content>
          <mat-icon class="empty-icon">hourglass_empty</mat-icon>
          <p class="empty-text">No trading data for this week yet. Keep logging your trades!</p>
        </mat-card-content>
      </mat-card>
    } @else {
      <!-- Overall Grade Banner -->
      <div class="grade-banner" [class]="'grade-' + overallGradeLetter()">
        <div class="grade-left">
          <span class="grade-letter">{{ overallGradeLetter() }}</span>
          <span class="grade-subtitle">Process Grade</span>
        </div>
        <div class="grade-right">
          <div class="grade-stat">
            <span class="grade-stat-value" [class.positive]="summary()!.totalPnl >= 0" [class.negative]="summary()!.totalPnl < 0">
              {{ summary()!.totalPnl | currency:'USD':'symbol':'1.0-0' }}
            </span>
            <span class="grade-stat-label">Net P&L</span>
          </div>
          <div class="grade-stat">
            <span class="grade-stat-value">{{ summary()!.totalTrades }}</span>
            <span class="grade-stat-label">Trades</span>
          </div>
          <div class="grade-stat">
            <span class="grade-stat-value">{{ summary()!.winRate }}%</span>
            <span class="grade-stat-label">Win Rate</span>
          </div>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="metrics-grid">
        <div class="metric-card stat-green">
          <mat-icon>emoji_events</mat-icon>
          <span class="metric-value">{{ summary()!.winningTrades }}</span>
          <span class="metric-label">Wins</span>
        </div>
        <div class="metric-card stat-red">
          <mat-icon>close</mat-icon>
          <span class="metric-value">{{ summary()!.losingTrades }}</span>
          <span class="metric-label">Losses</span>
        </div>
        <div class="metric-card stat-blue">
          <mat-icon>calendar_today</mat-icon>
          <span class="metric-value">{{ summary()!.tradingDays }}</span>
          <span class="metric-label">Days Active</span>
        </div>
        <div class="metric-card stat-purple">
          <mat-icon>verified</mat-icon>
          <span class="metric-value">{{ summary()!.checklistCompliance }}%</span>
          <span class="metric-label">Compliance</span>
        </div>
      </div>

      <!-- Extremes -->
      <div class="extremes-row">
        <div class="extreme-card best">
          <mat-icon>arrow_upward</mat-icon>
          <div>
            <span class="extreme-label">Best Trade</span>
            <span class="extreme-value">{{ summary()!.largestWin | currency:'USD':'symbol':'1.0-0' }}</span>
          </div>
        </div>
        <div class="extreme-card worst">
          <mat-icon>arrow_downward</mat-icon>
          <div>
            <span class="extreme-label">Worst Trade</span>
            <span class="extreme-value">{{ summary()!.largestLoss | currency:'USD':'symbol':'1.0-0' }}</span>
          </div>
        </div>
      </div>

      <!-- Setup Performance -->
      @if (summary()!.setupPerformance.length > 0) {
        <div class="section">
          <h3 class="section-title"><mat-icon>tune</mat-icon> Setup Performance</h3>
          @for (setup of summary()!.setupPerformance; track setup.setupId) {
            <div class="setup-row" [class]="'setup-' + setup.grade">
              <div class="setup-header">
                <span class="setup-name">{{ setup.setupName }}</span>
                <span class="setup-badge" [class]="'badge-' + setup.grade">{{ setup.grade }}</span>
              </div>
              <div class="setup-stats">
                <span>{{ setup.trades }} trades</span>
                <span>{{ setup.winRate }}% win</span>
                <span [class.positive]="setup.totalPnl >= 0" [class.negative]="setup.totalPnl < 0">
                  {{ setup.totalPnl | currency:'USD':'symbol':'1.0-0' }}
                </span>
              </div>
              <mat-progress-bar mode="determinate" [value]="setup.winRate" [color]="setup.grade === 'strong' ? 'primary' : setup.grade === 'weak' ? 'warn' : 'accent'"></mat-progress-bar>
            </div>
          }
        </div>
      }

      <!-- Time Analysis -->
      @if (summary()!.timeAnalysis.length > 0) {
        <div class="section">
          <h3 class="section-title"><mat-icon>schedule</mat-icon> Time of Day Analysis</h3>
          <div class="time-grid">
            @for (slot of summary()!.timeAnalysis; track slot.slot) {
              <div class="time-card" [class]="'time-' + slot.grade">
                <div class="time-header">
                  <span class="time-slot">{{ slot.slot }}</span>
                  <mat-icon class="time-indicator">{{ slot.grade === 'safe' ? 'check_circle' : slot.grade === 'dangerous' ? 'warning' : 'remove_circle_outline' }}</mat-icon>
                </div>
                <div class="time-stats">
                  <span>{{ slot.trades }} trades</span>
                  <span>{{ slot.winRate }}% win</span>
                </div>
                <span class="time-pnl" [class.positive]="slot.totalPnl >= 0" [class.negative]="slot.totalPnl < 0">
                  {{ slot.totalPnl | currency:'USD':'symbol':'1.0-0' }}
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Day of Week Analysis -->
      @if (summary()!.dayOfWeekAnalysis.length > 0) {
        <div class="section">
          <h3 class="section-title"><mat-icon>date_range</mat-icon> Day of Week Analysis</h3>
          <div class="day-grid">
            @for (day of summary()!.dayOfWeekAnalysis; track day.day) {
              <div class="day-card" [class]="'day-' + day.grade">
                <span class="day-name">{{ day.day }}</span>
                <span class="day-trades">{{ day.trades }}T</span>
                <span class="day-win">{{ day.winRate }}%</span>
                <span class="day-pnl" [class.positive]="day.totalPnl >= 0" [class.negative]="day.totalPnl < 0">
                  {{ day.totalPnl | currency:'USD':'symbol':'1.0-0' }}
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- What Went Well -->
      @if (summary()!.strengths.length > 0) {
        <mat-card class="feedback-card good">
          <mat-card-content>
            <div class="feedback-header">
              <mat-icon>thumb_up</mat-icon>
              <span>What Went Well</span>
            </div>
            <ul class="feedback-list">
              @for (item of summary()!.strengths; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </mat-card-content>
        </mat-card>
      }

      <!-- Improvement Areas -->
      @if (summary()!.improvements.length > 0) {
        <mat-card class="feedback-card improve">
          <mat-card-content>
            <div class="feedback-header">
              <mat-icon>lightbulb</mat-icon>
              <span>Areas to Improve</span>
            </div>
            <ul class="feedback-list">
              @for (item of summary()!.improvements; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </mat-card-content>
        </mat-card>
      }

      <!-- Danger Zones -->
      @if (summary()!.dangerZones.length > 0) {
        <mat-card class="feedback-card danger">
          <mat-card-content>
            <div class="feedback-header">
              <mat-icon>warning</mat-icon>
              <span>Danger Zones</span>
            </div>
            <ul class="feedback-list">
              @for (item of summary()!.dangerZones; track item) {
                <li>{{ item }}</li>
              }
            </ul>
          </mat-card-content>
        </mat-card>
      }

      <!-- Mentor Feedback -->
      <mat-card class="mentor-card">
        <mat-card-content>
          <div class="mentor-header">
            <mat-icon class="mentor-icon">psychology</mat-icon>
            <span class="mentor-title">Mentor's Weekly Review</span>
          </div>
          <p class="mentor-text">{{ summary()!.mentorFeedback }}</p>
          <div class="mentor-encouragement">
            <mat-icon>favorite</mat-icon>
            <span>Every week you review is a week you grow. Most traders never look back — you're already different.</span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Week over Week Trend -->
      @if (pastWeeks().length > 1) {
        <div class="section">
          <h3 class="section-title"><mat-icon>trending_up</mat-icon> Weekly Trends</h3>
          <div class="trend-grid">
            @for (week of pastWeeks(); track week.weekStart) {
              <div class="trend-card" [class.current]="week.weekStart === summary()!.weekStart">
                <span class="trend-date">{{ week.weekStart | localDate:'M/d' }}</span>
                <span class="trend-pnl" [class.positive]="week.totalPnl >= 0" [class.negative]="week.totalPnl < 0">
                  {{ week.totalPnl | currency:'USD':'symbol':'1.0-0' }}
                </span>
                <span class="trend-win">{{ week.winRate }}%</span>
                <span class="trend-compliance">{{ week.checklistCompliance }}% CL</span>
              </div>
            }
          </div>
        </div>
      }
    }
    }
  `,
  styles: [`
    :host { display: block; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }

    .page-banner {
      position: relative;
      margin: -24px -24px 24px;
      padding: 40px 24px 32px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(52, 199, 89, 0.12) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(0, 122, 255, 0.1) 0%, transparent 40%);
    }
    .banner-content { position: relative; text-align: center; }
    .banner-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px; border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .banner-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #4ecdc4; }
    h2 { margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700; }
    .banner-subtitle { color: rgba(255, 255, 255, 0.65); font-size: 0.875rem; margin: 4px 0 0; }

    .week-nav {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      margin-bottom: var(--spacing-md); padding: 10px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
    }
    .week-label { font-weight: 700; font-size: 0.95rem; }

    .empty-card { text-align: center; padding: 32px; }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; color: var(--color-text-muted); opacity: 0.5; }
    .empty-text { color: var(--color-text-secondary); margin-top: 12px; }

    .grade-banner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px; border-radius: var(--radius-lg);
      margin-bottom: var(--spacing-md); gap: 16px;
    }
    .grade-banner.grade-a { background: linear-gradient(135deg, #34c759 0%, #30b350 100%); }
    .grade-banner.grade-b { background: linear-gradient(135deg, #007aff 0%, #0066d6 100%); }
    .grade-banner.grade-c { background: linear-gradient(135deg, #ff9f0a 0%, #e6900a 100%); }
    .grade-banner.grade-d { background: linear-gradient(135deg, #ff6b35 0%, #e55a2a 100%); }
    .grade-banner.grade-f { background: linear-gradient(135deg, #ff3b30 0%, #d63028 100%); }
    .grade-left { display: flex; flex-direction: column; align-items: center; }
    .grade-letter { font-size: 3rem; font-weight: 900; color: #fff; line-height: 1; }
    .grade-subtitle { font-size: 0.7rem; font-weight: 600; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.05em; }
    .grade-right { display: flex; gap: 16px; }
    .grade-stat { display: flex; flex-direction: column; align-items: center; }
    .grade-stat-value { font-size: 1.1rem; font-weight: 700; color: #fff; }
    .grade-stat-label { font-size: 0.65rem; color: rgba(255,255,255,0.7); text-transform: uppercase; font-weight: 600; }

    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-sm); margin-bottom: var(--spacing-md); }
    .metric-card {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 14px 8px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm); text-align: center;
    }
    .metric-card mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .metric-card.stat-green mat-icon { color: var(--color-stat-green); }
    .metric-card.stat-red mat-icon { color: var(--color-danger); }
    .metric-card.stat-blue mat-icon { color: var(--color-stat-blue); }
    .metric-card.stat-purple mat-icon { color: var(--color-stat-purple); }
    .metric-value { font-size: 1.3rem; font-weight: 800; }
    .metric-label { font-size: 0.65rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; }

    .extremes-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); }
    .extreme-card {
      display: flex; align-items: center; gap: 12px; padding: 14px;
      border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-sm);
    }
    .extreme-card.best mat-icon { color: var(--color-stat-green); }
    .extreme-card.worst mat-icon { color: var(--color-danger); }
    .extreme-card > div { display: flex; flex-direction: column; }
    .extreme-label { font-size: 0.7rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; }
    .extreme-value { font-size: 1rem; font-weight: 700; }

    .section { margin-bottom: var(--spacing-lg); }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.03em; color: var(--color-text-secondary); margin: 0 0 12px;
    }
    .section-title mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .setup-row {
      padding: 14px; border-radius: var(--radius-md); margin-bottom: 8px;
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      border-left: 4px solid transparent;
    }
    .setup-row.setup-strong { border-left-color: var(--color-stat-green); }
    .setup-row.setup-neutral { border-left-color: var(--color-stat-blue); }
    .setup-row.setup-weak { border-left-color: var(--color-danger); }
    .setup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .setup-name { font-weight: 700; font-size: 0.9rem; }
    .setup-badge {
      font-size: 0.65rem; font-weight: 700; padding: 2px 8px;
      border-radius: var(--radius-full); text-transform: uppercase;
    }
    .badge-strong { background: var(--color-stat-green-bg); color: var(--color-stat-green); }
    .badge-neutral { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .badge-weak { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .setup-stats { display: flex; gap: 12px; font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 8px; font-weight: 500; }

    .time-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--spacing-sm); }
    .time-card {
      padding: 12px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      border-top: 3px solid transparent;
    }
    .time-card.time-safe { border-top-color: var(--color-stat-green); }
    .time-card.time-neutral { border-top-color: var(--color-stat-blue); }
    .time-card.time-dangerous { border-top-color: var(--color-danger); }
    .time-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .time-slot { font-weight: 700; font-size: 0.85rem; }
    .time-indicator { font-size: 18px; width: 18px; height: 18px; }
    .time-safe .time-indicator { color: var(--color-stat-green); }
    .time-neutral .time-indicator { color: var(--color-stat-blue); }
    .time-dangerous .time-indicator { color: var(--color-danger); }
    .time-stats { display: flex; gap: 8px; font-size: 0.75rem; color: var(--color-text-secondary); margin-bottom: 4px; }
    .time-pnl { font-weight: 700; font-size: 0.9rem; }

    .day-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--spacing-sm); }
    .day-card {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 12px 8px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      text-align: center; border-top: 3px solid transparent;
    }
    .day-card.day-strong { border-top-color: var(--color-stat-green); }
    .day-card.day-neutral { border-top-color: var(--color-stat-blue); }
    .day-card.day-weak { border-top-color: var(--color-danger); }
    .day-name { font-weight: 700; font-size: 0.8rem; }
    .day-trades { font-size: 0.7rem; color: var(--color-text-secondary); }
    .day-win { font-size: 0.8rem; font-weight: 600; }
    .day-pnl { font-size: 0.85rem; font-weight: 700; }

    .positive { color: var(--color-stat-green); }
    .negative { color: var(--color-danger); }

    .feedback-card { margin-bottom: var(--spacing-sm); }
    .feedback-card.good { border-left: 4px solid var(--color-stat-green); }
    .feedback-card.improve { border-left: 4px solid var(--color-stat-amber); }
    .feedback-card.danger { border-left: 4px solid var(--color-danger); }
    .feedback-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
      font-weight: 700; font-size: 0.9rem;
    }
    .feedback-card.good .feedback-header mat-icon { color: var(--color-stat-green); }
    .feedback-card.improve .feedback-header mat-icon { color: var(--color-stat-amber); }
    .feedback-card.danger .feedback-header mat-icon { color: var(--color-danger); }
    .feedback-list { margin: 0; padding-left: 20px; }
    .feedback-list li { font-size: 0.85rem; line-height: 1.6; color: var(--color-text-secondary); }

    .mentor-card { border-left: 4px solid var(--color-stat-purple); margin-bottom: var(--spacing-md); }
    .mentor-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .mentor-icon { color: var(--color-stat-purple); }
    .mentor-title { font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.02em; }
    .mentor-text { font-size: 0.9rem; line-height: 1.5; margin: 0 0 12px; color: var(--color-text-secondary); }
    .mentor-encouragement {
      display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px;
      border-radius: var(--radius-sm); background: var(--color-stat-green-bg);
      font-size: 0.8rem; color: var(--color-stat-green); line-height: 1.4;
    }
    .mentor-encouragement mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    .trend-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: var(--spacing-sm); }
    .trend-card {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 12px 8px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm); text-align: center;
      opacity: 0.7; transition: opacity 0.2s, transform 0.2s;
    }
    .trend-card.current { opacity: 1; transform: scale(1.05); box-shadow: var(--shadow-md); border: 2px solid var(--color-primary); }
    .trend-date { font-size: 0.7rem; font-weight: 600; color: var(--color-text-secondary); }
    .trend-pnl { font-size: 0.9rem; font-weight: 700; }
    .trend-win { font-size: 0.75rem; color: var(--color-text-secondary); }
    .trend-compliance { font-size: 0.65rem; color: var(--color-text-muted); }

    @media (max-width: 599px) {
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
      .grade-banner { flex-direction: column; text-align: center; }
      .grade-right { justify-content: center; }
      .metrics-grid { grid-template-columns: repeat(2, 1fr); }
      .extremes-row { grid-template-columns: 1fr; }
      .time-grid { grid-template-columns: 1fr 1fr; }
      .day-grid { grid-template-columns: repeat(5, 1fr); }
      .day-card { padding: 8px 4px; }
      .day-name { font-size: 0.7rem; }
      .trend-grid { grid-template-columns: repeat(3, 1fr); }
    }
  `]
})
export class WeeklySummaryComponent implements OnInit {
  private tradingService = inject(TradingService);

  loading = signal(true);
  summary = signal<WeeklySummary | null>(null);
  pastWeeks = signal<WeeklySummary[]>([]);
  currentWeekStart = signal(this.getWeekStart(new Date()));
  selectedWeekStart = signal(this.getWeekStart(new Date()));

  isCurrentWeek = computed(() => this.selectedWeekStart() === this.currentWeekStart());

  overallGradeLetter = computed(() => {
    const avg = this.summary()?.averageGrade ?? 0;
    if (avg >= 3.5) return 'a';
    if (avg >= 2.5) return 'b';
    if (avg >= 1.5) return 'c';
    if (avg >= 0.5) return 'd';
    return 'f';
  });

  ngOnInit(): void {
    this.loadWeek();
    this.tradingService.getWeeklySummaries(8).subscribe({
      next: (data) => this.pastWeeks.set(data),
      error: () => {}
    });
  }

  loadWeek(): void {
    this.tradingService.getWeeklySummary(this.selectedWeekStart()).subscribe({
      next: (data) => { this.summary.set(data); this.loading.set(false); },
      error: () => { this.summary.set(null); this.loading.set(false); }
    });
  }

  prevWeek(): void {
    const d = new Date(this.selectedWeekStart());
    d.setDate(d.getDate() - 7);
    this.selectedWeekStart.set(this.formatDate(d));
    this.loadWeek();
  }

  nextWeek(): void {
    const d = new Date(this.selectedWeekStart());
    d.setDate(d.getDate() + 7);
    this.selectedWeekStart.set(this.formatDate(d));
    this.loadWeek();
  }

  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return this.formatDate(d);
  }

  private formatDate(d: Date): string {
    return toLocalDateString(d);
  }
}
