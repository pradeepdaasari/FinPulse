import { Component, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BankAccountService } from '../../core/services/bank-account.service';
import { CommissionSchedule } from '../../core/models/bank-account.model';

export interface EditCommissionDialogData {
  accountId: number;
  accountName: string;
  schedule: CommissionSchedule;
}

@Component({
  selector: 'app-edit-commission-dialog',
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
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>edit</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>Edit Commission Rates</h2>
        <span class="dialog-subtitle">{{ data.accountName }} · Effective {{ data.schedule.effectiveFrom | date:'MMM d, yyyy' }}</span>
      </div>
    </div>
    <mat-dialog-content>
      <div class="fees-section">
        <div class="fee-sub-label">Options (per contract)</div>
        <div class="fees-grid">
          <mat-form-field appearance="outline">
            <mat-label>Commission</mat-label>
            <input matInput type="number" [ngModel]="optionsCommission()" (ngModelChange)="optionsCommission.set($event)" step="0.01">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Reg + Exchange</mat-label>
            <input matInput type="number" [ngModel]="optionsRegFee()" (ngModelChange)="optionsRegFee.set($event)" step="0.001">
          </mat-form-field>
        </div>
        <div class="fee-sub-label">Futures (per contract)</div>
        <div class="fees-grid">
          <mat-form-field appearance="outline">
            <mat-label>Commission</mat-label>
            <input matInput type="number" [ngModel]="futuresCommission()" (ngModelChange)="futuresCommission.set($event)" step="0.01">
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Reg + Exchange</mat-label>
            <input matInput type="number" [ngModel]="futuresRegFee()" (ngModelChange)="futuresRegFee.set($event)" step="0.001">
          </mat-form-field>
        </div>
      </div>

      <mat-checkbox [ngModel]="recalculate()" (ngModelChange)="recalculate.set($event)" class="recalc-checkbox">
        Recalculate trades in this date range
      </mat-checkbox>

      @if (recalculate()) {
        <div class="recalc-warning">
          <mat-icon>info</mat-icon>
          Trades from {{ data.schedule.effectiveFrom | date:'MMM d, yyyy' }} onward (until the next rate change) will be recalculated
        </div>
      }

      @if (result()) {
        <div class="result-banner">
          <mat-icon>check_circle</mat-icon>
          Updated — {{ result()!.tradesRecalculated }} trade(s) recalculated
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
        <button mat-raised-button color="primary" (click)="save()" [disabled]="saving()">
          @if (saving()) {
            Saving...
          } @else {
            Save & Apply
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
      background: rgba(21, 101, 192, 0.12);
    }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #1565c0; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    mat-dialog-content { min-width: 360px; max-width: 460px; position: relative; }
    .saving-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); border-radius: inherit; z-index: 10;
    }

    .fees-section { margin-bottom: 12px; }
    .fee-sub-label {
      font-size: 0.7rem; font-weight: 600; color: var(--color-text-secondary);
      text-transform: uppercase; letter-spacing: 0.03em; margin: 8px 0 4px 2px;
    }
    .fees-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .recalc-checkbox { margin: 8px 0; font-size: 0.85rem; }

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
      .fees-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class EditCommissionDialogComponent {
  private accountService = inject(BankAccountService);
  data = inject<EditCommissionDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<EditCommissionDialogComponent>);

  optionsCommission = signal<number | null>(this.data.schedule.optionsCommissionPerContract ?? null);
  optionsRegFee = signal<number | null>(this.data.schedule.optionsRegFeePerContract ?? null);
  futuresCommission = signal<number | null>(this.data.schedule.futuresCommissionPerContract ?? null);
  futuresRegFee = signal<number | null>(this.data.schedule.futuresRegFeePerContract ?? null);
  recalculate = signal(true);

  saving = signal(false);
  result = signal<{ tradesRecalculated: number } | null>(null);
  errorMsg = signal('');

  save(): void {
    this.saving.set(true);
    this.errorMsg.set('');

    const payload = {
      optionsCommissionPerContract: this.optionsCommission() ?? undefined,
      futuresCommissionPerContract: this.futuresCommission() ?? undefined,
      optionsRegFeePerContract: this.optionsRegFee() ?? undefined,
      futuresRegFeePerContract: this.futuresRegFee() ?? undefined,
      effectiveFrom: this.data.schedule.effectiveFrom,
      recalculateTrades: this.recalculate()
    };

    this.accountService.updateCommissionSchedule(this.data.accountId, this.data.schedule.id, payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.result.set({ tradesRecalculated: res.tradesRecalculated });
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message || 'Failed to update. Please try again.');
      }
    });
  }
}
