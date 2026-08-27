import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BankAccountService } from '../../core/services/bank-account.service';
import { BankAccount } from '../../core/models/bank-account.model';
import { CommissionChangeDialogComponent, CommissionChangeDialogData } from './commission-change-dialog.component';

@Component({
  selector: 'app-add-account-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon blue">
        <mat-icon>account_balance</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>{{ editMode ? 'Edit' : 'Add' }} Bank Account</h2>
        <span class="dialog-subtitle">Manage your bank accounts</span>
      </div>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="account-form">
        <mat-form-field class="full-width">
          <mat-label>Account Name</mat-label>
          <input matInput formControlName="accountName" placeholder="e.g. Chase Checking, Ally Savings">
        </mat-form-field>

        <div class="form-row">
          <mat-form-field>
            <mat-label>Account Type</mat-label>
            <mat-select formControlName="accountType">
              <mat-option value="Checking">Checking</mat-option>
              <mat-option value="Savings">Savings</mat-option>
              <mat-option value="Brokerage">Brokerage</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Current Balance</mat-label>
            <input matInput type="number" formControlName="currentBalance">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        @if (form.value.accountType === 'Brokerage') {
          <div class="fees-section">
            <div class="fees-header">
              <mat-icon>receipt_long</mat-icon>
              <span>Trading Fees (per contract)</span>
            </div>
            <div class="fee-sub-label">Options</div>
            <div class="fees-grid">
              <mat-form-field appearance="outline">
                <mat-label>Commission</mat-label>
                <input matInput type="number" formControlName="optionsCommission" step="0.01" placeholder="0.65">
                <mat-hint>e.g. 0.65</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Reg + Exchange</mat-label>
                <input matInput type="number" formControlName="optionsRegFee" step="0.001" placeholder="0.03">
                <mat-hint>e.g. 0.03</mat-hint>
              </mat-form-field>
            </div>
            <div class="fee-sub-label">Futures</div>
            <div class="fees-grid">
              <mat-form-field appearance="outline">
                <mat-label>Commission</mat-label>
                <input matInput type="number" formControlName="futuresCommission" step="0.01" placeholder="2.25">
                <mat-hint>e.g. 2.25</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Reg + Exchange</mat-label>
                <input matInput type="number" formControlName="futuresRegFee" step="0.001" placeholder="0.02">
                <mat-hint>e.g. 0.02</mat-hint>
              </mat-form-field>
            </div>
            <div class="fees-hint">
              <mat-icon>info</mat-icon>
              Fees are auto-applied to every trade logged under this account
            </div>
          </div>
        }
      </form>
      @if (saving()) {
        <div class="saving-overlay"><mat-spinner diameter="32"></mat-spinner></div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        @if (saving()) {
          Saving...
        } @else {
          {{ editMode ? 'Update' : 'Add' }} Account
        }
      </button>
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
    }
    .header-icon.blue { background: rgba(21,101,192,0.12); }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #1565c0; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    mat-dialog-content { min-width: 350px; max-width: 500px; position: relative; }
    .saving-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); border-radius: inherit; z-index: 10;
    }
    .account-form { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .full-width { width: 100%; }
    .fees-section {
      border: 1.5px solid var(--color-stat-purple);
      border-radius: var(--radius-md);
      padding: 14px;
      background: color-mix(in srgb, var(--color-stat-purple-bg) 40%, transparent);
      margin-top: 4px;
    }
    .fees-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.78rem; font-weight: 700; color: var(--color-stat-purple);
      text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 12px;
    }
    .fees-header mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .fees-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fee-sub-label {
      font-size: 0.7rem; font-weight: 600; color: var(--color-text-secondary);
      text-transform: uppercase; letter-spacing: 0.03em; margin: 8px 0 2px 2px;
    }
    .fees-hint {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.7rem; color: var(--color-text-muted);
      margin-top: 8px;
    }
    .fees-hint mat-icon { font-size: 14px; width: 14px; height: 14px; color: var(--color-stat-purple); }
    @media (max-width: 600px) {
      mat-dialog-content { min-width: unset; }
      .form-row, .fees-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AddAccountDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(BankAccountService);
  private dialogRef = inject(MatDialogRef<AddAccountDialogComponent>);
  private dialog = inject(MatDialog);
  private data: BankAccount | null = inject(MAT_DIALOG_DATA, { optional: true });

  editMode = !!this.data;
  saving = signal(false);

  form = this.fb.group({
    accountName: ['', Validators.required],
    accountType: ['Checking', Validators.required],
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    optionsCommission: [null as number | null],
    optionsRegFee: [null as number | null],
    futuresCommission: [null as number | null],
    futuresRegFee: [null as number | null]
  });

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        accountName: this.data.accountName,
        accountType: this.data.accountType,
        currentBalance: this.data.currentBalance,
        optionsCommission: this.data.optionsCommissionPerContract ?? null,
        optionsRegFee: this.data.optionsRegFeePerContract ?? null,
        futuresCommission: this.data.futuresCommissionPerContract ?? null,
        futuresRegFee: this.data.futuresRegFeePerContract ?? null
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const payload = {
      accountName: value.accountName!,
      accountType: value.accountType as any,
      currentBalance: value.currentBalance!,
      optionsCommissionPerContract: value.optionsCommission ?? undefined,
      futuresCommissionPerContract: value.futuresCommission ?? undefined,
      optionsRegFeePerContract: value.optionsRegFee ?? undefined,
      futuresRegFeePerContract: value.futuresRegFee ?? undefined
    };

    const req$ = this.editMode
      ? this.accountService.update(this.data!.id, payload)
      : this.accountService.create(payload);

    req$.subscribe({
      next: (result) => {
        if (this.editMode && this.hasCommissionChanged(value)) {
          this.openCommissionChangeDialog(result, value);
        } else {
          this.dialogRef.close(result);
        }
      },
      error: () => this.saving.set(false)
    });
  }

  private hasCommissionChanged(value: any): boolean {
    if (!this.data || this.data.accountType !== 'Brokerage') return false;
    return (this.data.optionsCommissionPerContract ?? 0) !== (value.optionsCommission ?? 0)
        || (this.data.optionsRegFeePerContract ?? 0) !== (value.optionsRegFee ?? 0)
        || (this.data.futuresCommissionPerContract ?? 0) !== (value.futuresCommission ?? 0)
        || (this.data.futuresRegFeePerContract ?? 0) !== (value.futuresRegFee ?? 0);
  }

  private openCommissionChangeDialog(savedAccount: BankAccount, value: any): void {
    const dialogData: CommissionChangeDialogData = {
      accountId: this.data!.id,
      accountName: savedAccount.accountName,
      oldRates: {
        optionsCommission: this.data!.optionsCommissionPerContract,
        futuresCommission: this.data!.futuresCommissionPerContract,
        optionsRegFee: this.data!.optionsRegFeePerContract,
        futuresRegFee: this.data!.futuresRegFeePerContract
      },
      newRates: {
        optionsCommission: value.optionsCommission,
        futuresCommission: value.futuresCommission,
        optionsRegFee: value.optionsRegFee,
        futuresRegFee: value.futuresRegFee
      }
    };

    const ref = this.dialog.open(CommissionChangeDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      data: dialogData
    });

    ref.afterClosed().subscribe(() => {
      this.dialogRef.close(savedAccount);
    });
  }
}
