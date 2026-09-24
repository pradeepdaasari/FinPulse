import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { TradingService } from '../../core/services/trading.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  TradingDayView, TradeEntryWithNotes, PreMarketNote, DailyReview,
  TradeNote, TradeNoteEmotion
} from '../../core/models/trading.model';
import { TradeNoteDialogComponent } from './trade-note-dialog.component';
import { TradeNotesPanelComponent } from './trade-notes-panel.component';
import { EmotionArcComponent, EmotionPoint } from './emotion-arc.component';

const EMOTION_DISPLAY: Record<TradeNoteEmotion, { icon: string; color: string }> = {
  confident: { icon: '💪', color: 'var(--color-success)' },
  calm: { icon: '😌', color: 'var(--color-stat-blue)' },
  neutral: { icon: '😐', color: 'var(--color-text-muted)' },
  anxious: { icon: '😰', color: 'var(--color-stat-amber)' },
  frustrated: { icon: '😤', color: 'var(--color-danger)' },
  fomo: { icon: '🫣', color: 'var(--color-stat-purple)' },
  relieved: { icon: '😮‍💨', color: 'var(--color-stat-green)' },
};

interface TimelineEvent {
  type: 'trade-open' | 'trade-close' | 'note';
  time: Date;
  trade?: TradeEntryWithNotes;
  note?: TradeNote;
  tradeInstrument?: string;
}

