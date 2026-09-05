import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { TradingService } from '../../core/services/trading.service';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PreMarketNote, MarketBias, MentalState } from '../../core/models/trading.model';
import { NotificationService } from '../../core/services/notification.service';
import { RichTextEditorComponent } from '../../shared/rich-text-editor.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { toLocalDateString } from '../../core/utils/date-utils';

@Component({
  selector: 'app-premarket',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSliderModule, MatChipsModule,
    CurrencyPipe, DatePipe, RichTextEditorComponent, SkeletonLoaderComponent, PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>wb_twilight</mat-icon></div>
        <h2>Pre-Market Plan</h2>
        <p class="banner-subtitle">Prepare your mind before the market opens</p>
      </div>
    </div>

    <!-- Date Navigator -->
    <div class="date-nav">
      <button mat-icon-button (click)="prevDay()"><mat-icon>chevron_left</mat-icon></button>
      <span class="date-label">{{ selectedDate() | date:'EEEE, MMM d, y' }}</span>
      <button mat-icon-button (click)="nextDay()" [disabled]="isToday()"><mat-icon>chevron_right</mat-icon></button>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card stat-green">
        <mat-icon>local_fire_department</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ streak() }}</span>
          <span class="stat-label">Day Streak</span>
        </div>
      </div>
      <div class="stat-card stat-blue">
        <mat-icon>trending_up</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ recentBias() }}</span>
          <span class="stat-label">Recent Bias</span>
        </div>
      </div>
      <div class="stat-card stat-purple">
        <mat-icon>psychology</mat-icon>
        <div class="stat-content">
          <span class="stat-value mental-dots">
            @for (s of recentMentalStates(); track $index) {
              <span class="mental-dot" [class]="'dot-' + s"></span>
            }
          </span>
          <span class="stat-label">Mental (5d)</span>
        </div>
      </div>
    </div>

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else {
      <form [formGroup]="form" class="premarket-form" (ngSubmit)="save()">
        <!-- Mental State -->
        <div class="form-section">
          <label class="section-label"><mat-icon>psychology</mat-icon> Mental State</label>
          <p class="section-hint">How are you feeling right now? Be honest.</p>
          <div class="mental-state-row">
            <button type="button" class="mental-btn mental-green" [class.active]="form.value.mentalState === 'green'"
                    (click)="form.patchValue({mentalState: 'green'})">
              <mat-icon>sentiment_satisfied</mat-icon>
              <span class="mental-label">Green</span>
              <span class="mental-desc">Focused & Calm</span>
            </button>
            <button type="button" class="mental-btn mental-yellow" [class.active]="form.value.mentalState === 'yellow'"
                    (click)="form.patchValue({mentalState: 'yellow'})">
              <mat-icon>sentiment_neutral</mat-icon>
              <span class="mental-label">Yellow</span>
              <span class="mental-desc">Slightly Off</span>
            </button>
            <button type="button" class="mental-btn mental-red" [class.active]="form.value.mentalState === 'red'"
                    (click)="form.patchValue({mentalState: 'red'})">
              <mat-icon>sentiment_very_dissatisfied</mat-icon>
              <span class="mental-label">Red</span>
              <span class="mental-desc">Emotional / Tired</span>
            </button>
          </div>

          @if (form.value.mentalState === 'red') {
            <div class="red-warning">
              <mat-icon>warning</mat-icon>
              <div>
                <strong>Consider sitting today out.</strong>
                <p>Your data shows red days lead to your worst losses. Protect your capital — the market will be here tomorrow.</p>
              </div>
            </div>
          }
        </div>

        <!-- Market Bias -->
        <div class="form-section">
          <label class="section-label"><mat-icon>trending_up</mat-icon> Market Bias</label>
          <div class="bias-row">
            <button type="button" class="bias-btn" [class.active]="form.value.marketBias === 'bullish'"
                    [class.bullish]="form.value.marketBias === 'bullish'"
                    (click)="form.patchValue({marketBias: 'bullish'})">
              <mat-icon>arrow_upward</mat-icon> Bullish
            </button>
            <button type="button" class="bias-btn" [class.active]="form.value.marketBias === 'bearish'"
                    [class.bearish]="form.value.marketBias === 'bearish'"
                    (click)="form.patchValue({marketBias: 'bearish'})">
              <mat-icon>arrow_downward</mat-icon> Bearish
            </button>
            <button type="button" class="bias-btn" [class.active]="form.value.marketBias === 'neutral'"
                    [class.neutral-active]="form.value.marketBias === 'neutral'"
                    (click)="form.patchValue({marketBias: 'neutral'})">
              <mat-icon>swap_vert</mat-icon> Neutral
            </button>
            <button type="button" class="bias-btn" [class.active]="form.value.marketBias === 'no-trade'"
                    [class.no-trade]="form.value.marketBias === 'no-trade'"
                    (click)="form.patchValue({marketBias: 'no-trade'})">
              <mat-icon>block</mat-icon> No Trade
            </button>
          </div>
        </div>

        <!-- Key Levels -->
        <div class="form-section">
          <app-rich-text-editor label="Key Levels" formControlName="keyLevels" height="100px"
            placeholder="e.g., SPX 5450 support, 5520 resistance, NQ 19800 pivot"></app-rich-text-editor>
        </div>

        <!-- Catalysts -->
        <div class="form-section">
          <app-rich-text-editor label="Catalysts & Events" formControlName="catalysts" height="80px"
            placeholder="e.g., FOMC minutes at 2pm, NVDA earnings, CPI data"></app-rich-text-editor>
        </div>

        <!-- Today's Plan -->
        <div class="form-section">
          <app-rich-text-editor label="Today's Plan" formControlName="plan" height="120px"
            placeholder="What will you do today? What will you NOT do? Be specific."></app-rich-text-editor>
        </div>

        <!-- Limits -->
        <div class="form-section limits-section">
          <label class="section-label"><mat-icon>shield</mat-icon> Daily Limits</label>
          <div class="limits-row">
            <div class="limit-item">
              <span class="limit-label">Max Trades</span>
              <div class="limit-slider">
                <mat-slider min="1" max="10" step="1" discrete>
                  <input matSliderThumb formControlName="maxTrades">
                </mat-slider>
                <span class="limit-value">{{ form.value.maxTrades }}</span>
              </div>
            </div>
            <div class="limit-item">
              <mat-form-field appearance="outline">
                <mat-label>Max Loss</mat-label>
                <input matInput type="number" formControlName="maxLoss" min="0">
                <span matTextPrefix>$&nbsp;</span>
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Save -->
        <div class="save-row">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            <mat-icon>{{ editingId() ? 'check' : 'save' }}</mat-icon>
            {{ editingId() ? 'Update Plan' : 'Save Plan' }}
          </button>
        </div>
      </form>

      <!-- History -->
      @if (history().length > 0) {
        <div class="history-section">
          <h3 class="history-title"><mat-icon>history</mat-icon> Recent Plans</h3>
          @for (note of history(); track note.id) {
            <div class="history-card" (click)="loadNote(note)">
              <div class="history-header">
                <span class="history-date">{{ note.date | date:'EEE, MMM d' }}</span>
                <span class="mental-dot" [class]="'dot-' + note.mentalState"></span>
                <span class="history-bias" [class]="'bias-' + note.marketBias">{{ note.marketBias }}</span>
              </div>
              <p class="history-plan" [innerHTML]="note.plan"></p>
              <div class="history-footer">
                <span class="history-limits">{{ note.maxTrades }} trades / {{ note.maxLoss | currency:'USD':'symbol':'1.0-0' }} max loss</span>
              </div>
            </div>
          }
        </div>
      }
    }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-banner {
      position: relative;
      margin: -24px -24px 24px;
      padding: 40px 24px 32px;
      background: var(--gradient-primary);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content { position: relative; text-align: center; }
    .banner-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px; border: 1px solid rgba(255,255,255,0.3);
    }
    .banner-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #fff; }
    h2 { margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .banner-subtitle { color: rgba(255,255,255,0.75); font-size: 0.9rem; margin: 4px 0 0; }

    .date-nav {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; margin-bottom: var(--spacing-md);
      background: var(--color-surface-secondary); border-radius: var(--radius-full);
      padding: 4px 8px; width: fit-content; margin-left: auto; margin-right: auto;
    }
    .date-label { font-size: 0.95rem; font-weight: 600; min-width: 180px; text-align: center; }

    .stats-row {
      grid-template-columns: repeat(3, 1fr);
      margin-bottom: var(--spacing-lg);
    }
    .stat-card {
      gap: 10px;
      padding: 14px;
    }
    .stat-card > mat-icon { font-size: 24px; width: 24px; height: 24px; padding: 0; border-radius: 0; background: none; }
    .stat-card.stat-green > mat-icon { color: var(--color-stat-green); background: none; }
    .stat-card.stat-blue > mat-icon { color: var(--color-stat-blue); background: none; }
    .stat-card.stat-purple > mat-icon { color: var(--color-stat-purple); background: none; }
    .stat-value { font-size: 1.1rem; }
    .stat-label { letter-spacing: 0.02em; }

    .mental-dots { display: flex; gap: 4px; align-items: center; }
    .mental-dot {
      width: 10px; height: 10px; border-radius: 50%;
    }
    .mental-dot.dot-green { background: var(--color-success); }
    .mental-dot.dot-yellow { background: var(--color-warning); }
    .mental-dot.dot-red { background: var(--color-danger); }

    .loading-center { display: flex; justify-content: center; align-items: center; min-height: 40vh; }

    .premarket-form { display: flex; flex-direction: column; gap: 8px; }
    .form-section { margin-bottom: var(--spacing-sm); }
    .section-label {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 0.95rem; margin-bottom: 8px;
    }
    .section-label mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .section-hint { font-size: 0.82rem; color: var(--color-text-secondary); margin: -4px 0 10px; }
    .full-width { width: 100%; }

    /* Mental State Buttons */
    .mental-state-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .mental-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 16px 8px; border-radius: var(--radius-md); border: 2px solid var(--color-border);
      background: var(--color-surface); cursor: pointer; transition: all 0.2s ease;
      font-family: inherit;
    }
    .mental-btn mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .mental-label { font-weight: 700; font-size: 0.85rem; }
    .mental-desc { font-size: 0.7rem; color: var(--color-text-secondary); text-align: center; }
    .mental-btn.mental-green:hover, .mental-btn.mental-green.active {
      border-color: var(--color-success); background: var(--color-stat-green-bg);
    }
    .mental-btn.mental-green.active mat-icon { color: var(--color-success); }
    .mental-btn.mental-yellow:hover, .mental-btn.mental-yellow.active {
      border-color: var(--color-warning); background: var(--color-stat-amber-bg);
    }
    .mental-btn.mental-yellow.active mat-icon { color: var(--color-warning); }
    .mental-btn.mental-red:hover, .mental-btn.mental-red.active {
      border-color: var(--color-danger); background: var(--color-stat-red-bg);
    }
    .mental-btn.mental-red.active mat-icon { color: var(--color-danger); }

    .red-warning {
      display: flex; gap: 12px; align-items: flex-start;
      margin-top: 12px; padding: 14px; border-radius: var(--radius-md);
      background: var(--color-stat-red-bg); border: 1px solid rgba(255, 59, 48, 0.2);
    }
    .red-warning > mat-icon { color: var(--color-danger); flex-shrink: 0; margin-top: 2px; }
    .red-warning strong { color: var(--color-danger); display: block; margin-bottom: 4px; }
    .red-warning p { margin: 0; font-size: 0.85rem; color: var(--color-text-secondary); }

    /* Bias Buttons */
    .bias-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .bias-btn {
      display: flex; align-items: center; justify-content: center; gap: 4px;
      padding: 10px 8px; border-radius: var(--radius-sm); border: 2px solid var(--color-border);
      background: var(--color-surface); cursor: pointer; transition: all 0.2s ease;
      font-size: 0.8rem; font-weight: 600; font-family: inherit;
    }
    .bias-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .bias-btn.active.bullish { border-color: var(--color-success); background: var(--color-stat-green-bg); color: var(--color-success); }
    .bias-btn.active.bearish { border-color: var(--color-danger); background: var(--color-stat-red-bg); color: var(--color-danger); }
    .bias-btn.active.neutral-active { border-color: var(--color-primary); background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .bias-btn.active.no-trade { border-color: var(--color-text-muted); background: var(--color-surface-secondary); color: var(--color-text-muted); }

    /* Limits */
    .limits-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); align-items: center; }
    .limit-item { display: flex; flex-direction: column; gap: 4px; }
    .limit-label { font-size: 0.82rem; font-weight: 600; color: var(--color-text-secondary); }
    .limit-slider { display: flex; align-items: center; gap: 8px; }
    .limit-value { font-size: 1.1rem; font-weight: 700; color: var(--color-primary); min-width: 24px; text-align: center; }

    .save-row { display: flex; justify-content: center; margin-top: var(--spacing-md); }
    .save-row button { padding: 0 32px; }
    .save-row button mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    /* History */
    .history-section { margin-top: var(--spacing-xl); }
    .history-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1rem; font-weight: 700; margin-bottom: var(--spacing-sm);
    }
    .history-title mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    .history-card {
      padding: 14px; margin-bottom: 10px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      cursor: pointer; transition: box-shadow 0.2s ease;
    }
    .history-card:hover { box-shadow: var(--shadow-md); }
    .history-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .history-date { font-weight: 600; font-size: 0.85rem; }
    .history-bias {
      font-size: 0.7rem; font-weight: 600; padding: 2px 8px;
      border-radius: var(--radius-full); text-transform: capitalize;
    }
    .bias-bullish { background: var(--color-stat-green-bg); color: var(--color-success); }
    .bias-bearish { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .bias-neutral { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .bias-no-trade { background: var(--color-surface-secondary); color: var(--color-text-muted); }
    .history-plan {
      font-size: 0.85rem; color: var(--color-text-secondary);
      margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .history-footer { margin-top: 6px; }
    .history-limits { font-size: 0.75rem; color: var(--color-text-muted); }

    @media (max-width: 599px) {
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
      .stats-row { grid-template-columns: 1fr; }
      .mental-state-row { grid-template-columns: 1fr; }
      .bias-row { grid-template-columns: repeat(2, 1fr); }
      .limits-row { grid-template-columns: 1fr; }
    }
  `]
})
export class PremarketComponent implements OnInit {
  private tradingService = inject(TradingService);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  editingId = signal<number | null>(null);
  selectedDate = signal(new Date());
  history = signal<PreMarketNote[]>([]);
  streak = signal(0);
  recentBias = signal('—');
  recentMentalStates = signal<MentalState[]>([]);

  form = this.fb.group({
    mentalState: ['green' as MentalState, Validators.required],
    marketBias: ['neutral' as MarketBias, Validators.required],
    keyLevels: [''],
    catalysts: [''],
    plan: ['', Validators.required],
    maxTrades: [3],
    maxLoss: [500, [Validators.required, Validators.min(1)]]
  });

  isToday = computed(() => {
    const today = new Date();
    const sel = this.selectedDate();
    return sel.toDateString() === today.toDateString();
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const dateStr = this.formatDate(this.selectedDate());

    this.tradingService.getPreMarketNoteByDate(dateStr).subscribe({
      next: (note) => {
        this.editingId.set(note.id);
        this.form.patchValue({
          mentalState: note.mentalState,
          marketBias: note.marketBias,
          keyLevels: note.keyLevels || '',
          catalysts: note.catalysts || '',
          plan: note.plan,
          maxTrades: note.maxTrades,
          maxLoss: note.maxLoss
        });
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.editingId.set(null);
        this.form.reset({ mentalState: 'green', marketBias: 'neutral', maxTrades: 3, maxLoss: 500 });
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });

    this.tradingService.getPreMarketNotes().subscribe({
      next: (notes) => {
        this.history.set(notes.slice(0, 10));
        this.calculateStats(notes);
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.value;
    const payload: Partial<PreMarketNote> = {
      date: this.formatDate(this.selectedDate()),
      mentalState: val.mentalState as MentalState,
      marketBias: val.marketBias as MarketBias,
      keyLevels: val.keyLevels || undefined,
      catalysts: val.catalysts || undefined,
      plan: val.plan!,
      maxTrades: val.maxTrades!,
      maxLoss: val.maxLoss!
    };

    const obs = this.editingId()
      ? this.tradingService.updatePreMarketNote(this.editingId()!, payload)
      : this.tradingService.createPreMarketNote(payload);

    obs.subscribe({
      next: (note) => {
        this.editingId.set(note.id);
        this.notify.success('Pre-market plan saved');
        this.saving.set(false);
        this.cdr.detectChanges();
        this.loadData();
      },
      error: () => {
        this.notify.error('Failed to save plan');
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  prevDay(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d);
    this.loadData();
  }

  nextDay(): void {
    if (this.isToday()) return;
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d);
    this.loadData();
  }

  loadNote(note: PreMarketNote): void {
    this.selectedDate.set(new Date(note.date));
    this.editingId.set(note.id);
    this.form.patchValue({
      mentalState: note.mentalState,
      marketBias: note.marketBias,
      keyLevels: note.keyLevels || '',
      catalysts: note.catalysts || '',
      plan: note.plan,
      maxTrades: note.maxTrades,
      maxLoss: note.maxLoss
    });
  }

  private calculateStats(notes: PreMarketNote[]): void {
    this.streak.set(this.calcStreak(notes));
    const recent = notes.slice(0, 5);
    if (recent.length > 0) {
      const biases = recent.map(n => n.marketBias);
      const counts: Record<string, number> = {};
      biases.forEach(b => counts[b] = (counts[b] || 0) + 1);
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      this.recentBias.set(top[0].charAt(0).toUpperCase() + top[0].slice(1));
      this.recentMentalStates.set(recent.map(n => n.mentalState));
    }
  }

  private calcStreak(notes: PreMarketNote[]): number {
    let streak = 0;
    const sorted = [...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = new Date();
    let checkDate = new Date(today);
    for (const note of sorted) {
      const noteDate = new Date(note.date).toDateString();
      if (noteDate === checkDate.toDateString()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  private formatDate(d: Date): string {
    return toLocalDateString(d);
  }
}
