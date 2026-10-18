import { Component, inject, signal, input, output, computed, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TradingService } from '../../core/services/trading.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  DailyReview, TradeEntryWithNotes, DayViewStats, TradingRule,
  PreMarketNote, DailyFlowReviewSummary, TradeGrade
} from '../../core/models/trading.model';

@Component({
  selector: 'app-flow-review',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CurrencyPipe,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  template: `
    @if (!review() && !editing() && !isToday()) {
      <div class="fr-empty-past">
        <mat-icon>event_busy</mat-icon>
        <span>No review was recorded this day</span>
      </div>
    } @else if (review() && !editing()) {
      <!-- Collapsed completed state -->
      <div class="fr-completed">
        <div class="fr-completed-header">
          @if (review()!.grade) {
            <span class="fr-grade-pill" [class]="'grade-' + review()!.grade">{{ review()!.grade }}</span>
          } @else {
            <span class="fr-grade-pill grade-obs"><mat-icon>visibility</mat-icon></span>
          }
          <div class="fr-completed-checks">
            @if (review()!.followedPlan) { <mat-icon class="fr-check-yes">check_circle</mat-icon> } @else { <mat-icon class="fr-check-no">cancel</mat-icon> }
            <span>Plan</span>
            @if (review()!.followedRules) { <mat-icon class="fr-check-yes">check_circle</mat-icon> } @else { <mat-icon class="fr-check-no">cancel</mat-icon> }
            <span>Rules</span>
          </div>
          <span class="fr-spacer"></span>
          @if (isToday()) { <button mat-icon-button (click)="editing.set(true)"><mat-icon>edit</mat-icon></button> }
        </div>
        @if (review()!.lessonsLearned) {
          <div class="fr-completed-lessons" [innerHTML]="review()!.lessonsLearned"></div>
        }
      </div>
    } @else {
      <!-- Editing / New review form -->

      <!-- Summary Strip -->
      @if (stats(); as s) {
        @if (s.closedTrades > 0) {
          <div class="fr-summary-strip">
            <div class="fr-sum-item">
              <span class="fr-sum-value">{{ s.totalTrades }}</span>
              <span class="fr-sum-label">Trades</span>
            </div>
            <div class="fr-sum-item" [class.fr-sum-green]="s.totalNetPnl > 0" [class.fr-sum-red]="s.totalNetPnl < 0">
              <span class="fr-sum-value">{{ s.totalNetPnl | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="fr-sum-label">Net P&L</span>
            </div>
            <div class="fr-sum-item">
              <span class="fr-sum-value">{{ s.winRate }}%</span>
              <span class="fr-sum-label">Win Rate</span>
            </div>
          </div>
        }
      }

      <!-- Plan vs Reality -->
      @if (premarket(); as pm) {
        @if (stats()?.closedTrades; as ct) {
          @if (ct > 0) {
            <div class="fr-pvr">
              <span class="fr-pvr-label">Plan vs Reality</span>
              <div class="fr-pvr-row">
                <div class="fr-pvr-item">
                  <span class="fr-pvr-sublabel">Planned</span>
                  <span class="fp-bias-badge" [class]="'bias-' + pm.marketBias">{{ pm.marketBias }}</span>
                </div>
                <mat-icon class="fr-pvr-arrow">arrow_forward</mat-icon>
                <div class="fr-pvr-item">
                  <span class="fr-pvr-sublabel">Result</span>
                  <span class="fr-pvr-result" [class.fr-sum-green]="stats()!.totalNetPnl > 0" [class.fr-sum-red]="stats()!.totalNetPnl < 0">
                    {{ stats()!.totalNetPnl | currency:'USD':'symbol':'1.0-0' }}
                  </span>
                </div>
              </div>
            </div>
          }
        }
      }

      <!-- Observation Mode -->
      @if (isObservation()) {
        <div class="fr-observation-banner">
          <mat-icon>visibility</mat-icon>
          <span>No trades today — log what you observed in the market</span>
        </div>

        <div class="fr-form-section">
          <label class="fr-section-label">Market Conditions</label>
          <div class="fr-condition-row">
            @for (c of conditions; track c) {
              <button type="button" class="fr-condition-btn" [class.active]="selectedCondition() === c"
                      (click)="selectedCondition.set(c)">{{ c }}</button>
            }
          </div>
        </div>

        <div class="fr-form-section">
          <mat-form-field appearance="outline" class="fr-full-width">
            <mat-label>Market Observations</mat-label>
            <textarea matInput rows="4" [(ngModel)]="marketObservation"
                      placeholder="What did you see? Patterns, levels, behavior..."></textarea>
          </mat-form-field>
        </div>
      }

      <!-- Grade Selector (trading mode) -->
      @if (!isObservation()) {
        <div class="fr-form-section">
          <label class="fr-section-label">Grade Your Process</label>
          <p class="fr-section-hint">Grade discipline, not P&L. A losing day with perfect execution is an A.</p>
          <div class="fr-grade-row">
            @for (g of grades; track g.letter) {
              <button type="button" class="fr-grade-btn"
                      [class.active]="selectedGrade() === g.letter"
                      [class]="'grade-' + g.letter"
                      (click)="selectedGrade.set(g.letter)">
                <span class="fr-grade-letter">{{ g.letter }}</span>
                <span class="fr-grade-desc">{{ g.desc }}</span>
              </button>
            }
          </div>
        </div>

        <!-- Yes/No Toggles -->
        <div class="fr-toggles">
          <div class="fr-toggle-item">
            <span>Did you follow your pre-market plan?</span>
            <div class="fr-toggle-btns">
              <button type="button" [class.active-yes]="followedPlan() === true" (click)="followedPlan.set(true)">Yes</button>
              <button type="button" [class.active-no]="followedPlan() === false" (click)="followedPlan.set(false)">No</button>
            </div>
          </div>
          <div class="fr-toggle-item">
            <span>Did you follow all your rules?</span>
            <div class="fr-toggle-btns">
              <button type="button" [class.active-yes]="followedRules() === true" (click)="followedRules.set(true)">Yes</button>
              <button type="button" [class.active-no]="followedRules() === false" (click)="followedRules.set(false)">No</button>
            </div>
          </div>
          <div class="fr-toggle-item">
            <span>Did you stop at your daily limit?</span>
            <div class="fr-toggle-btns">
              <button type="button" [class.active-yes]="stoppedAtLimit() === true" (click)="stoppedAtLimit.set(true)">Yes</button>
              <button type="button" [class.active-no]="stoppedAtLimit() === false" (click)="stoppedAtLimit.set(false)">No</button>
            </div>
          </div>
        </div>

        <!-- Rules Violated -->
        @if (rules().length > 0) {
          <div class="fr-form-section">
            <label class="fr-section-label">Rules Violated</label>
            <div class="fr-rules-chips">
              @for (r of rules(); track r.id) {
                <button type="button" class="fr-rule-chip" [class.violated]="violatedRules().includes(r.id)"
                        (click)="toggleRule(r.id)" [innerHTML]="r.text"></button>
              }
            </div>
          </div>
        }
      }

      <!-- Text Fields -->
      <div class="fr-form-section">
        <mat-form-field appearance="outline" class="fr-full-width">
          <mat-label>Lessons Learned</mat-label>
          <textarea matInput rows="3" [(ngModel)]="lessonsLearned"
                    placeholder="What did you learn today?"></textarea>
        </mat-form-field>
      </div>
      <div class="fr-form-section">
        <mat-form-field appearance="outline" class="fr-full-width">
          <mat-label>Tomorrow's Focus</mat-label>
          <textarea matInput rows="2" [(ngModel)]="tomorrowFocus"
                    placeholder="What's your #1 focus for tomorrow?"></textarea>
        </mat-form-field>
      </div>

      <!-- Save Button -->
      <button class="fr-save-btn" (click)="save()" [disabled]="!canSave() || saving()">
        @if (saving()) {
          <span class="fr-btn-spinner"></span> Saving...
        } @else {
          <mat-icon>{{ isObservation() ? 'visibility' : 'done_all' }}</mat-icon>
          {{ isObservation() ? 'Save Observation' : 'Close Your Day' }}
        }
      </button>
    }

    <!-- Grade History Dots -->
    @if (recentReviews().length > 0) {
      <div class="fr-grade-history">
        <span class="fr-history-label">Last 30 days</span>
        <div class="fr-history-dots">
          @for (r of recentReviews(); track r.id) {
            <span class="fr-history-dot" [class]="'dot-grade-' + (r.isObservationOnly ? 'obs' : (r.grade || 'none'))"></span>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    /* Summary Strip */
    .fr-summary-strip {
      display: flex; gap: 12px; margin-bottom: var(--spacing-md);
    }
    .fr-sum-item {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      padding: 10px 14px; background: var(--color-surface);
      border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
    }
    .fr-sum-value { font-weight: 700; font-size: 1.1rem; }
    .fr-sum-label { font-size: 0.75rem; color: var(--color-text-muted); }
    .fr-sum-green .fr-sum-value { color: var(--color-success); }
    .fr-sum-red .fr-sum-value { color: var(--color-danger); }

    /* Plan vs Reality */
    .fr-pvr {
      padding: 14px; background: var(--color-surface-secondary);
      border-radius: var(--radius-md); margin-bottom: var(--spacing-md);
    }
    .fr-pvr-label {
      font-size: 0.75rem; color: var(--color-text-muted);
      text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em;
    }
    .fr-pvr-row { display: flex; align-items: center; gap: 16px; margin-top: 8px; }
    .fr-pvr-item { display: flex; flex-direction: column; gap: 4px; }
    .fr-pvr-sublabel { font-size: 0.7rem; color: var(--color-text-muted); }
    .fr-pvr-arrow { color: var(--color-text-muted); font-size: 20px; width: 20px; height: 20px; }
    .fr-pvr-result { font-weight: 700; font-size: 1.1rem; }
    .fp-bias-badge {
      font-size: 0.75rem; font-weight: 600; padding: 3px 10px;
      border-radius: var(--radius-full); text-transform: capitalize;
    }
    .fp-bias-badge.bias-bullish { background: var(--color-stat-green-bg); color: var(--color-success); }
    .fp-bias-badge.bias-bearish { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .fp-bias-badge.bias-neutral { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .fp-bias-badge.bias-no-trade { background: var(--color-surface-secondary); color: var(--color-text-muted); }

    /* Observation Mode */
    .fr-observation-banner {
      display: flex; gap: 10px; align-items: center;
      padding: 14px; background: var(--color-stat-amber-bg);
      border-radius: var(--radius-md); margin-bottom: var(--spacing-md);
      font-size: 0.9rem;
    }
    .fr-observation-banner mat-icon { color: var(--color-warning); flex-shrink: 0; }
    .fr-condition-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .fr-condition-btn {
      padding: 10px 8px; border-radius: var(--radius-sm);
      border: 2px solid var(--color-border); background: var(--color-surface);
      cursor: pointer; font-size: 0.82rem; font-weight: 600;
      font-family: inherit; transition: var(--transition-fast);
    }
    .fr-condition-btn.active {
      border-color: var(--color-primary); background: var(--color-stat-blue-bg); color: var(--color-primary);
    }

    /* Form Sections */
    .fr-form-section { margin-bottom: var(--spacing-md); }
    .fr-section-label { font-weight: 700; font-size: 0.95rem; margin-bottom: 8px; display: block; }
    .fr-section-hint { font-size: 0.82rem; color: var(--color-text-secondary); margin: -4px 0 10px; }
    .fr-full-width { width: 100%; }

    /* Grade Selector */
    .fr-grade-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .fr-grade-btn {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 14px 8px; border-radius: var(--radius-md);
      border: 2px solid var(--color-border); background: var(--color-surface);
      cursor: pointer; font-family: inherit; transition: var(--transition-fast);
    }
    .fr-grade-letter { font-size: 1.5rem; font-weight: 800; }
    .fr-grade-desc { font-size: 0.7rem; color: var(--color-text-secondary); }
    .fr-grade-btn.active.grade-A { border-color: var(--color-success); background: var(--color-stat-green-bg); }
    .fr-grade-btn.active.grade-A .fr-grade-letter { color: var(--color-success); }
    .fr-grade-btn.active.grade-B { border-color: var(--color-primary); background: var(--color-stat-blue-bg); }
    .fr-grade-btn.active.grade-B .fr-grade-letter { color: var(--color-primary); }
    .fr-grade-btn.active.grade-C { border-color: var(--color-warning); background: var(--color-stat-amber-bg); }
    .fr-grade-btn.active.grade-C .fr-grade-letter { color: var(--color-warning); }
    .fr-grade-btn.active.grade-D { border-color: var(--color-warning); background: var(--color-stat-amber-bg); }
    .fr-grade-btn.active.grade-D .fr-grade-letter { color: var(--color-warning); }
    .fr-grade-btn.active.grade-F { border-color: var(--color-danger); background: var(--color-stat-red-bg); }
    .fr-grade-btn.active.grade-F .fr-grade-letter { color: var(--color-danger); }

    /* Yes/No Toggles */
    .fr-toggles { display: flex; flex-direction: column; gap: 10px; margin-bottom: var(--spacing-md); }
    .fr-toggle-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 14px; background: var(--color-surface);
      border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
      font-size: 0.9rem;
    }
    .fr-toggle-btns { display: flex; gap: 4px; }
    .fr-toggle-btns button {
      padding: 6px 16px; border: 1px solid var(--color-border);
      border-radius: var(--radius-full); cursor: pointer;
      background: var(--color-surface); font-family: inherit;
      font-size: 0.82rem; font-weight: 600; transition: var(--transition-fast);
    }
    .fr-toggle-btns button.active-yes {
      background: var(--color-stat-green-bg); border-color: var(--color-success); color: var(--color-success);
    }
    .fr-toggle-btns button.active-no {
      background: var(--color-stat-red-bg); border-color: var(--color-danger); color: var(--color-danger);
    }

    /* Rules Violated */
    .fr-rules-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .fr-rule-chip {
      padding: 6px 12px; border-radius: var(--radius-full);
      border: 1px solid var(--color-border); cursor: pointer;
      font-size: 0.82rem; background: var(--color-surface); font-family: inherit;
      transition: var(--transition-fast);
    }
    .fr-rule-chip ::ng-deep p { margin: 0; display: inline; }
    .fr-rule-chip.violated {
      border-color: var(--color-danger); background: var(--color-stat-red-bg); color: var(--color-danger);
    }

    /* Save Button */
    .fr-save-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; height: 48px; border: none; border-radius: var(--radius-md);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.95rem; font-weight: 700; font-family: inherit;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
      transition: box-shadow 0.2s ease, opacity 0.2s ease;
      margin-top: var(--spacing-sm);
    }
    .fr-save-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4); }
    .fr-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .fr-save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .fr-btn-spinner {
      display: inline-block; width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: fr-spin 0.6s linear infinite;
    }
    @keyframes fr-spin { to { transform: rotate(360deg); } }

    /* Grade History */
    .fr-grade-history { margin-top: var(--spacing-lg); }
    .fr-history-label { font-size: 0.75rem; color: var(--color-text-muted); }
    .fr-history-dots { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .fr-history-dot {
      width: 10px; height: 10px; border-radius: 50%;
    }
    .dot-grade-A { background: var(--color-success); }
    .dot-grade-B { background: var(--color-primary); }
    .dot-grade-C { background: var(--color-warning); }
    .dot-grade-D { background: #f5a623; }
    .dot-grade-F { background: var(--color-danger); }
    .dot-grade-obs { background: var(--color-text-muted); }
    .dot-grade-none { background: transparent; border: 1px solid var(--color-border); }

    /* Completed State */
    .fr-completed {
      padding: 14px; background: var(--color-surface);
      border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
    }
    .fr-completed-header { display: flex; align-items: center; gap: 10px; }
    .fr-spacer { flex: 1; }
    .fr-grade-pill {
      font-size: 1.2rem; font-weight: 800;
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
    }
    .fr-grade-pill.grade-A { background: var(--color-stat-green-bg); color: var(--color-success); }
    .fr-grade-pill.grade-B { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .fr-grade-pill.grade-C { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .fr-grade-pill.grade-D { background: var(--color-stat-amber-bg); color: #f5a623; }
    .fr-grade-pill.grade-F { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .fr-grade-pill.grade-obs { background: var(--color-surface-secondary); }
    .fr-grade-pill.grade-obs mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }
    .fr-completed-checks {
      display: flex; gap: 6px; align-items: center; font-size: 0.85rem;
    }
    .fr-check-yes { color: var(--color-success); font-size: 16px; width: 16px; height: 16px; }
    .fr-check-no { color: var(--color-danger); font-size: 16px; width: 16px; height: 16px; }
    .fr-completed-lessons {
      font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 10px;
      line-height: 1.5;
    }

    @media (max-width: 599px) {
      .fr-summary-strip { gap: 8px; }
      .fr-sum-item { padding: 8px 10px; }
      .fr-sum-value { font-size: 1rem; }
      .fr-grade-row { grid-template-columns: repeat(3, 1fr); }
      .fr-toggle-item { flex-direction: column; gap: 8px; align-items: flex-start; }
      .fr-toggle-btns button { min-height: 44px; }
      .fr-condition-row { grid-template-columns: repeat(2, 1fr); }
      .fr-condition-btn { min-height: 44px; }
      .fr-rule-chip { min-height: 44px; display: flex; align-items: center; }
      .fr-pvr-row { gap: 10px; }
    }

    .fr-empty-past {
      display: flex; align-items: center; gap: 10px;
      padding: 20px; text-align: center; justify-content: center;
      color: var(--color-text-muted); font-size: 0.88rem;
    }
    .fr-empty-past mat-icon { font-size: 20px; width: 20px; height: 20px; opacity: 0.5; }
  `]
})
export class FlowReviewComponent {
  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);

  review = input<DailyReview | null>(null);
  trades = input<TradeEntryWithNotes[]>([]);
  stats = input<DayViewStats | null>(null);
  rules = input<TradingRule[]>([]);
  premarket = input<PreMarketNote | null>(null);
  recentReviews = input<DailyFlowReviewSummary[]>([]);
  isToday = input<boolean>(true);

  saved = output<void>();

  editing = signal(false);
  saving = signal(false);
  selectedGrade = signal<TradeGrade | null>(null);
  followedPlan = signal<boolean | null>(null);
  followedRules = signal<boolean | null>(null);
  stoppedAtLimit = signal<boolean | null>(null);
  violatedRules = signal<number[]>([]);
  lessonsLearned = signal('');
  tomorrowFocus = signal('');
  marketObservation = signal('');
  selectedCondition = signal<string | null>(null);

  grades = [
    { letter: 'A' as TradeGrade, desc: 'Perfect' },
    { letter: 'B' as TradeGrade, desc: 'Good' },
    { letter: 'C' as TradeGrade, desc: 'Fair' },
    { letter: 'D' as TradeGrade, desc: 'Poor' },
    { letter: 'F' as TradeGrade, desc: 'Failed' }
  ];
  conditions = ['Bullish', 'Bearish', 'Choppy', 'Flat'];

  isObservation = computed(() => (this.stats()?.totalTrades ?? 0) === 0);
  canSave = computed(() => this.isObservation() ? this.selectedCondition() !== null : this.selectedGrade() !== null);

  constructor() {
    effect(() => {
      const r = this.review();
      if (r) {
        this.selectedGrade.set(r.grade);
        this.followedPlan.set(r.followedPlan);
        this.followedRules.set(r.followedRules);
        this.stoppedAtLimit.set(r.stoppedAtLimit ?? null);
        this.violatedRules.set(
          r.rulesViolated
            ? (typeof r.rulesViolated === 'string' ? JSON.parse(r.rulesViolated as unknown as string) : r.rulesViolated)
            : []
        );
        this.lessonsLearned.set(r.lessonsLearned || '');
        this.tomorrowFocus.set(r.improvementNote || '');
        this.marketObservation.set(r.marketObservation || '');
        this.selectedCondition.set(r.marketCondition || null);
        this.editing.set(false);
      } else {
        this.editing.set(this.isToday());
      }
    });
  }

  toggleRule(id: number): void {
    const current = this.violatedRules();
    this.violatedRules.set(
      current.includes(id) ? current.filter(r => r !== id) : [...current, id]
    );
  }

  save(): void {
    this.saving.set(true);
    const s = this.stats();
    const isObs = this.isObservation();
    const payload: Partial<DailyReview> = {
      date: new Date().toISOString(),
      grade: isObs ? null : this.selectedGrade(),
      followedPlan: this.followedPlan() ?? false,
      followedRules: this.followedRules() ?? false,
      stoppedAtLimit: this.stoppedAtLimit() ?? false,
      totalTrades: s?.totalTrades ?? 0,
      totalPnl: s?.totalNetPnl ?? 0,
      rulesViolated: this.violatedRules(),
      lessonsLearned: this.lessonsLearned() || undefined,
      improvementNote: this.tomorrowFocus() || undefined,
      emotionalSummary: undefined,
      isObservationOnly: isObs,
      marketCondition: isObs ? this.selectedCondition() ?? undefined : undefined,
      marketObservation: isObs ? this.marketObservation() || undefined : undefined
    };

    const r = this.review();
    const obs$ = r
      ? this.tradingService.updateReview(r.id, payload)
      : this.tradingService.createReview(payload);

    obs$.subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success(isObs ? 'Observation saved' : 'Review saved');
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Failed to save review');
      }
    });
  }
}
