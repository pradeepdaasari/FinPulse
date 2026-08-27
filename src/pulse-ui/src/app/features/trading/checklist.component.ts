import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TradingService } from '../../core/services/trading.service';
import { TradingSetupSummary, TradingSetup, PreMarketNote, TradeEntry, DailyLimits, ChecklistResponse } from '../../core/models/trading.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatProgressSpinnerModule, CurrencyPipe
  ],
  template: `
    <!-- Banner -->
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>checklist</mat-icon></div>
        <h2>Trade Checklist</h2>
        <p class="banner-sub">Every great trade starts with a process</p>
      </div>
    </div>

    <!-- Status Stats -->
    <div class="stats-row">
      <div class="stat-card stat-blue">
        <mat-icon>format_list_numbered</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ tradesToday() }} / {{ maxTrades() }}</span>
          <span class="stat-label">Trades Today</span>
        </div>
      </div>
      <div class="stat-card" [class.stat-green]="pnlToday() >= 0" [class.stat-red]="pnlToday() < 0">
        <mat-icon>{{ pnlToday() >= 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ pnlToday() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="stat-label">P&L Today</span>
        </div>
      </div>
      <div class="stat-card stat-amber">
        <mat-icon>shield</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ maxLoss() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="stat-label">Max Loss Limit</span>
        </div>
      </div>
      <div class="stat-card" [class.stat-green]="trafficLight() === 'green'" [class.stat-amber]="trafficLight() === 'yellow'" [class.stat-red]="trafficLight() === 'red'">
        <mat-icon>{{ trafficLight() === 'green' ? 'check_circle' : trafficLight() === 'yellow' ? 'warning' : 'block' }}</mat-icon>
        <div class="stat-content">
          <span class="stat-value status-text">{{ trafficLight() === 'green' ? 'CLEAR' : trafficLight() === 'yellow' ? 'CAUTION' : 'STOP' }}</span>
          <span class="stat-label">Status</span>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner></mat-spinner></div>
    }

    <!-- BLOCKED: No pre-market -->
    @if (!hasPreMarketNote() && !loading()) {
      <mat-card class="blocked-card">
        <mat-card-content>
          <div class="blocked-content">
            <div class="blocked-icon red-glow"><mat-icon>lock</mat-icon></div>
            <h3>Pre-Market Plan Required</h3>
            <p>You must complete your pre-market plan before taking any trades today. This is non-negotiable discipline.</p>
            <a mat-raised-button color="primary" routerLink="/trading/premarket">
              <mat-icon>wb_twilight</mat-icon> Complete Pre-Market Plan
            </a>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- LOCKED: Limit hit -->
    @if (hasPreMarketNote() && limitHit() && !loading()) {
      <mat-card class="blocked-card">
        <mat-card-content>
          <div class="blocked-content">
            <div class="blocked-icon amber-glow"><mat-icon>front_hand</mat-icon></div>
            <h3>{{ tradeLimitHit() ? "Daily Trade Limit Reached" : "Max Loss Reached" }}</h3>
            <p>{{ tradeLimitHit() ? "You've taken all your allowed trades for today. Come back tomorrow with fresh eyes." : "You've hit your maximum loss limit. Protect your capital. Step away and reset." }}</p>
            <div class="calming-quote">
              <mat-icon>format_quote</mat-icon>
              <em>"The market will be there tomorrow. Your capital won't be if you're reckless today."</em>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- STAGE 2: Mental State Gate -->
    @if (hasPreMarketNote() && !limitHit() && !loading() && stage() === 'mental') {
      <mat-card class="mental-card">
        <mat-card-content>
          <div class="mental-header">
            <div class="mental-icon"><mat-icon>psychology</mat-icon></div>
            <div>
              <h3>Mental State Check</h3>
              <p class="mental-sub">Be honest with yourself. There's no shame in sitting out.</p>
            </div>
          </div>

          <!-- Question 1: Emotional State -->
          <div class="mental-question">
            <span class="q-label">1. How is your emotional state right now?</span>
            <div class="mental-buttons">
              <button class="mental-btn" [class.active]="emotionalState() === 'green'" [class.btn-green]="emotionalState() === 'green'" (click)="emotionalState.set('green')">
                <mat-icon>sentiment_satisfied</mat-icon>
                <span>Calm & Focused</span>
              </button>
              <button class="mental-btn" [class.active]="emotionalState() === 'yellow'" [class.btn-yellow]="emotionalState() === 'yellow'" (click)="emotionalState.set('yellow')">
                <mat-icon>sentiment_neutral</mat-icon>
                <span>Slightly Agitated</span>
              </button>
              <button class="mental-btn" [class.active]="emotionalState() === 'red'" [class.btn-red]="emotionalState() === 'red'" (click)="emotionalState.set('red')">
                <mat-icon>sentiment_very_dissatisfied</mat-icon>
                <span>Emotional / Angry / Fearful</span>
              </button>
            </div>
          </div>

          <!-- Question 2: Revenge Trading -->
          <div class="mental-question">
            <span class="q-label">2. Are you revenge trading?</span>
            <div class="mental-buttons two-col">
              <button class="mental-btn" [class.active]="isRevenge() === false" [class.btn-green]="isRevenge() === false" (click)="isRevenge.set(false)">
                <mat-icon>thumb_up</mat-icon>
                <span>No — This is planned</span>
              </button>
              <button class="mental-btn" [class.active]="isRevenge() === true" [class.btn-red]="isRevenge() === true" (click)="isRevenge.set(true)">
                <mat-icon>thumb_down</mat-icon>
                <span>Yes — I want to get back</span>
              </button>
            </div>
            @if (isRevenge() === true) {
              <div class="warning-inline">
                <mat-icon>warning</mat-icon>
                <span>Revenge trading is the #1 account killer. You WILL lose more. Step away.</span>
              </div>
            }
          </div>

          <!-- Question 3: Upset -->
          <div class="mental-question">
            <span class="q-label">3. Did something just happen that upset you?</span>
            <div class="mental-buttons two-col">
              <button class="mental-btn" [class.active]="isUpset() === false" [class.btn-green]="isUpset() === false" (click)="isUpset.set(false)">
                <mat-icon>check</mat-icon>
                <span>No — I'm clear-headed</span>
              </button>
              <button class="mental-btn" [class.active]="isUpset() === true" [class.btn-yellow]="isUpset() === true" (click)="isUpset.set(true)">
                <mat-icon>priority_high</mat-icon>
                <span>Yes — Something happened</span>
              </button>
            </div>
            @if (isUpset() === true) {
              <div class="warning-inline caution">
                <mat-icon>schedule</mat-icon>
                <span>Wait at least 15 minutes before trading. Emotions cloud judgment.</span>
              </div>
            }
          </div>

          <!-- Recent loss detection -->
          @if (recentLoss()) {
            <div class="revenge-alert">
              <mat-icon>pause_circle</mat-icon>
              <div>
                <strong>PAUSE — You just took a loss.</strong>
                <p>Is this next trade from your plan, or from emotion?</p>
                <mat-checkbox [(ngModel)]="revengeAcknowledged" color="warn">
                  This trade is part of my plan, not a reaction to my last trade
                </mat-checkbox>
              </div>
            </div>
          }

          <!-- Mental State Result -->
          @if (mentalStateComplete()) {
            @if (mentalRisk() === 'red') {
              <div class="mental-result red-result">
                <mat-icon>dangerous</mat-icon>
                <div>
                  <strong>You should NOT be trading right now.</strong>
                  <p>Based on your self-assessment, emotional trades lose 3x more than calm trades. Your future self will thank you for sitting out.</p>
                </div>
              </div>
              <button mat-button class="override-btn" (click)="stage.set('checklist')">
                I understand the risk, proceed anyway
              </button>
            } @else if (mentalRisk() === 'yellow') {
              <div class="mental-result yellow-result">
                <mat-icon>info</mat-icon>
                <div>
                  <strong>Proceed with caution.</strong>
                  <p>Reduce your position size. Consider only A+ setups today.</p>
                </div>
              </div>
              <button mat-raised-button color="primary" (click)="stage.set('checklist')" [disabled]="recentLoss() && !revengeAcknowledged">
                <mat-icon>arrow_forward</mat-icon> Continue to Checklist
              </button>
            } @else {
              <div class="mental-result green-result">
                <mat-icon>check_circle</mat-icon>
                <div>
                  <strong>You're in a good state to trade.</strong>
                  <p>Stay disciplined. Follow your setup.</p>
                </div>
              </div>
              <button mat-raised-button color="primary" (click)="stage.set('checklist')" [disabled]="recentLoss() && !revengeAcknowledged">
                <mat-icon>arrow_forward</mat-icon> Continue to Checklist
              </button>
            }
          }
        </mat-card-content>
      </mat-card>
    }

    <!-- STAGE 3: Setup Checklist + Trade Entry -->
    @if (hasPreMarketNote() && !limitHit() && !loading() && stage() === 'checklist') {
      <mat-card class="checklist-card">
        <mat-card-content>
          <div class="checklist-header">
            <button mat-button (click)="stage.set('mental')" class="back-btn">
              <mat-icon>arrow_back</mat-icon> Back to Mental Check
            </button>
            <h3>Setup Checklist</h3>
          </div>

          <!-- Setup Selector -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Select Your Setup</mat-label>
            <mat-select (selectionChange)="onSetupSelected($event.value)">
              @for (setup of setups(); track setup.id) {
                <mat-option [value]="setup.id">
                  <mat-icon>tune</mat-icon> {{ setup.name }} ({{ setup.itemCount }} items)
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Checklist Items -->
          @if (selectedSetup()) {
            <div class="checklist-progress">
              <span class="progress-text">{{ checkedCount() }} / {{ selectedSetup()!.checklistItems.length }} items</span>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="checklistProgress()"></div>
              </div>
            </div>

            <div class="checklist-items">
              @for (item of selectedSetup()!.checklistItems; track item.orderIndex; let i = $index) {
                <div class="checklist-item" [class.checked]="checkStates()[i]" (click)="toggleCheck(i)">
                  <div class="check-box" [class.checked]="checkStates()[i]">
                    @if (checkStates()[i]) {
                      <mat-icon>check</mat-icon>
                    }
                  </div>
                  <span class="check-label">{{ item.label }}</span>
                </div>
              }
            </div>

            <!-- Trade Entry Form (only when all checked) -->
            @if (allChecked()) {
              <div class="trade-entry">
                <div class="entry-header">
                  <mat-icon>rocket_launch</mat-icon>
                  <h4>Confirm Trade Entry</h4>
                </div>
                <form [formGroup]="tradeForm" class="entry-form">
                  <div class="entry-grid">
                    <mat-form-field appearance="outline">
                      <mat-label>Instrument</mat-label>
                      <mat-select formControlName="instrument">
                        <mat-option value="SPX">SPX</mat-option>
                        <mat-option value="NDX">NDX</mat-option>
                        <mat-option value="QQQ">QQQ</mat-option>
                        <mat-option value="SPY">SPY</mat-option>
                        <mat-option value="ES">ES (Futures)</mat-option>
                        <mat-option value="NQ">NQ (Futures)</mat-option>
                        <mat-option value="other">Other</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <div class="direction-toggle">
                      <span class="dir-label">Direction</span>
                      <div class="dir-buttons">
                        <button type="button" class="dir-btn long" [class.active]="tradeForm.value.direction === 'long'" (click)="tradeForm.patchValue({direction: 'long'})">
                          <mat-icon>arrow_upward</mat-icon> Long
                        </button>
                        <button type="button" class="dir-btn short" [class.active]="tradeForm.value.direction === 'short'" (click)="tradeForm.patchValue({direction: 'short'})">
                          <mat-icon>arrow_downward</mat-icon> Short
                        </button>
                      </div>
                    </div>

                    <mat-form-field appearance="outline">
                      <mat-label>Entry Price</mat-label>
                      <input matInput type="number" formControlName="entryPrice" step="0.01">
                      <span matTextPrefix>$&nbsp;</span>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Contracts</mat-label>
                      <input matInput type="number" formControlName="quantity" min="1">
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Notes (optional)</mat-label>
                    <input matInput formControlName="notes" placeholder="Why are you taking this trade?">
                  </mat-form-field>

                  <button mat-raised-button color="primary" class="log-btn" (click)="logTrade()" [disabled]="tradeForm.invalid">
                    <mat-icon>add_task</mat-icon> Log Trade
                  </button>
                </form>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    :host { display: block; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }

    .page-banner {
      position: relative;
      margin: -24px -24px 20px;
      padding: 32px 24px 24px;
      background: var(--gradient-primary);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content { position: relative; text-align: center; }
    .banner-icon {
      width: 52px; height: 52px; border-radius: 16px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px; border: 1px solid rgba(255,255,255,0.3);
    }
    .banner-icon mat-icon { font-size: 26px; width: 26px; height: 26px; color: #fff; }
    h2 { margin: 0; color: #fff; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.01em; }
    .banner-sub { color: rgba(255,255,255,0.75); font-size: 0.85rem; margin: 4px 0 0; }

    /* Stats */
    .stats-row {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm); margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex; align-items: center; gap: 10px;
      background: var(--color-surface); border-radius: var(--radius-md);
      padding: 14px; box-shadow: var(--shadow-sm);
    }
    .stat-card > mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .stat-card.stat-blue > mat-icon { color: var(--color-stat-blue); }
    .stat-card.stat-green > mat-icon { color: var(--color-stat-green); }
    .stat-card.stat-red > mat-icon { color: var(--color-stat-red); }
    .stat-card.stat-amber > mat-icon { color: var(--color-stat-amber); }
    .stat-content { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.1rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .stat-label { font-size: 0.7rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.02em; }
    .status-text { text-transform: uppercase; letter-spacing: 0.05em; }

    /* Blocked/Locked */
    .blocked-card {
      max-width: 500px; margin: 40px auto; text-align: center;
    }
    .blocked-content { padding: 24px 16px; }
    .blocked-icon {
      width: 64px; height: 64px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .blocked-icon mat-icon { font-size: 32px; width: 32px; height: 32px; color: #fff; }
    .blocked-icon.red-glow { background: var(--color-danger); box-shadow: 0 4px 20px rgba(255,59,48,0.3); }
    .blocked-icon.amber-glow { background: var(--color-warning); box-shadow: 0 4px 20px rgba(255,149,0,0.3); }
    .blocked-content h3 { margin: 0 0 8px; font-size: 1.2rem; font-weight: 700; }
    .blocked-content p { color: var(--color-text-secondary); margin: 0 0 20px; line-height: 1.5; }
    .calming-quote {
      display: flex; align-items: flex-start; gap: 8px;
      background: var(--color-surface-secondary); border-radius: var(--radius-md);
      padding: 14px; margin-top: 20px; text-align: left;
    }
    .calming-quote mat-icon { color: var(--color-text-muted); flex-shrink: 0; }
    .calming-quote em { font-size: 0.9rem; color: var(--color-text-secondary); }

    /* Mental State Card */
    .mental-card { margin-bottom: var(--spacing-md); }
    .mental-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
    .mental-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: var(--color-stat-purple); display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .mental-icon mat-icon { color: #fff; font-size: 22px; width: 22px; height: 22px; }
    .mental-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }
    .mental-sub { margin: 2px 0 0; font-size: 0.8rem; color: var(--color-text-secondary); }

    .mental-question { margin-bottom: 24px; }
    .q-label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 10px; }
    .mental-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .mental-buttons.two-col { grid-template-columns: repeat(2, 1fr); }
    .mental-btn {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 14px 8px; border-radius: var(--radius-md);
      border: 2px solid var(--color-border); background: var(--color-surface);
      cursor: pointer; transition: all 0.2s ease; font-size: 0.78rem;
      font-weight: 500; text-align: center; color: var(--color-text);
    }
    .mental-btn:hover { border-color: var(--color-primary); }
    .mental-btn mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .mental-btn.active.btn-green { border-color: var(--color-success); background: var(--color-stat-green-bg); color: var(--color-success); }
    .mental-btn.active.btn-yellow { border-color: var(--color-warning); background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .mental-btn.active.btn-red { border-color: var(--color-danger); background: var(--color-stat-red-bg); color: var(--color-danger); }

    .warning-inline {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 14px; margin-top: 10px; border-radius: var(--radius-sm);
      background: var(--color-stat-red-bg); color: var(--color-danger); font-size: 0.82rem; font-weight: 500;
    }
    .warning-inline.caution { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .warning-inline mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

    .revenge-alert {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 16px; margin: 16px 0; border-radius: var(--radius-md);
      background: var(--color-stat-red-bg); border: 1px solid rgba(255,59,48,0.2);
    }
    .revenge-alert > mat-icon { font-size: 28px; width: 28px; height: 28px; color: var(--color-danger); flex-shrink: 0; }
    .revenge-alert strong { color: var(--color-danger); }
    .revenge-alert p { margin: 4px 0 10px; font-size: 0.85rem; color: var(--color-text-secondary); }

    .mental-result {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 16px; margin: 20px 0 16px; border-radius: var(--radius-md);
    }
    .mental-result mat-icon { font-size: 24px; width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; }
    .mental-result strong { display: block; margin-bottom: 4px; }
    .mental-result p { margin: 0; font-size: 0.85rem; color: var(--color-text-secondary); }
    .green-result { background: var(--color-stat-green-bg); }
    .green-result mat-icon { color: var(--color-success); }
    .yellow-result { background: var(--color-stat-amber-bg); }
    .yellow-result mat-icon { color: var(--color-warning); }
    .red-result { background: var(--color-stat-red-bg); }
    .red-result mat-icon { color: var(--color-danger); }

    .override-btn {
      font-size: 0.75rem !important; color: var(--color-text-muted) !important;
      opacity: 0.7; margin-top: 8px;
    }

    /* Checklist Card */
    .checklist-card { margin-bottom: var(--spacing-md); }
    .checklist-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .checklist-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; flex: 1; }
    .back-btn { font-size: 0.8rem !important; }
    .full-width { width: 100%; }

    .checklist-progress { margin-bottom: 16px; }
    .progress-text { font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary); }
    .progress-bar {
      height: 6px; background: var(--color-border); border-radius: 3px; margin-top: 6px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: var(--color-success); border-radius: 3px;
      transition: width 0.3s ease;
    }

    .checklist-items { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
    .checklist-item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border-radius: var(--radius-md);
      background: var(--color-surface-secondary); cursor: pointer;
      transition: all 0.2s ease; min-height: 48px;
      border: 2px solid transparent;
    }
    .checklist-item:hover { border-color: var(--color-primary); }
    .checklist-item.checked { background: var(--color-stat-green-bg); border-color: var(--color-success); }
    .check-box {
      width: 28px; height: 28px; border-radius: 8px;
      border: 2px solid var(--color-border); display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .check-box.checked { background: var(--color-success); border-color: var(--color-success); }
    .check-box.checked mat-icon { color: #fff; font-size: 18px; width: 18px; height: 18px; }
    .check-label { font-weight: 500; font-size: 0.9rem; }

    /* Trade Entry */
    .trade-entry {
      border-top: 2px solid var(--color-border); padding-top: 20px; margin-top: 8px;
    }
    .entry-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .entry-header mat-icon { color: var(--color-success); }
    .entry-header h4 { margin: 0; font-size: 1rem; font-weight: 700; }
    .entry-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .direction-toggle { display: flex; flex-direction: column; gap: 6px; }
    .dir-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; }
    .dir-buttons { display: flex; gap: 6px; }
    .dir-btn {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
      padding: 10px; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.85rem;
      border: 2px solid var(--color-border); background: var(--color-surface);
      cursor: pointer; transition: all 0.2s; color: var(--color-text);
    }
    .dir-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .dir-btn.long.active { border-color: var(--color-success); background: var(--color-stat-green-bg); color: var(--color-success); }
    .dir-btn.short.active { border-color: var(--color-danger); background: var(--color-stat-red-bg); color: var(--color-danger); }

    .log-btn { width: 100%; padding: 12px !important; font-weight: 600 !important; font-size: 0.95rem !important; }

    @media (max-width: 599px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .mental-buttons { grid-template-columns: 1fr; }
      .mental-buttons.two-col { grid-template-columns: 1fr; }
      .entry-grid { grid-template-columns: 1fr; }
      .page-banner { margin: -16px -16px 16px; padding: 24px 16px 20px; }
    }
  `]
})
export class ChecklistComponent implements OnInit {
  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);

  loading = signal(true);
  hasPreMarketNote = signal(false);
  todayNote = signal<PreMarketNote | null>(null);
  setups = signal<TradingSetupSummary[]>([]);
  selectedSetup = signal<TradingSetup | null>(null);
  todayTrades = signal<TradeEntry[]>([]);
  limits = signal<DailyLimits>({ id: 0, maxTradesPerDay: 3, maxDailyLoss: 500, stopAfterConsecutiveLosses: 3 });

  stage = signal<'mental' | 'checklist'>('mental');
  checkStates = signal<boolean[]>([]);

  // Mental state signals
  emotionalState = signal<'green' | 'yellow' | 'red' | null>(null);
  isRevenge = signal<boolean | null>(null);
  isUpset = signal<boolean | null>(null);
  revengeAcknowledged = false;

  tradeForm = this.fb.group({
    instrument: ['SPX', Validators.required],
    direction: ['long' as 'long' | 'short', Validators.required],
    entryPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  tradesToday = computed(() => this.todayTrades().length);
  maxTrades = computed(() => this.limits().maxTradesPerDay);
  maxLoss = computed(() => this.limits().maxDailyLoss);
  pnlToday = computed(() => this.todayTrades().reduce((sum, t) => sum + (t.pnl ?? 0), 0));

  tradeLimitHit = computed(() => this.tradesToday() >= this.maxTrades());
  lossLimitHit = computed(() => this.pnlToday() <= -this.maxLoss());
  limitHit = computed(() => this.tradeLimitHit() || this.lossLimitHit());

  trafficLight = computed(() => {
    if (this.limitHit() || !this.hasPreMarketNote()) return 'red';
    if (this.tradesToday() >= this.maxTrades() - 1 || this.pnlToday() <= -(this.maxLoss() * 0.8)) return 'yellow';
    return 'green';
  });

  recentLoss = computed(() => {
    const trades = this.todayTrades();
    if (trades.length === 0) return false;
    const last = trades[trades.length - 1];
    if (!last.pnl || last.pnl >= 0) return false;
    const entryTime = last.createdAt ? new Date(last.createdAt).getTime() : 0;
    return (Date.now() - entryTime) < 10 * 60 * 1000;
  });

  mentalStateComplete = computed(() =>
    this.emotionalState() !== null && this.isRevenge() !== null && this.isUpset() !== null
  );

  mentalRisk = computed(() => {
    if (this.emotionalState() === 'red' || this.isRevenge() === true) return 'red';
    if (this.emotionalState() === 'yellow' || this.isUpset() === true) return 'yellow';
    return 'green';
  });

  checkedCount = computed(() => this.checkStates().filter(Boolean).length);
  checklistProgress = computed(() => {
    const setup = this.selectedSetup();
    if (!setup || setup.checklistItems.length === 0) return 0;
    return (this.checkedCount() / setup.checklistItems.length) * 100;
  });
  allChecked = computed(() => {
    const setup = this.selectedSetup();
    if (!setup || setup.checklistItems.length === 0) return false;
    return this.checkStates().every(Boolean);
  });

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];

    this.tradingService.getTodayNote().subscribe({
      next: (note) => { this.todayNote.set(note); this.hasPreMarketNote.set(true); },
      error: () => { this.hasPreMarketNote.set(false); }
    });

    this.tradingService.getSetups().subscribe({
      next: (setups) => this.setups.set(setups.filter(s => s.isActive)),
      error: () => {}
    });

    this.tradingService.getTrades(today, today).subscribe({
      next: (trades) => this.todayTrades.set(trades),
      error: () => {}
    });

    this.tradingService.getLimits().subscribe({
      next: (limits) => this.limits.set(limits),
      error: () => {},
      complete: () => this.loading.set(false)
    });

    this.loading.set(false);
  }

  onSetupSelected(setupId: number): void {
    this.tradingService.getSetup(setupId).subscribe({
      next: (setup) => {
        this.selectedSetup.set(setup);
        this.checkStates.set(new Array(setup.checklistItems.length).fill(false));
      }
    });
  }

  toggleCheck(index: number): void {
    const states = [...this.checkStates()];
    states[index] = !states[index];
    this.checkStates.set(states);
  }

  logTrade(): void {
    const setup = this.selectedSetup();
    if (!setup || !this.tradeForm.valid) return;

    const val = this.tradeForm.value;
    const responses: ChecklistResponse[] = setup.checklistItems.map((item, i) => ({
      checklistItemId: item.id ?? i,
      label: item.label,
      checked: this.checkStates()[i]
    }));

    this.tradingService.createTrade({
      date: new Date().toISOString().split('T')[0],
      setupId: setup.id,
      instrument: val.instrument!,
      direction: val.direction!,
      entryPrice: val.entryPrice!,
      quantity: val.quantity!,
      notes: val.notes || undefined,
      checklistCompleted: this.allChecked(),
      checklistResponses: responses,
      isRevengeTrading: this.isRevenge() === true,
      emotionAtEntry: this.emotionalState() ?? undefined
    }).subscribe({
      next: () => {
        this.notify.success('Trade logged successfully');
        this.todayTrades.update(trades => [...trades, {} as TradeEntry]);
        this.resetForm();
      },
      error: () => this.notify.error('Failed to log trade')
    });
  }

  private resetForm(): void {
    this.selectedSetup.set(null);
    this.checkStates.set([]);
    this.tradeForm.reset({ instrument: 'SPX', direction: 'long', quantity: 1 });
    this.stage.set('mental');
    this.emotionalState.set(null);
    this.isRevenge.set(null);
    this.isUpset.set(null);
    this.revengeAcknowledged = false;
  }
}
