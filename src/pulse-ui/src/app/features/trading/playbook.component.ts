import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TradingService } from '../../core/services/trading.service';
import { TradingRule, RuleCategory, DailyLimits, TradingStats, WeeklyFocus, WisdomCategory } from '../../core/models/trading.model';
import { NotificationService } from '../../core/services/notification.service';
import { RuleEditorDialogComponent } from './rule-editor-dialog.component';

interface WisdomItem {
  text: string;
  author?: string;
  category: WisdomCategory;
}

@Component({
  selector: 'app-playbook',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatChipsModule, MatDialogModule, MatProgressSpinnerModule, CurrencyPipe
  ],
  template: `
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>menu_book</mat-icon></div>
        <h2>Playbook & Rules</h2>
        <p class="banner-subtitle">Your trading constitution. Follow it religiously.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner></mat-spinner></div>
    } @else {
    <!-- Streak Hero -->
    <mat-card class="streak-card">
      <mat-card-content>
        <div class="streak-hero">
          <div class="streak-number">
            <span class="streak-value">{{ stats()?.currentRuleStreak ?? 0 }}</span>
            <mat-icon class="streak-fire">local_fire_department</mat-icon>
          </div>
          <span class="streak-label">consecutive days following your rules</span>
          <div class="milestones">
            @for (m of milestones; track m.days) {
              <span class="milestone" [class.achieved]="(stats()?.currentRuleStreak ?? 0) >= m.days">
                {{ m.days }}d: {{ m.label }}
              </span>
            }
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Weekly Focus -->
    @if (weeklyFocus()) {
      <mat-card class="focus-card">
        <mat-card-content>
          <div class="focus-header">
            <mat-icon class="focus-icon">center_focus_strong</mat-icon>
            <span class="focus-title">Weekly Focus</span>
          </div>
          <p class="focus-rule">{{ weeklyFocus()!.ruleText }}</p>
          <div class="focus-dots">
            @for (d of [1,2,3,4,5]; track d) {
              <div class="focus-dot" [class.filled]="d <= (weeklyFocus()!.complianceDays ?? 0)">
                {{ ['M','T','W','T','F'][d-1] }}
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- My Rules -->
    <div class="section">
      <div class="section-header">
        <h3>My Rules</h3>
        <button mat-raised-button color="primary" (click)="openAddRule()">
          <mat-icon>add</mat-icon> Add Rule
        </button>
      </div>

      @if (rules().length > 0) {
        @for (cat of ruleCategories; track cat) {
          @if (rulesByCategory(cat).length > 0) {
            <div class="rule-category">
              <span class="category-chip" [class]="'cat-' + cat">{{ cat | titlecase }}</span>
              @for (rule of rulesByCategory(cat); track rule.id) {
                <div class="rule-item">
                  <mat-icon class="rule-check">rule</mat-icon>
                  <span class="rule-text">{{ rule.text }}</span>
                  <div class="rule-actions">
                    <button mat-icon-button (click)="editRule(rule)"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" (click)="deleteRule(rule)"><mat-icon>delete</mat-icon></button>
                  </div>
                </div>
              }
            </div>
          }
        }
      } @else {
        <p class="empty-hint">No rules yet. Add your first trading rule to start building discipline.</p>
      }
    </div>

    <!-- Daily Limits -->
    <div class="section">
      <h3>Daily Limits</h3>
      <mat-card class="limits-card">
        <mat-card-content>
          <div class="limits-grid">
            <div class="limit-item">
              <mat-form-field appearance="outline">
                <mat-label>Max Trades / Day</mat-label>
                <input matInput type="number" [(ngModel)]="maxTrades" min="1" max="20">
                <mat-icon matPrefix>bar_chart</mat-icon>
              </mat-form-field>
            </div>
            <div class="limit-item">
              <mat-form-field appearance="outline">
                <mat-label>Max Daily Loss</mat-label>
                <input matInput type="number" [(ngModel)]="maxLoss" min="0" step="50">
                <span matTextPrefix>$&nbsp;</span>
              </mat-form-field>
            </div>
            <div class="limit-item">
              <mat-form-field appearance="outline">
                <mat-label>Stop After N Consecutive Losses</mat-label>
                <input matInput type="number" [(ngModel)]="stopAfterLosses" min="1" max="10">
                <mat-icon matPrefix>block</mat-icon>
              </mat-form-field>
            </div>
          </div>
          <button mat-raised-button color="primary" (click)="saveLimits()">
            <mat-icon>save</mat-icon> Save Limits
          </button>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Trading Wisdom -->
    <div class="section">
      <h3>Trading Wisdom</h3>
      <div class="wisdom-filters">
        <button mat-stroked-button [class.active-filter]="wisdomFilter() === 'all'" (click)="wisdomFilter.set('all')">All</button>
        @for (cat of wisdomCategories; track cat) {
          <button mat-stroked-button [class.active-filter]="wisdomFilter() === cat" (click)="wisdomFilter.set(cat)">
            {{ cat | titlecase }}
          </button>
        }
      </div>
      <div class="wisdom-list">
        @for (w of filteredWisdom(); track w.text) {
          <div class="wisdom-card">
            <mat-icon class="wisdom-quote-icon">format_quote</mat-icon>
            <p class="wisdom-text">{{ w.text }}</p>
            <div class="wisdom-footer">
              @if (w.author) {
                <span class="wisdom-author">— {{ w.author }}</span>
              }
              <span class="wisdom-cat-badge" [class]="'wcat-' + w.category">{{ w.category }}</span>
            </div>
          </div>
        }
      </div>
    </div>
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

    /* Streak */
    .streak-card { margin-bottom: var(--spacing-md); background: var(--color-surface); }
    .streak-hero { text-align: center; padding: 20px 0; }
    .streak-number { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .streak-value { font-size: 4rem; font-weight: 900; color: var(--color-primary); line-height: 1; }
    .streak-fire { font-size: 36px; width: 36px; height: 36px; color: #ff9500; }
    .streak-label { display: block; margin-top: 8px; font-size: 0.85rem; color: var(--color-text-secondary); font-weight: 500; }
    .milestones { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 16px; }
    .milestone {
      padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 700;
      background: var(--color-border); color: var(--color-text-muted);
    }
    .milestone.achieved { background: var(--color-stat-green-bg); color: var(--color-success); }

    /* Weekly Focus */
    .focus-card { margin-bottom: var(--spacing-md); border-left: 4px solid var(--color-primary); }
    .focus-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .focus-icon { color: var(--color-primary); }
    .focus-title { font-weight: 700; font-size: 0.9rem; }
    .focus-rule { font-size: 1rem; font-weight: 500; margin: 0 0 12px; }
    .focus-dots { display: flex; gap: 8px; }
    .focus-dot {
      width: 32px; height: 32px; border-radius: 8px; display: flex;
      align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700;
      background: var(--color-border); color: var(--color-text-muted);
    }
    .focus-dot.filled { background: var(--color-stat-green-bg); color: var(--color-success); }

    /* Sections */
    .section { margin-bottom: var(--spacing-lg); }
    .section h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 12px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .empty-hint { color: var(--color-text-secondary); font-size: 0.85rem; font-style: italic; }

    /* Rules */
    .rule-category { margin-bottom: 16px; }
    .category-chip {
      display: inline-block; padding: 3px 10px; border-radius: var(--radius-full);
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px;
    }
    .cat-entry { background: var(--color-stat-green-bg); color: var(--color-success); }
    .cat-exit { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .cat-risk { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .cat-mindset { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }
    .cat-general { background: var(--color-stat-amber-bg); color: var(--color-warning); }

    .rule-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; background: var(--color-surface-secondary);
      border-radius: var(--radius-sm); margin-bottom: 6px;
    }
    .rule-check { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); flex-shrink: 0; }
    .rule-text { flex: 1; font-size: 0.9rem; font-weight: 500; }
    .rule-actions { display: flex; flex-shrink: 0; }
    .rule-actions button { width: 32px; height: 32px; }
    .rule-actions mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Limits */
    .limits-card { margin-bottom: var(--spacing-md); }
    .limits-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }
    .limits-grid mat-form-field { width: 100%; }

    /* Wisdom */
    .wisdom-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
    .wisdom-filters button { font-size: 0.75rem; border-radius: var(--radius-full) !important; }
    .active-filter { background: var(--color-primary) !important; color: #fff !important; }
    .wisdom-list { display: flex; flex-direction: column; gap: 12px; }
    .wisdom-card {
      padding: 16px; background: var(--color-surface-secondary);
      border-radius: var(--radius-md); border-left: 3px solid var(--color-primary);
    }
    .wisdom-quote-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); opacity: 0.5; margin-bottom: 4px; }
    .wisdom-text { font-size: 0.95rem; font-weight: 500; line-height: 1.5; margin: 0 0 8px; font-style: italic; }
    .wisdom-footer { display: flex; align-items: center; gap: 8px; }
    .wisdom-author { font-size: 0.8rem; color: var(--color-text-secondary); }
    .wisdom-cat-badge {
      padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.65rem;
      font-weight: 700; text-transform: uppercase;
    }
    .wcat-discipline { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .wcat-risk { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .wcat-psychology { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }
    .wcat-patience { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .wcat-process { background: var(--color-stat-green-bg); color: var(--color-success); }

    @media (max-width: 599px) {
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
      .streak-value { font-size: 3rem; }
      .limits-grid { grid-template-columns: 1fr; }
      .grade-buttons { grid-template-columns: repeat(3, 1fr); }
    }
  `]
})
export class PlaybookComponent implements OnInit {
  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  rules = signal<TradingRule[]>([]);
  stats = signal<TradingStats | null>(null);
  weeklyFocus = signal<WeeklyFocus | null>(null);
  wisdomFilter = signal<WisdomCategory | 'all'>('all');

