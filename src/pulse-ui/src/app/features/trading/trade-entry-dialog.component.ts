import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { TradeEntry, TradeDirection, TradeStatus, TradingSetupSummary } from '../../core/models/trading.model';
import { BankAccount } from '../../core/models/bank-account.model';
import { NotificationService } from '../../core/services/notification.service';
import { RichTextEditorComponent } from '../../shared/rich-text-editor.component';

export interface TradeEntryDialogData {
  trade: TradeEntry | null;
  setups: TradingSetupSummary[];
  closeMode?: boolean;
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

        <!-- Compact date + time row -->
        <div class="date-compact-row" (click)="picker.open()">
          <mat-icon class="date-icon">calendar_today</mat-icon>
          <div class="date-value">{{ form.value.date | date:'MMM d, yyyy' }}</div>
          <div class="date-sep">|</div>
          <mat-icon class="date-icon" (click)="$event.stopPropagation(); timeInput.showPicker()">schedule</mat-icon>
          <input #timeInput type="time" class="time-input" formControlName="time" (click)="$event.stopPropagation(); timeInput.showPicker()">
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
          @if (form.value.status === 'Closed') {
            <div class="closed-date-field" (click)="closedPicker.open()">
              <mat-icon class="date-icon">event_available</mat-icon>
              <span class="closed-date-value">Closed {{ form.value.closedDate | date:'MMM d, yyyy' }}</span>
              <input matInput [matDatepicker]="closedPicker" formControlName="closedDate" class="hidden-date-input">
              <mat-datepicker #closedPicker></mat-datepicker>
            </div>
          }
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

