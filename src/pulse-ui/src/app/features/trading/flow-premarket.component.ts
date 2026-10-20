import { Component, inject, signal, computed, input, output, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { RouterModule } from '@angular/router';
import { TradingService } from '../../core/services/trading.service';
import { NotificationService } from '../../core/services/notification.service';
import { RichTextEditorComponent } from '../../shared/rich-text-editor.component';
import { PreMarketNote, PreMarketTemplate, MarketBias, MentalState } from '../../core/models/trading.model';
import { toLocalDateString } from '../../core/utils/date-utils';

@Component({
  selector: 'app-flow-premarket',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSliderModule, CurrencyPipe,
    RichTextEditorComponent
  ],
  template: `
    @if (!editing() && !premarket() && !isToday()) {
      <div class="fp-empty-past">
        <mat-icon>event_busy</mat-icon>
        <span>No morning prep was recorded this day</span>
      </div>
    } @else if (!editing()) {
      <!-- Collapsed summary card -->
      <div class="fp-summary">
        <div class="fp-summary-header">
          <span class="fp-mental-dot" [class]="'dot-' + premarket()?.mentalState"></span>
          <span class="fp-bias-badge" [class]="'bias-' + premarket()?.marketBias">{{ premarket()?.marketBias }}</span>
          <span class="fp-limits">{{ premarket()?.maxTrades }} trades / {{ premarket()?.maxLoss | currency:'USD':'symbol':'1.0-0' }} max</span>
          @if (isToday()) { <button mat-icon-button class="fp-edit-btn" (click)="editing.set(true)"><mat-icon>edit</mat-icon></button> }
        </div>
        @if (premarket()?.plan) {
          <div class="fp-plan-snippet" [innerHTML]="premarket()!.plan"></div>
        }
        @if (premarket()?.emotionalPlan) {
          <div class="fp-emotional-snippet">
            <mat-icon>self_improvement</mat-icon>
            <span>{{ premarket()!.emotionalPlan }}</span>
          </div>
        }
      </div>
    } @else {
      <!-- Expanded form -->
      <form [formGroup]="form" class="fp-form" (ngSubmit)="save()">

        <!-- Mental State -->
        <div class="fp-form-section">
          <label class="fp-section-label"><mat-icon>psychology</mat-icon> Mental State</label>
          <p class="fp-section-hint">How are you feeling right now? Be honest.</p>
          <div class="fp-mental-row">
            <button type="button" class="fp-mental-btn fp-mental-green" [class.active]="form.value.mentalState === 'green'"
                    (click)="form.patchValue({mentalState: 'green'})">
              <mat-icon>sentiment_satisfied</mat-icon>
              <span class="fp-mental-label">Green</span>
              <span class="fp-mental-desc">Focused & Calm</span>
            </button>
            <button type="button" class="fp-mental-btn fp-mental-yellow" [class.active]="form.value.mentalState === 'yellow'"
                    (click)="form.patchValue({mentalState: 'yellow'})">
              <mat-icon>sentiment_neutral</mat-icon>
              <span class="fp-mental-label">Yellow</span>
              <span class="fp-mental-desc">Slightly Off</span>
            </button>
            <button type="button" class="fp-mental-btn fp-mental-red" [class.active]="form.value.mentalState === 'red'"
                    (click)="form.patchValue({mentalState: 'red'})">
              <mat-icon>sentiment_very_dissatisfied</mat-icon>
              <span class="fp-mental-label">Red</span>
              <span class="fp-mental-desc">Emotional / Tired</span>
            </button>
          </div>

          @if (form.value.mentalState === 'red') {
            <div class="fp-red-warning">
              <mat-icon>warning</mat-icon>
              <div>
                <strong>Consider sitting today out.</strong>
                <p>Your data shows red days lead to your worst losses. Protect your capital — the market will be here tomorrow.</p>
              </div>
            </div>
          }
        </div>

        <!-- Emotional Plan -->
        <div class="fp-form-section">
          <label class="fp-section-label"><mat-icon>self_improvement</mat-icon> Emotional Plan</label>
          <p class="fp-section-hint">If I feel X, I will Y. Pre-commit to handling emotions before they arise.</p>
          <mat-form-field appearance="outline" class="fp-full-width">
            <mat-label>Your emotional plan</mat-label>
            <textarea matInput formControlName="emotionalPlan" rows="3"
                      placeholder="If I feel FOMO, I will walk away for 5 minutes.&#10;If I feel revenge urge, I will close the platform.&#10;If I feel anxious, I will check my max loss limit."
                      cdkTextareaAutosize></textarea>
          </mat-form-field>
        </div>

        <!-- Market Bias -->
        <div class="fp-form-section">
          <label class="fp-section-label"><mat-icon>trending_up</mat-icon> Market Bias</label>
          <div class="fp-bias-row">
            <button type="button" class="fp-bias-btn" [class.active]="form.value.marketBias === 'bullish'"
                    [class.bullish]="form.value.marketBias === 'bullish'"
                    (click)="form.patchValue({marketBias: 'bullish'})">
              <mat-icon>arrow_upward</mat-icon> Bullish
            </button>
            <button type="button" class="fp-bias-btn" [class.active]="form.value.marketBias === 'bearish'"
                    [class.bearish]="form.value.marketBias === 'bearish'"
                    (click)="form.patchValue({marketBias: 'bearish'})">
              <mat-icon>arrow_downward</mat-icon> Bearish
            </button>
            <button type="button" class="fp-bias-btn" [class.active]="form.value.marketBias === 'neutral'"
                    [class.neutral-active]="form.value.marketBias === 'neutral'"
                    (click)="form.patchValue({marketBias: 'neutral'})">
              <mat-icon>swap_vert</mat-icon> Neutral
            </button>
            <button type="button" class="fp-bias-btn" [class.active]="form.value.marketBias === 'no-trade'"
                    [class.no-trade]="form.value.marketBias === 'no-trade'"
                    (click)="form.patchValue({marketBias: 'no-trade'})">
              <mat-icon>block</mat-icon> No Trade
            </button>
          </div>
        </div>

        <!-- Key Levels -->
        <div class="fp-form-section">
          <app-rich-text-editor label="Key Levels" formControlName="keyLevels" height="100px"
            placeholder="e.g., SPX 5450 support, 5520 resistance, NQ 19800 pivot"></app-rich-text-editor>
        </div>

        <!-- Catalysts -->
        <div class="fp-form-section">
          <app-rich-text-editor label="Catalysts & Events" formControlName="catalysts" height="80px"
            placeholder="e.g., FOMC minutes at 2pm, NVDA earnings, CPI data"></app-rich-text-editor>
        </div>

        <!-- Today's Plan -->
        <div class="fp-form-section">
          <app-rich-text-editor label="Today's Plan" formControlName="plan" height="120px"
            placeholder="What will you do today? What will you NOT do? Be specific."></app-rich-text-editor>
        </div>

        <!-- Limits -->
        <div class="fp-form-section">
          <label class="fp-section-label"><mat-icon>shield</mat-icon> Daily Limits</label>
          <div class="fp-limits-row">
            <div class="fp-limit-item">
              <span class="fp-limit-label">Max Trades</span>
              <div class="fp-limit-slider">
                <mat-slider min="1" max="10" step="1" discrete>
                  <input matSliderThumb formControlName="maxTrades">
                </mat-slider>
                <span class="fp-limit-value">{{ form.value.maxTrades }}</span>
              </div>
            </div>
            <div class="fp-limit-item">
              <mat-form-field appearance="outline">
                <mat-label>Max Loss</mat-label>
                <input matInput type="number" inputmode="decimal" formControlName="maxLoss" min="0">
                <span matTextPrefix>$&nbsp;</span>
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Template -->
        @if (template()) {
          <div class="fp-template-row">
            <button mat-stroked-button type="button" class="fp-template-btn" (click)="loadTemplate()">
              <mat-icon>auto_fix_high</mat-icon> Load Template
            </button>
            <a class="fp-manage-template" routerLink="/trading/premarket/template">
              <mat-icon>settings</mat-icon> Manage Template
            </a>
          </div>
        }

        <!-- Actions -->
        <div class="fp-actions">
          @if (premarket()) {
            <button type="button" mat-stroked-button class="fp-cancel-btn" (click)="cancelEdit()">Cancel</button>
          }
          <button class="fp-save-btn" type="submit" [disabled]="form.invalid || saving()">
            @if (saving()) {
              <span class="fp-btn-spinner"></span> Saving...
            } @else if (isFuture()) {
              <mat-icon>edit_note</mat-icon> Save as Draft
            } @else {
              <mat-icon>save</mat-icon> Save
            }
          </button>
        </div>
      </form>
    }
  `,
  styles: [`
    :host { display: block; }

    /* Summary card */
    .fp-summary {
      padding: 16px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
    }
    .fp-summary-header {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    .fp-mental-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }
    .fp-mental-dot.dot-green { background: var(--color-success); }
    .fp-mental-dot.dot-yellow { background: var(--color-warning); }
    .fp-mental-dot.dot-red { background: var(--color-danger); }
    .fp-bias-badge {
      font-size: 0.75rem; font-weight: 600; padding: 2px 10px;
      border-radius: var(--radius-full); text-transform: capitalize;
    }
    .fp-bias-badge.bias-bullish { background: var(--color-stat-green-bg); color: var(--color-success); }
    .fp-bias-badge.bias-bearish { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .fp-bias-badge.bias-neutral { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .fp-bias-badge.bias-no-trade { background: var(--color-surface-secondary); color: var(--color-text-muted); }
    .fp-limits {
      font-size: 0.82rem; color: var(--color-text-secondary); margin-left: auto;
    }
    .fp-edit-btn { flex-shrink: 0; }
    .fp-plan-snippet {
      margin-top: 10px; font-size: 0.88rem; color: var(--color-text-secondary);
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
      overflow: hidden; line-height: 1.5;
    }
    .fp-emotional-snippet {
      display: flex; align-items: flex-start; gap: 6px;
      margin-top: 8px; font-size: 0.82rem; color: var(--color-text-muted); font-style: italic;
    }
    .fp-emotional-snippet mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    /* Form */
    .fp-form { display: flex; flex-direction: column; gap: 8px; }
    .fp-form-section { margin-bottom: var(--spacing-sm); }
    .fp-section-label {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 0.95rem; margin-bottom: 8px;
    }
    .fp-section-label mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .fp-section-hint { font-size: 0.82rem; color: var(--color-text-secondary); margin: -4px 0 10px; }
    .fp-full-width { width: 100%; }

    /* Mental State Buttons */
    .fp-mental-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .fp-mental-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 16px 8px; border-radius: var(--radius-md); border: 2px solid var(--color-border);
      background: var(--color-surface); cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease;
      font-family: inherit;
    }
    .fp-mental-btn mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .fp-mental-label { font-weight: 700; font-size: 0.85rem; }
    .fp-mental-desc { font-size: 0.7rem; color: var(--color-text-secondary); text-align: center; }
    .fp-mental-btn.fp-mental-green:hover, .fp-mental-btn.fp-mental-green.active {
      border-color: var(--color-success); background: var(--color-stat-green-bg);
    }
    .fp-mental-btn.fp-mental-green.active mat-icon { color: var(--color-success); }
    .fp-mental-btn.fp-mental-yellow:hover, .fp-mental-btn.fp-mental-yellow.active {
      border-color: var(--color-warning); background: var(--color-stat-amber-bg);
    }
    .fp-mental-btn.fp-mental-yellow.active mat-icon { color: var(--color-warning); }
    .fp-mental-btn.fp-mental-red:hover, .fp-mental-btn.fp-mental-red.active {
      border-color: var(--color-danger); background: var(--color-stat-red-bg);
    }
    .fp-mental-btn.fp-mental-red.active mat-icon { color: var(--color-danger); }

    .fp-red-warning {
      display: flex; gap: 12px; align-items: flex-start;
      margin-top: 12px; padding: 14px; border-radius: var(--radius-md);
      background: var(--color-stat-red-bg); border: 1px solid rgba(255, 59, 48, 0.2);
    }
    .fp-red-warning > mat-icon { color: var(--color-danger); flex-shrink: 0; margin-top: 2px; }
    .fp-red-warning strong { color: var(--color-danger); display: block; margin-bottom: 4px; }
    .fp-red-warning p { margin: 0; font-size: 0.85rem; color: var(--color-text-secondary); }

    /* Bias Buttons */
    .fp-bias-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .fp-bias-btn {
      display: flex; align-items: center; justify-content: center; gap: 4px;
      padding: 10px 8px; border-radius: var(--radius-sm); border: 2px solid var(--color-border);
      background: var(--color-surface); cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease;
      font-size: 0.8rem; font-weight: 600; font-family: inherit;
    }
    .fp-bias-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .fp-bias-btn.active.bullish { border-color: var(--color-success); background: var(--color-stat-green-bg); color: var(--color-success); }
    .fp-bias-btn.active.bearish { border-color: var(--color-danger); background: var(--color-stat-red-bg); color: var(--color-danger); }
    .fp-bias-btn.active.neutral-active { border-color: var(--color-primary); background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .fp-bias-btn.active.no-trade { border-color: var(--color-text-muted); background: var(--color-surface-secondary); color: var(--color-text-muted); }

    /* Limits */
    .fp-limits-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); align-items: center; }
    .fp-limit-item { display: flex; flex-direction: column; gap: 4px; }
    .fp-limit-label { font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); }
    .fp-limit-slider { display: flex; align-items: center; gap: 8px; }
    .fp-limit-value { font-size: 1.1rem; font-weight: 700; color: var(--color-primary); min-width: 24px; text-align: center; }

    /* Template */
    .fp-template-row {
      display: flex; align-items: center; justify-content: center; gap: 16px; padding: 10px 0;
      border-top: 1px dashed var(--color-border);
    }
    .fp-template-btn { font-size: 0.82rem; }
    .fp-template-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 2px; }
    .fp-manage-template {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.78rem; color: var(--color-text-muted); text-decoration: none; cursor: pointer;
    }
    .fp-manage-template:hover { color: var(--color-primary); }
    .fp-manage-template mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Actions */
    .fp-actions { display: flex; gap: 10px; margin-top: var(--spacing-sm); }
    .fp-cancel-btn { flex-shrink: 0; min-height: 48px; }
    .fp-save-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      flex: 1; height: 48px; border: none; border-radius: var(--radius-md);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.95rem; font-weight: 700; font-family: inherit;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
      transition: box-shadow 0.2s ease, opacity 0.2s ease;
    }
    .fp-save-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4); }
    .fp-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .fp-save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .fp-btn-spinner {
      display: inline-block; width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: fp-spin 0.6s linear infinite;
    }
    @keyframes fp-spin { to { transform: rotate(360deg); } }

    @media (max-width: 599px) {
      .fp-mental-row { gap: 8px; }
      .fp-mental-btn { padding: 12px 4px; }
      .fp-mental-desc { display: none; }
      .fp-bias-row { grid-template-columns: repeat(2, 1fr); }
      .fp-bias-btn { min-height: 44px; }
      .fp-limits-row { grid-template-columns: 1fr; }
      .fp-save-btn, .fp-cancel-btn { min-height: 44px; }
    }

    .fp-empty-past {
      display: flex; align-items: center; gap: 10px;
      padding: 20px; text-align: center; justify-content: center;
      color: var(--color-text-muted); font-size: 0.88rem;
    }
    .fp-empty-past mat-icon { font-size: 20px; width: 20px; height: 20px; opacity: 0.5; }
  `]
})
export class FlowPremarketComponent {
  private tradingService = inject(TradingService);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  premarket = input<PreMarketNote | null>(null);
  template = input<PreMarketTemplate | null>(null);
  streak = input(0);
  recentMentalStates = input<string[]>([]);
  isToday = input<boolean>(true);
  targetDate = input<string | undefined>(undefined);

