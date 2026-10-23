import { Component, signal, input, output, computed, effect, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TradeNoteDialogComponent } from './trade-note-dialog.component';
import { TradeEntryDialogComponent, TradeEntryDialogData } from './trade-entry-dialog.component';
import { TradingService } from '../../core/services/trading.service';
import { NotificationService } from '../../core/services/notification.service';
import { TradingSetupSummary } from '../../core/models/trading.model';

@Component({
  selector: 'app-flow-session',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <!-- Discipline Traffic Light -->
    @if (disciplineStatus(); as ds) {
      <div class="fs-traffic" [class]="'fs-traffic-' + ds.trafficLight">
        <mat-icon>{{ ds.trafficLight === 'green' ? 'check_circle' : ds.trafficLight === 'yellow' ? 'warning' : 'block' }}</mat-icon>
        <div class="fs-traffic-text">
          <strong>{{ ds.trafficLight === 'green' ? 'All clear — trade your plan' : ds.trafficLight === 'yellow' ? 'Caution — approaching limits' : 'STOP — limit reached' }}</strong>
          @if (ds.violations.length > 0) {
            <ul class="fs-violations">
              @for (v of ds.violations; track v) { <li>{{ v }}</li> }
            </ul>
          }
        </div>
      </div>
    }

    @if (disciplineStatus()?.recentLoss) {
      <div class="fs-cooldown">
        <mat-icon>hourglass_top</mat-icon>
        <span>Cooldown active — you just closed <strong>{{ disciplineStatus()?.lastLossInstrument }}</strong> for a loss. Breathe.</span>
      </div>
    }

    <!-- Stats Strip -->
    @if (stats()?.totalTrades > 0) {
      <div class="fs-stats">
        <div class="fs-stat">
          <span class="fs-stat-value">{{ stats().totalTrades }}</span>
          <span class="fs-stat-label">Trades</span>
        </div>
        @if (stats().openTrades > 0) {
          <div class="fs-stat fs-stat-amber">
            <span class="fs-stat-value">{{ stats().openTrades }}</span>
            <span class="fs-stat-label">Open</span>
          </div>
        }
        <div class="fs-stat" [class.fs-stat-green]="stats().totalNetPnl > 0" [class.fs-stat-red]="stats().totalNetPnl < 0">
          <span class="fs-stat-value">{{ stats().totalNetPnl | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="fs-stat-label">Net P&L</span>
        </div>
        @if (stats().closedTrades > 0) {
          <div class="fs-stat">
            <span class="fs-stat-value">{{ stats().winRate }}%</span>
            <span class="fs-stat-label">Win Rate</span>
          </div>
        }
      </div>
    }

    <!-- Plan Reference Card -->
    @if (premarket(); as pm) {
      <div class="fs-plan-card">
        <div class="fs-plan-header" (click)="planCollapsed.set(!planCollapsed())">
          <mat-icon>push_pin</mat-icon>
          <span class="fs-plan-title">Your Plan</span>
          <span class="fp-bias-badge" [class]="'bias-' + pm.marketBias">{{ pm.marketBias }}</span>
          <mat-icon class="fs-chevron" [class.rotated]="!planCollapsed()">expand_more</mat-icon>
        </div>
        @if (!planCollapsed()) {
          <div class="fs-plan-body">
            @if (pm.keyLevels) {
              <div class="fs-plan-field">
                <span class="fs-plan-label">Key Levels</span>
                <div class="fs-plan-content" [innerHTML]="pm.keyLevels"></div>
              </div>
            }
            @if (pm.plan) {
              <div class="fs-plan-field">
                <span class="fs-plan-label">Plan</span>
                <div class="fs-plan-content" [innerHTML]="pm.plan"></div>
              </div>
            }
            @if (pm.emotionalPlan) {
              <div class="fs-plan-field">
                <span class="fs-plan-label">Emotional Plan</span>
                <div class="fs-plan-content">{{ pm.emotionalPlan }}</div>
              </div>
            }
          </div>
        }
      </div>
    }

    <!-- Trade Timeline -->
    @for (g of tradeGroups(); track g.trade.id; let idx = $index) {
      <div class="fs-trade-group fs-trade-clickable" [class.fs-group-carry]="g.isCarryOver"
           [class.fs-group-open]="g.trade.status === 'Open'"
           [class.fs-group-closed]="g.trade.status !== 'Open' && !g.isCarryOver"
           (click)="editTrade(g.trade)">
        <div class="fs-trade-top-row">
          <div class="fs-trade-number">Trade #{{ idx + 1 }}</div>
          <span class="fs-edit-label"><mat-icon>edit</mat-icon> Edit</span>
        </div>
        <div class="fs-trade-header">
          <span class="fs-trade-badge" [class.fs-badge-open]="g.trade.status === 'Open'"
                [class.fs-badge-carry]="g.isCarryOver">
            @if (g.isCarryOver) {
              CARRY · {{ g.trade.date | date:'MMM d' }}
            } @else {
              {{ g.trade.status === 'Open' ? 'OPEN' : 'CLOSED' }}
            }
          </span>
          <span class="fs-instrument">{{ g.trade.instrument }}</span>
          @if (g.trade.optionType || g.trade.spreadType) {
            <span class="fs-option-tag">@if (g.trade.spreadType && g.trade.spreadType !== 'Single') {{{ g.trade.spreadType }} }@if (g.trade.optionType) {{{ g.trade.optionType }} }{{ g.trade.strikePrice }}@if (g.trade.strikePrice2) {/{{ g.trade.strikePrice2 }}}@if (g.trade.strikePrice3) {/{{ g.trade.strikePrice3 }}}@if (g.trade.strikePrice4) {/{{ g.trade.strikePrice4 }}}</span>
          }
          <span class="fs-direction" [class.fs-long]="g.trade.direction === 'long'" [class.fs-short]="g.trade.direction !== 'long'">
            {{ g.trade.direction }}
          </span>
          <span class="fs-qty">x{{ g.trade.quantity }}</span>
          @if (!g.trade.checklistCompleted) {
            <span class="fs-no-checklist">⚠ No checklist</span>
          }
        </div>

        <!-- Entry details -->
        <div class="fs-trade-meta">
          @if (g.trade.entryTime) { <span class="fs-time">{{ g.trade.entryTime }}</span> }
          @if (g.trade.setupName) { <span class="fs-setup-name">{{ g.trade.setupName }}</span> }
          @if (g.trade.emotionAtEntry) { <span class="fs-emotion-tag">{{ g.trade.emotionAtEntry }}</span> }
        </div>

        <div class="fs-trade-details">
          @if (g.trade.entryPremium) {
            <span class="fs-detail">Entry: {{ g.trade.entryPremium | currency:'USD':'symbol':'1.2-2' }}</span>
          } @else if (g.trade.entryPrice) {
            <span class="fs-detail">Entry: {{ g.trade.entryPrice }}</span>
          }
          @if (g.trade.expirationDate) {
            <span class="fs-detail">Exp: {{ g.trade.expirationDate | date:'MMM d' }}</span>
          }
          @if (g.trade.plannedRisk) {
            <span class="fs-detail">Risk: {{ g.trade.plannedRisk | currency:'USD':'symbol':'1.0-0' }}</span>
          }
        </div>

        @if (g.trade.tradeThesis) {
          <div class="fs-trade-thesis">"{{ g.trade.tradeThesis }}"</div>
        }

        @if (g.trade.stopLoss || g.trade.profitTarget) {
          <div class="fs-risk-tags">
            @if (g.trade.stopLoss) { <span class="fs-risk-tag fs-risk-stop">Stop: {{ g.trade.stopLoss }}</span> }
            @if (g.trade.profitTarget) { <span class="fs-risk-tag fs-risk-target">Target: {{ g.trade.profitTarget }}</span> }
          </div>
        }

        <!-- Checklist -->
        @if (g.trade.checklistResponses?.length > 0) {
          <div class="fs-checklist" (click)="toggleChecklist(g.trade.id); $event.stopPropagation()">
            <div class="fs-checklist-header">
              <mat-icon class="fs-checklist-icon" [class.fs-checklist-pass]="g.trade.checklistCompleted">
                {{ g.trade.checklistCompleted ? 'verified' : 'warning' }}
              </mat-icon>
              <span class="fs-checklist-label">
                {{ g.checkedCount }}/{{ g.trade.checklistResponses.length }} checks passed
              </span>
              <mat-icon class="fs-chevron-sm" [class.rotated]="expandedChecklists().has(g.trade.id)">expand_more</mat-icon>
            </div>
            @if (expandedChecklists().has(g.trade.id)) {
              <div class="fs-checklist-items">
                @for (item of g.trade.checklistResponses; track item.checklistItemId) {
                  <div class="fs-check-item" [class.fs-check-pass]="item.checked" [class.fs-check-fail]="!item.checked">
                    <mat-icon>{{ item.checked ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>{{ item.label }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Trade Notes -->
        @for (n of g.notes; track n.id) {
          <div class="fs-note" [style.border-left-color]="emotionColor(n.emotion)">
            <div class="fs-note-content">
              <div class="fs-note-header">
                @if (n.emotion) { <span class="fs-note-emotion">{{ n.emotion }}</span> }
                <span class="fs-note-time">{{ n.createdAt | date:'h:mm a' }}</span>
              </div>
              <span class="fs-note-text" [innerHTML]="n.note"></span>
            </div>
            <div class="fs-note-actions">
              <button class="fs-note-action" (click)="editNote(g.trade, n)">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="fs-note-action fs-note-delete" (click)="deleteNote(g.trade, n)">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          </div>
        }

        <!-- Actions for open trades -->
        @if (g.trade.status === 'Open') {
          <div class="fs-open-actions">
            <button class="fs-add-note-btn" (click)="addNote(g.trade); $event.stopPropagation()">
              <mat-icon>add_comment</mat-icon> Add Note
            </button>
            <button class="fs-close-trade-btn" (click)="closeTrade(g.trade); $event.stopPropagation()">
              <mat-icon>lock</mat-icon> Close Trade
            </button>
          </div>
        }

        <!-- Closed trade result -->
        @if (g.trade.status === 'Closed') {
          <div class="fs-close-section">
            @if (g.trade.exitTime) { <span class="fs-time">Closed {{ g.trade.exitTime }}</span> }
            @if (g.trade.duration) { <span class="fs-duration-badge">{{ g.trade.duration }}</span> }
            <div class="fs-trade-pnl" [class.fs-pnl-win]="(g.trade.netPnl ?? g.trade.pnl ?? 0) > 0" [class.fs-pnl-loss]="(g.trade.netPnl ?? g.trade.pnl ?? 0) < 0">
              {{ (g.trade.netPnl ?? g.trade.pnl ?? 0) | currency:'USD':'symbol':'1.2-2' }}
              @if (g.trade.totalFees) {
                <span class="fs-fees">({{ g.trade.totalFees | currency:'USD':'symbol':'1.2-2' }} fees)</span>
              }
            </div>
            @if (g.trade.exitReason) {
              <span class="fs-exit-badge" [class]="'exit-' + exitClass(g.trade.exitReason)">{{ g.trade.exitReason }}</span>
            }
          </div>
          @if (g.trade.lessonsLearned) {
            <div class="fs-lessons"><mat-icon>lightbulb</mat-icon> <span [innerHTML]="g.trade.lessonsLearned"></span></div>
          }
        }
      </div>
    }

    <!-- Actions -->
    @if (premarket()) {
      @if (mentalGateOpen()) {
        <div class="fs-mental-gate">
          <div class="fs-gate-label">How are you feeling right now?</div>
          <div class="fs-gate-buttons">
            <button class="fs-gate-btn fs-gate-green" (click)="confirmMentalGate('confident')">
              <mat-icon>sentiment_very_satisfied</mat-icon>
              <span>Focused</span>
            </button>
            <button class="fs-gate-btn fs-gate-amber" (click)="confirmMentalGate('uncertain')">
              <mat-icon>sentiment_neutral</mat-icon>
              <span>Uncertain</span>
            </button>
            <button class="fs-gate-btn fs-gate-red" (click)="confirmMentalGate('anxious')">
              <mat-icon>sentiment_very_dissatisfied</mat-icon>
              <span>Anxious</span>
            </button>
          </div>
          <button class="fs-gate-cancel" (click)="mentalGateOpen.set(false)">Cancel</button>
        </div>
      } @else {
        <div class="fs-actions">
          <button class="fs-action-btn fs-action-primary" (click)="startNewTrade()">
            <mat-icon>add_chart</mat-icon>
            <span>New Trade</span>
          </button>
        </div>
      }
    }

    <!-- Empty State -->
    @if (tradeGroups().length === 0) {
      <div class="fs-empty">
        @if (!premarket()) {
          <mat-icon>schedule</mat-icon>
          <p>Complete your morning prep first</p>
        } @else {
          <mat-icon>rocket_launch</mat-icon>
          <p>No trades yet — run your checklist and enter your first trade</p>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    /* Traffic Light Banner */
    .fs-traffic {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: var(--spacing-sm);
    }
    .fs-traffic > mat-icon { flex-shrink: 0; margin-top: 1px; }
    .fs-traffic-text { flex: 1; }
    .fs-traffic-text strong { font-size: 0.9rem; }
    .fs-traffic-green { background: var(--color-stat-green-bg); color: var(--color-success); }
    .fs-traffic-green > mat-icon { color: var(--color-success); }
    .fs-traffic-yellow { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .fs-traffic-yellow > mat-icon { color: var(--color-warning); }
    .fs-traffic-red { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .fs-traffic-red > mat-icon { color: var(--color-danger); }
    .fs-violations {
      margin: 6px 0 0; padding-left: 20px; font-size: 0.85rem; list-style: disc;
    }
    .fs-violations li { margin-bottom: 2px; }

    .fs-cooldown {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 16px; border-radius: var(--radius-md); margin-bottom: var(--spacing-sm);
      background: var(--color-stat-amber-bg); font-size: 0.85rem; color: var(--color-warning);
    }
    .fs-cooldown > mat-icon { flex-shrink: 0; color: var(--color-warning); }

    /* Stats Strip */
    .fs-stats {
      display: flex; gap: 12px; overflow-x: auto; margin-bottom: var(--spacing-md);
      padding-bottom: 4px; -webkit-overflow-scrolling: touch;
    }
    .fs-stat {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 14px; background: var(--color-surface); border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm); min-width: 70px; flex-shrink: 0;
    }
    .fs-stat-value { font-size: 1.1rem; font-weight: 700; }
    .fs-stat-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }
    .fs-stat-green .fs-stat-value { color: var(--color-success); }
    .fs-stat-red .fs-stat-value { color: var(--color-danger); }
    .fs-stat-amber .fs-stat-value { color: var(--color-warning); }

    /* Plan Reference Card */
    .fs-plan-card {
      border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
      overflow: hidden; margin-bottom: var(--spacing-md);
    }
    .fs-plan-header {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; cursor: pointer; background: var(--color-surface-secondary);
      transition: background 0.15s ease;
    }
    .fs-plan-header:hover { background: var(--color-surface-tertiary, var(--color-surface-secondary)); }
    .fs-plan-header > mat-icon:first-child { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); }
    .fs-plan-title { font-weight: 700; font-size: 0.9rem; flex: 1; }
    .fs-chevron { transition: transform 0.2s ease; color: var(--color-text-muted); }
    .fs-chevron.rotated { transform: rotate(180deg); }

    .fp-bias-badge {
      font-size: 0.7rem; font-weight: 600; padding: 2px 8px;
      border-radius: var(--radius-full); text-transform: capitalize;
    }
    .bias-bullish { background: var(--color-stat-green-bg); color: var(--color-success); }
    .bias-bearish { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .bias-neutral { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .bias-no-trade { background: var(--color-surface-secondary); color: var(--color-text-muted); }

    .fs-plan-body { padding: 12px 16px; border-top: 1px solid var(--color-border); background: var(--color-surface); }
    .fs-plan-field { margin-bottom: 10px; }
    .fs-plan-field:last-child { margin-bottom: 0; }
    .fs-plan-label {
      font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase;
      font-weight: 600; letter-spacing: 0.04em; margin-bottom: 4px;
    }
    .fs-plan-content { font-size: 0.9rem; line-height: 1.5; }

    /* Trade Timeline */
    .fs-trade-group {
      padding: 14px 14px 14px 16px; margin-bottom: 14px; border-radius: var(--radius-md);
      background: var(--color-surface); box-shadow: var(--shadow-sm);
      border-left: 3px solid var(--color-primary);
    }
    .fs-trade-group.fs-group-open { border-left-color: var(--color-warning); }
    .fs-trade-group.fs-group-closed { border-left-color: var(--color-success); }
    .fs-trade-group.fs-group-carry { border-left-color: var(--color-text-muted); }
    .fs-trade-number {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      color: var(--color-text-muted); letter-spacing: 0.5px; margin-bottom: 6px;
    }
    .fs-trade-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .fs-trade-top-row .fs-trade-number { margin-bottom: 0; }
    .fs-edit-label {
      display: inline-flex; align-items: center; gap: 3px;
      font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted);
      opacity: 0; transition: opacity var(--transition-fast), color var(--transition-fast);
    }
    .fs-edit-label mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .fs-trade-clickable { cursor: pointer; transition: border-color var(--transition-fast), box-shadow var(--transition-fast); }
    .fs-trade-clickable:hover { border-color: var(--color-primary); box-shadow: var(--shadow-sm); }
    .fs-trade-clickable:hover .fs-edit-label { opacity: 1; color: var(--color-primary); }
    @media (hover: none) { .fs-edit-label { opacity: 0.6; } }
    .fs-trade-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .fs-trade-badge {
      font-size: 0.65rem; font-weight: 700; padding: 2px 8px;
      border-radius: var(--radius-full); background: var(--color-surface-secondary);
      color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em;
    }
    .fs-badge-open { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .fs-instrument { font-weight: 700; font-size: 1rem; }
    .fs-option-tag {
      font-size: 0.8rem; color: var(--color-primary);
      background: var(--color-stat-blue-bg); padding: 2px 6px; border-radius: var(--radius-sm);
    }
    .fs-direction { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .fs-long { color: var(--color-success); }
    .fs-short { color: var(--color-danger); }
    .fs-qty { font-size: 0.8rem; color: var(--color-text-muted); }

    .fs-trade-setup { font-size: 0.82rem; color: var(--color-text-secondary); margin-top: 4px; }
    .fs-trade-thesis {
      font-style: italic; font-size: 0.85rem; color: var(--color-text-secondary);
      margin-top: 6px; padding-left: 12px; border-left: 2px solid var(--color-primary);
    }

    .fs-risk-tags { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
    .fs-risk-tag {
      font-size: 0.75rem; padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600;
    }
    .fs-risk-stop { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .fs-risk-target { background: var(--color-stat-green-bg); color: var(--color-success); }

    /* Carry-over */
    .fs-group-carry { border-left: 3px solid var(--color-warning); }
    .fs-badge-carry { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .fs-no-checklist {
      font-size: 0.7rem; font-weight: 600; color: var(--color-warning);
      background: var(--color-stat-amber-bg); padding: 2px 8px; border-radius: var(--radius-full);
    }
    .fs-spread-tag {
      font-size: 0.75rem; color: var(--color-text-secondary);
      background: var(--color-surface-secondary); padding: 2px 6px; border-radius: var(--radius-sm);
    }

    /* Trade Meta (entry time + setup) */
    .fs-trade-meta {
      display: flex; align-items: center; gap: 8px; margin-top: 4px;
      font-size: 0.8rem; color: var(--color-text-muted);
    }
    .fs-time { font-variant-numeric: tabular-nums; }
    .fs-setup-name { color: var(--color-text-secondary); }
    .fs-emotion-tag {
      font-size: 0.72rem; font-weight: 600; text-transform: capitalize;
      padding: 1px 6px; border-radius: var(--radius-full);
      background: var(--color-surface-secondary); color: var(--color-text-secondary);
    }
    .fs-trade-details {
      display: flex; gap: 12px; margin-top: 4px; flex-wrap: wrap;
    }
    .fs-detail {
      font-size: 0.8rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums;
    }

    /* Checklist */
    .fs-checklist {
      margin-top: 8px; padding: 8px 12px; border-radius: var(--radius-sm);
      background: var(--color-surface-secondary); cursor: pointer;
    }
    .fs-checklist-header {
      display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600;
    }
    .fs-checklist-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-warning); }
    .fs-checklist-icon.fs-checklist-pass { color: var(--color-success); }
    .fs-checklist-label { flex: 1; color: var(--color-text-secondary); }
    .fs-chevron-sm {
      font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted);
      transition: transform 0.2s ease;
    }
    .fs-chevron-sm.rotated { transform: rotate(180deg); }
    .fs-checklist-items { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
    .fs-check-item {
      display: flex; align-items: center; gap: 6px; font-size: 0.8rem;
      color: var(--color-text-secondary);
    }
    .fs-check-item mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .fs-check-pass mat-icon { color: var(--color-success); }
    .fs-check-fail mat-icon { color: var(--color-danger); }
    .fs-check-fail span { text-decoration: line-through; color: var(--color-text-muted); }

    /* Notes with emotion color + edit */
    .fs-note {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
      font-size: 0.85rem; padding: 8px 12px; margin-top: 6px;
      background: var(--color-surface-secondary); border-radius: var(--radius-sm);
      border-left: 3px solid var(--color-border);
    }
    .fs-note-content { flex: 1; min-width: 0; }
    .fs-note-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
    .fs-note-emotion {
      font-size: 0.7rem; font-weight: 600;
      text-transform: capitalize; color: var(--color-primary);
    }
    .fs-note-time { font-size: 0.7rem; color: var(--color-text-muted); }
    .fs-note-text {
      color: var(--color-text-secondary); line-height: 1.5;
      word-break: break-word; white-space: normal;
    }
    .fs-note-text ::ng-deep {
      p { margin: 0 0 4px; }
      p:last-child { margin-bottom: 0; }
      ul, ol { margin: 4px 0; padding-left: 20px; }
      li { margin-bottom: 2px; }
      strong { font-weight: 600; }
      br + br { display: none; }
    }
    .fs-lessons ::ng-deep p { margin: 0; display: inline; }
    .fs-note-actions {
      display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;
      opacity: 0; transition: opacity 0.15s ease;
    }
    .fs-note:hover .fs-note-actions { opacity: 1; }
    .fs-note-action {
      background: none; border: none; cursor: pointer;
      color: var(--color-text-muted); padding: 2px; border-radius: 4px;
    }
    .fs-note-action mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .fs-note-action:hover { color: var(--color-primary); }
    .fs-note-delete:hover { color: var(--color-danger); }

    /* Close Section */
    .fs-close-section {
      margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
    }
    .fs-close-section > .fs-time { font-size: 0.78rem; }
    .fs-duration-badge {
      font-size: 0.72rem; font-weight: 600; padding: 2px 8px;
      border-radius: var(--radius-full); background: var(--color-surface-secondary);
      color: var(--color-text-secondary); font-variant-numeric: tabular-nums;
    }
    .fs-fees { font-size: 0.78rem; font-weight: 400; color: var(--color-text-muted); }

    .fs-trade-pnl {
      font-weight: 700; font-size: 1rem;
      display: flex; align-items: center; gap: 8px;
    }
    .fs-pnl-win { color: var(--color-success); }
    .fs-pnl-loss { color: var(--color-danger); }

    .fs-exit-badge {
      font-size: 0.7rem; padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600;
    }
    .exit-target { background: var(--color-stat-green-bg); color: var(--color-success); }
    .exit-stop { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .exit-panic { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .exit-neutral { background: var(--color-surface-secondary); color: var(--color-text-muted); }


    .fs-lessons {
      font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 6px;
      display: flex; align-items: flex-start; gap: 6px;
    }
    .fs-lessons mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-warning); flex-shrink: 0; margin-top: 2px; }

    /* Action Bar */
    .fs-actions {
      display: flex; gap: 8px; margin-bottom: var(--spacing-sm); flex-wrap: wrap;
    }
    .fs-action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 16px; border-radius: var(--radius-md);
      border: 1px solid var(--color-border); background: var(--color-surface);
      color: var(--color-text-secondary); font-size: 0.85rem; font-weight: 600;
      cursor: pointer; font-family: inherit; text-decoration: none;
      transition: var(--transition-fast); min-height: 44px;
    }
    .fs-action-btn:hover { background: var(--color-surface-secondary); border-color: var(--color-primary); color: var(--color-primary); }
    .fs-action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .fs-action-primary {
      background: var(--color-stat-blue-bg); border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .fs-action-primary:hover { background: var(--color-primary); color: #fff; }

    /* Mental Readiness Gate */
    .fs-mental-gate {
      padding: 16px; margin-bottom: var(--spacing-sm); text-align: center;
      background: var(--color-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);
    }
    .fs-gate-label {
      font-size: 0.9rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 12px;
    }
    .fs-gate-buttons { display: flex; gap: 10px; justify-content: center; }
    .fs-gate-btn {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 12px 20px; border-radius: var(--radius-md); border: 2px solid var(--color-border);
      background: var(--color-surface); cursor: pointer; font-family: inherit;
      font-size: 0.8rem; font-weight: 600; min-height: 44px; min-width: 90px;
      transition: var(--transition-fast);
    }
    .fs-gate-btn mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .fs-gate-green { color: var(--color-success); }
    .fs-gate-green:hover { background: var(--color-stat-green-bg); border-color: var(--color-success); }
    .fs-gate-amber { color: var(--color-warning); }
    .fs-gate-amber:hover { background: var(--color-stat-amber-bg); border-color: var(--color-warning); }
    .fs-gate-red { color: var(--color-danger); }
    .fs-gate-red:hover { background: var(--color-stat-red-bg); border-color: var(--color-danger); }
    .fs-gate-cancel {
      margin-top: 10px; background: none; border: none; color: var(--color-text-muted);
      font-size: 0.82rem; cursor: pointer; font-family: inherit; padding: 4px 12px;
    }
    .fs-gate-cancel:hover { color: var(--color-text-secondary); }

    /* Empty State */
    .fs-empty {
      text-align: center; padding: 40px 20px; color: var(--color-text-muted);
    }
    .fs-empty > mat-icon {
      font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px;
      color: var(--color-text-muted); opacity: 0.5;
    }
    .fs-empty p { margin: 0 0 16px; font-size: 0.95rem; }
    .fs-empty a { min-height: 44px; }
    .fs-empty a mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    .fs-open-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
    .fs-add-note-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: var(--radius-full);
      border: 1px dashed var(--color-primary); background: transparent;
      color: var(--color-primary); font-size: 0.82rem; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background 0.2s ease;
    }
    .fs-add-note-btn:hover { background: var(--color-stat-blue-bg); }
    .fs-add-note-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .fs-close-trade-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: var(--radius-full);
      border: 1px solid var(--color-stat-purple); background: transparent;
      color: var(--color-stat-purple); font-size: 0.82rem; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: background 0.2s ease;
    }
    .fs-close-trade-btn:hover { background: var(--color-stat-purple-bg); }
    .fs-close-trade-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    @media (max-width: 599px) {
      .fs-stats { gap: 8px; }
      .fs-stat { padding: 8px 10px; min-width: 60px; }
      .fs-stat-value { font-size: 0.95rem; }
      .fs-trade-group { padding: 12px; }
      .fs-empty a { min-height: 44px; min-width: 44px; }
      .fs-note-actions { opacity: 1; flex-direction: row; }
      .fs-note-action { min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center; }
    }
  `]
})
export class FlowSessionComponent {
  private dialog = inject(MatDialog);
  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);

  trades = input<any[]>([]);
  stats = input<any | null>(null);
  disciplineStatus = input<any | null>(null);
  premarket = input<any | null>(null);
  limits = input<any | null>(null);
  setups = input<TradingSetupSummary[]>([]);
  isToday = input<boolean>(true);
  targetDate = input<string>('');
  noteAdded = output<void>();
  tradeAdded = output<void>();

  planCollapsed = signal(false);
  expandedChecklists = signal(new Set<number>());
  mentalGateOpen = signal(false);

  constructor() {
    effect(() => {
      this.planCollapsed.set(this.trades().length > 0);
    });
  }

  tradeGroups = computed(() => {
    const t = this.trades();
    if (!t.length) return [];
    return t.map(trade => ({
      trade,
      notes: trade.tradeNotes || [],
      isCarryOver: trade.isCarryOver ?? false,
      checkedCount: (trade.checklistResponses || []).filter((r: any) => r.checked).length
    }));
  });

  hasOpenTrades = computed(() => this.trades().some(t => t.status === 'Open'));

  addNote(trade: any): void {
    const ref = this.dialog.open(TradeNoteDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: { tradeId: trade.id, instrument: trade.instrument }
    });
    ref.afterClosed().subscribe(r => {
      if (r) this.noteAdded.emit();
    });
  }

  toggleChecklist(tradeId: number): void {
    const s = new Set(this.expandedChecklists());
    if (s.has(tradeId)) s.delete(tradeId); else s.add(tradeId);
    this.expandedChecklists.set(s);
  }

  deleteNote(trade: any, note: any): void {
    if (!confirm('Delete this note?')) return;
    this.tradingService.deleteTradeNote(trade.id, note.id).subscribe({
      next: () => {
        this.notify.success('Note deleted');
        this.noteAdded.emit();
      },
      error: () => this.notify.error('Failed to delete note')
    });
  }

  editNote(trade: any, note: any): void {
    const ref = this.dialog.open(TradeNoteDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: { tradeId: trade.id, instrument: trade.instrument, note }
    });
    ref.afterClosed().subscribe(r => {
      if (r) this.noteAdded.emit();
    });
  }

  editTrade(trade: any): void {
    const ref = this.dialog.open(TradeEntryDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: { trade, setups: this.setups() } as TradeEntryDialogData,
      maxWidth: '600px',
      width: '100%'
    });
    ref.afterClosed().subscribe(r => {
      if (r) this.tradeAdded.emit();
    });
  }

  closeTrade(trade: any): void {
    const ref = this.dialog.open(TradeEntryDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: { trade, setups: this.setups(), closeMode: true } as TradeEntryDialogData
    });
    ref.afterClosed().subscribe(r => {
      if (r) this.tradeAdded.emit();
    });
  }

  emotionColor(emotion: string | null | undefined): string {
    if (!emotion) return 'var(--color-border)';
    const e = emotion.toLowerCase();
    if (e === 'confident' || e === 'calm' || e === 'focused') return 'var(--color-success)';
    if (e === 'anxious' || e === 'fomo' || e === 'frustrated' || e === 'revenge') return 'var(--color-danger)';
    if (e === 'uncertain' || e === 'impatient' || e === 'greedy') return 'var(--color-warning)';
    return 'var(--color-primary)';
  }

  startNewTrade(): void {
    const ds = this.disciplineStatus();
    if (ds?.trafficLight === 'red') return;
    this.mentalGateOpen.set(true);
  }

  confirmMentalGate(emotion: string): void {
    this.mentalGateOpen.set(false);
    const dialogData: TradeEntryDialogData = {
      trade: null,
      setups: this.setups(),
      targetDate: this.targetDate() || undefined,
      checklistPrefill: {
        setupId: 0,
        checklistCompleted: false,
        checklistResponses: [],
        emotionAtEntry: emotion,
        isRevengeTrading: emotion === 'anxious'
      }
    };
    const ref = this.dialog.open(TradeEntryDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: dialogData,
      maxWidth: '600px',
      width: '100%'
    });
    ref.afterClosed().subscribe(r => {
      if (r) this.tradeAdded.emit();
    });
  }

  exitClass(reason: string): string {
    if (reason === 'Hit Target') return 'target';
    if (reason === 'Hit Stop') return 'stop';
    if (reason === 'Panic Exit' || reason === 'Revenge Close') return 'panic';
    return 'neutral';
  }
}
