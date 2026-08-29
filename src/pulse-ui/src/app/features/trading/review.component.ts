import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TradingService } from '../../core/services/trading.service';
import { DailyReview, TradeGrade, TradingRule, TradeEntry } from '../../core/models/trading.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatChipsModule, MatCheckboxModule, MatProgressSpinnerModule, CurrencyPipe
  ],
  template: `
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>grading</mat-icon></div>
        <h2>Daily Review</h2>
        <p class="banner-subtitle">Grade your process, not your P&L</p>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner></mat-spinner></div>
    } @else {
    <div class="date-nav">
      <button mat-icon-button (click)="prevDay()"><mat-icon>chevron_left</mat-icon></button>
      <span class="date-label">{{ dateLabel() }}</span>
      <button mat-icon-button (click)="nextDay()"><mat-icon>chevron_right</mat-icon></button>
    </div>

    @if (todayTrades().length > 0) {
    <!-- Trade Day: Full Review -->
    <mat-card class="summary-card">
      <mat-card-content>
        <div class="summary-row">
          <div class="summary-item">
            <mat-icon class="summary-icon blue">bar_chart</mat-icon>
            <div>
              <span class="summary-value">{{ todayTrades().length }}</span>
              <span class="summary-label">Trades</span>
            </div>
          </div>
          <div class="summary-item">
            <mat-icon class="summary-icon" [class.green]="todayPnl() >= 0" [class.red]="todayPnl() < 0">trending_up</mat-icon>
            <div>
              <span class="summary-value">{{ todayPnl() | currency }}</span>
              <span class="summary-label">P&L</span>
            </div>
          </div>
          <div class="summary-item">
            <mat-icon class="summary-icon purple">verified</mat-icon>
            <div>
              <span class="summary-value">{{ todayCompliance() }}%</span>
              <span class="summary-label">Compliance</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Grade Selector -->
    <div class="grade-section">
      <h3 class="section-title">How did you execute today?</h3>
      <div class="grade-buttons">
        @for (g of grades; track g.value) {
          <button class="grade-btn" [class]="'grade-' + g.value.toLowerCase()"
                  [class.selected]="selectedGrade() === g.value"
                  (click)="selectedGrade.set(g.value)">
            <span class="grade-letter">{{ g.value }}</span>
            <span class="grade-desc">{{ g.label }}</span>
          </button>
        }
      </div>

      <details class="rubric">
        <summary>Grading Rubric</summary>
        <ul>
          <li><strong>A:</strong> Followed all rules, stuck to plan, managed risk perfectly</li>
          <li><strong>B:</strong> Minor deviation, caught yourself, overall disciplined</li>
          <li><strong>C:</strong> Some rule breaks, overtraded slightly</li>
          <li><strong>D:</strong> Multiple violations, emotional trading</li>
          <li><strong>F:</strong> Complete plan abandonment, revenge traded, ignored limits</li>
        </ul>
      </details>
    </div>

    <!-- Toggle Questions -->
    <mat-card class="questions-card">
      <mat-card-content>
        <div class="question-row">
          <span class="question-text">Did you follow your pre-market plan?</span>
          <div class="yn-toggle">
            <button mat-stroked-button [class.yn-yes]="followedPlan() === true" (click)="followedPlan.set(true)">Yes</button>
            <button mat-stroked-button [class.yn-no]="followedPlan() === false" (click)="followedPlan.set(false)">No</button>
          </div>
        </div>
        <div class="question-row">
          <span class="question-text">Did you follow all your rules?</span>
          <div class="yn-toggle">
            <button mat-stroked-button [class.yn-yes]="followedRules() === true" (click)="followedRules.set(true)">Yes</button>
            <button mat-stroked-button [class.yn-no]="followedRules() === false" (click)="followedRules.set(false)">No</button>
          </div>
        </div>
        <div class="question-row">
          <span class="question-text">Did you stop at your daily limit?</span>
          <div class="yn-toggle">
            <button mat-stroked-button [class.yn-yes]="stoppedAtLimit() === true" (click)="stoppedAtLimit.set(true)">Yes</button>
            <button mat-stroked-button [class.yn-no]="stoppedAtLimit() === false" (click)="stoppedAtLimit.set(false)">No</button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Rules Violated -->
    @if (rules().length > 0) {
      <div class="rules-violated-section">
        <h3 class="section-title">Rules Violated Today</h3>
        <p class="section-hint">Select any rules you broke (leave empty if none)</p>
        <div class="rule-chips">
          @for (rule of rules(); track rule.id) {
            <button mat-stroked-button class="rule-chip"
                    [class.violated]="violatedRules().includes(rule.id)"
                    (click)="toggleViolation(rule.id)">
              <mat-icon>{{ violatedRules().includes(rule.id) ? 'close' : 'check' }}</mat-icon>
              {{ rule.text }}
            </button>
          }
        </div>
      </div>
    }

    <!-- Text Fields -->
    <div class="text-fields">
      <mat-form-field appearance="outline">
        <mat-label>Lessons Learned</mat-label>
        <textarea matInput [value]="lessonsLearned" (input)="lessonsLearned = $any($event.target).value" rows="3"
                  placeholder="What did today teach you?"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Tomorrow's Focus</mat-label>
        <textarea matInput [value]="tomorrowFocus" (input)="tomorrowFocus = $any($event.target).value" rows="2"
                  placeholder="What ONE thing will you improve tomorrow?"></textarea>
      </mat-form-field>
    </div>

    <button mat-raised-button color="primary" class="save-btn" (click)="save()" [disabled]="!selectedGrade()">
      <mat-icon>save</mat-icon> Save Review
    </button>

    } @else {
    <!-- Observation Mode: No trades today -->
    <mat-card class="observation-banner">
      <mat-card-content>
        <div class="obs-banner-content">
          <mat-icon class="obs-icon">visibility</mat-icon>
          <div>
            <span class="obs-title">Observation Mode</span>
            <span class="obs-subtitle">No trades today — log what you saw in the market</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Market Condition -->
    <div class="condition-section">
      <h3 class="section-title">Market Conditions</h3>
      <div class="condition-buttons">
        @for (c of marketConditions; track c.value) {
          <button class="condition-btn" [class.selected]="selectedCondition() === c.value"
                  (click)="selectedCondition.set(c.value)">
            <mat-icon>{{ c.icon }}</mat-icon>
            <span>{{ c.label }}</span>
          </button>
        }
      </div>
    </div>

    <!-- Observation Notes -->
    <div class="text-fields">
      <mat-form-field appearance="outline">
        <mat-label>Market Observations</mat-label>
        <textarea matInput [value]="marketObservation" (input)="marketObservation = $any($event.target).value" rows="4"
                  placeholder="What patterns did you notice? Key levels? Sector rotations? Setups forming?"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Setups Watched</mat-label>
        <textarea matInput [value]="lessonsLearned" (input)="lessonsLearned = $any($event.target).value" rows="3"
                  placeholder="Any setups you tracked but didn't take? Why not?"></textarea>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Tomorrow's Plan</mat-label>
        <textarea matInput [value]="tomorrowFocus" (input)="tomorrowFocus = $any($event.target).value" rows="2"
                  placeholder="What will you watch for tomorrow?"></textarea>
      </mat-form-field>
    </div>

    <button mat-raised-button color="primary" class="save-btn" (click)="saveObservation()">
      <mat-icon>save</mat-icon> Save Observation
    </button>
    }

    <!-- Grade History -->
    @if (recentReviews().length > 0) {
      <div class="grade-history">
        <h3 class="section-title">Last 30 Days</h3>
        <div class="history-grid">
          @for (r of recentReviews(); track r.id) {
            @if (r.isObservationOnly) {
              <div class="history-dot dot-obs" [title]="r.date + ': Observation'">
                <mat-icon>visibility</mat-icon>
              </div>
            } @else {
              <div class="history-dot" [class]="'dot-' + (r.grade || 'c').toLowerCase()" [title]="r.date + ': ' + r.grade">
                {{ r.grade }}
              </div>
            }
          }
        </div>
      </div>
    }
    }
  `,
  styles: [`
    :host { display: block; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    .page-banner {
      position: relative; margin: -24px -24px 24px; padding: 40px 24px 32px;
      background: var(--gradient-primary); border-radius: 0 0 var(--radius-lg) var(--radius-lg); overflow: hidden;
    }
    .banner-pattern { position: absolute; inset: 0; background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%); }
    .banner-content { position: relative; text-align: center; }
    .banner-icon { width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; border: 1px solid rgba(255,255,255,0.3); }
    .banner-icon mat-icon { font-size: 26px; width: 26px; height: 26px; color: #fff; }
    h2 { margin: 0; color: #fff; font-size: 1.4rem; font-weight: 700; }
    .banner-subtitle { color: rgba(255,255,255,0.75); font-size: 0.85rem; margin: 4px 0 0; }

    .date-nav {
      display: flex; align-items: center; justify-content: center; gap: var(--spacing-xs);
      background: var(--color-surface-secondary); border-radius: var(--radius-full);
      padding: 4px; margin-bottom: var(--spacing-md); width: fit-content; margin-left: auto; margin-right: auto;
    }
    .date-label { font-size: var(--text-sm); font-weight: 600; min-width: 140px; text-align: center; }

    .summary-card { margin-bottom: var(--spacing-md); }
    .summary-row { display: flex; justify-content: space-around; flex-wrap: wrap; gap: var(--spacing-sm); }
    .summary-item { display: flex; align-items: center; gap: 10px; }
    .summary-icon { font-size: 28px; width: 28px; height: 28px; }
    .summary-icon.blue { color: var(--color-stat-blue); }
    .summary-icon.green { color: var(--color-success); }
    .summary-icon.red { color: var(--color-danger); }
    .summary-icon.purple { color: var(--color-stat-purple); }
    .summary-value { display: block; font-size: 1.1rem; font-weight: 700; }
    .summary-label { display: block; font-size: 0.72rem; color: var(--color-text-secondary); text-transform: uppercase; font-weight: 600; }

    .section-title { font-size: 1rem; font-weight: 700; margin: 0 0 12px; }
    .section-hint { font-size: 0.8rem; color: var(--color-text-secondary); margin: -8px 0 12px; }

    .grade-section { margin-bottom: var(--spacing-md); }
    .grade-buttons { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 12px; }
    .grade-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 16px 8px; border-radius: var(--radius-md); border: 2px solid var(--color-border);
      cursor: pointer; background: var(--color-surface); transition: all 0.2s;
    }
    .grade-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .grade-letter { font-size: 1.5rem; font-weight: 800; }
    .grade-desc { font-size: 0.6rem; text-transform: uppercase; font-weight: 600; color: var(--color-text-secondary); }
    .grade-a .grade-letter { color: var(--color-success); }
    .grade-b .grade-letter { color: var(--color-stat-blue); }
    .grade-c .grade-letter { color: var(--color-warning); }
    .grade-d .grade-letter { color: var(--color-stat-amber); }
    .grade-f .grade-letter { color: var(--color-danger); }
    .grade-btn.selected { border-color: var(--color-primary); background: var(--color-stat-blue-bg); box-shadow: var(--shadow-md); }

    .rubric { margin-bottom: var(--spacing-md); font-size: 0.8rem; color: var(--color-text-secondary); }
    .rubric summary { cursor: pointer; font-weight: 600; color: var(--color-primary); }
    .rubric ul { padding-left: 20px; margin: 8px 0 0; }
    .rubric li { margin-bottom: 4px; }

    .questions-card { margin-bottom: var(--spacing-md); }
    .question-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--color-border); }
    .question-row:last-child { border-bottom: none; }
    .question-text { font-size: 0.9rem; font-weight: 500; }
    .yn-toggle { display: flex; gap: 6px; }
    .yn-toggle button { min-width: 50px; font-size: 0.8rem; border-radius: var(--radius-full) !important; }
    .yn-yes { background: var(--color-stat-green-bg) !important; color: var(--color-success) !important; border-color: var(--color-success) !important; }
    .yn-no { background: var(--color-stat-red-bg) !important; color: var(--color-danger) !important; border-color: var(--color-danger) !important; }

    .rules-violated-section { margin-bottom: var(--spacing-md); }
    .rule-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .rule-chip { font-size: 0.75rem !important; border-radius: var(--radius-full) !important; }
    .rule-chip mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 4px; }
    .rule-chip.violated { background: var(--color-stat-red-bg) !important; color: var(--color-danger) !important; border-color: var(--color-danger) !important; }

    .text-fields { display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--spacing-md); }
    .text-fields mat-form-field { width: 100%; }

    .save-btn { width: 100%; padding: 12px !important; font-weight: 700 !important; margin-bottom: var(--spacing-lg); }
    .save-btn mat-icon { margin-right: 8px; }

    .grade-history { margin-top: var(--spacing-md); }
    .history-grid { display: flex; flex-wrap: wrap; gap: 4px; }
    .history-dot {
      width: 28px; height: 28px; border-radius: 6px; display: flex;
      align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800;
    }
    .dot-a { background: var(--color-stat-green-bg); color: var(--color-success); }
    .dot-b { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .dot-c { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .dot-d { background: rgba(255, 149, 0, 0.15); color: #e65100; }
    .dot-f { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .dot-obs { background: var(--color-surface-secondary); color: var(--color-text-secondary); }
    .dot-obs mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .observation-banner { margin-bottom: var(--spacing-md); border-left: 4px solid var(--color-stat-blue); }
    .obs-banner-content { display: flex; align-items: center; gap: 12px; }
    .obs-icon { font-size: 28px; width: 28px; height: 28px; color: var(--color-stat-blue); }
    .obs-title { display: block; font-size: 1rem; font-weight: 700; }
    .obs-subtitle { display: block; font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 2px; }

    .condition-section { margin-bottom: var(--spacing-md); }
    .condition-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .condition-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 16px 8px; border-radius: var(--radius-md); border: 2px solid var(--color-border);
      cursor: pointer; background: var(--color-surface); transition: all 0.2s;
      font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary);
    }
    .condition-btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .condition-btn.selected { border-color: var(--color-primary); background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .condition-btn mat-icon { font-size: 24px; width: 24px; height: 24px; }

    @media (max-width: 599px) {
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
      .grade-buttons { grid-template-columns: repeat(5, 1fr); gap: 4px; }
      .grade-btn { padding: 12px 4px; }
      .grade-letter { font-size: 1.2rem; }
      .grade-desc { display: none; }
      .question-row { flex-direction: column; align-items: flex-start; gap: 8px; }
      .condition-buttons { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class ReviewComponent implements OnInit {
  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);

  loading = signal(true);
  currentDate = signal(new Date());
  dateLabel = computed(() => this.currentDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));

  todayTrades = signal<TradeEntry[]>([]);
  todayPnl = computed(() => this.todayTrades().reduce((s, t) => s + (t.pnl ?? 0), 0));
  todayCompliance = computed(() => {
    const t = this.todayTrades();
    if (!t.length) return 0;
    return Math.round((t.filter(x => x.checklistCompleted).length / t.length) * 100);
  });

  rules = signal<TradingRule[]>([]);
  recentReviews = signal<DailyReview[]>([]);
  existingReview = signal<DailyReview | null>(null);

  selectedGrade = signal<TradeGrade | null>(null);
  followedPlan = signal<boolean | null>(null);
  followedRules = signal<boolean | null>(null);
  stoppedAtLimit = signal<boolean | null>(null);
  violatedRules = signal<number[]>([]);
  lessonsLearned = '';
  tomorrowFocus = '';
  marketObservation = '';
  selectedCondition = signal<string | null>(null);

  marketConditions = [
    { value: 'bullish', label: 'Bullish', icon: 'trending_up' },
    { value: 'bearish', label: 'Bearish', icon: 'trending_down' },
    { value: 'choppy', label: 'Choppy', icon: 'swap_vert' },
    { value: 'flat', label: 'Flat', icon: 'horizontal_rule' }
  ];

  grades: { value: TradeGrade; label: string }[] = [
    { value: 'A', label: 'Perfect' },
    { value: 'B', label: 'Good' },
    { value: 'C', label: 'Fair' },
    { value: 'D', label: 'Poor' },
    { value: 'F', label: 'Failed' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const dateStr = this.formatDate(this.currentDate());
    this.tradingService.getTrades(dateStr, dateStr).subscribe({
      next: t => { this.todayTrades.set(t); this.loading.set(false); },
      error: () => { this.todayTrades.set([]); this.loading.set(false); }
    });
    this.tradingService.getRules().subscribe({
      next: r => this.rules.set(r),
      error: () => this.rules.set([])
    });
    this.tradingService.getReviews().subscribe({
      next: r => this.recentReviews.set(r.slice(0, 30)),
      error: () => this.recentReviews.set([])
    });
    this.tradingService.getReviews(dateStr, dateStr).subscribe({
      next: r => {
        const review = r.length > 0 ? r[0] : null;
        this.existingReview.set(review);
        if (review) {
          this.marketObservation = review.marketObservation ?? '';
          this.lessonsLearned = review.lessonsLearned ?? '';
          this.tomorrowFocus = review.improvementNote ?? '';
          this.selectedCondition.set(review.marketCondition ?? null);
          this.selectedGrade.set((review.grade as any) ?? null);
          this.followedPlan.set(review.followedPlan ?? null);
          this.followedRules.set(review.followedRules ?? null);
        } else {
          this.marketObservation = '';
          this.lessonsLearned = '';
          this.tomorrowFocus = '';
          this.selectedCondition.set(null);
          this.selectedGrade.set(null);
          this.followedPlan.set(null);
          this.followedRules.set(null);
        }
      },
      error: () => this.existingReview.set(null)
    });
  }

  prevDay(): void {
    const d = new Date(this.currentDate());
    d.setDate(d.getDate() - 1);
    this.currentDate.set(d);
    this.loadData();
  }

  nextDay(): void {
    const d = new Date(this.currentDate());
    d.setDate(d.getDate() + 1);
    this.currentDate.set(d);
    this.loadData();
  }

  toggleViolation(ruleId: number): void {
    const current = this.violatedRules();
    if (current.includes(ruleId)) {
      this.violatedRules.set(current.filter(id => id !== ruleId));
    } else {
      this.violatedRules.set([...current, ruleId]);
    }
  }

  save(): void {
    if (!this.selectedGrade()) return;
    const payload: Partial<DailyReview> = {
      date: this.formatDate(this.currentDate()),
      grade: this.selectedGrade()!,
      followedPlan: this.followedPlan() ?? false,
      followedRules: this.followedRules() ?? false,
      totalTrades: this.todayTrades().length,
      totalPnl: this.todayPnl(),
      rulesViolated: this.violatedRules(),
      lessonsLearned: this.lessonsLearned || undefined,
      improvementNote: this.tomorrowFocus || undefined,
      isObservationOnly: false
    };
    const existing = this.existingReview();
    const obs$ = existing
      ? this.tradingService.updateReview(existing.id, payload)
      : this.tradingService.createReview(payload);
    obs$.subscribe({
      next: () => { this.notify.success('Review saved!'); this.loadData(); },
      error: () => this.notify.error('Failed to save review')
    });
  }

  saveObservation(): void {
    const payload: Partial<DailyReview> = {
      date: this.formatDate(this.currentDate()),
      isObservationOnly: true,
      marketCondition: this.selectedCondition() || undefined,
      marketObservation: this.marketObservation || undefined,
      lessonsLearned: this.lessonsLearned || undefined,
      improvementNote: this.tomorrowFocus || undefined,
      grade: null,
      followedPlan: false,
      followedRules: false,
      totalTrades: 0,
      totalPnl: 0,
      rulesViolated: [],
    };
    const existing = this.existingReview();
    const obs$ = existing
      ? this.tradingService.updateReview(existing.id, payload)
      : this.tradingService.createReview(payload);
    obs$.subscribe({
      next: () => { this.notify.success('Observation saved!'); this.loadData(); },
      error: () => this.notify.error('Failed to save observation')
    });
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