  maxTrades = 3;
  maxLoss = 500;
  stopAfterLosses = 2;

  ruleCategories: RuleCategory[] = ['entry', 'exit', 'risk', 'mindset', 'general'];
  wisdomCategories: WisdomCategory[] = ['discipline', 'risk', 'psychology', 'patience', 'process'];

  milestones = [
    { days: 7, label: 'Iron Will' },
    { days: 14, label: 'Disciplined' },
    { days: 30, label: 'Professional' },
    { days: 60, label: 'Elite' },
    { days: 90, label: 'Master' },
  ];

  private wisdomData: WisdomItem[] = [
    { text: 'The goal is to make the best trades, not the most trades.', category: 'discipline' },
    { text: 'One good trade a day is all you need.', category: 'patience' },
    { text: 'Losses are tuition. But repeated losses from the same mistake are a choice.', category: 'process' },
    { text: 'The market rewards patience. It punishes impulse.', category: 'patience' },
    { text: 'Your edge is not your setup. Your edge is your ability to follow your rules.', category: 'discipline' },
    { text: 'A trade you sit out because the setup wasn\'t perfect is your best trade of the day.', category: 'patience' },
    { text: 'Professional traders are professional waiters.', category: 'patience' },
    { text: 'Risk management is not optional. It is the entire game.', category: 'risk' },
    { text: 'The P&L of a single trade is noise. The P&L of following your process is signal.', category: 'process' },
    { text: 'You don\'t need to trade every day. You need to trade well when you trade.', category: 'discipline' },
    { text: 'Moving your stop loss is the same as not having one.', category: 'risk' },
    { text: 'If you\'re trading to make back what you lost, you\'ve already lost more.', category: 'psychology' },
    { text: 'The best traders have the most boring trading days.', category: 'discipline' },
    { text: 'Three trades max. Make them count.', category: 'discipline' },
    { text: 'Your journal is your edge. Without it, you\'re guessing in circles.', category: 'process' },
    { text: 'The market doesn\'t know your position. It doesn\'t care about your feelings.', category: 'psychology' },
    { text: 'Discipline is choosing between what you want now and what you want most.', category: 'psychology' },
    { text: 'Every revenge trade finances someone else\'s retirement.', category: 'psychology' },
    { text: 'Size kills. Cut your size in half and watch your clarity double.', category: 'risk' },
    { text: 'The process IS the edge. Trust it.', category: 'process' },
  ];