@Component({
  selector: 'app-day-view',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, DecimalPipe,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
    SkeletonLoaderComponent, TradeNotesPanelComponent, EmotionArcComponent
  ],
  template: `
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>today</mat-icon></div>
        <div class="banner-text">
          <h2>Trading Day</h2>
          <p class="banner-subtitle">Your complete day, one timeline.</p>
        </div>
      </div>
    </div>

    <!-- Date Navigator -->
    <div class="date-nav">
      <button mat-icon-button (click)="prevDay()"><mat-icon>chevron_left</mat-icon></button>
      <div class="date-display">
        <span class="date-label">{{ displayDate() }}</span>
        @if (isToday()) {
          <span class="today-badge">TODAY</span>
        }
      </div>
      <button mat-icon-button (click)="nextDay()" [disabled]="isToday()"><mat-icon>chevron_right</mat-icon></button>
      @if (!isToday()) {
        <button mat-stroked-button class="today-btn" (click)="goToToday()">Today</button>
      }
    </div>

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else if (dayData()) {

      <!-- Stats Bar -->
      @if (dayData()!.stats.totalTrades > 0) {
        <div class="stats-strip">
          <div class="stat-item">
            <span class="stat-num">{{ dayData()!.stats.totalTrades }}</span>
            <span class="stat-lbl">Trades</span>
          </div>
          @if (dayData()!.stats.openTrades > 0) {
            <div class="stat-item stat-amber">
              <span class="stat-num">{{ dayData()!.stats.openTrades }}</span>
              <span class="stat-lbl">Open</span>
            </div>
          }
          <div class="stat-item" [class.stat-green]="dayData()!.stats.totalNetPnl >= 0" [class.stat-red]="dayData()!.stats.totalNetPnl < 0">
            <span class="stat-num">{{ dayData()!.stats.totalNetPnl | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="stat-lbl">Net P&L</span>
          </div>
          @if (dayData()!.stats.closedTrades > 0) {
            <div class="stat-item">
              <span class="stat-num">{{ dayData()!.stats.winRate | number:'1.0-0' }}%</span>
              <span class="stat-lbl">Win Rate</span>
            </div>
          }
          @if (dayData()!.stats.totalFees > 0) {
            <div class="stat-item stat-muted">
              <span class="stat-num">{{ dayData()!.stats.totalFees | currency:'USD':'symbol':'1.0-0' }}</span>
              <span class="stat-lbl">Fees</span>
            </div>
          }
        </div>
      }

      <!-- Emotion Arc -->
      @if (emotionPoints().length > 1) {
        <app-emotion-arc [points]="emotionPoints()"></app-emotion-arc>
      }

      <!-- Premarket Section -->
      @if (!dayData()!.premarket) {
        <div class="cta-card" (click)="goToPremarket()">
          <div class="cta-icon-wrap"><mat-icon>wb_sunny</mat-icon></div>
          <div class="cta-text">
            <h3>Start Your Trading Day</h3>
            <p>Set your bias, levels, plan, and mental state before markets open.</p>
          </div>
          <mat-icon class="cta-arrow">arrow_forward</mat-icon>
        </div>
      } @else {
        <div class="section-card premarket-card" [class.collapsed]="premarketCollapsed()">
          <button class="section-header" (click)="premarketCollapsed.set(!premarketCollapsed())">
            <mat-icon class="section-icon">wb_sunny</mat-icon>
            <span class="section-title">Pre-Market Plan</span>
            <span class="time-label">{{ dayData()!.premarket!.createdAt | date:'h:mm a' }}</span>
            <div class="header-chips">
              <span class="bias-chip" [attr.data-bias]="dayData()!.premarket!.marketBias">{{ dayData()!.premarket!.marketBias | titlecase }}</span>
              <span class="mental-chip" [attr.data-state]="dayData()!.premarket!.mentalState">
                {{ dayData()!.premarket!.mentalState === 'green' ? '🟢' : dayData()!.premarket!.mentalState === 'yellow' ? '🟡' : '🔴' }}
              </span>
            </div>
            <mat-icon class="collapse-arrow">{{ premarketCollapsed() ? 'expand_more' : 'expand_less' }}</mat-icon>
          </button>
          @if (!premarketCollapsed()) {
            <div class="section-body">
              @if (dayData()!.premarket!.plan) {
                <div class="field-row">
                  <span class="field-label">Plan</span>
                  <p class="field-value" [innerHTML]="dayData()!.premarket!.plan"></p>
                </div>
              }
              @if (dayData()!.premarket!.keyLevels) {
                <div class="field-row">
                  <span class="field-label">Key Levels</span>
                  <p class="field-value" [innerHTML]="dayData()!.premarket!.keyLevels"></p>
                </div>
              }
              @if (dayData()!.premarket!.catalysts) {
                <div class="field-row">
                  <span class="field-label">Catalysts</span>
                  <p class="field-value" [innerHTML]="dayData()!.premarket!.catalysts"></p>
                </div>
              }
              <div class="field-row inline-fields">
                <div class="inline-field">
                  <span class="field-label">Max Trades</span>
                  <span class="field-value">{{ dayData()!.premarket!.maxTrades }}</span>
                </div>
                <div class="inline-field">
                  <span class="field-label">Max Loss</span>
                  <span class="field-value">{{ dayData()!.premarket!.maxLoss | currency }}</span>
                </div>
              </div>
              @if (dayData()!.premarket!.emotionalPlan) {
                <div class="field-row emotional-plan-row">
                  <span class="field-label">🧠 Emotional Plan</span>
                  <p class="field-value emotional-plan-text">{{ dayData()!.premarket!.emotionalPlan }}</p>
                </div>
              }
              @if (dayData()!.premarket!.mentalStateNotes) {
                <div class="field-row">
                  <span class="field-label">Mental Notes</span>
                  <p class="field-value">{{ dayData()!.premarket!.mentalStateNotes }}</p>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Timeline -->
      @if (timeline().length > 0) {
        <div class="timeline">
          @for (event of timeline(); track trackEvent($index, event)) {
            @if (event.type === 'trade-open') {
              <div class="tl-event tl-trade-open">
                <div class="tl-dot dot-open"></div>
                <div class="tl-content">
                  <div class="tl-header">
                    <span class="tl-time">{{ event.time | date:'h:mm a' }}</span>
                    <span class="open-badge">OPENED</span>
                    <span class="tl-instrument">{{ event.trade!.instrument }}</span>
                    @if (event.trade!.optionType) {
                      <span class="option-badge" [class.badge-call]="event.trade!.optionType === 'Call'" [class.badge-put]="event.trade!.optionType === 'Put'">{{ event.trade!.optionType }}</span>
                    }
                    <span class="dir-pill" [class.dir-long]="event.trade!.direction === 'long'" [class.dir-short]="event.trade!.direction === 'short'">
                      {{ event.trade!.direction | uppercase }}
                    </span>
                  </div>
                  <div class="tl-details">
                    {{ event.trade!.quantity }} contracts
                    @if (event.trade!.setupName) { · {{ event.trade!.setupName }} }
                    @if (event.trade!.strikePrice) { · {{ event.trade!.strikePrice }} strike }
                    @if (!event.trade!.checklistCompleted) {
                      <span class="no-checklist-warn">⚠ No checklist</span>
                    }
                  </div>
                  @if (event.trade!.status === 'Open') {
                    <div class="open-trade-actions">
                      <button mat-stroked-button class="add-note-inline-btn" (click)="addNoteToTrade(event.trade!)">
                        <mat-icon>add_comment</mat-icon> Add Note
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            @if (event.type === 'note') {
              <div class="tl-event tl-note">
                <div class="tl-dot dot-note" [style.border-color]="emotionColor(event.note!.emotion)"></div>
                <div class="tl-content note-bubble">
                  <div class="tl-header">
                    <span class="tl-time">{{ event.time | date:'h:mm a' }}</span>
                    @if (event.note!.emotion) {
                      <span class="note-emotion" [style.color]="emotionColor(event.note!.emotion)">
                        {{ emotionIcon(event.note!.emotion) }} {{ event.note!.emotion | titlecase }}
                      </span>
                    }
                    <span class="note-trade-ref">{{ event.tradeInstrument }}</span>
                  </div>
                  <p class="note-text" [innerHTML]="event.note!.note"></p>
                </div>
              </div>
            }

            @if (event.type === 'trade-close') {
              <div class="tl-event tl-trade-close">
                <div class="tl-dot dot-close" [class.dot-win]="(event.trade!.pnl ?? 0) > 0" [class.dot-loss]="(event.trade!.pnl ?? 0) < 0"></div>
                <div class="tl-content">
                  <div class="tl-header">
                    <span class="tl-time">{{ event.time | date:'h:mm a' }}</span>
                    <span class="closed-badge">CLOSED</span>
                    <span class="tl-instrument">{{ event.trade!.instrument }}</span>
                    <span class="pnl-value" [class.pnl-positive]="(event.trade!.netPnl ?? event.trade!.pnl ?? 0) >= 0" [class.pnl-negative]="(event.trade!.netPnl ?? event.trade!.pnl ?? 0) < 0">
                      {{ (event.trade!.netPnl ?? event.trade!.pnl ?? 0) >= 0 ? '+' : '' }}{{ (event.trade!.netPnl ?? event.trade!.pnl) | currency }}
                    </span>
                  </div>
                  @if (event.trade!.totalFees) {
                    <span class="fee-note">{{ event.trade!.totalFees | currency }} in fees</span>
                  }
                </div>
              </div>
            }
          }
        </div>
      } @else if (dayData()!.premarket && dayData()!.stats.totalTrades === 0) {
        <div class="ready-card" (click)="goToChecklist()">
          <mat-icon>checklist</mat-icon>
          <div>
            <h3>Ready to Trade</h3>
            <p>Pre-market is done. Run your checklist before entering.</p>
          </div>
          <mat-icon class="cta-arrow">arrow_forward</mat-icon>
        </div>
      }

      <!-- Review Section -->
      @if (dayData()!.stats.closedTrades > 0 || dayData()!.review) {
        <div class="section-card review-card">
          <div class="section-header review-header">
            <mat-icon class="section-icon">grading</mat-icon>
            <span class="section-title">Daily Review</span>
            @if (dayData()!.review?.grade) {
              <span class="grade-badge" [attr.data-grade]="dayData()!.review!.grade">{{ dayData()!.review!.grade }}</span>
            }
          </div>
          @if (!dayData()!.review) {
            <div class="review-cta" (click)="goToReview()">
              <p>You have closed trades today. Take a moment to review your day.</p>
              <button mat-flat-button color="primary">
                <mat-icon>rate_review</mat-icon> Review Your Day
              </button>
            </div>
          } @else {
            <div class="section-body review-body">
              <div class="review-checks">
                <span class="review-check" [class.check-yes]="dayData()!.review!.followedPlan" [class.check-no]="!dayData()!.review!.followedPlan">
                  <mat-icon>{{ dayData()!.review!.followedPlan ? 'check_circle' : 'cancel' }}</mat-icon> Followed plan
                </span>
                <span class="review-check" [class.check-yes]="dayData()!.review!.followedRules" [class.check-no]="!dayData()!.review!.followedRules">
                  <mat-icon>{{ dayData()!.review!.followedRules ? 'check_circle' : 'cancel' }}</mat-icon> Followed rules
                </span>
                <span class="review-check" [class.check-yes]="dayData()!.review!.stoppedAtLimit" [class.check-no]="!dayData()!.review!.stoppedAtLimit">
                  <mat-icon>{{ dayData()!.review!.stoppedAtLimit ? 'check_circle' : 'cancel' }}</mat-icon> Stopped at limit
                </span>
              </div>
              @if (dayData()!.review!.lessonsLearned) {
                <div class="field-row">
                  <span class="field-label">Lessons</span>
                  <p class="field-value">{{ dayData()!.review!.lessonsLearned }}</p>
                </div>
              }
              @if (dayData()!.review!.emotionalSummary) {
                <div class="field-row">
                  <span class="field-label">Emotional Summary</span>
                  <p class="field-value">{{ dayData()!.review!.emotionalSummary }}</p>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Empty Day -->
      @if (!dayData()!.premarket && dayData()!.stats.totalTrades === 0 && !dayData()!.review) {
        <div class="empty-state">
          <div class="empty-icon-wrap"><mat-icon>event_available</mat-icon></div>
          <h3>No trading activity</h3>
          <p>Start your day with a pre-market plan, or browse another date.</p>
          <button mat-raised-button color="primary" (click)="goToPremarket()">
            <mat-icon>wb_sunny</mat-icon> Start Pre-Market
          </button>
        </div>
      }
    }

    <!-- FAB for open trades -->
    @if (hasOpenTrades()) {
      <button class="fab" (click)="fabAddNote()" matTooltip="Add note to open trade">
        <mat-icon>add_comment</mat-icon>
      </button>
    }
  `,
  styles: [`
    :host { display: block; }

    .page-banner {
      position: relative;
      margin: -28px -36px var(--spacing-md);
      padding: 14px 24px;
      background: var(--gradient-primary);
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.07) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%);
    }
    .banner-content { position: relative; display: flex; align-items: center; gap: 12px; }
    .banner-icon {
      width: 42px; height: 42px; border-radius: var(--radius-md);
      background: rgba(255,255,255,0.18);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; border: 1px solid rgba(255,255,255,0.25);
    }
    .banner-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #fff; }
    h2 { margin: 0; color: #fff; font-size: 1rem; font-weight: var(--weight-bold); letter-spacing: -0.02em; }
    .banner-subtitle { color: rgba(255,255,255,0.7); font-size: var(--text-xs); margin: 1px 0 0; }

    /* Date Nav */
    .date-nav {
      display: flex; align-items: center; gap: var(--spacing-xs);
      margin-bottom: var(--spacing-md);
      background: var(--color-surface-solid); border-radius: var(--radius-md);
      padding: 8px 12px; border: 1px solid var(--color-border);
    }
    .date-display { flex: 1; text-align: center; }
    .date-label { font-weight: var(--weight-bold); font-size: var(--text-base); }
    .today-badge {
      display: inline-block; padding: 2px 8px; border-radius: var(--radius-full);
      font-size: 0.6rem; font-weight: var(--weight-bold); text-transform: uppercase;
      letter-spacing: 0.04em; background: var(--color-primary); color: #fff;
      margin-left: 8px; vertical-align: middle;
    }
    .today-btn { font-size: var(--text-xs) !important; border-radius: var(--radius-full) !important; }

    /* Stats Strip */
    .stats-strip {
      display: flex; gap: var(--spacing-sm); margin-bottom: var(--spacing-md);
      overflow-x: auto; -webkit-overflow-scrolling: touch;
      scrollbar-width: none; padding-bottom: 2px;
    }
    .stats-strip::-webkit-scrollbar { display: none; }
    .stat-item {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 16px; border-radius: var(--radius-sm);
      background: var(--color-surface-solid); border: 1px solid var(--color-border);
      min-width: 80px; flex: 1;
    }
    .stat-num { font-size: 1.1rem; font-weight: var(--weight-bold); font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
    .stat-lbl { font-size: 0.6rem; font-weight: var(--weight-semibold); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: var(--tracking-wide); margin-top: 2px; }
    .stat-green .stat-num { color: var(--color-success); }
    .stat-red .stat-num { color: var(--color-danger); }
    .stat-amber .stat-num { color: var(--color-stat-amber); }
    .stat-muted .stat-num { color: var(--color-text-secondary); }

    /* CTA Card */
    .cta-card, .ready-card {
      display: flex; align-items: center; gap: 14px;
      padding: 18px 20px; border-radius: var(--radius-md);
      background: var(--color-surface-solid); border: 1px solid var(--color-border);
      cursor: pointer; transition: all var(--transition-fast);
      margin-bottom: var(--spacing-md);
    }
    .cta-card:hover, .ready-card:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
    .cta-icon-wrap {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--color-stat-amber) 12%, transparent);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .cta-icon-wrap mat-icon { font-size: 24px; width: 24px; height: 24px; color: var(--color-stat-amber); }
    .cta-text h3 { margin: 0 0 2px; font-size: var(--text-sm); font-weight: var(--weight-bold); }
    .cta-text p { margin: 0; font-size: var(--text-xs); color: var(--color-text-secondary); line-height: var(--leading-relaxed); }
    .cta-arrow { color: var(--color-text-muted) !important; margin-left: auto; }
    .ready-card mat-icon:first-child { font-size: 28px; width: 28px; height: 28px; color: var(--color-success); flex-shrink: 0; }
    .ready-card h3 { margin: 0 0 2px; font-size: var(--text-sm); font-weight: var(--weight-bold); }
    .ready-card p { margin: 0; font-size: var(--text-xs); color: var(--color-text-secondary); }

    /* Section Card */
    .section-card {
      background: var(--color-surface-solid); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); margin-bottom: var(--spacing-md);
      overflow: hidden;
    }
    .section-header {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; width: 100%;
      background: none; border: none; cursor: pointer;
      font: inherit; text-align: left; color: inherit;
    }
    .section-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-stat-amber); }
    .section-title { font-size: var(--text-sm); font-weight: var(--weight-bold); flex: 1; }
    .time-label { font-size: var(--text-xs); color: var(--color-text-muted); }
    .collapse-arrow { color: var(--color-text-muted); transition: transform 0.2s; }
    .header-chips { display: flex; gap: 6px; }
    .bias-chip {
      padding: 2px 8px; border-radius: var(--radius-full);
      font-size: 0.625rem; font-weight: var(--weight-semibold);
    }
    .bias-chip[data-bias="bullish"] { background: var(--color-success-bg); color: var(--color-success-text); }
    .bias-chip[data-bias="bearish"] { background: var(--color-stat-red-bg); color: var(--color-stat-red); }
    .bias-chip[data-bias="neutral"] { background: var(--color-surface-hover); color: var(--color-text-secondary); }
    .bias-chip[data-bias="no-trade"] { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }

    .section-body { padding: 0 16px 16px; }
    .field-row { margin-bottom: 12px; }
    .field-label {
      display: block; font-size: 0.625rem; font-weight: var(--weight-semibold);
      color: var(--color-text-muted); text-transform: uppercase;
      letter-spacing: var(--tracking-wide); margin-bottom: 3px;
    }
    .field-value { margin: 0; font-size: var(--text-sm); line-height: var(--leading-relaxed); color: var(--color-text-primary); }
    .inline-fields { display: flex; gap: var(--spacing-lg); }
    .inline-field { flex: 1; }

    .emotional-plan-row {
      background: color-mix(in srgb, var(--color-stat-purple) 5%, transparent);
      border-radius: var(--radius-sm); padding: 10px 12px !important;
      border-left: 3px solid var(--color-stat-purple);
    }
    .emotional-plan-text { white-space: pre-wrap; }

    /* Timeline */
    .timeline {
      position: relative; margin-bottom: var(--spacing-md);
      padding-left: 24px;
    }
    .timeline::before {
      content: ''; position: absolute; left: 9px; top: 8px; bottom: 8px;
      width: 2px; background: var(--color-border); border-radius: 1px;
    }
    .tl-event {
      position: relative; margin-bottom: 12px;
    }
    .tl-dot {
      position: absolute; left: -24px; top: 6px;
      width: 14px; height: 14px; border-radius: 50%;
      border: 2.5px solid var(--color-border); background: var(--color-surface-solid);
      z-index: 1;
    }
    .dot-open { border-color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .dot-close { border-color: var(--color-text-muted); }
    .dot-close.dot-win { border-color: var(--color-success); background: var(--color-success-bg); }
    .dot-close.dot-loss { border-color: var(--color-danger); background: color-mix(in srgb, var(--color-danger) 10%, transparent); }
    .dot-note { border-color: var(--color-stat-blue); }

    .tl-content {
      padding: 10px 14px;
      background: var(--color-surface-solid); border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }
    .note-bubble {
      background: color-mix(in srgb, var(--color-stat-blue) 4%, var(--color-surface-solid));
      border-color: color-mix(in srgb, var(--color-stat-blue) 20%, var(--color-border));
    }
    .tl-header {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    }
    .tl-time { font-size: 0.65rem; color: var(--color-text-muted); font-weight: var(--weight-medium); font-variant-numeric: tabular-nums; }
    .tl-instrument { font-weight: var(--weight-bold); font-size: var(--text-sm); }
    .tl-details { font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 4px; }

    .open-badge, .closed-badge {
      padding: 1px 7px; border-radius: var(--radius-full);
      font-size: 0.55rem; font-weight: var(--weight-bold); text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .open-badge { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }
    .closed-badge { background: var(--color-surface-hover); color: var(--color-text-secondary); }
    .option-badge {
      padding: 1px 6px; border-radius: var(--radius-full);
      font-size: 0.55rem; font-weight: var(--weight-semibold);
    }
    .badge-call { background: var(--color-info-bg); color: var(--color-info-text); }
    .badge-put { background: rgba(156,39,176,0.08); color: #7b1fa2; }
    .dir-pill {
      padding: 1px 7px; border-radius: var(--radius-full);
      font-size: 0.55rem; font-weight: var(--weight-bold);
    }
    .dir-long { background: var(--color-success-bg); color: var(--color-success-text); }
    .dir-short { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }

    .no-checklist-warn { color: var(--color-stat-amber); font-weight: var(--weight-semibold); margin-left: 4px; }

    .pnl-value { font-weight: var(--weight-bold); font-variant-numeric: tabular-nums; font-size: var(--text-sm); }
    .pnl-positive { color: var(--color-success); }
    .pnl-negative { color: var(--color-danger); }
    .fee-note { font-size: var(--text-xs); color: var(--color-text-muted); margin-top: 2px; display: block; }

    .note-emotion { font-size: var(--text-xs); font-weight: var(--weight-semibold); }
    .note-trade-ref { font-size: var(--text-xs); color: var(--color-text-muted); margin-left: auto; }
    .note-text { margin: 6px 0 0; font-size: var(--text-sm); line-height: var(--leading-relaxed); word-break: break-word; }
    .note-text ::ng-deep p { margin: 0; }

    .open-trade-actions { margin-top: 8px; }
    .add-note-inline-btn {
      font-size: var(--text-xs) !important; border-radius: var(--radius-full) !important;
      color: var(--color-primary) !important; border-color: var(--color-border) !important;
    }
    .add-note-inline-btn mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 3px; }

    /* Review */
    .review-header { cursor: default; }
    .review-card .section-icon { color: var(--color-stat-purple); }
    .grade-badge {
      width: 28px; height: 28px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      font-weight: var(--weight-bold); font-size: var(--text-sm);
    }
    .grade-badge[data-grade="A"] { background: var(--color-success-bg); color: var(--color-success-text); }
    .grade-badge[data-grade="B"] { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .grade-badge[data-grade="C"] { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }
    .grade-badge[data-grade="D"], .grade-badge[data-grade="F"] { background: var(--color-stat-red-bg); color: var(--color-stat-red); }

    .review-cta {
      padding: 16px; text-align: center;
    }
    .review-cta p { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 12px; }
    .review-cta button mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }
    .review-body { padding-top: 4px; }
    .review-checks { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .review-check {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: var(--text-xs); font-weight: var(--weight-semibold);
    }
    .review-check mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .check-yes { color: var(--color-success); }
    .check-no { color: var(--color-danger); }

    /* Empty State */
    .empty-state { text-align: center; padding: var(--spacing-3xl) var(--spacing-lg); }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-lg);
      background: var(--color-stat-amber-bg); display: flex;
      align-items: center; justify-content: center; margin: 0 auto var(--spacing-md);
    }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--color-stat-amber); }
    .empty-state h3 { margin: 0 0 var(--spacing-sm); font-weight: var(--weight-bold); }
    .empty-state p { color: var(--color-text-secondary); margin: 0 0 var(--spacing-lg); font-size: var(--text-sm); line-height: var(--leading-relaxed); }

    /* FAB */
    .fab {
      position: fixed; bottom: 80px; right: 24px;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      border: none; cursor: pointer; z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .fab:hover { transform: scale(1.08); box-shadow: 0 6px 16px rgba(0,0,0,0.25); }
    .fab mat-icon { font-size: 24px; width: 24px; height: 24px; }

    /* Responsive */
    @media (max-width: 599px) {
      .page-banner { margin: -14px -14px 16px; padding: 10px 16px; border-radius: 0 0 var(--radius-lg) var(--radius-lg); }
      .stats-strip { gap: 6px; }
      .stat-item { padding: 8px 10px; min-width: 64px; }
      .stat-num { font-size: 0.95rem; }
      .inline-fields { flex-direction: column; gap: var(--spacing-sm); }
      .fab { bottom: 72px; right: 16px; width: 50px; height: 50px; }
    }
  `]
})
export class DayViewComponent implements OnInit {
  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  dayData = signal<TradingDayView | null>(null);
  currentDate = signal<string>('');
  premarketCollapsed = signal(false);