  saved = output<void>();

  editing = signal(false);
  saving = signal(false);

  isFuture = computed(() => {
    const td = this.targetDate();
    if (!td) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return td > todayStr;
  });

  form = this.fb.group({
    mentalState: ['green' as MentalState, Validators.required],
    marketBias: ['neutral' as MarketBias, Validators.required],
    keyLevels: [''],
    catalysts: [''],
    plan: [''],
    emotionalPlan: [''],
    maxTrades: [3],
    maxLoss: [500, Validators.min(1)]
  });

  constructor() {
    effect(() => {
      const pm = this.premarket();
      if (pm) {
        this.form.patchValue({
          mentalState: pm.mentalState,
          marketBias: pm.marketBias,
          keyLevels: pm.keyLevels || '',
          catalysts: pm.catalysts || '',
          plan: pm.plan,
          emotionalPlan: pm.emotionalPlan || '',
          maxTrades: pm.maxTrades,
          maxLoss: pm.maxLoss
        });
        this.editing.set(false);
      } else {
        const t = this.template();
        this.form.reset({
          mentalState: 'green', marketBias: 'neutral', maxTrades: 3, maxLoss: 500,
          keyLevels: t?.keyLevels || '',
          catalysts: t?.catalysts || '',
          plan: t?.plan || '',
          emotionalPlan: ''
        });
        this.editing.set(this.isToday());
      }
      this.cdr.detectChanges();
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.value;
    const payload: Partial<PreMarketNote> = {
      date: this.targetDate() || toLocalDateString(new Date()),
      mentalState: val.mentalState as MentalState,
      marketBias: val.marketBias as MarketBias,
      keyLevels: val.keyLevels || undefined,
      catalysts: val.catalysts || undefined,
      plan: val.plan || '',
      emotionalPlan: val.emotionalPlan || undefined,
      maxTrades: val.maxTrades ?? 3,
      maxLoss: val.maxLoss ?? 500
    };

    const pm = this.premarket();
    const obs = pm
      ? this.tradingService.updatePreMarketNote(pm.id, payload)
      : this.tradingService.createPreMarketNote(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('Pre-market plan saved');
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Failed to save plan');
      }
    });
  }

  cancelEdit(): void {
    const pm = this.premarket();
    if (pm) {
      this.form.patchValue({
        mentalState: pm.mentalState,
        marketBias: pm.marketBias,
        keyLevels: pm.keyLevels || '',
        catalysts: pm.catalysts || '',
        plan: pm.plan,
        emotionalPlan: pm.emotionalPlan || '',
        maxTrades: pm.maxTrades,
        maxLoss: pm.maxLoss
      });
      this.editing.set(false);
    }
  }

  loadTemplate(): void {
    const t = this.template();
    if (!t) return;
    this.form.patchValue({
      keyLevels: t.keyLevels || '',
      catalysts: t.catalysts || '',
      plan: t.plan || ''
    });
    this.notify.success('Template loaded');
  }

}
