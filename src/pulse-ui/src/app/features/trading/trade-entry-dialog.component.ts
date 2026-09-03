import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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
import { TradingService } from '../../core/services/trading.service';
import { toLocalISOString } from '../../core/utils/date-utils';
import { BankAccountService } from '../../core/services/bank-account.service';
import { TradeEntry, TradingSetupSummary } from '../../core/models/trading.model';
import { BankAccount } from '../../core/models/bank-account.model';
import { NotificationService } from '../../core/services/notification.service';
import { RichTextEditorComponent } from '../../shared/rich-text-editor.component';

export interface TradeEntryDialogData {
  trade: TradeEntry | null;
  setups: TradingSetupSummary[];
}

@Component({
  selector: 'app-trade-entry-dialog',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule,
    MatButtonModule, MatIconModule, MatButtonToggleModule, MatCheckboxModule, MatProgressSpinnerModule,
    RichTextEditorComponent
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="dialog-header">
      <div class="header-icon" [class.edit-mode]="!!data?.trade">
        <mat-icon>{{ data?.trade ? 'edit' : 'add_chart' }}</mat-icon>
      </div>
      <h2>{{ data?.trade ? 'Edit' : 'Log' }} Trade</h2>
    </div>

    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="trade-form">

        <!-- Row 1: Date + Time -->
        <div class="row-2col">
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Time</mat-label>
            <input matInput type="time" formControlName="time">
            <mat-icon matSuffix>schedule</mat-icon>
          </mat-form-field>
        </div>

        <!-- Row 2: Setup + Instrument -->
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

        <!-- Row 2: Direction + Asset Type side by side -->
        <div class="row-2col">
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
                <input matInput type="number" formControlName="strikePrice" step="1">
              </mat-form-field>
            } @else if (form.value.spreadType === 'Calendar') {
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Strike</mat-label>
                <input matInput type="number" formControlName="strikePrice" step="1">
              </mat-form-field>
            } @else if (form.value.spreadType === 'Vertical') {
              <div class="row-2col">
                <mat-form-field appearance="outline">
                  <mat-label>Short Strike</mat-label>
                  <input matInput type="number" formControlName="strikePrice" step="1" (input)="calcPnl()">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Long Strike</mat-label>
                  <input matInput type="number" formControlName="strikePrice2" step="1" (input)="calcPnl()">
                </mat-form-field>
              </div>
            } @else if (form.value.spreadType === 'IronCondor') {
              <div class="row-4col">
                <mat-form-field appearance="outline">
                  <mat-label>SC</mat-label>
                  <input matInput type="number" formControlName="strikePrice" step="1" (input)="calcPnl()">
                  <mat-hint>Short Call</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>LC</mat-label>
                  <input matInput type="number" formControlName="strikePrice2" step="1" (input)="calcPnl()">
                  <mat-hint>Long Call</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>SP</mat-label>
                  <input matInput type="number" formControlName="strikePrice3" step="1" (input)="calcPnl()">
                  <mat-hint>Short Put</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>LP</mat-label>
                  <input matInput type="number" formControlName="strikePrice4" step="1" (input)="calcPnl()">
                  <mat-hint>Long Put</mat-hint>
                </mat-form-field>
              </div>
            } @else if (form.value.spreadType === 'Butterfly') {
              <div class="row-3col">
                <mat-form-field appearance="outline">
                  <mat-label>Lower</mat-label>
                  <input matInput type="number" formControlName="strikePrice" step="1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Middle</mat-label>
                  <input matInput type="number" formControlName="strikePrice2" step="1">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Upper</mat-label>
                  <input matInput type="number" formControlName="strikePrice3" step="1">
                </mat-form-field>
              </div>
            }

            <!-- Premiums -->
            <div class="row-2col">
              <mat-form-field appearance="outline">
                <mat-label>Entry Premium</mat-label>
                <input matInput type="number" formControlName="entryPremium" step="0.01" (input)="calcPnl()">
                <span matTextPrefix>$</span>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Exit Premium</mat-label>
                <input matInput type="number" formControlName="exitPremium" step="0.01" (input)="calcPnl()" [readonly]="!!form.value.expiredWorthless">
                <span matTextPrefix>$</span>
              </mat-form-field>
            </div>
            <mat-checkbox formControlName="expiredWorthless" color="primary" class="expired-check" (change)="onExpiredWorthlessChange($event.checked)">
              Expired Worthless <span class="expired-hint">(no exit brokerage — option expired, not closed)</span>
            </mat-checkbox>
          </div>
        } @else {
          <!-- Non-options: standard price fields -->
          <div class="row-2col">
            <mat-form-field appearance="outline">
              <mat-label>Entry Price</mat-label>
              <input matInput type="number" formControlName="entryPrice" step="0.01" (input)="calcPnl()">
              <span matTextPrefix>$</span>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Exit Price</mat-label>
              <input matInput type="number" formControlName="exitPrice" step="0.01" (input)="calcPnl()">
              <span matTextPrefix>$</span>
            </mat-form-field>
          </div>
        }

        <!-- Contracts, Multiplier, P&L -->
        <div class="row-3col">
          <mat-form-field appearance="outline">
            <mat-label>Qty</mat-label>
            <input matInput type="number" formControlName="quantity" min="1" (input)="calcPnl()">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Multiplier</mat-label>
            <input matInput type="number" formControlName="multiplier" min="1" (input)="calcPnl()">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>P&L</mat-label>
            <input matInput type="number" formControlName="pnl" step="0.01">
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
                  <input matInput type="number" formControlName="commissionFees" step="0.01" (input)="onFeesChanged()">
                  <span matTextPrefix>$</span>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Reg + Exchange</mat-label>
                  <input matInput type="number" formControlName="regExchangeFees" step="0.01" (input)="onFeesChanged()">
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
              </div>
            </div>
          }
        }

        <!-- Bottom row: checklist + notes + tags -->
        <mat-checkbox formControlName="checklistCompleted" color="primary" class="checklist-check">
          Checklist completed
        </mat-checkbox>

        <app-rich-text-editor label="Notes" formControlName="notes" height="80px"
          placeholder="Quick notes..."></app-rich-text-editor>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tags</mat-label>
          <input matInput formControlName="tags" placeholder="0DTE, scalp, breakout">
          <mat-hint>Comma-separated</mat-hint>
        </mat-form-field>
      </form>
      }
      @if (saving()) {
        <div class="saving-overlay"><mat-spinner diameter="32"></mat-spinner></div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || loading() || saving()">
        <mat-icon>{{ data?.trade ? 'check' : 'save' }}</mat-icon>
        {{ data?.trade ? 'Update' : 'Save Trade' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 24px 10px; margin: -24px -24px 0;
      background: var(--gradient-primary); border-radius: 4px 4px 0 0;
    }
    .header-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .header-icon mat-icon { color: #fff; font-size: 20px; width: 20px; height: 20px; }
    .header-icon.edit-mode { background: rgba(255,255,255,0.25); }
    .dialog-header h2 { margin: 0; color: #fff; font-size: 1.1rem; font-weight: 700; }

    .trade-form { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding-top: 12px; }

    .row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center; }
    .row-3col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; align-items: start; }
    .row-4col { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; }
    .full-width { width: 100%; }

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
      border: 1.5px solid var(--color-stat-blue);
      border-radius: var(--radius-md);
      padding: 14px 12px 8px;
      margin: 6px 0 14px;
      background: color-mix(in srgb, var(--color-stat-blue-bg) 30%, transparent);
    }
    .options-section .row-2col,
    .options-section .row-3col,
    .options-section .row-4col { margin-bottom: 0; }

    .fees-section {
      border: 1.5px solid var(--color-stat-amber);
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

    ::ng-deep .trade-form .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .trade-form .mat-mdc-form-field-hint-wrapper { display: none; }
    ::ng-deep .options-section .mat-mdc-form-field-subscript-wrapper { display: block; }

    .checklist-check { margin: 6px 0; }
    .expired-check { margin: 4px 0 10px; display: block; }
    .expired-hint { font-size: 0.72rem; color: var(--color-text-muted); margin-left: 4px; }
    .max-risk-line { border-top: 1px dashed var(--color-border, #e0e0e0); padding-top: 4px; margin-top: 2px; }

    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    mat-dialog-content { position: relative; }
    .saving-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); border-radius: inherit; z-index: 10;
    }
    @media (max-width: 599px) {
      :host { max-width: 100%; overflow: hidden; }
      .dialog-header { padding: 14px 16px 8px; margin: -16px -16px 0; }
      .trade-form { max-width: 100%; overflow: hidden; box-sizing: border-box; }
      .row-3col { grid-template-columns: 1fr 1fr; }
      .row-4col { grid-template-columns: 1fr 1fr; }
      .row-2col { grid-template-columns: 1fr; }
      .compact-toggle { height: 44px; }
      .fees-section { margin-left: 0; margin-right: 0; overflow: hidden; max-width: 100%; box-sizing: border-box; padding: 10px 8px 8px; }
      .fees-inputs { grid-template-columns: 1fr 1fr; gap: 8px; }
      .fee-summary-bar { gap: 4px; flex-wrap: wrap; }
      .fee-chip { font-size: 0.7rem; padding: 4px 8px; }
      .options-section { padding: 10px 8px 6px; overflow: hidden; max-width: 100%; box-sizing: border-box; }
      .expired-hint { display: block; margin-left: 0; margin-top: 2px; }
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

  loading = signal(true);
  saving = signal(false);
  feesManuallyEdited = false;
  brokerageAccounts = signal<BankAccount[]>([]);
  selectedAccount = signal<BankAccount | null>(null);
  estimatedFees = signal(0);
  netPnl = signal(0);
  balanceAfter = signal(0);
  maxRisk = signal<number | null>(null);

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
    notes: [this.data?.trade?.notes ?? ''],
    tags: [this.data?.trade?.tags?.join(', ') ?? '']
  });

  ngOnInit(): void {
    if (this.data?.trade?.commissionFees != null || this.data?.trade?.regExchangeFees != null) {
      this.feesManuallyEdited = true;
    }
    this.accountService.getAll().subscribe(accounts => {
      const brokerages = accounts.filter(a => a.accountType === 'Brokerage');
      this.brokerageAccounts.set(brokerages);
      if (!this.data?.trade && brokerages.length === 1) {
        this.form.patchValue({ bankAccountId: brokerages[0].id });
      }
      this.updateFeeEstimate();
      this.loading.set(false);
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

  onFeesChanged(): void {
    this.feesManuallyEdited = true;
    const v = this.form.value;
    const commission = v.commissionFees ?? 0;
    const regExchange = v.regExchangeFees ?? 0;
    const fees = commission + regExchange;
    const net = (v.pnl ?? 0) - fees;
    this.estimatedFees.set(Math.round(fees * 100) / 100);
    this.netPnl.set(Math.round(net * 100) / 100);
    const acct = this.selectedAccount();
    if (acct) this.balanceAfter.set(Math.round((acct.currentBalance + net) * 100) / 100);
  }

  private updateFeeEstimate(): void {
    const v = this.form.value;
    const acct = this.brokerageAccounts().find(a => a.id === v.bankAccountId) ?? null;
    this.selectedAccount.set(acct);
    if (!acct || !v.quantity) {
      this.estimatedFees.set(0);
      this.netPnl.set(v.pnl ?? 0);
      if (!acct) this.feesManuallyEdited = false;
      return;
    }
    if (!this.feesManuallyEdited) {
      const commissionRate = v.assetType === 'Futures'
        ? (acct.futuresCommissionPerContract ?? 0)
        : (acct.optionsCommissionPerContract ?? 0);
      const regFeeRate = v.assetType === 'Futures'
        ? (acct.futuresRegFeePerContract ?? 0)
        : (acct.optionsRegFeePerContract ?? 0);
      const legs = v.assetType === 'Options' ? this.getLegsForSpread(v.spreadType) : 1;
      const multiplier = v.quantity * legs * (v.expiredWorthless ? 1 : 2);
      const commission = Math.round(commissionRate * multiplier * 100) / 100;
      const regExchange = Math.round(regFeeRate * multiplier * 100) / 100;
      this.form.patchValue({ commissionFees: commission, regExchangeFees: regExchange }, { emitEvent: false });
    }
    const commission = this.form.value.commissionFees ?? 0;
    const regExchange = this.form.value.regExchangeFees ?? 0;
    const fees = commission + regExchange;
    const net = (v.pnl ?? 0) - fees;
    this.estimatedFees.set(Math.round(fees * 100) / 100);
    this.netPnl.set(Math.round(net * 100) / 100);
    this.balanceAfter.set(Math.round((acct.currentBalance + net) * 100) / 100);
  }

  private getLegsForSpread(spreadType: string | null | undefined): number {
    switch (spreadType) {
      case 'Vertical': case 'Calendar': return 2;
      case 'Butterfly': return 3;
      case 'IronCondor': return 4;
      default: return 1;
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
      direction: val.direction as any,
      entryPrice: val.entryPrice ?? 0,
      exitPrice: val.exitPrice ?? undefined,
      quantity: val.quantity!,
      pnl: val.pnl ?? undefined,
      checklistCompleted: val.checklistCompleted ?? false,
      notes: val.notes || undefined,
      tags: val.tags ? val.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      isRevengeTrading: false,
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
      exitPremium: val.exitPremium ?? undefined,
      expiredWorthless: val.expiredWorthless ?? false,
      bankAccountId: val.bankAccountId ?? undefined,
      commissionFees: val.commissionFees ?? undefined,
      regExchangeFees: val.regExchangeFees ?? undefined,
      multiplier: val.multiplier ?? 100
    };

    this.saving.set(true);
    const obs = this.data.trade
      ? this.tradingService.updateTrade(this.data.trade.id, payload)
      : this.tradingService.createTrade(payload);

    obs.subscribe({
      next: () => { this.saving.set(false); this.notify.success('Trade saved'); this.dialogRef.close(true); },
      error: (err) => { this.saving.set(false); const msg = err?.error?.error || err?.error?.title || 'Failed to save trade'; this.notify.error(msg); console.error('Trade save error:', err); }
    });
  }
}
