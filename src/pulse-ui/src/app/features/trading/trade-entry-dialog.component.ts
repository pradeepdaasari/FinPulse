import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TradingService } from '../../core/services/trading.service';
import { TradeEntry, TradingSetupSummary } from '../../core/models/trading.model';
import { NotificationService } from '../../core/services/notification.service';

export interface TradeEntryDialogData {
  trade: TradeEntry | null;
  setups: TradingSetupSummary[];
}

@Component({
  selector: 'app-trade-entry-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatButtonToggleModule, MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">{{ data?.trade ? 'edit' : 'add_chart' }}</mat-icon>
      {{ data?.trade ? 'Edit' : 'Log' }} Trade
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="trade-form">
        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

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
            <mat-option value="ES">ES (Futures)</mat-option>
            <mat-option value="NQ">NQ (Futures)</mat-option>
            <mat-option value="Other">Other</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="direction-row">
          <span class="field-label">Direction</span>
          <mat-button-toggle-group formControlName="direction" class="dir-toggle">
            <mat-button-toggle value="long" class="toggle-long">
              <mat-icon>arrow_upward</mat-icon> Long
            </mat-button-toggle>
            <mat-button-toggle value="short" class="toggle-short">
              <mat-icon>arrow_downward</mat-icon> Short
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <div class="price-row">
          <mat-form-field appearance="outline">
            <mat-label>Entry Price</mat-label>
            <input matInput type="number" formControlName="entryPrice" step="0.01">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Exit Price</mat-label>
            <input matInput type="number" formControlName="exitPrice" step="0.01">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        <div class="price-row">
          <mat-form-field appearance="outline">
            <mat-label>Contracts</mat-label>
            <input matInput type="number" formControlName="quantity" min="1">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>P&L (manual)</mat-label>
            <input matInput type="number" formControlName="pnl" step="0.01">
            <span matTextPrefix>$&nbsp;</span>
            <mat-hint>Auto-fills if entry+exit provided</mat-hint>
          </mat-form-field>
        </div>

        <mat-checkbox formControlName="checklistCompleted" color="primary">
          Checklist was completed before this trade
        </mat-checkbox>

        <mat-form-field appearance="outline">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="3" placeholder="What went well? What could improve?"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tags (optional)</mat-label>
          <input matInput formControlName="tags" placeholder="e.g. 0DTE, scalp, breakout">
          <mat-hint>Comma-separated</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
        <mat-icon>save</mat-icon> {{ data?.trade ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title-icon { vertical-align: middle; margin-right: 8px; color: var(--color-primary); }
    .trade-form { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .direction-row { margin-bottom: 12px; }
    .field-label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 6px; }
    .dir-toggle { width: 100%; }
    .dir-toggle .mat-button-toggle { flex: 1; }
    ::ng-deep .dir-toggle .mat-button-toggle-checked.toggle-long {
      background: var(--color-stat-green-bg) !important; color: var(--color-success) !important;
    }
    ::ng-deep .dir-toggle .mat-button-toggle-checked.toggle-short {
      background: var(--color-stat-red-bg) !important; color: var(--color-danger) !important;
    }
    .price-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-checkbox { margin-bottom: 8px; }
    @media (max-width: 599px) {
      .price-row { grid-template-columns: 1fr; }
    }
  `]
})
export class TradeEntryDialogComponent {
  private fb = inject(FormBuilder);
  private tradingService = inject(TradingService);
  private dialogRef = inject(MatDialogRef<TradeEntryDialogComponent>);
  private notify = inject(NotificationService);
  data: TradeEntryDialogData = inject(MAT_DIALOG_DATA);

  form = this.fb.group({
    date: [this.data?.trade?.date ? new Date(this.data.trade.date) : new Date(), Validators.required],
    setupId: [this.data?.trade?.setupId ?? null, Validators.required],
    instrument: [this.data?.trade?.instrument ?? 'SPX', Validators.required],
    direction: [this.data?.trade?.direction ?? 'long', Validators.required],
    entryPrice: [this.data?.trade?.entryPrice ?? null as number | null, Validators.required],
    exitPrice: [this.data?.trade?.exitPrice ?? null as number | null],
    quantity: [this.data?.trade?.quantity ?? 1, [Validators.required, Validators.min(1)]],
    pnl: [this.data?.trade?.pnl ?? null as number | null],
    checklistCompleted: [this.data?.trade?.checklistCompleted ?? false],
    notes: [this.data?.trade?.notes ?? ''],
    tags: [this.data?.trade?.tags?.join(', ') ?? '']
  });

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload: Partial<TradeEntry> = {
      date: val.date instanceof Date ? val.date.toISOString().split('T')[0] : String(val.date!),
      setupId: val.setupId!,
      instrument: val.instrument!,
      direction: val.direction as any,
      entryPrice: val.entryPrice!,
      exitPrice: val.exitPrice ?? undefined,
      quantity: val.quantity!,
      pnl: val.pnl ?? undefined,
      checklistCompleted: val.checklistCompleted ?? false,
      notes: val.notes || undefined,
      tags: val.tags ? val.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      isRevengeTrading: false,
      checklistResponses: []
    };

    const obs = this.data.trade
      ? this.tradingService.updateTrade(this.data.trade.id, payload)
      : this.tradingService.createTrade(payload);

    obs.subscribe({
      next: () => { this.notify.success('Trade saved'); this.dialogRef.close(true); },
      error: () => this.notify.error('Failed to save trade')
    });
  }
}