  displayDate = computed(() => {
    const d = this.currentDate();
    if (!d) return '';
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  });

  isToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.currentDate() === today;
  });

  hasOpenTrades = computed(() => {
    return (this.dayData()?.stats.openTrades ?? 0) > 0;
  });

  emotionPoints = computed((): EmotionPoint[] => {
    const data = this.dayData();
    if (!data) return [];
    const points: EmotionPoint[] = [];

    for (const trade of data.trades) {
      if (trade.emotionAtEntry) {
        points.push({
          time: trade.date || trade.createdAt!,
          emotion: trade.emotionAtEntry.toLowerCase(),
          context: `Entry: ${trade.instrument}`
        });
      }
      if (trade.tradeNotes) {
        for (const note of trade.tradeNotes) {
          if (note.emotion) {
            points.push({
              time: note.createdAt,
              emotion: note.emotion,
              context: `${trade.instrument}: ${note.note.slice(0, 40)}${note.note.length > 40 ? '…' : ''}`
            });
          }
        }
      }
    }

    points.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    return points;
  });

  timeline = computed(() => {
    const data = this.dayData();
    if (!data) return [];
    const events: TimelineEvent[] = [];

    for (const trade of data.trades) {
      events.push({
        type: 'trade-open',
        time: new Date(trade.date || trade.createdAt!),
        trade,
      });

      if (trade.tradeNotes) {
        for (const note of trade.tradeNotes) {
          events.push({
            type: 'note',
            time: new Date(note.createdAt),
            note,
            tradeInstrument: trade.instrument,
          });
        }
      }

      if (trade.status === 'Closed' && trade.closedDate) {
        events.push({
          type: 'trade-close',
          time: new Date(trade.closedDate),
          trade,
        });
      }
    }

    events.sort((a, b) => a.time.getTime() - b.time.getTime());
    return events;
  });

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const date = params['date'];
      if (date) {
        this.currentDate.set(date);
        this.loadDay(date);
      } else {
        const today = new Date().toISOString().slice(0, 10);
        this.currentDate.set(today);
        this.loadToday();
      }
    });
  }

  loadToday(): void {
    this.loading.set(true);
    this.tradingService.getTodayDayView().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.dayData.set(data); this.currentDate.set(data.date); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.notify.error('Failed to load day view'); this.cdr.detectChanges(); }
    });
  }

  loadDay(date: string): void {
    this.loading.set(true);
    this.tradingService.getDayView(date).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.dayData.set(data); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.notify.error('Failed to load day view'); this.cdr.detectChanges(); }
    });
  }

  prevDay(): void {
    const d = new Date(this.currentDate() + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    const newDate = d.toISOString().slice(0, 10);
    this.router.navigate(['/trading/day', newDate]);
  }

  nextDay(): void {
    const d = new Date(this.currentDate() + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    const newDate = d.toISOString().slice(0, 10);
    this.router.navigate(['/trading/day', newDate]);
  }

  goToToday(): void {
    this.router.navigate(['/trading/day']);
  }

  goToPremarket(): void {
    this.router.navigate(['/trading/premarket']);
  }

  goToChecklist(): void {
    this.router.navigate(['/trading/checklist']);
  }

  goToReview(): void {
    this.router.navigate(['/trading/review']);
  }

  trackEvent(index: number, event: TimelineEvent): string {
    if (event.type === 'note') return `note-${event.note!.id}`;
    return `${event.type}-${event.trade!.id}`;
  }

  emotionColor(emotion?: string): string {
    if (!emotion) return 'var(--color-text-muted)';
    return EMOTION_DISPLAY[emotion as TradeNoteEmotion]?.color ?? 'var(--color-text-muted)';
  }

  emotionIcon(emotion?: string): string {
    if (!emotion) return '';
    return EMOTION_DISPLAY[emotion as TradeNoteEmotion]?.icon ?? '';
  }

  addNoteToTrade(trade: TradeEntryWithNotes): void {
    const ref = this.dialog.open(TradeNoteDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: { tradeId: trade.id, instrument: trade.instrument }
    });
    ref.afterClosed().subscribe(r => {
      if (r) this.loadDay(this.currentDate());
    });
  }

  fabAddNote(): void {
    const openTrades = this.dayData()?.trades.filter(t => t.status === 'Open') ?? [];
    if (openTrades.length === 1) {
      this.addNoteToTrade(openTrades[0]);
    } else if (openTrades.length > 1) {
      this.addNoteToTrade(openTrades[0]);
    }
  }
}
