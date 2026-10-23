import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TradingService } from '../../core/services/trading.service';
import { toLocalISOString } from '../../core/utils/date-utils';
import { BankAccountService } from '../../core/services/bank-account.service';
import { TradeEntry, TradeDirection, TradeStatus, ExitReason, TradingSetupSummary, DisciplineStatus, ChecklistItem } from '../../core/models/trading.model';
import { BankAccount } from '../../core/models/bank-account.model';
import { NotificationService } from '../../core/services/notification.service';
import { RichTextEditorComponent } from '../../shared/rich-text-editor.component';

export interface TradeEntryDialogData {
  trade: TradeEntry | null;
  setups: TradingSetupSummary[];
  closeMode?: boolean;
  targetDate?: string;
  checklistPrefill?: {
    setupId: number;
    checklistCompleted: boolean;
    checklistResponses: any[];
    emotionAtEntry?: string;
    isRevengeTrading?: boolean;
  };
}

@Component({
  selector: 'app-trade-entry-dialog',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DecimalPipe, DatePipe, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatButtonToggleModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatChipsModule, MatTooltipModule, RichTextEditorComponent
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon" [class.edit-mode]="!!data?.trade" [class.close-mode]="!!data?.closeMode">
          <mat-icon>{{ data?.closeMode ? 'lock' : (data?.trade ? 'edit' : 'add_chart') }}</mat-icon>
        </div>
        <div class="banner-text">
          <h2>{{ data?.closeMode ? 'Close' : (data?.trade ? 'Edit' : 'Log') }} Trade</h2>
          <p>{{ bannerSubtitle }}</p>
        </div>
        <span class="banner-spacer"></span>
        <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="trade-form" (submit)="$event.preventDefault()">

        @if (isMultiStep()) {
          <div class="step-indicator">
            <div class="step-dot" [class.active]="currentStep() === 1" (click)="currentStep.set(1)">1</div>
            <div class="step-line" [class.done]="currentStep() === 2"></div>
            <div class="step-dot" [class.active]="currentStep() === 2" (click)="currentStep.set(2)">2</div>
            <div class="step-labels">
              <span [class.active]="currentStep() === 1">Entry</span>
              <span [class.active]="currentStep() === 2">Close &amp; Reflect</span>
            </div>
          </div>
        }

        @if (currentStep() === 1) {

        @if (data?.closeMode) {
          <div class="entry-summary-card">
            <div class="summary-row">
              <span class="summary-instrument">{{ data.trade?.instrument }}</span>
              <span class="summary-direction" [class.long]="data.trade?.direction === 'long'" [class.short]="data.trade?.direction === 'short'">{{ data.trade?.direction }}</span>
              <span class="summary-setup">{{ data.trade?.setupName || 'Setup' }}</span>
            </div>
            <div class="summary-meta">
              Entry {{ (data.trade?.assetType === 'Options' ? data.trade?.entryPremium : data.trade?.entryPrice) | currency }} · {{ data.trade?.quantity }} ct · {{ data.trade?.date | date:'MMM d' }}
            </div>
            @if (data.trade?.tradeThesis) {
              <div class="summary-thesis">"{{ data.trade?.tradeThesis }}"</div>
            }
          </div>
        } @else {

        <!-- Discipline Status Banner -->
        @if (!data?.trade && disciplineStatus(); as ds) {
          <div class="discipline-banner" [class.banner-green]="ds.trafficLight === 'green'"
               [class.banner-yellow]="ds.trafficLight === 'yellow'"
               [class.banner-red]="ds.trafficLight === 'red'">
            <div class="discipline-banner-row">
              <mat-icon>{{ ds.trafficLight === 'green' ? 'check_circle' : ds.trafficLight === 'yellow' ? 'warning' : 'block' }}</mat-icon>
              <span class="discipline-status-text">
                {{ ds.trafficLight === 'green' ? 'Clear to trade' : ds.trafficLight === 'yellow' ? 'Proceed with caution' : 'Trading blocked' }}
              </span>
            </div>
            <div class="discipline-stats">
              <span class="discipline-chip">{{ ds.tradesToday }}/{{ ds.maxTrades }} trades</span>
              @if (!ds.hasPreMarketNote) {
                <span class="discipline-chip chip-warn chip-link" (click)="goToPremarket()">No pre-market plan <mat-icon class="chip-link-icon">arrow_forward</mat-icon></span>
              }
            </div>
            @if (ds.recentLoss) {
              <div class="cooldown-warning">
                <mat-icon>pause_circle</mat-icon>
                <span>Recent loss{{ ds.lastLossInstrument ? ' on ' + ds.lastLossInstrument : '' }}. Is this trade from your plan?</span>
              </div>
            }
            @if (ds.trafficLight === 'red' && ds.violations.length > 0) {
              <div class="discipline-block-msg">
                @if (!ds.hasPreMarketNote) {
                  <span class="block-msg-link" (click)="goToPremarket()">Complete your pre-market plan to start trading <mat-icon>arrow_forward</mat-icon></span>
                } @else {
                  {{ ds.violations[0] }}
                }
              </div>
            }
          </div>
        }

        <!-- Compact date + time row -->
        <div class="date-compact-row" (click)="picker.open()">
          <mat-icon class="date-icon">calendar_today</mat-icon>
          <div class="date-value">{{ form.value.date | date:'MMM d, yyyy' }}</div>
          <div class="date-sep">|</div>
          <mat-icon class="date-icon" (click)="$event.stopPropagation(); timeInput.focus()">schedule</mat-icon>
          <input #timeInput type="time" class="time-input" formControlName="time" (click)="$event.stopPropagation()">
          <input matInput [matDatepicker]="picker" formControlName="date" class="hidden-date-input">
          <mat-datepicker #picker></mat-datepicker>
        </div>

        <!-- Setup + Instrument -->
        <div class="row-2col">
          <mat-form-field appearance="outline">
            <mat-label>Setup</mat-label>
            <mat-select formControlName="setupId">
              @for (s of data.setups; track s.id) {
                <mat-option [value]="s.id">{{ s.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Instrument</mat-label>
            <mat-select formControlName="instrument">
              <mat-option value="SPX">SPX</mat-option>
              <mat-option value="NDX">NDX</mat-option>
              <mat-option value="QQQ">QQQ</mat-option>
              <mat-option value="SPY">SPY</mat-option>
              <mat-option value="ES">ES</mat-option>
              <mat-option value="NQ">NQ</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Checklist -->
        @if (checklistItems().length > 0 && !data?.trade) {
          <div class="checklist-section">
            <div class="checklist-header">
              <mat-icon [class.checklist-done]="allChecked()">{{ allChecked() ? 'verified' : 'checklist' }}</mat-icon>
              <span>{{ checkStates().filter(c => c).length }}/{{ checklistItems().length }} checks</span>
            </div>
            <div class="checklist-list">
              @for (item of checklistItems(); track item.orderIndex; let i = $index) {
                <div class="checklist-row" [class.checked]="checkStates()[i]" (click)="toggleCheck(i)">
                  <div class="check-box" [class.checked]="checkStates()[i]">
                    @if (checkStates()[i]) { <mat-icon>check</mat-icon> }
                  </div>
                  <span>{{ item.label }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Trade Thesis -->
        @if (!data?.trade || data?.trade?.tradeThesis) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Why am I taking this trade?</mat-label>
            <textarea matInput formControlName="tradeThesis" rows="2" maxlength="500"
              placeholder="e.g., SPX rejected 4500, bearish engulfing on 5min, targeting 4480"></textarea>
          </mat-form-field>
        }

        <!-- Status Toggle -->
        <div class="status-toggle-row">
          <mat-button-toggle-group formControlName="status" class="status-toggle">
            <mat-button-toggle value="Open" class="toggle-open">
              <mat-icon>lock_open</mat-icon> Open
            </mat-button-toggle>
            <mat-button-toggle value="Closed" class="toggle-closed">
              <mat-icon>lock</mat-icon> Closed
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <!-- Direction + Asset Type side by side -->
        <div class="row-2col toggle-row">
          <div class="toggle-field">
            <mat-button-toggle-group formControlName="direction" class="dir-toggle">
              <mat-button-toggle value="long" class="toggle-long">
                <mat-icon>arrow_upward</mat-icon> Long
              </mat-button-toggle>
              <mat-button-toggle value="short" class="toggle-short">
                <mat-icon>arrow_downward</mat-icon> Short
              </mat-button-toggle>
            </mat-button-toggle-group>
          </div>
          <div class="toggle-field">
            <mat-button-toggle-group formControlName="assetType" class="asset-toggle">
              <mat-button-toggle value="Options" class="toggle-options">Options</mat-button-toggle>
              <mat-button-toggle value="Futures" class="toggle-futures">Futures</mat-button-toggle>
              <mat-button-toggle value="Equity" class="toggle-equity">Equity</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </div>

        <!-- Options Section -->
        @if (form.value.assetType === 'Options') {
          <div class="options-section">
            <!-- Spread + Expiration -->
            <div class="row-2col">
              <mat-form-field appearance="outline">
                <mat-label>Spread</mat-label>
                <mat-select formControlName="spreadType">
                  <mat-option value="Single">Single</mat-option>
                  <mat-option value="Vertical">Vertical</mat-option>
                  <mat-option value="IronCondor">Iron Condor</mat-option>
                  <mat-option value="Butterfly">Butterfly</mat-option>
                  <mat-option value="Calendar">Calendar</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Expiration</mat-label>
                <input matInput [matDatepicker]="expPicker" formControlName="expirationDate">
                <mat-datepicker-toggle matIconSuffix [for]="expPicker"></mat-datepicker-toggle>
                <mat-datepicker #expPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <!-- Call/Put toggle (not for Iron Condor which uses both) -->
            @if (form.value.spreadType !== 'IronCondor') {
              <mat-button-toggle-group formControlName="optionType" class="opt-toggle compact-toggle">
                <mat-button-toggle value="Call" class="toggle-call">Call</mat-button-toggle>
                <mat-button-toggle value="Put" class="toggle-put">Put</mat-button-toggle>
              </mat-button-toggle-group>
            }

            <!-- Strike fields per spread type -->
            @if (form.value.spreadType === 'Single') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Strike</mat-label>
                <input matInput type="text" inputmode="decimal" formControlName="strikePrice">
              </mat-form-field>
            } @else if (form.value.spreadType === 'Calendar') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Strike</mat-label>
                <input matInput type="text" inputmode="decimal" formControlName="strikePrice">
              </mat-form-field>
            } @else if (form.value.spreadType === 'Vertical') {
              <div class="row-2col">
                <mat-form-field appearance="outline">
                  <mat-label>Short Strike</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice" (input)="calcPnl()">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Long Strike</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice2" (input)="calcPnl()">
                </mat-form-field>
              </div>
            } @else if (form.value.spreadType === 'IronCondor') {
              <div class="row-4col">
                <mat-form-field appearance="outline">
                  <mat-label>SC</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice" (input)="calcPnl()">
                  <mat-hint>Short Call</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>LC</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice2" (input)="calcPnl()">
                  <mat-hint>Long Call</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>SP</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice3" (input)="calcPnl()">
                  <mat-hint>Short Put</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>LP</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice4" (input)="calcPnl()">
                  <mat-hint>Long Put</mat-hint>
                </mat-form-field>
              </div>
            } @else if (form.value.spreadType === 'Butterfly') {
              <div class="row-3col">
                <mat-form-field appearance="outline">
                  <mat-label>Lower</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Middle</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice2">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Upper</mat-label>
                  <input matInput type="text" inputmode="decimal" formControlName="strikePrice3">
                </mat-form-field>
              </div>
            }

            <!-- Entry Premium -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Entry Premium</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="entryPremium" step="0.01" (input)="calcPnl()">
              <span matTextPrefix>$</span>
            </mat-form-field>
          </div>
        } @else {
          <!-- Entry Price (non-options) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Entry Price</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="entryPrice" step="0.01" (input)="calcPnl()">
            <span matTextPrefix>$</span>
          </mat-form-field>
        }

        <!-- Qty, Multiplier, Stop, Target -->
        <div class="row-4col">
          <mat-form-field appearance="outline">
            <mat-label>Qty</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="quantity" min="1" (input)="calcPnl()">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Multiplier</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="multiplier" min="1" (input)="calcPnl()">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Stop Loss</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="stopLoss" step="0.01">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Target</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="profitTarget" step="0.01">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        <mat-checkbox formControlName="checklistCompleted" color="primary" class="checklist-check">
          Checklist completed
        </mat-checkbox>

        <!-- Emotion at entry (hide in close mode — exitEmotion covers it) -->
        @if (form.value.status !== 'Closed') {
          <div class="emotion-section">
            <label class="section-label">How are you feeling?</label>
            <mat-button-toggle-group formControlName="emotionAtEntry" class="emotion-toggle">
              @for (e of emotions; track e.value) {
                <mat-button-toggle [value]="e.value" class="emotion-btn">
                  <span class="emotion-icon">{{ e.icon }}</span>
                  <span class="emotion-label">{{ e.label }}</span>
                </mat-button-toggle>
              }
            </mat-button-toggle-group>
          </div>
        }

        } <!-- end close-mode else -->
        } <!-- end step 1 -->

        @if (currentStep() === 2) {

        <!-- Close Date -->
        <div class="closed-date-field step2-close-date" (click)="closedPicker2.open()">
          <mat-icon class="date-icon">event_available</mat-icon>
          <span class="closed-date-value">Closed {{ form.value.closedDate | date:'MMM d, yyyy' }}</span>
          <input matInput [matDatepicker]="closedPicker2" formControlName="closedDate" class="hidden-date-input">
          <mat-datepicker #closedPicker2></mat-datepicker>
          <span class="date-sep">|</span>
          <mat-icon class="date-icon" (click)="$event.stopPropagation(); closedTimeInput2.focus()">schedule</mat-icon>
          <input #closedTimeInput2 type="time" class="time-input closed-time" formControlName="closedTime" (click)="$event.stopPropagation()">
        </div>

        <!-- Exit Premium / Price -->
        @if (form.value.assetType === 'Options') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Exit Premium</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="exitPremium" step="0.01" (input)="calcPnl()" [readonly]="!!form.value.expiredWorthless">
            <span matTextPrefix>$</span>
          </mat-form-field>
          <mat-checkbox formControlName="expiredWorthless" color="primary" class="expired-check" (change)="onExpiredWorthlessChange($event.checked)">
            Expired Worthless <span class="expired-hint">(no exit brokerage — option expired, not closed)</span>
          </mat-checkbox>
        } @else {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Exit Price</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="exitPrice" step="0.01" (input)="calcPnl()">
            <span matTextPrefix>$</span>
          </mat-form-field>
        }

        <!-- P&L + Risk -->
        <div class="row-2col">
          <mat-form-field appearance="outline">
            <mat-label>P&L</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="pnl" step="0.01">
            <span matTextPrefix>$</span>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Risk</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="plannedRisk" step="1" min="0">
            <span matTextPrefix>$</span>
          </mat-form-field>
        </div>

        <!-- Brokerage + Fees -->
        @if (brokerageAccounts().length > 0) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Account</mat-label>
            <mat-select formControlName="bankAccountId" (selectionChange)="calcPnl()">
              <mat-option [value]="null">— None —</mat-option>
              @for (acct of brokerageAccounts(); track acct.id) {
                <mat-option [value]="acct.id">{{ acct.accountName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (selectedAccount()) {
            <div class="fees-section">
              <div class="fees-inputs">
                <mat-form-field appearance="outline">
                  <mat-label>Commission</mat-label>
                  <input matInput type="number" inputmode="decimal" formControlName="commissionFees" step="0.01" (input)="onFeesChanged()">
                  <span matTextPrefix>$</span>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Reg + Exchange</mat-label>
                  <input matInput type="number" inputmode="decimal" formControlName="regExchangeFees" step="0.01" (input)="onFeesChanged()">
                  <span matTextPrefix>$</span>
                </mat-form-field>
              </div>
              <div class="fee-summary-bar">
                @if (form.value.pnl != null) {
                  <div class="fee-chip">
                    <span class="fee-chip-label">Gross</span>
                    <span [class.positive]="(form.value.pnl ?? 0) >= 0" [class.negative]="(form.value.pnl ?? 0) < 0">
                      {{ (form.value.pnl ?? 0) >= 0 ? '+' : '' }}{{ form.value.pnl | currency }}
                    </span>
                  </div>
                }
                @if (estimatedFees() > 0) {
                  <div class="fee-chip">
                    <span class="fee-chip-label">Fees</span>
                    <span>−{{ estimatedFees() | currency }}</span>
                  </div>
                }
                @if (form.value.pnl != null && estimatedFees() > 0) {
                  <div class="fee-chip net-chip">
                    <span class="fee-chip-label">Net</span>
                    <span [class.positive]="netPnl() >= 0" [class.negative]="netPnl() < 0">
                      {{ netPnl() >= 0 ? '+' : '' }}{{ netPnl() | currency }}
                    </span>
                  </div>
                }
                @if (maxRisk() != null) {
                  <div class="fee-chip risk-chip">
                    <span class="fee-chip-label">Risk</span>
                    <span class="negative">−{{ maxRisk()! | currency }}</span>
                  </div>
                }
                @if (computedR() != null) {
                  <div class="fee-chip r-chip" [class.positive-r]="computedR()! >= 0" [class.negative-r]="computedR()! < 0">
                    <span class="fee-chip-label">R</span>
                    <span>{{ computedR()! >= 0 ? '+' : '' }}{{ computedR()! | number:'1.1-1' }}R</span>
                  </div>
                }
              </div>
            </div>
          }
        }

        <!-- Post-Trade Reflection -->
        <div class="reflection-section">
          <label class="section-label">Post-Trade Reflection</label>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Exit Reason</mat-label>
            <mat-select formControlName="exitReason">
              <mat-option value="Hit Target">Hit Target</mat-option>
              <mat-option value="Hit Stop">Hit Stop</mat-option>
              <mat-option value="Time Exit">Time Exit</mat-option>
              <mat-option value="Manual Close">Manual Close</mat-option>
              <mat-option value="Panic Exit">Panic Exit</mat-option>
              <mat-option value="Revenge Close">Revenge Close</mat-option>
            </mat-select>
          </mat-form-field>
          <label class="section-label">How are you feeling after this trade?</label>
          <mat-button-toggle-group formControlName="exitEmotion" class="emotion-toggle">
            @for (e of emotions; track e.value) {
              <mat-button-toggle [value]="e.value" class="emotion-btn">
                <span class="emotion-icon">{{ e.icon }}</span>
                <span class="emotion-label">{{ e.label }}</span>
              </mat-button-toggle>
            }
          </mat-button-toggle-group>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>What did you learn?</mat-label>
            <textarea matInput formControlName="lessonsLearned" rows="2" maxlength="1000"
              placeholder="e.g., Should have waited for confirmation. Entry was solid but held too long."></textarea>
          </mat-form-field>
        </div>

        <!-- More options: mistakes, notes, tags -->
        <button type="button" class="more-toggle" (click)="showMore.set(!showMore())">
          <mat-icon>{{ showMore() ? 'expand_less' : 'expand_more' }}</mat-icon>
          More options (Mistakes, Notes, Tags)
        </button>
        @if (showMore()) {
          <div class="more-section">
            <div class="mistake-section">
              <label class="section-label">Mistakes (if any)</label>
              <div class="mistake-chips">
                @for (m of mistakeOptions; track m) {
                  <button type="button" class="mistake-chip" [class.selected]="selectedMistakes().includes(m)"
                    (click)="toggleMistake(m)">{{ m }}</button>
                }
              </div>
            </div>

            <app-rich-text-editor label="Notes" formControlName="notes" height="80px"
              placeholder="Quick notes..."></app-rich-text-editor>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tags</mat-label>
              <input matInput formControlName="tags" placeholder="0DTE, scalp, breakout">
              <mat-hint>Comma-separated</mat-hint>
            </mat-form-field>
          </div>
        }

        } <!-- end step 2 -->
      </form>
      }
      @if (saving()) {
        <div class="saving-overlay"><mat-spinner diameter="32"></mat-spinner></div>
      }
    </mat-dialog-content>
    <div class="save-bar">
      @if (currentStep() === 1 && isMultiStep()) {
        <button class="save-btn next-btn" (click)="currentStep.set(2)">
          Next <mat-icon>arrow_forward</mat-icon>
        </button>
      } @else if (currentStep() === 2) {
        <div class="save-bar-split">
          <button class="back-btn" (click)="currentStep.set(1)">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
          <button class="save-btn" (click)="save()" [disabled]="form.invalid || loading() || saving()">
            @if (saving()) {
              <mat-spinner diameter="20" class="save-spinner"></mat-spinner>
              Saving...
            } @else {
              <mat-icon>{{ data?.closeMode ? 'lock' : 'check' }}</mat-icon>
              {{ data?.closeMode ? 'Close Trade' : 'Save Trade' }}
            }
          </button>
        </div>
      } @else {
        <button class="save-btn" (click)="save()" [disabled]="form.invalid || loading() || saving()">
          @if (saving()) {
            <mat-spinner diameter="20" class="save-spinner"></mat-spinner>
            Saving...
          } @else {
            <mat-icon>{{ data?.trade ? 'check' : 'save' }}</mat-icon>
            {{ data?.trade ? 'Update Trade' : 'Open Trade' }}
          }
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex; flex-direction: column; max-height: 100vh; overflow: hidden;
    }
    .dialog-banner {
      position: relative; padding: 18px 24px 14px;
      background: var(--gradient-primary); overflow: hidden;
      flex-shrink: 0; z-index: 2;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
                  radial-gradient(circle at 85% 20%, rgba(255,255,255,0.04) 0%, transparent 40%);
    }
    .banner-content { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; }
    .banner-icon {
      width: 38px; height: 38px; border-radius: 10px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,0.3); flex-shrink: 0;
    }
    .banner-icon mat-icon { color: #fff; font-size: 20px; width: 20px; height: 20px; }
    .banner-icon.edit-mode { background: rgba(255,255,255,0.25); }
    .banner-icon.close-mode { background: rgba(76,175,80,0.35); }
    .banner-text h2 { margin: 0; color: #fff; font-size: 1.05rem; font-weight: 700; }
    .banner-text p { margin: 2px 0 0; color: rgba(255,255,255,0.7); font-size: 0.72rem; }
    .banner-spacer { flex: 1; }
    .header-close {
      color: rgba(255, 255, 255, 0.9) !important;
      width: 40px !important; height: 40px !important; padding: 0 !important;
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      border-radius: 50% !important;
      background: rgba(255, 255, 255, 0.12) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      flex-shrink: 0 !important;
    }
    .header-close:hover { background: rgba(255, 255, 255, 0.25) !important; }
    .header-close mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .date-compact-row {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 20px; background: var(--color-surface-secondary);
      border-radius: var(--radius-md); border: 1px solid var(--color-border);
      cursor: pointer; transition: border-color 0.15s;
      width: 100%; position: relative; box-sizing: border-box;
    }
    .hidden-date-input {
      position: absolute; left: 0; top: 100%; width: 1px; height: 1px;
      opacity: 0; pointer-events: none; overflow: hidden;
    }
    .date-compact-row:hover { border-color: var(--color-primary); }
    .date-icon { color: var(--color-primary); font-size: 24px; width: 24px; height: 24px; flex-shrink: 0; }
    .date-value { font-size: 1.05rem; font-weight: 600; color: var(--color-text); }
    .date-sep { color: var(--color-border); font-size: 1.2rem; }
    .time-input {
      border: none; background: none; font-size: 1.05rem; font-weight: 600;
      color: var(--color-text); outline: none; width: auto; min-width: 60px; cursor: text;
      font-family: inherit;
    }
    .time-input::-webkit-calendar-picker-indicator { display: none; -webkit-appearance: none; }

    .trade-form { display: flex; flex-direction: column; gap: 14px; min-width: 0; padding-top: 12px; }

    .row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; }
    .row-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; align-items: start; }
    .row-4col { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
    .full-width { width: 100%; }

    .status-toggle-row {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    .status-toggle { flex-shrink: 0; }
    .status-toggle .mat-button-toggle { flex: none; }
    ::ng-deep .status-toggle .mat-button-toggle-checked.toggle-open {
      background: var(--color-stat-amber-bg) !important; color: var(--color-stat-amber) !important;
    }
    ::ng-deep .status-toggle .mat-button-toggle-checked.toggle-closed {
      background: var(--color-stat-green-bg) !important; color: var(--color-success) !important;
    }
    .closed-date-field {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; background: var(--color-stat-green-bg);
      border-radius: var(--radius-full); cursor: pointer;
      border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
      transition: border-color 0.15s; position: relative;
    }
    .closed-date-field:hover { border-color: var(--color-success); }
    .closed-date-field .date-sep { color: color-mix(in srgb, var(--color-success) 50%, transparent); font-size: 1rem; }
    .closed-date-field .date-icon { color: var(--color-success); font-size: 18px; width: 18px; height: 18px; }
    .closed-time { font-size: 0.8rem; color: var(--color-success); min-width: 50px; width: auto; }
    .closed-date-value { font-size: 0.8rem; font-weight: 600; color: var(--color-success); white-space: nowrap; }
    .toggle-field { display: flex; align-items: center; padding: 4px 0; }
    .dir-toggle, .opt-toggle, .asset-toggle { width: 100%; }
    .dir-toggle .mat-button-toggle, .opt-toggle .mat-button-toggle, .asset-toggle .mat-button-toggle { flex: 1; }
    .compact-toggle { align-self: center; height: 40px; margin-bottom: 8px; }

    ::ng-deep .dir-toggle .mat-button-toggle-checked.toggle-long {
      background: var(--color-stat-green-bg) !important; color: var(--color-success) !important;
    }
    ::ng-deep .dir-toggle .mat-button-toggle-checked.toggle-short {
      background: var(--color-stat-red-bg) !important; color: var(--color-danger) !important;
    }
    ::ng-deep .opt-toggle .mat-button-toggle-checked.toggle-call {
      background: var(--color-stat-green-bg) !important; color: var(--color-success) !important;
    }
    ::ng-deep .opt-toggle .mat-button-toggle-checked.toggle-put {
      background: var(--color-stat-red-bg) !important; color: var(--color-danger) !important;
    }
    ::ng-deep .asset-toggle .mat-button-toggle-checked.toggle-options {
      background: var(--color-stat-blue-bg) !important; color: var(--color-stat-blue) !important;
    }
    ::ng-deep .asset-toggle .mat-button-toggle-checked.toggle-futures {
      background: var(--color-stat-purple-bg) !important; color: var(--color-stat-purple) !important;
    }
    ::ng-deep .asset-toggle .mat-button-toggle-checked.toggle-equity {
      background: var(--color-stat-green-bg) !important; color: var(--color-success) !important;
    }

    .options-section {
      border: 1px solid color-mix(in srgb, var(--color-stat-blue) 30%, var(--color-border));
      border-radius: var(--radius-md);
      padding: 14px 12px 8px;
      margin: 6px 0 14px;
      background: color-mix(in srgb, var(--color-stat-blue-bg) 20%, transparent);
    }
    .options-section .row-2col,
    .options-section .row-3col,
    .options-section .row-4col { margin-bottom: 0; }

    .fees-section {
      border: 1px solid color-mix(in srgb, var(--color-stat-amber) 30%, var(--color-border));
      border-radius: var(--radius-md);
      padding: 12px 12px 8px;
      margin: 2px 0 10px;
      background: color-mix(in srgb, var(--color-stat-amber) 5%, transparent);
    }
    .fees-inputs {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    }
    .fee-summary-bar {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;
    }
    .fee-chip {
      display: flex; align-items: center; gap: 4px;
      background: var(--color-surface-secondary); border-radius: 20px;
      padding: 4px 10px; font-size: 0.72rem; font-weight: 600;
      color: var(--color-text-secondary);
    }
    .fee-chip-label { opacity: 0.7; font-weight: 500; }
    .fee-chip.net-chip {
      background: var(--color-surface); border: 1.5px solid var(--color-border);
      font-weight: 700;
    }
    .fee-chip.risk-chip {
      border: 1.5px dashed var(--color-danger); background: transparent;
    }
    .fee-chip .positive { color: var(--color-success); }
    .fee-chip .negative { color: var(--color-danger); }
    .fee-chip.r-chip { border: 1.5px solid var(--color-stat-blue); background: transparent; font-weight: 700; }
    .fee-chip.r-chip.positive-r { border-color: var(--color-success); color: var(--color-success); }
    .fee-chip.r-chip.negative-r { border-color: var(--color-danger); color: var(--color-danger); }

    ::ng-deep .trade-form .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .trade-form .mat-mdc-form-field-hint-wrapper { display: none; }
    ::ng-deep .options-section .mat-mdc-form-field-subscript-wrapper { display: block; }

    .checklist-check { margin: 6px 0 2px; }

    .section-label {
      display: block; font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary);
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
    }
    .emotion-section { margin: 4px 0 8px; }
    .emotion-toggle { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
    .emotion-toggle .mat-button-toggle { flex: none; }
    ::ng-deep .emotion-toggle .mat-button-toggle-button {
      display: flex; align-items: center; justify-content: center; padding: 8px 4px;
    }
    .emotion-btn {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 2px; width: 100%;
    }
    .emotion-icon { font-size: 1.3rem; line-height: 1; }
    .emotion-label { font-size: 0.6rem; font-weight: 600; line-height: 1; }
    ::ng-deep .emotion-toggle .mat-button-toggle-checked {
      background: var(--color-stat-blue-bg) !important; color: var(--color-stat-blue) !important;
    }

    .mistake-section { margin: 0 0 8px; }
    .mistake-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .mistake-chip {
      padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 600;
      border: 1.5px solid var(--color-border); background: transparent; color: var(--color-text-secondary);
      cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .mistake-chip:hover { border-color: var(--color-text-muted); }
    .mistake-chip.selected {
      background: var(--color-stat-red-bg); color: var(--color-danger);
      border-color: var(--color-danger);
    }
    .expired-check { margin: 4px 0 10px; display: block; }
    .expired-hint { font-size: 0.72rem; color: var(--color-text-muted); margin-left: 4px; }
    .max-risk-line { border-top: 1px dashed var(--color-border, #e0e0e0); padding-top: 4px; margin-top: 2px; }

    .step-indicator {
      display: flex; align-items: center; justify-content: center;
      gap: 0; padding: 4px 0 8px; flex-wrap: wrap;
    }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700;
      background: var(--color-surface-secondary); color: var(--color-text-muted);
      border: 2px solid var(--color-border); cursor: pointer;
      transition: all 0.2s;
    }
    .step-dot.active {
      background: var(--color-primary); color: #fff; border-color: var(--color-primary);
    }
    .step-line {
      width: 40px; height: 2px; background: var(--color-border);
      transition: background 0.2s;
    }
    .step-line.done { background: var(--color-primary); }
    .step-labels {
      width: 100%; display: flex; justify-content: space-between;
      padding: 4px 16px 0; font-size: 0.7rem; font-weight: 600;
      color: var(--color-text-muted);
    }
    .step-labels span.active { color: var(--color-primary); }

    .entry-summary-card {
      background: var(--color-surface-secondary); border-radius: var(--radius-md);
      padding: 14px 16px; border: 1px solid var(--color-border);
    }
    .summary-row {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    }
    .summary-instrument {
      font-size: 1rem; font-weight: 700; color: var(--color-text);
    }
    .summary-direction {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      padding: 2px 8px; border-radius: var(--radius-full);
    }
    .summary-direction.long { background: var(--color-stat-green-bg); color: var(--color-success); }
    .summary-direction.short { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .summary-setup {
      font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted);
    }
    .summary-meta {
      font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 6px;
    }
    .summary-thesis {
      font-size: 0.75rem; color: var(--color-text-muted); font-style: italic;
      margin-top: 6px; line-height: 1.4;
    }

    .step2-close-date { width: fit-content; }

    .save-bar-split {
      display: flex; gap: 10px; align-items: center;
    }
    .back-btn {
      height: 48px; border: 1.5px solid var(--color-border); border-radius: var(--radius-sm);
      background: var(--color-surface); color: var(--color-text-secondary);
      font-size: 0.85rem; font-weight: 600;
      display: flex; align-items: center; gap: 4px;
      cursor: pointer; padding: 0 16px; white-space: nowrap;
      transition: border-color 0.15s, color 0.15s;
    }
    .back-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .back-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .save-bar-split .save-btn { flex: 1; }
    .next-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .more-toggle {
      display: flex; align-items: center; gap: 4px;
      background: none; border: none; cursor: pointer;
      color: var(--color-primary); font-size: 0.8rem; font-weight: 600;
      padding: 6px 0; margin: 4px 0;
    }
    .more-toggle mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .more-section {
      display: flex; flex-direction: column; gap: 8px;
      padding: 14px; border-radius: var(--radius-sm);
      border: 1px dashed color-mix(in srgb, var(--color-primary) 25%, var(--color-border));
      background: color-mix(in srgb, var(--color-primary) 2%, transparent);
    }

    .save-bar {
      flex-shrink: 0; z-index: 2;
      padding: 12px 24px calc(16px + env(safe-area-inset-bottom, 0px));
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
    }
    .save-btn {
      width: 100%; height: 48px; border: none; border-radius: var(--radius-sm);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.95rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
      transition: box-shadow 0.2s, opacity 0.2s;
    }
    .save-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4); }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    ::ng-deep .save-spinner circle { stroke: #fff !important; }

    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    mat-dialog-content {
      position: relative; flex: 1 1 auto; min-height: 0;
      overflow-y: auto; -webkit-overflow-scrolling: touch;
    }
    .saving-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); border-radius: inherit; z-index: 10;
    }
    .discipline-banner {
      border-radius: var(--radius-md); padding: 10px 14px; margin-bottom: 4px;
      border: 1px solid var(--color-border);
    }
    .discipline-banner.banner-green {
      background: color-mix(in srgb, var(--color-success) 6%, white);
      border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
    }
    .discipline-banner.banner-yellow {
      background: color-mix(in srgb, var(--color-warning) 8%, white);
      border-color: color-mix(in srgb, var(--color-warning) 40%, transparent);
    }
    .discipline-banner.banner-red {
      background: color-mix(in srgb, var(--color-danger) 6%, white);
      border-color: color-mix(in srgb, var(--color-danger) 40%, transparent);
    }
    .discipline-banner-row {
      display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.85rem;
    }
    .banner-green .discipline-banner-row { color: var(--color-success); }
    .banner-yellow .discipline-banner-row { color: var(--color-warning); }
    .banner-red .discipline-banner-row { color: var(--color-danger); }
    .discipline-banner-row mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .discipline-stats { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .discipline-chip {
      font-size: 0.7rem; font-weight: 600; padding: 2px 8px;
      background: rgba(0,0,0,0.05); border-radius: var(--radius-full);
      color: var(--color-text-secondary);
    }
    .discipline-chip.chip-warn { color: var(--color-danger); background: color-mix(in srgb, var(--color-danger) 8%, white); }
    .discipline-chip.chip-link { cursor: pointer; display: inline-flex; align-items: center; gap: 2px; }
    .discipline-chip.chip-link:hover { background: color-mix(in srgb, var(--color-danger) 15%, white); }
    .chip-link-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .cooldown-warning {
      display: flex; align-items: center; gap: 6px; margin-top: 8px;
      padding: 6px 10px; border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-warning) 10%, white);
      font-size: 0.75rem; color: var(--color-warning-text);
    }
    .cooldown-warning mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .discipline-block-msg { margin-top: 8px; font-size: 0.75rem; color: var(--color-danger); font-weight: 500; }
    .block-msg-link { cursor: pointer; display: inline-flex; align-items: center; gap: 4px; text-decoration: underline; text-underline-offset: 2px; }
    .block-msg-link:hover { opacity: 0.8; }
    .block-msg-link mat-icon { font-size: 14px !important; width: 14px !important; height: 14px !important; }
    .reflection-section {
      border: 1px solid color-mix(in srgb, var(--color-success) 30%, var(--color-border));
      border-radius: var(--radius-md); padding: 14px 12px 8px; margin: 6px 0 10px;
      background: color-mix(in srgb, var(--color-success) 4%, white);
      display: flex; flex-direction: column; gap: 8px;
    }

    @media (max-width: 1024px) {
      .row-2col { grid-template-columns: 1fr 1fr; }
      .toggle-row.row-2col { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 599px) {
      :host { height: 100%; max-width: 100%; }
      .dialog-banner { padding: 14px 16px 12px; flex-shrink: 0; }
      .banner-text h2 { font-size: 0.95rem; }
      .trade-form { max-width: 100%; overflow: hidden; box-sizing: border-box; }
      .row-3col { grid-template-columns: 1fr 1fr; }
      .row-4col { grid-template-columns: 1fr 1fr; }
      .row-2col { grid-template-columns: 1fr 1fr; }
      .toggle-row.row-2col { grid-template-columns: 1fr; }
      .compact-toggle { height: 44px; }
      .asset-toggle .mat-button-toggle { font-size: 0.75rem; }
      .fees-section { margin-left: 0; margin-right: 0; overflow: hidden; max-width: 100%; box-sizing: border-box; padding: 10px 8px 8px; }
      .fees-inputs { grid-template-columns: 1fr 1fr; gap: 8px; }
      .fee-summary-bar { gap: 4px; flex-wrap: wrap; }
      .fee-chip { font-size: 0.7rem; padding: 4px 8px; }
      .options-section { padding: 10px 8px 6px; overflow: hidden; max-width: 100%; box-sizing: border-box; }
      .expired-hint { display: block; margin-left: 0; margin-top: 2px; }
      .emotion-toggle { grid-template-columns: repeat(3, 1fr); }
      .emotion-icon { font-size: 1.2rem; }
      .emotion-label { font-size: 0.65rem; }
      .mistake-chip { padding: 6px 12px; font-size: 0.75rem; min-height: 44px; display: flex; align-items: center; }
      .save-bar { padding: 10px 16px 14px; margin: 0 -16px -16px; }
      .date-compact-row { padding: 14px 16px; }
      .discipline-banner { padding: 8px 12px; margin-bottom: 2px; }
      .reflection-section { padding: 10px 8px 6px; }
      .checklist-row { min-height: 44px; }
    }

    .checklist-section {
      margin: -4px 0 12px; padding: 12px; background: var(--color-surface-secondary);
      border-radius: var(--radius-md); border: 1px solid var(--color-border);
    }
    .checklist-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
      font-size: 0.85rem; font-weight: 600; color: var(--color-text-secondary);
    }
    .checklist-header mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    .checklist-header .checklist-done { color: var(--color-success); }
    .checklist-list { display: flex; flex-direction: column; gap: 6px; }
    .checklist-row {
      display: flex; align-items: center; gap: 10px; padding: 8px 10px;
      border-radius: var(--radius-sm); cursor: pointer; transition: background 0.15s ease;
      font-size: 0.88rem; color: var(--color-text-secondary);
    }
    .checklist-row:hover { background: var(--color-surface); }
    .checklist-row.checked { color: var(--color-text-muted); }
    .checklist-row.checked span { text-decoration: line-through; }
    .check-box {
      width: 22px; height: 22px; border-radius: 4px; flex-shrink: 0;
      border: 2px solid var(--color-border); display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .check-box.checked {
      background: var(--color-success); border-color: var(--color-success);
    }
    .check-box mat-icon { font-size: 14px; width: 14px; height: 14px; color: #fff; }
  `]
})
export class TradeEntryDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tradingService = inject(TradingService);
  private accountService = inject(BankAccountService);
  private dialogRef = inject(MatDialogRef<TradeEntryDialogComponent>);
  private router = inject(Router);
  private notify = inject(NotificationService);
  data: TradeEntryDialogData = inject(MAT_DIALOG_DATA);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  showMore = signal(false);
  currentStep = signal(1);
  isMultiStep = signal(false);
  disciplineStatus = signal<DisciplineStatus | null>(null);
  selectedMistakes = signal<string[]>(
    this.data?.trade?.mistakeTags ?? (this.data?.checklistPrefill?.isRevengeTrading ? ['Revenge'] : [])
  );

  get bannerSubtitle(): string {
    if (this.data?.closeMode) return 'Record exit details and lock in your P&L';
    if (this.data?.trade?.status === 'Open') return 'Update your open position';
    if (this.data?.trade) return 'Modify your trade record';
    return 'Record your entry with discipline';
  }

  emotions = [
    { value: 'Confident', label: 'Confident', icon: '💪' },
    { value: 'Fearful', label: 'Fearful', icon: '😰' },
    { value: 'Greedy', label: 'Greedy', icon: '🤑' },
    { value: 'Bored', label: 'Bored', icon: '😴' },
    { value: 'Frustrated', label: 'Frustrated', icon: '😤' },
    { value: 'Neutral', label: 'Neutral', icon: '😐' }
  ];
  mistakeOptions = ['FOMO', 'Revenge', 'Oversized', 'Chased Entry', 'No Setup', 'Held Too Long', 'Exited Early', 'Broke Rules'];
  brokerageAccounts = signal<BankAccount[]>([]);
  selectedAccount = signal<BankAccount | null>(null);
  estimatedFees = signal(0);
  netPnl = signal(0);
  balanceAfter = signal(0);
  maxRisk = signal<number | null>(null);
  computedR = signal<number | null>(null);
  checklistItems = signal<ChecklistItem[]>([]);
  checkStates = signal<boolean[]>([]);
  allChecked = computed(() => this.checklistItems().length > 0 && this.checkStates().every(c => c));

  private getTimeStr(dateStr?: string): string {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  private parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split('T')[0].split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  form = this.fb.group({
    date: [this.data?.trade?.date ? new Date(this.data.trade.date) : this.data?.targetDate ? new Date(this.data.targetDate + 'T12:00:00') : new Date(), Validators.required],
    time: [this.data?.trade?.entryTime || this.getTimeStr(), Validators.required],
    setupId: [this.data?.checklistPrefill?.setupId ?? this.data?.trade?.setupId ?? null, Validators.required],
    instrument: [this.data?.trade?.instrument ?? 'SPX', Validators.required],
    direction: [this.data?.trade?.direction ?? 'short', Validators.required],
    assetType: [this.data?.trade?.assetType ?? 'Options'],
    spreadType: [this.data?.trade?.spreadType ?? 'Single'],
    optionType: [this.data?.trade?.optionType ?? 'Put'],
    strikePrice: [this.data?.trade?.strikePrice ?? null as number | null],
    strikePrice2: [this.data?.trade?.strikePrice2 ?? null as number | null],
    strikePrice3: [this.data?.trade?.strikePrice3 ?? null as number | null],
    strikePrice4: [this.data?.trade?.strikePrice4 ?? null as number | null],
    expirationDate: [this.data?.trade?.expirationDate ? this.parseLocalDate(this.data.trade.expirationDate) : null],
    entryPremium: [this.data?.trade?.entryPremium ?? null as number | null],
    exitPremium: [this.data?.trade?.exitPremium ?? null as number | null],
    expiredWorthless: [this.data?.trade?.expiredWorthless ?? false],
    entryPrice: [this.data?.trade?.entryPrice ?? null as number | null],
    exitPrice: [this.data?.trade?.exitPrice ?? null as number | null],
    quantity: [this.data?.trade?.quantity ?? 1, [Validators.required, Validators.min(1)]],
    multiplier: [this.data?.trade?.multiplier ?? 100],
    pnl: [this.data?.trade?.pnl ?? null as number | null],
    bankAccountId: [this.data?.trade?.bankAccountId ?? null as number | null],
    commissionFees: [this.data?.trade?.commissionFees ?? null as number | null],
    regExchangeFees: [this.data?.trade?.regExchangeFees ?? null as number | null],
    checklistCompleted: [this.data?.checklistPrefill?.checklistCompleted ?? this.data?.trade?.checklistCompleted ?? false],
    emotionAtEntry: [this.data?.checklistPrefill?.emotionAtEntry ?? this.data?.trade?.emotionAtEntry ?? null as string | null],
    plannedRisk: [this.data?.trade?.plannedRisk ?? null as number | null],
    notes: [this.data?.trade?.notes ?? ''],
    tags: [this.data?.trade?.tags?.join(', ') ?? ''],
    status: [this.data?.trade?.status ?? 'Open'],
    closedDate: [this.data?.trade?.closedDate ? new Date(this.data.trade.closedDate) : new Date()],
    closedTime: [this.data?.trade?.exitTime || this.getTimeStr(this.data?.trade?.closedDate)],
    tradeThesis: [this.data?.trade?.tradeThesis ?? ''],
    stopLoss: [this.data?.trade?.stopLoss ?? null as number | null],
    profitTarget: [this.data?.trade?.profitTarget ?? null as number | null],
    exitReason: [this.data?.trade?.exitReason ?? null as string | null],
    exitEmotion: [this.data?.trade?.exitEmotion ?? null as string | null],
    lessonsLearned: [this.data?.trade?.lessonsLearned ?? ''],
  });

  ngOnInit(): void {
    if (this.data?.closeMode) {
      this.form.patchValue({ status: 'Closed', closedDate: new Date() });
      this.currentStep.set(2);
    }
    if (!this.data?.trade) {
      this.fetchDisciplineStatus();
      this.form.get('date')!.valueChanges.subscribe(d => this.fetchDisciplineStatus(d));
      this.form.get('tradeThesis')!.setValidators([Validators.required, Validators.maxLength(500)]);
      this.form.get('tradeThesis')!.updateValueAndValidity();
      this.form.get('stopLoss')!.setValidators([Validators.required, Validators.min(0.01)]);
      this.form.get('stopLoss')!.updateValueAndValidity();
    }
    this.form.get('setupId')!.valueChanges.subscribe(id => {
      if (id) this.loadChecklist(id);
      else { this.checklistItems.set([]); this.checkStates.set([]); }
    });
    if (this.data?.checklistPrefill) {
      const pf = this.data.checklistPrefill;
      this.checkStates.set(pf.checklistResponses.map(r => r.checked));
      this.loadChecklist(pf.setupId);
    } else if (this.form.value.setupId) {
      this.loadChecklist(this.form.value.setupId);
    }

    this.isMultiStep.set(this.form.value.status === 'Closed');
    this.updateFeeValidators(this.form.value.status as string);
    this.form.get('status')!.valueChanges.subscribe(s => {
      this.isMultiStep.set(s === 'Closed');
      this.updateFeeValidators(s as string);
      this.updateExitValidators(s as string);
    });
    this.updateExitValidators(this.form.value.status as string);
    if (this.data?.trade) {
      const t = this.data.trade;
      if ((t.mistakeTags && t.mistakeTags.length > 0) || t.notes || (t.tags && t.tags.length > 0)) {
        this.showMore.set(true);
      }
    }
    this.accountService.getAll().subscribe({
      next: accounts => {
        const brokerages = accounts.filter(a => a.accountType === 'Brokerage');
        this.brokerageAccounts.set(brokerages);
        if (brokerages.length === 1 && !this.form.value.bankAccountId) {
          this.form.patchValue({ bankAccountId: brokerages[0].id });
        }
        this.updateFeeEstimate();
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private loadChecklist(setupId: number): void {
    this.tradingService.getSetup(setupId).subscribe({
      next: setup => {
        const items = setup.checklistItems || [];
        this.checklistItems.set(items);
        if (this.checkStates().length !== items.length) {
          this.checkStates.set(items.map(() => false));
        }
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  toggleCheck(index: number): void {
    const states = [...this.checkStates()];
    states[index] = !states[index];
    this.checkStates.set(states);
  }

  goToPremarket(): void {
    this.dialogRef.close();
    this.router.navigate(['/trading/flow']);
  }

  private fetchDisciplineStatus(dateOverride?: Date | null): void {
    const d = dateOverride ?? this.form.value.date;
    const dateParam = d instanceof Date
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : undefined;
    this.tradingService.getDisciplineStatus(dateParam).subscribe({
      next: ds => { this.disciplineStatus.set(ds); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  onExpiredWorthlessChange(checked: boolean): void {
    if (checked) {
      this.form.patchValue({ exitPremium: 0 }, { emitEvent: false });
    } else {
      this.form.patchValue({ exitPremium: null }, { emitEvent: false });
    }
    this.calcPnl();
  }

  calcPnl(): void {
    const v = this.form.value;
    if (v.assetType === 'Options' && v.entryPremium != null && v.exitPremium != null && v.quantity && v.multiplier) {
      const dir = v.direction === 'short' ? 1 : -1;
      const pnl = dir * (v.entryPremium - v.exitPremium) * v.multiplier * v.quantity;
      this.form.patchValue({ pnl: Math.round(pnl * 100) / 100 }, { emitEvent: false });
      // max risk for defined-risk spreads: (spread_width - net_premium) * qty * multiplier
      if (v.spreadType === 'Vertical' && v.strikePrice != null && v.strikePrice2 != null) {
        const width = Math.abs(v.strikePrice - v.strikePrice2);
        const risk = (width - v.entryPremium) * v.quantity * v.multiplier;
        this.maxRisk.set(Math.round(risk * 100) / 100);
      } else if (v.spreadType === 'IronCondor' && v.strikePrice != null && v.strikePrice2 != null) {
        const callWidth = Math.abs(v.strikePrice3 != null && v.strikePrice4 != null ? v.strikePrice4 - v.strikePrice3 : 0);
        const putWidth = Math.abs(v.strikePrice2 - v.strikePrice);
        const maxWidth = Math.max(callWidth, putWidth);
        this.maxRisk.set(Math.round((maxWidth - v.entryPremium) * v.quantity * v.multiplier * 100) / 100);
      } else {
        this.maxRisk.set(null);
      }
    } else if (v.assetType !== 'Options' && v.entryPrice != null && v.exitPrice != null && v.quantity && v.multiplier) {
      const dir = v.direction === 'long' ? 1 : -1;
      const pnl = dir * (v.exitPrice - v.entryPrice) * v.multiplier * v.quantity;
      this.form.patchValue({ pnl: Math.round(pnl * 100) / 100 }, { emitEvent: false });
      this.maxRisk.set(null);
    }
    this.updateFeeEstimate();
  }

  private updateFeeValidators(status?: string): void {
    const s = status ?? this.form.value.status;
    const hasAccount = !!this.form.value.bankAccountId;
    const controls = [this.form.get('commissionFees')!, this.form.get('regExchangeFees')!];
    if (s === 'Closed' && hasAccount) {
      controls.forEach(c => { c.setValidators([Validators.required, Validators.min(0)]); c.updateValueAndValidity(); });
    } else {
      controls.forEach(c => { c.clearValidators(); c.updateValueAndValidity(); });
    }
  }

  private updateExitValidators(status?: string): void {
    const s = status ?? this.form.value.status;
    const exitReasonCtrl = this.form.get('exitReason')!;
    if (s === 'Closed') {
      exitReasonCtrl.setValidators([Validators.required]);
    } else {
      exitReasonCtrl.clearValidators();
    }
    exitReasonCtrl.updateValueAndValidity();
  }

  onFeesChanged(): void {
    const v = this.form.value;
    const commission = v.commissionFees ?? 0;
    const regExchange = v.regExchangeFees ?? 0;
    const fees = commission + regExchange;
    const net = (v.pnl ?? 0) - fees;
    this.estimatedFees.set(Math.round(fees * 100) / 100);
    this.netPnl.set(Math.round(net * 100) / 100);
    const acct = this.selectedAccount();
    if (acct) this.balanceAfter.set(Math.round((acct.currentBalance + net) * 100) / 100);
    this.updateComputedR();
  }

  private updateFeeEstimate(): void {
    const v = this.form.value;
    const acct = this.brokerageAccounts().find(a => a.id === v.bankAccountId) ?? null;
    this.selectedAccount.set(acct);
    this.updateFeeValidators();
    if (!acct || !v.quantity) {
      this.estimatedFees.set(0);
      this.netPnl.set(v.pnl ?? 0);
      this.updateComputedR();
      return;
    }
    const commission = this.form.value.commissionFees ?? 0;
    const regExchange = this.form.value.regExchangeFees ?? 0;
    const fees = commission + regExchange;
    const net = (v.pnl ?? 0) - fees;
    this.estimatedFees.set(Math.round(fees * 100) / 100);
    this.netPnl.set(Math.round(net * 100) / 100);
    this.balanceAfter.set(Math.round((acct.currentBalance + net) * 100) / 100);
    this.updateComputedR();
  }

  private updateComputedR(): void {
    const pnl = this.form.value.pnl;
    const risk = this.form.value.plannedRisk;
    if (pnl != null && risk != null && risk > 0) {
      const fees = this.estimatedFees();
      const netPnl = pnl - fees;
      this.computedR.set(Math.round((netPnl / risk) * 100) / 100);
    } else {
      this.computedR.set(null);
    }
  }

  toggleMistake(tag: string): void {
    const current = this.selectedMistakes();
    if (current.includes(tag)) {
      this.selectedMistakes.set(current.filter(t => t !== tag));
    } else {
      this.selectedMistakes.set([...current, tag]);
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const d = val.date instanceof Date ? val.date : new Date(val.date!);
    const [hh, mm] = (val.time || '00:00').split(':').map(Number);
    d.setHours(hh, mm, 0, 0);

    if (val.status === 'Closed' && val.closedDate) {
      const cd = val.closedDate instanceof Date ? val.closedDate : new Date(val.closedDate);
      const entryOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const closeOnly = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate());
      if (closeOnly < entryOnly) {
        this.notify.error('Close date cannot be before entry date.');
        return;
      }
    }
    const payload: Partial<TradeEntry> = {
      date: toLocalISOString(d),
      entryTime: val.time || undefined,
      setupId: val.setupId!,
      instrument: val.instrument!,
      direction: (val.direction ?? 'long') as TradeDirection,
      entryPrice: val.entryPrice ?? 0,
      exitPrice: val.status === 'Closed' ? (val.exitPrice ?? undefined) : undefined,
      quantity: val.quantity!,
      pnl: val.status === 'Closed' ? (val.pnl ?? undefined) : undefined,
      checklistCompleted: this.checklistItems().length > 0 ? this.allChecked() : (val.checklistCompleted ?? false),
      notes: val.notes || undefined,
      tags: val.tags ? val.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      isRevengeTrading: this.selectedMistakes().includes('Revenge'),
      emotionAtEntry: val.emotionAtEntry || undefined,
      plannedRisk: val.plannedRisk ?? undefined,
      stopLoss: val.stopLoss ?? undefined,
      profitTarget: val.profitTarget ?? undefined,
      tradeThesis: val.tradeThesis || undefined,
      exitReason: val.status === 'Closed' ? (val.exitReason as ExitReason || undefined) : undefined,
      exitEmotion: val.status === 'Closed' ? (val.exitEmotion || undefined) : undefined,
      lessonsLearned: val.status === 'Closed' ? (val.lessonsLearned || undefined) : undefined,
      mistakeTags: this.selectedMistakes().length > 0 ? this.selectedMistakes() : undefined,
      checklistResponses: this.checklistItems().length > 0
        ? this.checklistItems().map((item, i) => ({
            checklistItemId: item.id ?? 0,
            label: item.label,
            checked: this.checkStates()[i] ?? false
          }))
        : (this.data?.checklistPrefill?.checklistResponses ?? []),
      assetType: val.assetType ?? 'Options',
      optionType: val.assetType === 'Options' && val.spreadType !== 'IronCondor' ? val.optionType ?? undefined : undefined,
      spreadType: val.assetType === 'Options' ? val.spreadType ?? undefined : undefined,
      strikePrice: val.strikePrice ?? undefined,
      strikePrice2: val.strikePrice2 ?? undefined,
      strikePrice3: val.strikePrice3 ?? undefined,
      strikePrice4: val.strikePrice4 ?? undefined,
      expirationDate: val.expirationDate instanceof Date
        ? `${val.expirationDate.getFullYear()}-${String(val.expirationDate.getMonth() + 1).padStart(2, '0')}-${String(val.expirationDate.getDate()).padStart(2, '0')}`
        : val.expirationDate ?? undefined,
      entryPremium: val.entryPremium ?? undefined,
      exitPremium: val.status === 'Closed' ? (val.exitPremium ?? undefined) : undefined,
      expiredWorthless: val.status === 'Closed' ? (val.expiredWorthless ?? false) : false,
      bankAccountId: val.status === 'Closed' ? (val.bankAccountId ?? undefined) : undefined,
      commissionFees: val.status === 'Closed' ? (val.commissionFees ?? undefined) : undefined,
      regExchangeFees: val.status === 'Closed' ? (val.regExchangeFees ?? undefined) : undefined,
      multiplier: val.multiplier ?? 100,
      status: (val.status as TradeStatus) ?? 'Open',
      closedDate: val.status === 'Closed' && val.closedDate instanceof Date
        ? (() => { const cd = new Date(val.closedDate!); const [ch, cm] = (val.closedTime || '00:00').split(':').map(Number); cd.setHours(ch, cm, 0, 0); return toLocalISOString(cd); })()
        : val.status === 'Closed' && val.closedDate ? val.closedDate as unknown as string : undefined,
      exitTime: val.status === 'Closed' ? (val.closedTime || undefined) : undefined
    };

    this.saving.set(true);
    const obs = this.data.trade
      ? this.tradingService.updateTrade(this.data.trade.id, payload)
      : this.tradingService.createTrade(payload);

    obs.subscribe({
      next: () => { this.saving.set(false); this.notify.success('Trade saved'); this.cdr.detectChanges(); this.dialogRef.close(true); },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 422 && err.error?.violations) {
          const msgs = err.error.violations.map((v: any) => v.message || v).join(' ');
          this.notify.error(msgs);
        } else {
          const msg = err?.error?.error || err?.error?.title || 'Failed to save trade';
          this.notify.error(msg);
        }
        this.cdr.detectChanges();
      }
    });
  }
}