            <!-- Premiums -->
            <div [class]="form.value.status === 'Closed' ? 'row-2col' : 'full-width'">
              <mat-form-field appearance="outline" [class.full-width]="form.value.status !== 'Closed'">
                <mat-label>Entry Premium</mat-label>
                <input matInput type="number" inputmode="decimal" formControlName="entryPremium" step="0.01" (input)="calcPnl()">
                <span matTextPrefix>$</span>
              </mat-form-field>
              @if (form.value.status === 'Closed') {
                <mat-form-field appearance="outline">
                  <mat-label>Exit Premium</mat-label>
                  <input matInput type="number" inputmode="decimal" formControlName="exitPremium" step="0.01" (input)="calcPnl()" [readonly]="!!form.value.expiredWorthless">
                  <span matTextPrefix>$</span>
                </mat-form-field>
              }
            </div>
            @if (form.value.status === 'Closed') {
              <mat-checkbox formControlName="expiredWorthless" color="primary" class="expired-check" (change)="onExpiredWorthlessChange($event.checked)">
                Expired Worthless <span class="expired-hint">(no exit brokerage — option expired, not closed)</span>
              </mat-checkbox>
            }
          </div>
        } @else {
          <!-- Non-options: standard price fields -->
          <div [class]="form.value.status === 'Closed' ? 'row-2col' : 'full-width'">
            <mat-form-field appearance="outline" [class.full-width]="form.value.status !== 'Closed'">
              <mat-label>Entry Price</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="entryPrice" step="0.01" (input)="calcPnl()">
              <span matTextPrefix>$</span>
            </mat-form-field>
            @if (form.value.status === 'Closed') {
              <mat-form-field appearance="outline">
                <mat-label>Exit Price</mat-label>
                <input matInput type="number" inputmode="decimal" formControlName="exitPrice" step="0.01" (input)="calcPnl()">
                <span matTextPrefix>$</span>
              </mat-form-field>
            }
          </div>
        }

        <!-- Contracts, Multiplier, P&L, Risk -->
        @if (form.value.status === 'Closed') {
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
        } @else {
          <div class="row-2col">
            <mat-form-field appearance="outline">
              <mat-label>Qty</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="quantity" min="1">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Multiplier</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="multiplier" min="1">
            </mat-form-field>
          </div>
        }

        <!-- Brokerage + Fees (only when closing) -->
        @if (form.value.status === 'Closed' && brokerageAccounts().length > 0) {
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

        <mat-checkbox formControlName="checklistCompleted" color="primary" class="checklist-check">
          Checklist completed
        </mat-checkbox>

        <!-- Emotion at entry -->
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
      </form>
      }
      @if (saving()) {
        <div class="saving-overlay"><mat-spinner diameter="32"></mat-spinner></div>
      }
    </mat-dialog-content>
    <div class="save-bar">
      <button class="save-btn" (click)="save()" [disabled]="form.invalid || loading() || saving()">
        @if (saving()) {
          <mat-spinner diameter="20" class="save-spinner"></mat-spinner>
          Saving...
        } @else {
          <mat-icon>{{ data?.closeMode ? 'lock' : (data?.trade ? 'check' : 'save') }}</mat-icon>
          {{ data?.closeMode ? 'Close Trade' : (data?.trade ? 'Update Trade' : (form.value.status === 'Open' ? 'Open Trade' : 'Save Trade')) }}
        }
      </button>
    </div>
  `,
  styles: [`
    .dialog-banner {
      position: relative; padding: 18px 24px 14px;
      background: var(--gradient-primary); overflow: hidden;
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

    .trade-form { display: flex; flex-direction: column; gap: 12px; min-width: 0; padding-top: 12px; }

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
      cursor: pointer; transition: all 0.15s;
    }
    .mistake-chip:hover { border-color: var(--color-text-muted); }
    .mistake-chip.selected {
      background: var(--color-stat-red-bg); color: var(--color-danger);
      border-color: var(--color-danger);
    }
    .expired-check { margin: 4px 0 10px; display: block; }
    .expired-hint { font-size: 0.72rem; color: var(--color-text-muted); margin-left: 4px; }
    .max-risk-line { border-top: 1px dashed var(--color-border, #e0e0e0); padding-top: 4px; margin-top: 2px; }

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
      flex-shrink: 0;
      padding: 12px 24px 16px;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
    }
    .save-btn {
      width: 100%; height: 48px; border: none; border-radius: var(--radius-sm);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.95rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
      transition: all 0.2s;
    }
    .save-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4); transform: translateY(-1px); }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    ::ng-deep .save-spinner circle { stroke: #fff !important; }

    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    mat-dialog-content { position: relative; }
    .saving-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); border-radius: inherit; z-index: 10;
    }
    @media (max-width: 1024px) {
      .row-2col { grid-template-columns: 1fr 1fr; }
      .toggle-row.row-2col { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 599px) {
      :host { display: flex; flex-direction: column; height: 100%; min-height: 0; max-width: 100%; overflow: hidden; }
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
    }
  `]
})
export class TradeEntryDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tradingService = inject(TradingService);
  private accountService = inject(BankAccountService);
  private dialogRef = inject(MatDialogRef<TradeEntryDialogComponent>);
  private notify = inject(NotificationService);
  data: TradeEntryDialogData = inject(MAT_DIALOG_DATA);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  showMore = signal(false);
  selectedMistakes = signal<string[]>(this.data?.trade?.mistakeTags ?? []);

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

  private getTimeStr(dateStr?: string): string {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  private parseLocalDate(dateStr: string): Date {
    const parts = dateStr.split('T')[0].split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  form = this.fb.group({
    date: [this.data?.trade?.date ? new Date(this.data.trade.date) : new Date(), Validators.required],
    time: [this.getTimeStr(this.data?.trade?.date), Validators.required],
    setupId: [this.data?.trade?.setupId ?? null, Validators.required],
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
    checklistCompleted: [this.data?.trade?.checklistCompleted ?? false],
    emotionAtEntry: [this.data?.trade?.emotionAtEntry ?? null as string | null],
    plannedRisk: [this.data?.trade?.plannedRisk ?? null as number | null],
    notes: [this.data?.trade?.notes ?? ''],
    tags: [this.data?.trade?.tags?.join(', ') ?? ''],
    status: [this.data?.trade?.status ?? 'Open'],
    closedDate: [this.data?.trade?.closedDate ? new Date(this.data.trade.closedDate) : new Date()]
  });

  ngOnInit(): void {
    if (this.data?.closeMode) {
      this.form.patchValue({ status: 'Closed', closedDate: new Date() });
    }
    this.updateFeeValidators(this.form.value.status as string);
    this.form.get('status')!.valueChanges.subscribe(s => this.updateFeeValidators(s as string));
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
    const payload: Partial<TradeEntry> = {
      date: toLocalISOString(d),
      setupId: val.setupId!,
      instrument: val.instrument!,
      direction: (val.direction ?? 'long') as TradeDirection,
      entryPrice: val.entryPrice ?? 0,
      exitPrice: val.status === 'Closed' ? (val.exitPrice ?? undefined) : undefined,
      quantity: val.quantity!,
      pnl: val.status === 'Closed' ? (val.pnl ?? undefined) : undefined,
      checklistCompleted: val.checklistCompleted ?? false,
      notes: val.notes || undefined,
      tags: val.tags ? val.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      isRevengeTrading: this.selectedMistakes().includes('Revenge'),
      emotionAtEntry: val.emotionAtEntry || undefined,
      plannedRisk: val.plannedRisk ?? undefined,
      mistakeTags: this.selectedMistakes().length > 0 ? this.selectedMistakes() : undefined,
      checklistResponses: [],
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
        ? toLocalISOString(val.closedDate)
        : val.status === 'Closed' && val.closedDate ? val.closedDate as unknown as string : undefined
    };

    this.saving.set(true);
    const obs = this.data.trade
      ? this.tradingService.updateTrade(this.data.trade.id, payload)
      : this.tradingService.createTrade(payload);

    obs.subscribe({
      next: () => { this.saving.set(false); this.notify.success('Trade saved'); this.cdr.detectChanges(); this.dialogRef.close(true); },
      error: (err) => { this.saving.set(false); const msg = err?.error?.error || err?.error?.title || 'Failed to save trade'; this.notify.error(msg); console.error('Trade save error:', err); this.cdr.detectChanges(); }
    });
  }
}