  filteredWisdom = computed(() => {
    const f = this.wisdomFilter();
    if (f === 'all') return this.wisdomData;
    return this.wisdomData.filter(w => w.category === f);
  });

  ngOnInit(): void {
    this.tradingService.getRules().subscribe({
      next: r => { this.rules.set(r); this.loading.set(false); },
      error: () => { this.rules.set([]); this.loading.set(false); }
    });
    this.tradingService.getStats().subscribe({
      next: s => this.stats.set(s),
      error: () => {}
    });
    this.tradingService.getWeeklyFocus().subscribe({
      next: f => this.weeklyFocus.set(f),
      error: () => {}
    });
    this.tradingService.getLimits().subscribe({
      next: l => {
        this.maxTrades = l.maxTradesPerDay;
        this.maxLoss = l.maxDailyLoss;
        this.stopAfterLosses = l.stopAfterConsecutiveLosses;
      },
      error: () => {}
    });
  }

  rulesByCategory(cat: RuleCategory): TradingRule[] {
    return this.rules().filter(r => r.category === cat);
  }

  openAddRule(): void {
    const ref = this.dialog.open(RuleEditorDialogComponent, {
      width: '450px', data: { rule: null }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadRules(); });
  }

  editRule(rule: TradingRule): void {
    const ref = this.dialog.open(RuleEditorDialogComponent, {
      width: '450px', data: { rule }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadRules(); });
  }

  deleteRule(rule: TradingRule): void {
    if (!confirm('Delete this rule?')) return;
    this.tradingService.deleteRule(rule.id).subscribe({
      next: () => { this.notify.success('Rule deleted'); this.loadRules(); },
      error: () => this.notify.error('Failed to delete rule')
    });
  }

  saveLimits(): void {
    this.tradingService.updateLimits({
      maxTradesPerDay: this.maxTrades,
      maxDailyLoss: this.maxLoss,
      stopAfterConsecutiveLosses: this.stopAfterLosses
    }).subscribe({
      next: () => this.notify.success('Limits saved'),
      error: () => this.notify.error('Failed to save limits')
    });
  }

  private loadRules(): void {
    this.tradingService.getRules().subscribe(r => this.rules.set(r));
  }
}
