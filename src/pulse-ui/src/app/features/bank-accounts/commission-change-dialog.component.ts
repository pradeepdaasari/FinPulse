import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { toLocalDateString } from '../../core/utils/date-utils';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { BankAccountService } from '../../core/services/bank-account.service';

export interface CommissionChangeDialogData {
  accountId: number;
  accountName: string;
  oldRates: {
    optionsCommission?: number | null;
    futuresCommission?: number | null;
    optionsRegFee?: number | null;
    futuresRegFee?: number | null;
  };
  newRates: {
    optionsCommission?: number | null;
    futuresCommission?: number | null;
    optionsRegFee?: number | null;
    futuresRegFee?: number | null;
  };
}

@Component({
  selector: 'app-commission-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>history</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>Commission Rate Change</h2>
        <span class="dialog-subtitle">{{ data.accountName }}</span>
      </div>
    </div>
    <mat-dialog-content>
      <!-- Changes Summary -->
      <div class="changes-summary">
        @for (change of changes; track change.label) {
          <div class="change-row">
            <span class="change-label">{{ change.label }}</span>
            <span class="change-old">{{ change.old | currency:'USD':'symbol':'1.2-4' }}</span>
            <mat-icon class="arrow-icon">arrow_forward</mat-icon>
            <span class="change-new">{{ change.new | currency:'USD':'symbol':'1.2-4' }}</span>
          </div>
        }
      </div>

      <!-- Application Mode -->
      <div class="apply-section">
        <p class="apply-label">From which date should the new rates apply?</p>
        <mat-radio-group [ngModel]="mode()" (ngModelChange)="mode.set($event)" class="mode-group">
          <mat-radio-button value="today">Apply to new trades only (today)</mat-radio-button>
          <mat-radio-button value="custom">Recalculate from a specific date</mat-radio-button>
        </mat-radio-group>

        @if (mode() === 'custom') {
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>Effective From</mat-label>
            <input matInput [matDatepicker]="picker" [ngModel]="effectiveDate()" (ngModelChange)="effectiveDate.set($event)">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
          <div class="recalc-warning">
            <mat-icon>info</mat-icon>
            All trades from this date onward will be recalculated with the new rates
          </div>
        }
      </div>

      @if (result()) {
        <div class="result-banner">
          <mat-icon>check_circle</mat-icon>
          Done — {{ result()!.tradesRecalculated }} trade(s) recalculated
        </div>
      }

      @if (errorMsg()) {
        <div class="error-banner">
          <mat-icon>error</mat-icon>
          {{ errorMsg() }}
        </div>
      }
      @if (saving()) {
        <div class="saving-overlay"><mat-spinner diameter="32"></mat-spinner></div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (!result()) {
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" (click)="apply()" [disabled]="saving() || (mode() === 'custom' && !effectiveDate())">
          @if (saving()) {
            Applying...
          } @else {
            Apply Changes
          }
        </button>
      } @else {
        <button mat-raised-button color="primary" (click)="dialogRef.close(result())">Done</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 24px 12px;
    }
    .header-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(156, 39, 176, 0.12);
    }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #9c27b0; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    mat-dialog-content { min-width: 360px; max-width: 460px; position: relative; }
    .saving-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); border-radius: inherit; z-index: 10;
    }

    .changes-summary {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      margin-bottom: 16px;
      background: var(--color-surface-secondary);
    }
    .change-row {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 0; font-size: 0.8rem;
    }
    .change-label { font-weight: 600; min-width: 120px; color: var(--color-text-secondary); }
    .change-old { color: var(--color-danger); text-decoration: line-through; }
    .change-new { color: var(--color-success); font-weight: 700; }
    .arrow-icon { font-size: 14px; width: 14px; height: 14px; color: var(--color-text-muted); }

    .apply-section { margin-bottom: 8px; }
    .apply-label { font-size: 0.85rem; font-weight: 600; margin: 0 0 10px; }
    .mode-group { display: flex; flex-direction: column; gap: 8px; }
    .mode-group mat-radio-button { font-size: 0.8rem; }

    .date-field { margin-top: 12px; width: 100%; }

    .recalc-warning {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.72rem; color: var(--color-stat-amber);
      margin-top: 4px;
    }
    .recalc-warning mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .result-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; margin-top: 12px;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-success) 10%, transparent);
      color: var(--color-success);
      font-size: 0.85rem; font-weight: 600;
    }
    .result-banner mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .error-banner {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px; margin-top: 12px;
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-danger) 10%, transparent);
      color: var(--color-danger);
      font-size: 0.8rem; font-weight: 600;
    }
    .error-banner mat-icon { font-size: 18px; width: 18px; height: 18px; }

    @media (max-width: 600px) {
      mat-dialog-content { min-width: unset; }
    }
  `]
})
export class CommissionChangeDialogComponent {
  private accountService = inject(BankAccountService);
  data = inject<CommissionChangeDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<CommissionChangeDialogComponent>);
  private cdr = inject(ChangeDetectorRef);

  saving = signal(false);
  result = signal<{ tradesRecalculated: number } | null>(null);
  errorMsg = signal('');
  mode = signal('today');
  effectiveDate = signal<Date | null>(null);

  changes = this.buildChanges();

  private buildChanges() {
    const changes: { label: string; old: number; new: number }[] = [];
    const { oldRates, newRates } = this.data;

    if ((oldRates.optionsCommission ?? 0) !== (newRates.optionsCommission ?? 0)) {
      changes.push({ label: 'Options Commission', old: oldRates.optionsCommission ?? 0, new: newRates.optionsCommission ?? 0 });
    }
    if ((oldRates.optionsRegFee ?? 0) !== (newRates.optionsRegFee ?? 0)) {
      changes.push({ label: 'Options Reg Fee', old: oldRates.optionsRegFee ?? 0, new: newRates.optionsRegFee ?? 0 });
    }
    if ((oldRates.futuresCommission ?? 0) !== (newRates.futuresCommission ?? 0)) {
      changes.push({ label: 'Futures Commission', old: oldRates.futuresCommission ?? 0, new: newRates.futuresCommission ?? 0 });
    }
    if ((oldRates.futuresRegFee ?? 0) !== (newRates.futuresRegFee ?? 0)) {
      changes.push({ label: 'Futures Reg Fee', old: oldRates.futuresRegFee ?? 0, new: newRates.futuresRegFee ?? 0 });
    }
    return changes;
  }

  apply(): void {
    this.saving.set(true);
    this.errorMsg.set('');

    const effectiveFrom = this.mode() === 'custom' && this.effectiveDate()
      ? toLocalDateString(this.effectiveDate()!)
      : toLocalDateString(new Date());

    const payload = {
      optionsCommissionPerContract: this.data.newRates.optionsCommission ?? undefined,
      futuresCommissionPerContract: this.data.newRates.futuresCommission ?? undefined,
      optionsRegFeePerContract: this.data.newRates.optionsRegFee ?? undefined,
      futuresRegFeePerContract: this.data.newRates.futuresRegFee ?? undefined,
      effectiveFrom,
      recalculateTrades: this.mode() === 'custom'
    };

    this.accountService.createCommissionSchedule(this.data.accountId, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.result.set({ tradesRecalculated: res.tradesRecalculated });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Failed to apply changes. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }
}
