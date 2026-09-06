import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';
import { StrategyService } from '../../../core/services/strategy.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { BudgetService } from '../../../core/services/budget.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StrategyComparison, PayoffStrategy, MonthlyActionStep, DebtPayoffOrder } from '../../../core/models/strategy.model';
import { DebtFreeCountdown } from '../../../core/models/dashboard.model';
import { BudgetPlan } from '../../../core/models/budget.model';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-strategy-comparison',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatButtonToggleModule, MatSliderModule, MatTooltipModule,
    SkeletonLoaderComponent, PullToRefreshDirective,
    CurrencyPipe, DatePipe, DecimalPipe
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    @if (loading()) {
      <app-skeleton type="card" [count]="3"></app-skeleton>
    } @else if (comparison()) {

      <!-- ═══════ HERO ═══════ -->
      <div class="hero">
        <div class="hero-icon-wrap">
          <mat-icon>account_balance_wallet</mat-icon>
        </div>
        <h1 class="hero-title">Your Debt-Free Journey</h1>
        <div class="hero-debt">
          <span class="hero-amount">{{ comparison()!.totalDebt | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="hero-label">total remaining</span>
        </div>
        @if (activeStrategy()) {
          <div class="hero-date">
            <mat-icon>event_available</mat-icon>
            <span>Debt-free by <strong>{{ debtFreeDate() }}</strong></span>
            <span class="hero-months">({{ activeStrategy()!.monthsToPayoff }} months)</span>
          </div>
        }
        <p class="hero-encourage">You've got this. Here's your plan, step by step.</p>
      </div>

      <!-- ═══════ PAYCHECK GUIDE ═══════ -->
      @if (comparison()!.paychecks.length > 0 && budgetPlan()) {
        <div class="section-card paycheck-guide">
          <div class="section-icon-header">
            <div class="section-badge paycheck-badge">
              <mat-icon>account_balance</mat-icon>
            </div>
            <div>
              <h2 class="section-title">Your Paycheck Guide</h2>
              <p class="section-subtitle">Here's how your paychecks line up with your bills this month</p>
            </div>
          </div>
          <div class="paycheck-timeline">
            @for (pc of paycheckBreakdowns(); track pc.date) {
              <div class="pc-block">
                <div class="pc-header">
                  <div class="pc-date-badge">
                    <mat-icon>payments</mat-icon>
                    <span>{{ pc.date | date:'MMM d' }}</span>
                  </div>
                  <span class="pc-amount">{{ pc.amount | currency:'USD':'symbol':'1.0-0' }} paycheck</span>
                </div>
                @if (pc.expenses.length > 0) {
                  <div class="pc-expenses">
                    @for (exp of pc.expenses; track exp.name) {
                      <div class="pc-expense-row" [class.debt-payment]="exp.isDebtPayment">
                        <span class="pc-exp-name">
                          {{ exp.name }}
                          @if (exp.dueDay) {
                            <span class="due-tag">due {{ exp.dueDay | number }}{{ ordinal(exp.dueDay) }}</span>
                          }
                          @if (exp.isAutopay) {
                            <span class="autopay-tag">autopay</span>
                          }
                        </span>
                        <span class="pc-exp-amount">{{ exp.amount | currency:'USD':'symbol':'1.0-0' }}</span>
                      </div>
                    }
                    <div class="pc-leftover-row">
                      <span>Left over after this paycheck</span>
                      <span class="pc-leftover" [class.positive]="pc.leftover >= 0" [class.negative]="pc.leftover < 0">
                        {{ pc.leftover | currency:'USD':'symbol':'1.0-0' }}
                      </span>
                    </div>
                  </div>
                } @else {
                  <p class="pc-no-bills">No bills due before your next paycheck — nice!</p>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ═══════ THIS MONTH'S ACTION PLAN ═══════ -->
      @if (activeStrategy() && activeStrategy()!.monthlyPlan.length > 0) {
        <div class="section-card action-plan">
          <div class="section-icon-header">
            <div class="section-badge action-badge">
              <mat-icon>checklist</mat-icon>
            </div>
            <div>
              <h2 class="section-title">What To Pay This Month</h2>
              <p class="section-subtitle">Follow these steps in order — we'll tell you exactly where each dollar goes</p>
            </div>
          </div>
          <div class="action-steps">
            @for (step of groupedSteps(); track step.debtName + step.isMinimum; let i = $index) {
              <div class="step" [class.extra-step]="!step.isMinimum">
                <div class="step-number" [class.extra-number]="!step.isMinimum">{{ i + 1 }}</div>
                <div class="step-content">
                  <div class="step-main">
                    <span class="step-action">Pay <strong>{{ step.amount | currency }}</strong> to <strong>{{ step.debtName }}</strong></span>
                    @if (step.dueDay > 0) {
                      <span class="step-due">due {{ step.dueDay }}{{ ordinal(step.dueDay) }}</span>
                    }
                  </div>
                  <span class="step-why" [class.extra-why]="!step.isMinimum">
                    @if (!step.isMinimum) {
                      <mat-icon class="arrow-icon">north_east</mat-icon>
                    }
                    {{ step.explanation }}
                  </span>
                  @if (step.paycheckDate) {
                    <span class="step-paycheck">
                      <mat-icon>payments</mat-icon>
                      Use your {{ step.paycheckDate | date:'MMM d' }} paycheck
                    </span>
                  }
                </div>
              </div>
            }
          </div>
          <div class="action-total">
            <span>Total this month</span>
            <span class="total-amount">{{ activeStrategy()!.totalMonthlyPayment | currency:'USD':'symbol':'1.0-0' }}</span>
          </div>
        </div>
      }

      <!-- ═══════ QUICK WINS ═══════ -->
      @if (activeStrategy() && activeStrategy()!.quickWins.length > 0) {
        <div class="section-card quick-wins">
          <div class="section-icon-header">
            <div class="section-badge wins-badge">
              <mat-icon>emoji_events</mat-icon>
            </div>
            <div>
              <h2 class="section-title">Quick Wins</h2>
              <p class="section-subtitle">These debts are almost gone! Eliminating one frees up that payment for the next</p>
            </div>
          </div>
          <div class="wins-list">
            @for (win of activeStrategy()!.quickWins; track win.debtName) {
              <div class="win-item">
                <div class="win-target">
                  <mat-icon>track_changes</mat-icon>
                </div>
                <div class="win-info">
                  <span class="win-name">{{ win.debtName }}</span>
                  <span class="win-detail">{{ win.balance | currency }} left — gone in {{ win.monthsToPayoff }} {{ win.monthsToPayoff === 1 ? 'month' : 'months' }}!</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ═══════ YOUR STRATEGY ═══════ -->
      <div class="section-card strategy-section">
        <div class="section-icon-header">
          <div class="section-badge strategy-badge">
            <mat-icon>lightbulb</mat-icon>
          </div>
          <div>
            <h2 class="section-title">Your Strategy</h2>
            <p class="section-subtitle">{{ strategyExplanation() }}</p>
          </div>
        </div>

        <div class="strategy-toggle-wrap">
          <span class="toggle-label">Want to switch?</span>
          <mat-button-toggle-group [value]="chosenStrategy()" (change)="chooseStrategy($event.value)" class="strategy-toggle">
            <mat-button-toggle value="avalanche">
              <mat-icon>trending_up</mat-icon>
              <span>Avalanche</span>
            </mat-button-toggle>
            <mat-button-toggle value="snowball">
              <mat-icon>ac_unit</mat-icon>
              <span>Snowball</span>
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <div class="strategy-compare-mini">
          <div class="mini-stat">
            <span class="mini-label">Interest you'll pay</span>
            <div class="mini-values">
              <span class="mini-val" [class.active-val]="chosenStrategy() === 'avalanche'">
                {{ comparison()!.avalanche.totalInterest | currency:'USD':'symbol':'1.0-0' }}
                <span class="mini-tag">Avalanche</span>
              </span>
              <span class="mini-vs">vs</span>
              <span class="mini-val" [class.active-val]="chosenStrategy() === 'snowball'">
                {{ comparison()!.snowball.totalInterest | currency:'USD':'symbol':'1.0-0' }}
                <span class="mini-tag">Snowball</span>
              </span>
            </div>
          </div>
          <div class="mini-stat">
            <span class="mini-label">Months to freedom</span>
            <div class="mini-values">
              <span class="mini-val" [class.active-val]="chosenStrategy() === 'avalanche'">
                {{ comparison()!.avalanche.monthsToPayoff }}
                <span class="mini-tag">Avalanche</span>
              </span>
              <span class="mini-vs">vs</span>
              <span class="mini-val" [class.active-val]="chosenStrategy() === 'snowball'">
                {{ comparison()!.snowball.monthsToPayoff }}
                <span class="mini-tag">Snowball</span>
              </span>
            </div>
          </div>
        </div>

        @if (comparison()!.interestSaved > 0) {
          <div class="savings-callout">
            <mat-icon>savings</mat-icon>
            <span>Avalanche saves you <strong>{{ comparison()!.interestSaved | currency }}</strong>
            and <strong>{{ comparison()!.timeDifference }} months</strong></span>
          </div>
        }
      </div>

      <!-- ═══════ PAYOFF ROADMAP ═══════ -->
      @if (activeStrategy()) {
        <div class="section-card roadmap">
          <div class="section-icon-header">
            <div class="section-badge roadmap-badge">
              <mat-icon>route</mat-icon>
            </div>
            <div>
              <h2 class="section-title">Your Payoff Roadmap</h2>
              <p class="section-subtitle">Debts will be eliminated in this order</p>
            </div>
          </div>
          <div class="roadmap-timeline">
            @for (debt of activeStrategy()!.debtPayoffOrder; track debt.debtName; let i = $index) {
              <div class="road-item" [class.road-first]="i === 0">
                <div class="road-number">{{ i + 1 }}</div>
                <div class="road-connector"></div>
                <div class="road-content">
                  <div class="road-header">
                    <span class="road-name">{{ debt.debtName }}</span>
                    <span class="road-date">{{ payoffDate(debt.payoffMonth) }}</span>
                  </div>
                  <div class="road-bar-wrap">
                    <div class="road-bar">
                      <div class="road-bar-fill" [style.width.%]="progressPercent(debt)"></div>
                    </div>
                    <span class="road-pct">{{ progressPercent(debt) | number:'1.0-0' }}%</span>
                  </div>
                  <div class="road-meta">
                    <span>{{ debt.balance | currency:'USD':'symbol':'1.0-0' }} remaining</span>
                    <span class="road-dot"></span>
                    <span>{{ debt.minimumPayment | currency:'USD':'symbol':'1.0-0' }}/mo{{ i === 0 ? ' + extra' : '' }}</span>
                    @if (debt.dueDay > 0) {
                      <span class="road-dot"></span>
                      <span>Due {{ debt.dueDay }}{{ ordinal(debt.dueDay) }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ═══════ EXTRA PAYMENT SLIDER ═══════ -->
      <div class="section-card extra-section">
        <div class="section-icon-header">
          <div class="section-badge extra-badge">
            <mat-icon>rocket_launch</mat-icon>
          </div>
          <div>
            <h2 class="section-title">What If I Pay More?</h2>
            <p class="section-subtitle">Even a little extra each month makes a huge difference</p>
          </div>
        </div>
        <div class="slider-wrap">
          <div class="slider-label-row">
            <span class="slider-current">
              Extra: <strong>{{ extraPayment() | currency:'USD':'symbol':'1.0-0' }}</strong>/month
            </span>
          </div>
          <mat-slider min="0" max="500" step="25" discrete class="extra-slider" [displayWith]="sliderLabel">
            <input matSliderThumb [value]="extraPayment()" (valueChange)="onExtraSliderChange($event)">
          </mat-slider>
          <div class="slider-range">
            <span>$0</span>
            <span>$500</span>
          </div>
        </div>
        @if (baseComparison() && extraPayment() > 0) {
          <div class="impact-card">
            <div class="impact-row">
              <mat-icon>schedule</mat-icon>
              <span>
                Debt-free <strong>{{ monthsSaved() }} months sooner</strong>
              </span>
            </div>
            <div class="impact-row">
              <mat-icon>savings</mat-icon>
              <span>
                Save <strong>{{ interestSaved() | currency }}</strong> in interest
              </span>
            </div>
          </div>
        }
      </div>

      <!-- ═══════ MILESTONES ═══════ -->
      <div class="section-card milestones">
        <div class="section-icon-header">
          <div class="section-badge milestone-badge">
            <mat-icon>flag</mat-icon>
          </div>
          <div>
            <h2 class="section-title">Milestones</h2>
            <p class="section-subtitle">Celebrations along the way</p>
          </div>
        </div>
        <div class="milestone-list">
          @for (m of milestones(); track m.label) {
            <div class="milestone-item" [class.achieved]="m.achieved">
              <div class="milestone-check">
                <mat-icon>{{ m.achieved ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              </div>
              <div class="milestone-text">
                <span class="milestone-label">{{ m.label }}</span>
                @if (m.detail) {
                  <span class="milestone-detail">{{ m.detail }}</span>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- ═══════ BUDGET CONNECTION ═══════ -->
      <div class="section-card budget-link">
        <div class="budget-link-content">
          <mat-icon>sync</mat-icon>
          <div>
            <strong>Connected to your budget</strong>
            <p>This plan uses your actual income ({{ comparison()!.monthlyIncome | currency:'USD':'symbol':'1.0-0' }}/mo),
            paycheck schedule ({{ comparison()!.payFrequency | lowercase }}), and bill due dates.
            Changes to your budget will automatically update this plan.</p>
          </div>
        </div>
      </div>

    }
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* Hero */
    .hero {
      text-align: center; padding: 32px 20px 28px;
      background: var(--gradient-primary); border-radius: var(--radius-lg);
      color: #fff; margin-bottom: 20px;
    }
    .hero-icon-wrap {
      width: 52px; height: 52px; border-radius: var(--radius-full);
      background: rgba(255,255,255,0.2); display: inline-flex;
      align-items: center; justify-content: center; margin-bottom: 12px;
    }
    .hero-icon-wrap mat-icon { font-size: 28px; width: 28px; height: 28px; color: #fff; }
    .hero-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 16px; }
    .hero-amount { font-size: 2.2rem; font-weight: 900; display: block; }
    .hero-label { font-size: 0.8rem; font-weight: 500; opacity: 0.85; display: block; margin-top: 2px; }
    .hero-date {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 14px; font-size: 0.9rem; font-weight: 600;
      background: rgba(255,255,255,0.15); padding: 8px 16px;
      border-radius: var(--radius-full);
    }
    .hero-date mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .hero-months { opacity: 0.7; font-weight: 400; }
    .hero-encourage { margin: 14px 0 0; font-size: 0.85rem; opacity: 0.85; }

    /* Section cards */
    .section-card {
      background: var(--color-surface); border-radius: var(--radius-lg);
      border: 1px solid var(--color-border); padding: 20px;
      margin-bottom: 16px; box-shadow: var(--shadow-sm);
    }
    .section-icon-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
    .section-badge {
      width: 40px; height: 40px; min-width: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .section-badge mat-icon { font-size: 22px; width: 22px; height: 22px; color: #fff; }
    .action-badge { background: var(--color-primary); }
    .wins-badge { background: #ff9500; }
    .strategy-badge { background: var(--color-stat-purple); }
    .roadmap-badge { background: var(--color-stat-blue); }
    .extra-badge { background: var(--color-success); }
    .milestone-badge { background: #ff3b5c; }
    .paycheck-badge { background: #00897B; }
    .section-title { font-size: 1.05rem; font-weight: 700; margin: 0; }
    .section-subtitle { font-size: 0.8rem; color: var(--color-text-muted); margin: 3px 0 0; line-height: 1.4; }

    /* Paycheck Guide */
    .paycheck-timeline { display: flex; flex-direction: column; gap: 16px; }
    .pc-block {
      border: 1px solid var(--color-border); border-radius: var(--radius-md);
      overflow: hidden;
    }
    .pc-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; background: var(--color-surface-secondary);
      border-bottom: 1px solid var(--color-border);
    }
    .pc-date-badge {
      display: flex; align-items: center; gap: 6px;
      font-weight: 700; font-size: 0.9rem;
    }
    .pc-date-badge mat-icon { font-size: 18px; width: 18px; height: 18px; color: #00897B; }
    .pc-amount { font-size: 0.85rem; font-weight: 600; color: var(--color-success); }
    .pc-expenses { padding: 0; }
    .pc-expense-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 16px; border-bottom: 1px solid var(--color-border);
      font-size: 0.85rem;
    }
    .pc-expense-row:last-of-type { border-bottom: 1px solid var(--color-border); }
    .pc-expense-row.debt-payment { background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface)); }
    .pc-exp-name { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .due-tag {
      font-size: 0.65rem; font-weight: 700; padding: 1px 6px;
      background: var(--color-stat-amber-bg); color: var(--color-stat-amber);
      border-radius: var(--radius-full); text-transform: uppercase;
    }
    .autopay-tag {
      font-size: 0.65rem; font-weight: 700; padding: 1px 6px;
      background: var(--color-stat-green-bg); color: var(--color-success);
      border-radius: var(--radius-full); text-transform: uppercase;
    }
    .pc-exp-amount { font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .pc-leftover-row {
      display: flex; justify-content: space-between; padding: 10px 16px;
      font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted);
      background: var(--color-surface-secondary);
    }
    .pc-leftover { font-weight: 700; }
    .pc-no-bills { padding: 12px 16px; color: var(--color-text-muted); font-size: 0.85rem; margin: 0; }

    /* Action Plan */
    .action-steps { display: flex; flex-direction: column; gap: 0; }
    .step {
      display: flex; gap: 14px; padding: 14px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .step:last-child { border-bottom: none; }
    .step-number {
      width: 30px; height: 30px; min-width: 30px; border-radius: var(--radius-full);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: #fff;
      background: var(--color-primary); margin-top: 2px;
    }
    .extra-number { background: var(--color-success); }
    .extra-step { background: color-mix(in srgb, var(--color-success) 5%, var(--color-surface)); border-radius: var(--radius-sm); padding: 14px; margin: 4px -14px; }
    .step-content { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
    .step-main { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
    .step-action { font-size: 0.9rem; }
    .step-due {
      font-size: 0.65rem; font-weight: 700; padding: 1px 6px;
      background: var(--color-stat-amber-bg); color: var(--color-stat-amber);
      border-radius: var(--radius-full); text-transform: uppercase;
    }
    .step-why { font-size: 0.78rem; color: var(--color-text-muted); }
    .extra-why {
      color: var(--color-success); font-weight: 600;
      display: flex; align-items: center; gap: 4px;
    }
    .arrow-icon { font-size: 14px; width: 14px; height: 14px; }
    .step-paycheck {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.72rem; color: #00897B; font-weight: 600; margin-top: 2px;
    }
    .step-paycheck mat-icon { font-size: 13px; width: 13px; height: 13px; }

    .action-total {
      display: flex; justify-content: space-between; align-items: center;
      padding: 14px 0 0; margin-top: 4px;
      border-top: 2px solid var(--color-border);
      font-size: 0.9rem; font-weight: 600;
    }
    .total-amount { font-size: 1.15rem; font-weight: 800; color: var(--color-primary); }

    /* Quick Wins */
    .wins-list { display: flex; flex-direction: column; gap: 0; }
    .win-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid var(--color-border);
    }
    .win-item:last-child { border-bottom: none; }
    .win-target {
      width: 36px; height: 36px; min-width: 36px; border-radius: var(--radius-full);
      background: color-mix(in srgb, #ff9500 12%, var(--color-surface));
      display: flex; align-items: center; justify-content: center;
    }
    .win-target mat-icon { font-size: 20px; width: 20px; height: 20px; color: #ff9500; }
    .win-info { display: flex; flex-direction: column; gap: 2px; }
    .win-name { font-size: 0.9rem; font-weight: 600; }
    .win-detail { font-size: 0.8rem; color: var(--color-success); font-weight: 500; }

    /* Strategy section */
    .strategy-toggle-wrap {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 16px;
    }
    .toggle-label { font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500; }
    .strategy-toggle { border-radius: var(--radius-md); overflow: hidden; }
    ::ng-deep .strategy-toggle .mat-button-toggle-button {
      display: flex; align-items: center; gap: 4px; padding: 6px 14px;
      font-size: 0.8rem; font-weight: 600;
    }
    ::ng-deep .strategy-toggle .mat-button-toggle-button mat-icon {
      font-size: 16px; width: 16px; height: 16px;
    }

    .strategy-compare-mini { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }
    .mini-stat { flex: 1; min-width: 200px; }
    .mini-label { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .mini-values { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .mini-val {
      display: flex; flex-direction: column; gap: 2px;
      font-size: 1.1rem; font-weight: 700; opacity: 0.5;
      transition: opacity var(--transition-fast);
    }
    .mini-val.active-val { opacity: 1; }
    .mini-tag { font-size: 0.6rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }
    .mini-vs { font-size: 0.7rem; color: var(--color-text-muted); font-weight: 500; }

    .savings-callout {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; background: var(--color-stat-green-bg);
      border-radius: var(--radius-sm); font-size: 0.82rem; font-weight: 500;
      color: var(--color-success);
    }
    .savings-callout mat-icon { font-size: 20px; width: 20px; height: 20px; }

    /* Roadmap */
    .roadmap-timeline { display: flex; flex-direction: column; gap: 0; position: relative; }
    .road-item {
      display: flex; gap: 16px; position: relative;
      padding: 16px 0; padding-left: 48px;
    }
    .road-number {
      position: absolute; left: 0; top: 16px;
      width: 32px; height: 32px; border-radius: var(--radius-full);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700; color: #fff;
      background: var(--color-primary); z-index: 1;
    }
    .road-first .road-number { background: var(--color-success); }
    .road-connector {
      position: absolute; left: 15px; top: 48px; bottom: 0; width: 2px;
      background: var(--color-border);
    }
    .road-item:last-child .road-connector { display: none; }
    .road-content { flex: 1; min-width: 0; }
    .road-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .road-name { font-size: 0.95rem; font-weight: 700; }
    .road-date { font-size: 0.78rem; color: var(--color-text-muted); font-weight: 500; }
    .road-bar-wrap { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .road-bar {
      flex: 1; height: 8px; background: var(--color-border);
      border-radius: var(--radius-full); overflow: hidden;
    }
    .road-bar-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-full); transition: width 0.5s ease; }
    .road-first .road-bar-fill { background: var(--color-success); }
    .road-pct { font-size: 0.72rem; font-weight: 700; color: var(--color-text-muted); min-width: 32px; }
    .road-meta {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      font-size: 0.75rem; color: var(--color-text-muted);
    }
    .road-dot {
      width: 3px; height: 3px; border-radius: 50%;
      background: var(--color-text-muted); opacity: 0.4;
    }

    /* Extra Payment Slider */
    .slider-wrap { margin-bottom: 12px; }
    .slider-label-row { display: flex; justify-content: center; margin-bottom: 8px; }
    .slider-current { font-size: 1.1rem; font-weight: 700; color: var(--color-primary); }
    .extra-slider { width: 100%; }
    .slider-range { display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--color-text-muted); margin-top: -6px; }

    .impact-card {
      display: flex; flex-direction: column; gap: 10px;
      padding: 14px; background: var(--color-stat-green-bg);
      border-radius: var(--radius-md); border: 1px solid var(--color-success);
    }
    .impact-row {
      display: flex; align-items: center; gap: 10px;
      font-size: 0.9rem; font-weight: 500; color: var(--color-success);
    }
    .impact-row mat-icon { font-size: 20px; width: 20px; height: 20px; }

    /* Milestones */
    .milestone-list { display: flex; flex-direction: column; gap: 0; }
    .milestone-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 12px 0; border-bottom: 1px solid var(--color-border);
    }
    .milestone-item:last-child { border-bottom: none; }
    .milestone-check mat-icon {
      font-size: 24px; width: 24px; height: 24px;
      color: var(--color-border);
    }
    .milestone-item.achieved .milestone-check mat-icon { color: var(--color-success); }
    .milestone-text { display: flex; flex-direction: column; gap: 2px; }
    .milestone-label { font-size: 0.88rem; font-weight: 600; }
    .milestone-item:not(.achieved) .milestone-label { color: var(--color-text-muted); }
    .milestone-detail { font-size: 0.75rem; color: var(--color-text-muted); }

    /* Budget link */
    .budget-link { background: color-mix(in srgb, var(--color-primary) 5%, var(--color-surface)); }
    .budget-link-content {
      display: flex; gap: 12px; align-items: flex-start;
    }
    .budget-link-content mat-icon { font-size: 24px; width: 24px; height: 24px; color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
    .budget-link-content strong { font-size: 0.9rem; }
    .budget-link-content p { font-size: 0.78rem; color: var(--color-text-muted); margin: 4px 0 0; line-height: 1.5; }

    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }

    /* Mobile */
    @media (max-width: 599px) {
      .hero { padding: 24px 16px 22px; }
      .hero-amount { font-size: 1.8rem; }
      .hero-title { font-size: 1.1rem; }
      .hero-date { font-size: 0.8rem; padding: 6px 12px; flex-wrap: wrap; justify-content: center; }
      .section-card { padding: 16px; }
      .section-icon-header { gap: 10px; }
      .section-badge { width: 34px; height: 34px; min-width: 34px; border-radius: 10px; }
      .section-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .strategy-compare-mini { flex-direction: column; gap: 12px; }
      .mini-stat { min-width: 0; }
      .strategy-toggle-wrap { flex-direction: column; align-items: flex-start; gap: 8px; }
      .extra-step { margin: 4px -8px; padding: 12px 8px; }
      .step-main { flex-direction: column; gap: 4px; }
      .road-item { padding-left: 44px; }
      .pc-header { flex-direction: column; align-items: flex-start; gap: 4px; }
    }
  `]
})
export class StrategyComparisonComponent implements OnInit {
  private strategyService = inject(StrategyService);
  private dashboardService = inject(DashboardService);
  private budgetService = inject(BudgetService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  comparison = signal<StrategyComparison | null>(null);
  baseComparison = signal<StrategyComparison | null>(null);
  countdown = signal<DebtFreeCountdown | null>(null);
  budgetPlan = signal<BudgetPlan | null>(null);
  loading = signal(true);
  extraPayment = signal(0);
  chosenStrategy = signal<string>(localStorage.getItem('pulse_chosen_strategy') || 'avalanche');

  activeStrategy = computed(() => {
    const comp = this.comparison();
    if (!comp) return null;
    return this.chosenStrategy() === 'snowball' ? comp.snowball : comp.avalanche;
  });

  debtFreeDate = computed(() => {
    const s = this.activeStrategy();
    if (!s) return '';
    const d = new Date();
    d.setMonth(d.getMonth() + s.monthsToPayoff);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  groupedSteps = computed(() => {
    const s = this.activeStrategy();
    if (!s) return [];
    return s.monthlyPlan;
  });

  strategyExplanation = computed(() => {
    const comp = this.comparison();
    if (!comp) return '';
    if (comp.interestSaved > 100) {
      if (this.chosenStrategy() === 'avalanche') {
        return "You're targeting the highest-interest debt first because it's costing you the most money every month. Think of interest like a leak — we're plugging the biggest leak first.";
      } else {
        return "You're targeting the smallest balance first to feel the win of eliminating a debt quickly. Momentum matters! Once it's gone, that payment rolls into the next one.";
      }
    }
    return "The difference between strategies is small for your debts. Snowball gives you quick wins for motivation. Either way, you're winning by having a plan.";
  });

  paycheckBreakdowns = computed(() => {
    const bp = this.budgetPlan();
    if (!bp) return [];
    return bp.paycheckBreakdowns.map(pb => ({
      date: pb.payDate,
      amount: pb.grossPay,
      expenses: pb.expenses,
      leftover: pb.leftover
    }));
  });

  milestones = computed(() => {
    const comp = this.comparison();
    const cd = this.countdown();
    if (!comp) return [];

    const totalDebt = comp.totalDebt;
    let totalPaidOff = 0;
    let debtsEliminated = 0;
    let totalDebts = 0;

    if (cd) {
      totalDebts = cd.projections.length;
      for (const p of cd.projections) {
        if (p.progressPercent >= 100) {
          debtsEliminated++;
        }
        const original = p.progressPercent > 0 ? p.currentBalance / (1 - p.progressPercent / 100) : p.currentBalance;
        totalPaidOff += original - p.currentBalance;
      }
    }

    const activeDebts = cd ? cd.projections.filter(p => p.currentBalance > 0).length : totalDebts;
    const pctGone = totalDebt > 0 ? totalPaidOff / (totalPaidOff + totalDebt) : 0;

    const results = [
      { label: 'Started your journey', detail: "You're already ahead of most people", achieved: true },
      { label: 'First $1,000 paid off', detail: totalPaidOff >= 1000 ? `You've paid off ${this.fmt(totalPaidOff)}!` : `${this.fmt(1000 - totalPaidOff)} to go`, achieved: totalPaidOff >= 1000 },
      { label: 'First debt eliminated', detail: debtsEliminated > 0 ? `${debtsEliminated} down!` : null, achieved: debtsEliminated > 0 },
      { label: '25% of total debt gone', detail: pctGone >= 0.25 ? 'Quarter done!' : `${(pctGone * 100).toFixed(0)}% so far`, achieved: pctGone >= 0.25 },
      { label: 'Halfway there!', detail: pctGone >= 0.5 ? 'Over the hill!' : null, achieved: pctGone >= 0.5 },
      { label: 'Only one debt left', detail: activeDebts === 1 ? 'The home stretch!' : `${activeDebts} debts remaining`, achieved: activeDebts <= 1 && totalDebts > 1 },
      { label: 'DEBT FREE!', detail: null, achieved: totalDebt === 0 && totalDebts > 0 },
    ];
    return results;
  });

  monthsSaved = computed(() => {
    const base = this.baseComparison();
    const current = this.comparison();
    if (!base || !current) return 0;
    const baseMonths = this.chosenStrategy() === 'snowball' ? base.snowball.monthsToPayoff : base.avalanche.monthsToPayoff;
    const curMonths = this.chosenStrategy() === 'snowball' ? current.snowball.monthsToPayoff : current.avalanche.monthsToPayoff;
    return baseMonths - curMonths;
  });

  interestSaved = computed(() => {
    const base = this.baseComparison();
    const current = this.comparison();
    if (!base || !current) return 0;
    const baseInt = this.chosenStrategy() === 'snowball' ? base.snowball.totalInterest : base.avalanche.totalInterest;
    const curInt = this.chosenStrategy() === 'snowball' ? current.snowball.totalInterest : current.avalanche.totalInterest;
    return baseInt - curInt;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const now = new Date();

    forkJoin({
      comparison: this.strategyService.getComparison(this.extraPayment()),
      countdown: this.dashboardService.getCountdown().pipe(catchError(() => of(null as DebtFreeCountdown | null))),
      budget: this.budgetService.getPlan(now.getFullYear(), now.getMonth() + 1).pipe(catchError(() => of(null as BudgetPlan | null)))
    }).subscribe({
      next: ({ comparison, countdown, budget }) => {
        this.comparison.set(comparison);
        if (this.extraPayment() === 0) {
          this.baseComparison.set(comparison);
        }
        this.countdown.set(countdown);
        this.budgetPlan.set(budget);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  onExtraSliderChange(value: number): void {
    this.extraPayment.set(value);
    this.strategyService.getComparison(value).subscribe({
      next: (data) => {
        this.comparison.set(data);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  chooseStrategy(type: string): void {
    localStorage.setItem('pulse_chosen_strategy', type);
    this.chosenStrategy.set(type);
    const label = type === 'avalanche' ? 'Avalanche' : 'Snowball';
    this.notificationService.success(`${label} strategy selected!`);
  }

  sliderLabel(value: number): string {
    return `$${value}`;
  }

  ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  payoffDate(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  progressPercent(debt: DebtPayoffOrder): number {
    const cd = this.countdown();
    if (cd) {
      const proj = cd.projections.find(p => p.debtName === debt.debtName);
      if (proj) return Math.min(proj.progressPercent, 100);
    }
    return 0;
  }

  private fmt(n: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }
}
