import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { TradingService } from '../../core/services/trading.service';
import { NotificationService } from '../../core/services/notification.service';
import { TradingGoal, GoalProgress, GoalHistory, GoalSnapshot } from '../../core/models/trading.model';

interface MetricDef {
  key: string;
  label: string;
  icon: string;
  unit: string;
  defaultOp: string;
  format: 'currency' | 'percent' | 'number';
}

@Component({
  selector: 'app-trading-goals',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, DecimalPipe,
    MatButtonModule, MatButtonToggleModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatDatepickerModule, MatNativeDateModule, BaseChartDirective,
    SkeletonLoaderComponent, PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="loadProgress()">
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>flag</mat-icon></div>
        <h2>Trading Goals</h2>
        <p class="banner-subtitle">Set targets, track progress automatically</p>
      </div>
    </div>

    <!-- Timeframe Toggle -->
    <div class="timeframe-row">
      <mat-button-toggle-group [value]="timeframe()" (change)="onTimeframeChange($event.value)" hideSingleSelectionIndicator>
        <mat-button-toggle value="daily">Daily</mat-button-toggle>
        <mat-button-toggle value="weekly">Weekly</mat-button-toggle>
        <mat-button-toggle value="monthly">Monthly</mat-button-toggle>
      </mat-button-toggle-group>
    </div>

    <!-- History Period Range -->
    <div class="period-row">
      <div class="period-chips">
        @for (r of periodRanges; track r.key) {
          <button class="period-chip" [class.active]="historyRange() === r.key" (click)="onHistoryRangeChange(r.key)">
            {{ r.label }}
          </button>
        }
      </div>
      @if (historyRange() === 'custom') {
        <div class="custom-range">
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>From</mat-label>
            <input matInput [matDatepicker]="fromPicker" [ngModel]="customFrom()" (dateChange)="onCustomFromChange($event.value)">
            <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>To</mat-label>
            <input matInput [matDatepicker]="toPicker" [ngModel]="customTo()" (dateChange)="onCustomToChange($event.value)">
            <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </mat-form-field>
          <button mat-raised-button color="primary" class="apply-btn" (click)="applyCustomRange()">Apply</button>
        </div>
      }
    </div>

    <!-- Summary -->
    @if (progress().length > 0) {
      <div class="summary-card" [class.all-achieved]="achievedCount() === progress().length">
        <div class="summary-ring">
          <svg viewBox="0 0 36 36" class="ring-svg">
            <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="ring-fill" [class.ring-complete]="achievedCount() === progress().length"
              [style.stroke-dasharray]="overallPercent() + ', 100'"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <span class="ring-text">{{ overallPercent() }}%</span>
        </div>
        <div class="summary-info">
          <span class="summary-count">{{ achievedCount() }}/{{ progress().length }} goals achieved</span>
          <span class="summary-period">{{ timeframeLabel() }}</span>
          <span class="summary-range">{{ timeframeRange() }}</span>
        </div>
      </div>
    }

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else {

    <!-- Goals Grid -->
    @if (progress().length > 0) {
      <div class="goals-grid">
        @for (p of progress(); track p.goal.id) {
          <div class="goal-card" [class.achieved]="p.achieved" [class.missed]="!p.achieved && p.percentage < 50">
            <div class="goal-header">
              <mat-icon class="goal-icon">{{ getMetricIcon(p.goal.metric) }}</mat-icon>
              <span class="goal-metric">{{ getMetricLabel(p.goal.metric) }}</span>
              @if (historyMap().get(p.goal.id); as h) {
                @if (h.streak > 0) {
                  <span class="streak-badge">
                    <mat-icon>local_fire_department</mat-icon>
                    {{ h.streak }}
                  </span>
                }
              }
              <div class="goal-actions">
                <button mat-icon-button class="action-btn" (click)="toggleHistory(p.goal.id)">
                  <mat-icon>{{ expandedGoal() === p.goal.id ? 'expand_less' : 'timeline' }}</mat-icon>
                </button>
                <button mat-icon-button class="action-btn" (click)="editGoal(p.goal)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-btn" (click)="deleteGoal(p.goal)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>
            <div class="goal-progress">
              <div class="progress-bar-track">
                <div class="progress-bar-fill" [class.fill-green]="p.achieved" [class.fill-amber]="!p.achieved && p.percentage >= 50"
                  [class.fill-red]="!p.achieved && p.percentage < 50"
                  [style.width.%]="Math.min(p.percentage, 100)"></div>
              </div>
              <div class="progress-numbers">
                <span class="current-val">{{ formatValue(p.currentValue, p.goal.metric) }}</span>
                <span class="target-val">{{ p.goal.operator === 'gte' ? '≥' : '≤' }} {{ formatValue(p.goal.targetValue, p.goal.metric) }}</span>
              </div>
            </div>
            <div class="goal-status">
              @if (p.achieved) {
                <mat-icon class="status-icon status-pass">check_circle</mat-icon>
                <span class="status-text status-pass">Achieved</span>
              } @else {
                <mat-icon class="status-icon status-pending">radio_button_unchecked</mat-icon>
                <span class="status-text status-pending">{{ p.percentage | number:'1.0-0' }}% progress</span>
              }
            </div>

            <!-- History Panel -->
            @if (expandedGoal() === p.goal.id && historyMap().get(p.goal.id); as h) {
              <div class="history-panel">
                <div class="history-header">
                  <span class="history-title">{{ getRangeLabel() }} results</span>
                  @if (h.streak > 0) {
                    <span class="streak-label">
                      <mat-icon>local_fire_department</mat-icon>
                      {{ h.streak }} {{ p.goal.timeframe === 'daily' ? 'day' : p.goal.timeframe === 'weekly' ? 'week' : 'month' }}{{ h.streak > 1 ? 's' : '' }} streak
                    </span>
                  }
                </div>

                <!-- Achievement summary bar -->
                @if (h.snapshots.length > 0) {
                  <div class="achievement-bar">
                    <span class="ach-label">{{ getAchievedCount(h) }}/{{ h.snapshots.length }} achieved</span>
                    <span class="ach-rate">{{ getAchievedRate(h) }}%</span>
                  </div>
                }

                <!-- Chart -->
                @if (h.snapshots.length > 1 && getChartConfig(p.goal, h); as cfg) {
                  <div class="history-chart-wrap">
                    <canvas baseChart [data]="cfg.data" [options]="cfg.options" [type]="cfg.type"></canvas>
                  </div>
                }

                <!-- Snapshot rows -->
                <div class="snapshot-list" [class.scrollable]="h.snapshots.length > 8">
                  @for (s of h.snapshots.slice().reverse(); track s.periodStart) {
                    <div class="snapshot-row"
                      [class.snap-achieved]="s.achieved"
                      [class.snap-loss]="!s.achieved && isLoss(s, p.goal)"
                      [class.snap-missed]="!s.achieved && !isLoss(s, p.goal)">
                      <span class="snap-period">{{ formatPeriodDate(s.periodStart, p.goal.timeframe) }}</span>
                      <span class="snap-value">{{ formatValue(s.currentValue, p.goal.metric) }}</span>
                      <span class="snap-pct">{{ s.percentage | number:'1.0-0' }}%</span>
                      @if (s.achieved) {
                        <mat-icon class="snap-icon snap-pass">check_circle</mat-icon>
                      } @else if (isLoss(s, p.goal)) {
                        <mat-icon class="snap-icon snap-danger">close</mat-icon>
                      } @else {
                        <mat-icon class="snap-icon snap-warn">warning</mat-icon>
                      }
                    </div>
                  }
                </div>
              </div>
            }
            @if (expandedGoal() === p.goal.id && !historyMap().get(p.goal.id)) {
              <div class="history-panel">
                <div class="history-loading">Loading history...</div>
              </div>
            }
          </div>
        }
      </div>
    } @else if (!showForm()) {
      <div class="empty-state">
        <div class="empty-icon-wrap"><mat-icon>flag</mat-icon></div>
        <h3>No {{ timeframe() }} goals yet</h3>
        <p>Set targets to track your trading discipline</p>
        <button mat-raised-button color="primary" (click)="showForm.set(true)">
          <mat-icon>add</mat-icon> Add Your First Goal
        </button>
      </div>
    }

    <!-- Add Goal Button -->
    @if (progress().length > 0 && !showForm()) {
      <div class="add-row">
        <button mat-raised-button color="primary" (click)="showForm.set(true)">
          <mat-icon>add</mat-icon> Add Goal
        </button>
      </div>
    }

    <!-- Add/Edit Form -->
    @if (showForm()) {
      <div class="form-card">
        <h3 class="form-title">{{ editingId() ? 'Edit Goal' : 'New Goal' }}</h3>
        <form [formGroup]="form" (ngSubmit)="saveGoal()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Metric</mat-label>
            <mat-select formControlName="metric" (selectionChange)="onMetricChange($event.value)">
              @for (m of metrics; track m.key) {
                <mat-option [value]="m.key">{{ m.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Condition</mat-label>
              <mat-select formControlName="operator">
                <mat-option value="gte">≥ Greater or equal</mat-option>
                <mat-option value="lte">≤ Less or equal</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Target Value</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="targetValue">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Timeframe</mat-label>
            <mat-select formControlName="timeframe">
              <mat-option value="daily">Daily</mat-option>
              <mat-option value="weekly">Weekly</mat-option>
              <mat-option value="monthly">Monthly</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="form-actions">
            <button mat-stroked-button type="button" (click)="cancelForm()">Cancel</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              {{ editingId() ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    }
    }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-banner {
      position: relative; margin: -24px -24px 24px; padding: 40px 24px 32px;
      background: var(--gradient-primary); border-radius: 0 0 var(--radius-lg) var(--radius-lg); overflow: hidden;
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

    .timeframe-row { display: flex; justify-content: center; margin-bottom: var(--spacing-sm); }
    ::ng-deep .timeframe-row .mat-button-toggle-group { border-radius: var(--radius-full); overflow: hidden; }

    /* Period Range Chips */
    .period-row { margin-bottom: var(--spacing-md); }
    .period-chips {
      display: flex; justify-content: center; gap: 6px; flex-wrap: wrap;
    }
    .period-chip {
      padding: 5px 14px; border-radius: var(--radius-full);
      border: 1px solid var(--color-border); background: var(--color-surface);
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      color: var(--color-text-muted); transition: all 0.2s;
    }
    .period-chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .period-chip.active {
      background: var(--color-primary); color: #fff; border-color: var(--color-primary);
    }
    .custom-range {
      display: flex; gap: 8px; align-items: center; justify-content: center;
      margin-top: 10px; flex-wrap: wrap;
    }
    .date-field { width: 140px; }
    ::ng-deep .date-field .mat-mdc-form-field-infix { padding-top: 8px !important; padding-bottom: 8px !important; min-height: 36px; }
    ::ng-deep .date-field .mat-mdc-text-field-wrapper { height: auto; }
    .apply-btn { height: 40px; }

    /* Summary Card */
    .summary-card {
      display: flex; align-items: center; gap: 16px;
      padding: 16px 20px; margin-bottom: var(--spacing-lg);
      background: var(--color-surface); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm); border: 1px solid var(--color-border);
    }
    .summary-card.all-achieved { border-color: var(--color-success); background: var(--color-stat-green-bg); }
    .ring-svg { width: 56px; height: 56px; transform: rotate(-90deg); }
    .ring-bg { fill: none; stroke: var(--color-border); stroke-width: 3; }
    .ring-fill { fill: none; stroke: var(--color-primary); stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.6s ease; }
    .ring-fill.ring-complete { stroke: var(--color-success); }
    .summary-ring { position: relative; width: 56px; height: 56px; flex-shrink: 0; }
    .ring-text {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
    }
    .summary-count { font-size: 1rem; font-weight: 700; display: block; }
    .summary-period { font-size: 0.8rem; color: var(--color-text-muted); text-transform: capitalize; }
    .summary-range { font-size: 0.78rem; font-weight: 600; color: var(--color-primary); display: block; margin-top: 2px; }

    /* Goals Grid */
    .goals-grid { display: grid; grid-template-columns: 1fr; gap: var(--spacing-sm); }
    .goal-card {
      padding: 16px; background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); border-left: 4px solid var(--color-border);
      transition: border-color 0.3s, box-shadow 0.2s;
    }
    .goal-card.achieved { border-left-color: var(--color-success); }
    .goal-card.missed { border-left-color: var(--color-danger); }
    .goal-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .goal-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .goal-metric { font-weight: 700; font-size: 0.9rem; flex: 1; }
    .goal-actions { display: flex; gap: 0; }
    .action-btn { width: 32px; height: 32px; }
    .action-btn mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-text-muted); }

    /* Streak Badge */
    .streak-badge {
      display: inline-flex; align-items: center; gap: 2px;
      padding: 2px 8px; border-radius: var(--radius-full);
      background: linear-gradient(135deg, #FF9500, #FF3B30);
      color: #fff; font-size: 0.72rem; font-weight: 700;
      white-space: nowrap;
    }
    .streak-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Progress Bar */
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
    .progress-numbers { display: flex; justify-content: space-between; font-size: 0.82rem; }
    .current-val { font-weight: 700; }
    .target-val { color: var(--color-text-muted); }

    /* Status */
    .goal-status { display: flex; align-items: center; gap: 6px; margin-top: 8px; }
    .status-icon { font-size: 16px; width: 16px; height: 16px; }
    .status-text { font-size: 0.78rem; font-weight: 600; }
    .status-pass { color: var(--color-success); }
    .status-pending { color: var(--color-text-muted); }

    /* History Panel */
    .history-panel {
      margin-top: 12px; padding-top: 12px;
      border-top: 1px solid var(--color-border);
    }
    .history-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .history-title { font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .streak-label {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 0.78rem; font-weight: 700; color: #FF9500;
    }
    .streak-label mat-icon { font-size: 16px; width: 16px; height: 16px; color: #FF9500; }
    .history-loading { text-align: center; color: var(--color-text-muted); font-size: 0.85rem; padding: 12px 0; }

    /* Achievement Bar */
    .achievement-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 12px; margin-bottom: 10px;
      background: var(--color-surface-secondary); border-radius: var(--radius-sm);
      font-size: 0.82rem;
    }
    .ach-label { font-weight: 600; }
    .ach-rate { font-weight: 700; color: var(--color-primary); }

    /* History Chart */
    .history-chart-wrap { margin-bottom: 12px; height: 180px; position: relative; }

    /* Snapshot List */
    .snapshot-list { display: flex; flex-direction: column; gap: 4px; }
    .snapshot-list.scrollable { max-height: 320px; overflow-y: auto; }
    .snapshot-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 10px; border-radius: var(--radius-sm);
      background: var(--color-surface-secondary); font-size: 0.82rem;
    }
    .snapshot-row.snap-achieved { background: var(--color-stat-green-bg, rgba(52, 199, 89, 0.08)); }
    .snapshot-row.snap-achieved .snap-value { color: var(--color-success); }
    .snapshot-row.snap-missed { background: rgba(255, 159, 10, 0.08); }
    .snapshot-row.snap-missed .snap-value { color: var(--color-warning); }
    .snapshot-row.snap-missed .snap-pct { color: var(--color-warning); }
    .snapshot-row.snap-loss { background: var(--color-stat-red-bg, rgba(255, 59, 48, 0.08)); }
    .snapshot-row.snap-loss .snap-value { color: var(--color-danger); }
    .snapshot-row.snap-loss .snap-pct { color: var(--color-danger); }
    .snap-period { flex: 1; font-weight: 600; }
    .snap-value { font-weight: 700; font-variant-numeric: tabular-nums; }
    .snap-pct { color: var(--color-text-muted); font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }
    .snap-icon { font-size: 16px; width: 16px; height: 16px; }
    .snap-pass { color: var(--color-success); }
    .snap-warn { color: var(--color-warning); }
    .snap-danger { color: var(--color-danger); }

    /* Empty State */
    .empty-state { text-align: center; padding: 48px 24px; }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 50%; background: var(--color-surface-secondary);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--color-text-muted); }
    .empty-state h3 { margin: 0 0 6px; font-size: 1.1rem; }
    .empty-state p { margin: 0 0 20px; color: var(--color-text-muted); font-size: 0.9rem; }

    .add-row { display: flex; justify-content: center; margin-top: var(--spacing-lg); }
    .add-row button mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    /* Form */
    .form-card {
      padding: 20px; margin-top: var(--spacing-md);
      background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
    }
    .form-title { margin: 0 0 16px; font-size: 1rem; font-weight: 700; }
    .full-width { width: 100%; }
    .form-row { display: flex; gap: 12px; }
    .half-width { flex: 1; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }

    @media (max-width: 599px) {
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
      .form-row { flex-direction: column; gap: 0; }
      .half-width { width: 100%; }
      .custom-range { flex-direction: column; align-items: stretch; }
      .date-field { width: 100%; }
    }
  `]
})
export class TradingGoalsComponent implements OnInit {
  private tradingService = inject(TradingService);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  Math = Math;

  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editingId = signal<number | null>(null);
  timeframe = signal('daily');
  progress = signal<GoalProgress[]>([]);
  expandedGoal = signal<number | null>(null);
  historyMap = signal<Map<number, GoalHistory>>(new Map());
  historyRange = signal('1M');
  customFrom = signal<Date | null>(null);
  customTo = signal<Date | null>(null);

  periodRanges = [
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
    { key: '6M', label: '6M' },
    { key: 'YTD', label: 'YTD' },
    { key: 'custom', label: 'Custom' },
  ];

  achievedCount = computed(() => this.progress().filter(p => p.achieved).length);
  overallPercent = computed(() => {
    const p = this.progress();
    if (p.length === 0) return 0;
    return Math.round(p.reduce((sum, x) => sum + Math.min(x.percentage, 100), 0) / p.length);
  });
  timeframeLabel = computed(() => {
    switch (this.timeframe()) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      default: return '';
    }
  });
  timeframeRange = computed(() => {
    const now = new Date();
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    switch (this.timeframe()) {
      case 'daily':
        return now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      case 'weekly': {
        const day = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${fmt(start)} – ${fmt(end)}`;
      }
      case 'monthly': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return `${fmt(start)} – ${fmt(end)}`;
      }
      default: return '';
    }
  });

  metrics: MetricDef[] = [
    { key: 'netPnl', label: 'Net P&L', icon: 'attach_money', unit: '$', defaultOp: 'gte', format: 'currency' },
    { key: 'totalTrades', label: 'Total Trades', icon: 'swap_horiz', unit: '', defaultOp: 'lte', format: 'number' },
    { key: 'winRate', label: 'Win Rate', icon: 'emoji_events', unit: '%', defaultOp: 'gte', format: 'percent' },
    { key: 'maxLoss', label: 'Max Single Loss', icon: 'trending_down', unit: '$', defaultOp: 'lte', format: 'currency' },
    { key: 'profitFactor', label: 'Profit Factor', icon: 'balance', unit: '', defaultOp: 'gte', format: 'number' },
    { key: 'maxConsecutiveLosses', label: 'Max Consecutive Losses', icon: 'warning', unit: '', defaultOp: 'lte', format: 'number' },
    { key: 'avgWinLossRatio', label: 'Avg Win/Loss Ratio', icon: 'compare_arrows', unit: '', defaultOp: 'gte', format: 'number' },
    { key: 'checklistCompliance', label: 'Checklist Compliance', icon: 'checklist', unit: '%', defaultOp: 'gte', format: 'percent' },
  ];

  form = this.fb.group({
    metric: ['netPnl', Validators.required],
    operator: ['gte', Validators.required],
    targetValue: [0 as number, [Validators.required, Validators.min(0)]],
    timeframe: ['daily', Validators.required]
  });

  ngOnInit(): void {
    this.loadProgress();
  }

  onTimeframeChange(value: string): void {
    this.timeframe.set(value);
    this.expandedGoal.set(null);
    this.historyMap.set(new Map());
    this.loadProgress();
  }

  onHistoryRangeChange(key: string): void {
    this.historyRange.set(key);
    if (key !== 'custom') {
      this.historyMap.set(new Map());
      this.reloadAllHistory();
    }
  }

  onCustomFromChange(value: Date | null): void {
    this.customFrom.set(value);
  }

  onCustomToChange(value: Date | null): void {
    this.customTo.set(value);
  }

  applyCustomRange(): void {
    if (!this.customFrom() || !this.customTo()) {
      this.notify.error('Please select both dates');
      return;
    }
    this.historyMap.set(new Map());
    this.reloadAllHistory();
  }

  getHistoryFromDate(): string | undefined {
    const now = new Date();
    switch (this.historyRange()) {
      case '1M': {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
      }
      case '3M': {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 3);
        return d.toISOString().split('T')[0];
      }
      case '6M': {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 6);
        return d.toISOString().split('T')[0];
      }
      case 'YTD':
        return `${now.getFullYear()}-01-01`;
      case 'custom': {
        const from = this.customFrom();
        return from ? from.toISOString().split('T')[0] : undefined;
      }
      default:
        return undefined;
    }
  }

  loadProgress(): void {
    this.loading.set(true);
    this.tradingService.getGoalProgress(this.timeframe()).subscribe({
      next: (data) => {
        this.progress.set(data);
        this.loading.set(false);
        this.reloadAllHistory();
        this.cdr.detectChanges();
      },
      error: () => {
        this.progress.set([]);
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  reloadAllHistory(): void {
    for (const p of this.progress()) {
      this.loadHistoryForGoal(p.goal.id);
    }
  }

  loadHistoryForGoal(goalId: number): void {
    const fromDate = this.getHistoryFromDate();
    this.tradingService.getGoalHistory(goalId, undefined, fromDate).subscribe({
      next: (history) => {
        const map = new Map(this.historyMap());
        map.set(goalId, history);
        this.historyMap.set(map);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  toggleHistory(goalId: number): void {
    if (this.expandedGoal() === goalId) {
      this.expandedGoal.set(null);
    } else {
      this.expandedGoal.set(goalId);
      if (!this.historyMap().has(goalId)) {
        this.loadHistoryForGoal(goalId);
      }
    }
  }

  onMetricChange(key: string): void {
    const def = this.metrics.find(m => m.key === key);
    if (def) this.form.patchValue({ operator: def.defaultOp });
  }

  saveGoal(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.value;
    const payload: Partial<TradingGoal> = {
      metric: val.metric!,
      operator: val.operator!,
      targetValue: val.targetValue!,
      timeframe: val.timeframe!,
      isActive: true
    };

    const obs = this.editingId()
      ? this.tradingService.updateGoal(this.editingId()!, payload)
      : this.tradingService.createGoal(payload);

    obs.subscribe({
      next: () => {
        this.notify.success(this.editingId() ? 'Goal updated' : 'Goal created');
        this.saving.set(false);
        this.cancelForm();
        this.historyMap.set(new Map());
        this.loadProgress();
      },
      error: () => {
        this.notify.error('Failed to save goal');
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  editGoal(goal: TradingGoal): void {
    this.editingId.set(goal.id);
    this.form.patchValue({
      metric: goal.metric,
      operator: goal.operator,
      targetValue: goal.targetValue,
      timeframe: goal.timeframe
    });
    this.showForm.set(true);
  }

  deleteGoal(goal: TradingGoal): void {
    this.tradingService.deleteGoal(goal.id).subscribe({
      next: () => {
        this.notify.success('Goal deleted');
        this.historyMap.set(new Map());
        this.loadProgress();
      },
      error: () => this.notify.error('Failed to delete goal')
    });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset({ metric: 'netPnl', operator: 'gte', targetValue: 0, timeframe: this.timeframe() });
  }

  getMetricLabel(key: string): string {
    return this.metrics.find(m => m.key === key)?.label || key;
  }

  getMetricIcon(key: string): string {
    return this.metrics.find(m => m.key === key)?.icon || 'flag';
  }

  formatValue(value: number, metric: string): string {
    const def = this.metrics.find(m => m.key === metric);
    if (!def) return value.toString();
    if (def.format === 'currency') return '$' + Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (def.format === 'percent') return value.toFixed(1) + '%';
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  getRangeLabel(): string {
    const r = this.historyRange();
    const found = this.periodRanges.find(p => p.key === r);
    return found ? found.label : r;
  }

  getAchievedCount(h: GoalHistory): number {
    return h.snapshots.filter(s => s.achieved).length;
  }

  getAchievedRate(h: GoalHistory): string {
    if (h.snapshots.length === 0) return '0';
    return Math.round(h.snapshots.filter(s => s.achieved).length / h.snapshots.length * 100).toString();
  }

  isLoss(s: GoalSnapshot, goal: TradingGoal): boolean {
    if (s.achieved) return false;
    const def = this.metrics.find(m => m.key === goal.metric);
    if (def?.format === 'currency') return s.currentValue < 0;
    if (goal.operator === 'lte') return s.currentValue > s.targetValue * 1.5;
    return s.currentValue === 0 && s.targetValue > 0;
  }

  getChartConfig(goal: TradingGoal, h: GoalHistory): ChartConfiguration<'bar'> {
    const def = this.metrics.find(m => m.key === goal.metric);
    const labels = h.snapshots.map(s => this.formatPeriodLabel(s.periodStart, goal.timeframe));
    const values = h.snapshots.map(s => s.currentValue);
    const colors = h.snapshots.map(s => {
      if (s.achieved) return 'rgba(52, 199, 89, 0.8)';
      if (this.isLoss(s, goal)) return 'rgba(255, 59, 48, 0.8)';
      return 'rgba(255, 159, 10, 0.8)';
    });
    const borderColors = h.snapshots.map(s => {
      if (s.achieved) return 'rgb(52, 199, 89)';
      if (this.isLoss(s, goal)) return 'rgb(255, 59, 48)';
      return 'rgb(255, 159, 10)';
    });

    const formatFn = (v: number) => this.formatValue(v, goal.metric);

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.7,
          },
          {
            data: h.snapshots.map(() => goal.targetValue),
            borderColor: 'rgba(128, 128, 128, 0.5)',
            borderWidth: 2,
            pointRadius: 0,
            label: 'Target',
            type: 'line',
            borderDash: [6, 4],
            fill: false,
          } as any
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 12 },
            bodyFont: { size: 13, weight: 'bold' },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              title: (items: any[]) => {
                const idx = items[0]?.dataIndex;
                if (idx == null) return '';
                return this.formatPeriodDate(h.snapshots[idx].periodStart, goal.timeframe);
              },
              label: (ctx: any) => {
                if (ctx.datasetIndex === 1) return `Target: ${formatFn(goal.targetValue)}`;
                const snap = h.snapshots[ctx.dataIndex];
                const status = snap.achieved ? 'Achieved' : this.isLoss(snap, goal) ? 'Loss' : 'Missed';
                return `${formatFn(snap.currentValue)} (${snap.percentage.toFixed(0)}%) — ${status}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              color: 'rgba(128, 128, 128, 0.7)',
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 15,
            }
          },
          y: {
            grid: { color: 'rgba(128, 128, 128, 0.1)' },
            ticks: {
              font: { size: 10 },
              color: 'rgba(128, 128, 128, 0.7)',
              callback: (v: any) => {
                if (def?.format === 'currency') return '$' + v;
                if (def?.format === 'percent') return v + '%';
                return v;
              }
            }
          }
        }
      }
    };
  }

  formatPeriodLabel(dateStr: string, timeframe: string): string {
    const d = new Date(dateStr);
    if (timeframe === 'daily') {
      const range = this.historyRange();
      if (range === '1M') return d.toLocaleDateString('en-US', { day: 'numeric' });
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (timeframe === 'weekly') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  formatPeriodDate(dateStr: string, timeframe: string): string {
    const d = new Date(dateStr);
    if (timeframe === 'daily') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (timeframe === 'weekly') {
      const end = new Date(d);
      end.setDate(end.getDate() + 6);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
}
