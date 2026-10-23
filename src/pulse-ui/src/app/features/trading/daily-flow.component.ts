import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { TradingService } from '../../core/services/trading.service';
import { DailyFlow } from '../../core/models/trading.model';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { FlowPremarketComponent } from './flow-premarket.component';
import { FlowSessionComponent } from './flow-session.component';
import { FlowReviewComponent } from './flow-review.component';

@Component({
  selector: 'app-daily-flow',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, MatIconModule, MatButtonModule,
    SkeletonLoaderComponent, PullToRefreshDirective,
    FlowPremarketComponent, FlowSessionComponent, FlowReviewComponent
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData(false)">
    <!-- Date Navigation -->
    <div class="df-date-nav">
      <button class="df-nav-btn" (click)="prevDay()">
        <mat-icon>chevron_left</mat-icon>
      </button>
      <div class="df-date-center">
        <span class="df-date-label">{{ dateLabel() }}</span>
        @if (!isToday()) {
          <button class="df-today-btn" (click)="goToday()">Today</button>
        }
      </div>
      <button class="df-nav-btn" [disabled]="atMaxFutureDate()" (click)="nextDay()">
        <mat-icon>chevron_right</mat-icon>
      </button>
    </div>

    <!-- Phase Stepper -->
    <div class="df-stepper">
      @for (phase of phases; track phase.key; let i = $index) {
        <div class="df-step" [class.df-step-done]="phaseStatus(phase.key) === 'done'"
             [class.df-step-active]="phaseStatus(phase.key) === 'active'"
             [class.df-step-upcoming]="phaseStatus(phase.key) === 'upcoming'"
             (click)="scrollToPhase(phase.key)">
          <div class="df-step-dot" [class]="'df-dot-' + phase.color">
            @if (phaseStatus(phase.key) === 'done') {
              <mat-icon>check</mat-icon>
            } @else if (phaseStatus(phase.key) === 'active') {
              <span class="df-pulse"></span>
            }
          </div>
          <span class="df-step-label">{{ phase.label }}</span>
        </div>
        @if (i < phases.length - 1) {
          <div class="df-step-line" [class.df-line-done]="phaseStatus(phase.key) === 'done'"></div>
        }
      }
    </div>

    <!-- Wisdom Quote -->
    @if (flowData()?.wisdom; as w) {
      <div class="df-wisdom">
        <mat-icon>lightbulb</mat-icon>
        <span class="df-wisdom-text">"{{ w.text }}"</span>
        @if (w.author) { <span class="df-wisdom-author">— {{ w.author }}</span> }
      </div>
    }

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
      <app-skeleton type="card"></app-skeleton>
    } @else if (flowData(); as data) {
      <!-- Morning Prep -->
      <div class="df-phase" id="phase-morning">
        <div class="df-phase-header" (click)="togglePhase('morning')">
          <div class="df-phase-title">
            <mat-icon class="df-phase-icon df-icon-morning">wb_sunny</mat-icon>
            <span>Morning Prep</span>
            @if (data.premarketStreak > 0) {
              <span class="df-streak"><mat-icon>local_fire_department</mat-icon> Day {{ data.premarketStreak }}</span>
            }
          </div>
          <div class="df-phase-right">
            @if (data.dayView.premarket && data.isToday && !data.isMarketOpen) {
              <span class="df-badge df-badge-active">In Progress</span>
            } @else if (data.dayView.premarket && isFutureOrToday() && !data.isToday) {
              <span class="df-badge df-badge-active">In Progress</span>
            } @else if (data.dayView.premarket) {
              <span class="df-badge df-badge-done">Completed</span>
            } @else if (data.activePhase === 'morning') {
              <span class="df-badge df-badge-active">In Progress</span>
            } @else {
              <span class="df-badge df-badge-upcoming">Upcoming</span>
            }
            <mat-icon class="df-chevron" [class.df-chevron-open]="morningOpen()">expand_more</mat-icon>
          </div>
        </div>
        @if (morningOpen()) {
          <div class="df-phase-body">
            <app-flow-premarket
              [premarket]="data.dayView.premarket"
              [template]="data.template"
              [streak]="data.premarketStreak"
              [recentMentalStates]="data.recentMentalStates"
              [isToday]="isFutureOrToday()"
              [targetDate]="data.targetDate"
              (saved)="loadData(false)">
            </app-flow-premarket>
          </div>
        }
      </div>

      <!-- Trading Session -->
      <div class="df-phase" id="phase-session">
        <div class="df-phase-header" (click)="togglePhase('session')">
          <div class="df-phase-title">
            <mat-icon class="df-phase-icon df-icon-session">bolt</mat-icon>
            <span>Trading Session</span>
          </div>
          <div class="df-phase-right">
            @if (data.dayView.stats.closedTrades > 0) {
              <span class="df-badge df-badge-done">{{ data.dayView.stats.totalTrades }} trades</span>
            } @else if (data.activePhase === 'session') {
              <span class="df-badge df-badge-active">Active</span>
            } @else {
              <span class="df-badge df-badge-upcoming">Upcoming</span>
            }
            <mat-icon class="df-chevron" [class.df-chevron-open]="sessionOpen()">expand_more</mat-icon>
          </div>
        </div>
        @if (sessionOpen()) {
          <div class="df-phase-body">
            <app-flow-session
              [trades]="data.dayView.trades"
              [stats]="data.dayView.stats"
              [disciplineStatus]="data.disciplineStatus"
              [premarket]="data.dayView.premarket"
              [limits]="data.dayView.limits"
              [setups]="data.setups"
              [isToday]="data.isToday"
              [targetDate]="data.targetDate"
              (noteAdded)="loadData(false)"
              (tradeAdded)="loadData(false)">
            </app-flow-session>
          </div>
        }
      </div>

      <!-- Evening Review -->
      <div class="df-phase" id="phase-review">
        <div class="df-phase-header" (click)="togglePhase('review')">
          <div class="df-phase-title">
            <mat-icon class="df-phase-icon df-icon-review">grading</mat-icon>
            <span>Evening Review</span>
          </div>
          <div class="df-phase-right">
            @if (data.dayView.review) {
              <span class="df-badge df-badge-done">Completed</span>
            } @else if (data.activePhase === 'review') {
              <span class="df-badge df-badge-active">In Progress</span>
            } @else {
              <span class="df-badge df-badge-upcoming">Upcoming</span>
            }
            <mat-icon class="df-chevron" [class.df-chevron-open]="reviewOpen()">expand_more</mat-icon>
          </div>
        </div>
        @if (reviewOpen()) {
          <div class="df-phase-body">
            <app-flow-review
              [review]="data.dayView.review"
              [trades]="data.dayView.trades"
              [stats]="data.dayView.stats"
              [rules]="data.rules"
              [premarket]="data.dayView.premarket"
              [recentReviews]="data.recentReviews"
              [isToday]="data.isToday"
              (saved)="loadData(false)">
            </app-flow-review>
          </div>
        }
      </div>

      <!-- All Phases Complete -->
      @if (data.allPhasesComplete) {
        <div class="df-complete-banner">
          <mat-icon>emoji_events</mat-icon>
          <span>Trading day complete. Great discipline — rest up for tomorrow.</span>
        </div>
      }

    }
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* Date Navigation */
    .df-date-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 4px; margin-bottom: 4px;
    }
    .df-nav-btn {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--color-text-secondary); transition: var(--transition-fast);
    }
    .df-nav-btn:hover:not(:disabled) { background: var(--color-surface-secondary); color: var(--color-primary); }
    .df-nav-btn:disabled { opacity: 0.3; cursor: default; }
    .df-nav-btn mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .df-date-center { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .df-date-label { font-size: 0.95rem; font-weight: 700; color: var(--color-text); }
    .df-today-btn {
      font-size: 0.75rem; font-weight: 600; padding: 2px 12px;
      border-radius: var(--radius-full); border: 1px solid var(--color-primary);
      background: var(--color-stat-blue-bg); color: var(--color-primary);
      cursor: pointer; font-family: inherit; transition: var(--transition-fast);
    }
    .df-today-btn:hover { background: var(--color-primary); color: #fff; }

    /* Phase Stepper */
    .df-stepper {
      display: flex; align-items: center; justify-content: center;
      gap: 0; padding: 16px 0 8px; margin-bottom: var(--spacing-sm);
    }
    .df-step {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      cursor: pointer; flex-shrink: 0; padding: 0 4px;
    }
    .df-step-dot {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--color-border); background: var(--color-surface);
      transition: all 0.3s ease; position: relative;
    }
    .df-step-dot mat-icon { font-size: 16px; width: 16px; height: 16px; color: #fff; }
    .df-step-done .df-step-dot { border-color: transparent; }
    .df-step-done .df-dot-amber { background: var(--color-stat-amber); }
    .df-step-done .df-dot-blue { background: var(--color-primary); }
    .df-step-done .df-dot-green { background: var(--color-success); }
    .df-step-active .df-step-dot { border-color: transparent; }
    .df-step-active .df-dot-amber { background: var(--color-stat-amber); }
    .df-step-active .df-dot-blue { background: var(--color-primary); }
    .df-step-active .df-dot-green { background: var(--color-success); }
    .df-pulse {
      width: 10px; height: 10px; border-radius: 50%; background: #fff;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.7); } }
    .df-step-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); white-space: nowrap; }
    .df-step-active .df-step-label { color: var(--color-text); font-weight: 700; }
    .df-step-done .df-step-label { color: var(--color-text-secondary); }
    .df-step-line {
      flex: 1; height: 2px; background: var(--color-border);
      margin: 0 4px; margin-bottom: 22px; min-width: 24px; max-width: 60px;
      transition: background 0.3s ease;
    }
    .df-line-done { background: var(--color-success); }

    /* Wisdom */
    .df-wisdom {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px; margin-bottom: var(--spacing-md);
      background: var(--color-surface-secondary); border-radius: var(--radius-md);
      border-left: 3px solid var(--color-primary);
    }
    .df-wisdom mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-warning); flex-shrink: 0; margin-top: 2px; }
    .df-wisdom-text { font-size: 0.88rem; color: var(--color-text-secondary); font-style: italic; flex: 1; }
    .df-wisdom-author { font-size: 0.78rem; color: var(--color-text-muted); white-space: nowrap; }

    /* Phase Sections */
    .df-phase {
      margin-bottom: var(--spacing-sm); border-radius: var(--radius-lg);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .df-phase-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; cursor: pointer;
      transition: background 0.2s ease;
    }
    .df-phase-header:hover { background: var(--color-surface-secondary); }
    .df-phase-title { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.95rem; }
    .df-phase-icon { font-size: 22px; width: 22px; height: 22px; }
    .df-icon-morning { color: var(--color-stat-amber); }
    .df-icon-session { color: var(--color-primary); }
    .df-icon-review { color: var(--color-success); }
    .df-phase-right { display: flex; align-items: center; gap: 8px; }
    .df-badge {
      font-size: 0.7rem; font-weight: 600; padding: 3px 10px;
      border-radius: var(--radius-full);
    }
    .df-badge-done { background: var(--color-stat-green-bg); color: var(--color-success); }
    .df-badge-active { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .df-badge-upcoming { background: var(--color-surface-secondary); color: var(--color-text-muted); }
    .df-chevron {
      font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted);
      transition: transform 0.2s ease; transform: rotate(-90deg);
    }
    .df-chevron-open { transform: rotate(0deg); }
    .df-phase-body { padding: 0 16px 16px; }

    /* Streak */
    .df-streak {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.8rem; font-weight: 700; color: var(--color-stat-amber);
      background: var(--color-stat-amber-bg); padding: 2px 10px;
      border-radius: var(--radius-full);
    }
    .df-streak mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Complete Banner */
    .df-complete-banner {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; margin-top: var(--spacing-sm);
      background: var(--color-stat-green-bg); border-radius: var(--radius-md);
      border: 1px solid rgba(52, 199, 89, 0.2);
    }
    .df-complete-banner mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--color-success); }
    .df-complete-banner span { font-size: 0.92rem; font-weight: 600; color: var(--color-success); }

    @media (max-width: 599px) {
      .df-step-label { display: none; }
      .df-step-dot { width: 28px; height: 28px; }
      .df-step-line { min-width: 32px; max-width: 80px; margin-bottom: 0; }
      .df-wisdom { padding: 10px 12px; }
      .df-wisdom-author { display: none; }
      .df-phase-header { padding: 12px 14px; }
      .df-phase-body { padding: 0 12px 12px; }
      .df-phase-title { font-size: 0.9rem; gap: 8px; }
      :host > .df-fab { bottom: 72px; right: 16px; }
      .df-fab-group { bottom: 72px; right: 16px; }
    }
  `]
})
export class DailyFlowComponent implements OnInit {
  private tradingService = inject(TradingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  flowData = signal<DailyFlow | null>(null);
  morningOpen = signal(true);
  sessionOpen = signal(false);
  reviewOpen = signal(false);
  selectedDate = signal<string | undefined>(undefined);

  isToday = computed(() => this.flowData()?.isToday ?? true);

  isFutureOrToday = computed(() => {
    const data = this.flowData();
    if (!data) return true;
    if (data.isToday) return true;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return data.targetDate >= todayStr;
  });

  atMaxFutureDate = computed(() => {
    const data = this.flowData();
    if (!data) return false;
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);
    const maxStr = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`;
    return data.targetDate >= maxStr;
  });

  dateLabel = computed(() => {
    const data = this.flowData();
    if (!data) return '';
    const d = new Date(data.targetDate + 'T12:00:00');
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const formatted = d.toLocaleDateString('en-US', opts);
    if (data.isToday) return `Today • ${formatted}`;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    if (data.targetDate === tomorrowStr) return `Tomorrow • ${formatted}`;
    return formatted;
  });

  phases = [
    { key: 'morning', label: 'Morning Prep', color: 'amber' },
    { key: 'session', label: 'Trading Session', color: 'blue' },
    { key: 'review', label: 'Evening Review', color: 'green' }
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const date = params.get('date') || undefined;
      this.selectedDate.set(date);
      this.loadData();
    });
  }

  loadData(resetOpenStates = true): void {
    this.loading.set(true);
    this.tradingService.getDailyFlow(this.selectedDate()).subscribe({
      next: (data) => {
        this.flowData.set(data);
        this.loading.set(false);
        if (resetOpenStates) this.setDefaultOpenStates(data);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  prevDay(): void {
    const current = this.flowData()?.targetDate || new Date().toISOString().split('T')[0];
    const d = new Date(current + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.selectedDate.set(dateStr);
    this.loadData();
  }

  nextDay(): void {
    if (this.atMaxFutureDate()) return;
    const current = this.flowData()?.targetDate || new Date().toISOString().split('T')[0];
    const d = new Date(current + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    this.selectedDate.set(dateStr);
    this.loadData();
  }

  goToday(): void {
    this.selectedDate.set(undefined);
    this.loadData();
  }

  phaseStatus(key: string): 'done' | 'active' | 'upcoming' {
    const data = this.flowData();
    if (!data) return 'upcoming';
    const isFuture = this.isFutureOrToday() && !data.isToday;
    if (key === 'morning') {
      if (data.dayView.premarket && data.isToday && !data.isMarketOpen) return 'active';
      if (data.dayView.premarket && !isFuture) return 'done';
      if (data.dayView.premarket && isFuture) return 'active';
      if (data.activePhase === 'morning' || isFuture) return 'active';
      return 'upcoming';
    }
    if (key === 'session') {
      if (isFuture) return 'upcoming';
      if (data.dayView.review) return 'done';
      if (data.dayView.stats.totalTrades > 0 && !data.dayView.review) return 'active';
      if (data.activePhase === 'session') return 'active';
      return 'upcoming';
    }
    if (key === 'review') {
      if (isFuture) return 'upcoming';
      if (data.dayView.review) return 'done';
      if (data.activePhase === 'review') return 'active';
      return 'upcoming';
    }
    return 'upcoming';
  }

  togglePhase(phase: string): void {
    if (phase === 'morning') this.morningOpen.set(!this.morningOpen());
    if (phase === 'session') this.sessionOpen.set(!this.sessionOpen());
    if (phase === 'review') this.reviewOpen.set(!this.reviewOpen());
  }

  scrollToPhase(key: string): void {
    const el = document.getElementById(`phase-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (key === 'morning') this.morningOpen.set(true);
    if (key === 'session') this.sessionOpen.set(true);
    if (key === 'review') this.reviewOpen.set(true);
  }

  private setDefaultOpenStates(data: DailyFlow): void {
    if (!data.isToday && !this.isFutureOrToday()) {
      this.morningOpen.set(!!data.dayView.premarket);
      this.sessionOpen.set(data.dayView.trades.length > 0);
      this.reviewOpen.set(!!data.dayView.review);
      return;
    }
    if (this.isFutureOrToday() && !data.isToday) {
      this.morningOpen.set(true);
      this.sessionOpen.set(false);
      this.reviewOpen.set(false);
      return;
    }
    const phase = data.activePhase;
    const hasOpenTrades = data.dayView.trades.some(t => t.status === 'Open');
    this.morningOpen.set(phase === 'morning' || !data.dayView.premarket);
    this.sessionOpen.set(phase === 'session' || hasOpenTrades || data.dayView.stats.totalTrades > 0);
    this.reviewOpen.set(phase === 'review');
  }
}
