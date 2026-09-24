import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BankAccountService } from '../../../core/services/bank-account.service';
import { BankAccount } from '../../../core/models/bank-account.model';

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
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule
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
      <span class="header-spacer"></span>
      <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="account-form" (submit)="$event.preventDefault()">
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
              <mat-option value="Cash">Cash</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Current Balance</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="currentBalance">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        <div class="excluded-toggle">
          <mat-slide-toggle formControlName="isExcluded" color="primary">
            <span class="excluded-toggle-label">Exclude from total</span>
            <span class="excluded-toggle-hint">Balance won't count toward your total</span>
          </mat-slide-toggle>
        </div>
      </form>
      @if (saving()) {
        <div class="saving-overlay"><mat-spinner diameter="32"></mat-spinner></div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-flat-button color="primary" class="save-btn" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Saving...' : (editMode ? 'Update Account' : 'Add Account') }}
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
    .header-spacer { flex: 1; }
    .header-close {
      color: var(--color-text-muted) !important;
      width: 34px !important; height: 34px !important;
      padding: 0 !important;
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      border-radius: 50% !important;
      background: var(--color-surface-secondary) !important;
      border: 1px solid var(--color-border) !important;
    }
    .header-close:hover { background: var(--color-surface-hover) !important; }
    .header-close mat-icon { font-size: 18px; width: 18px; height: 18px; }
    mat-dialog-content { min-width: 350px; max-width: 500px; position: relative; }
    .saving-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); border-radius: inherit; z-index: 10;
    }
    .account-form { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .full-width { width: 100%; }
    .excluded-toggle {
      padding: 12px 14px; border-radius: var(--radius-md);
      border: 1px solid var(--color-border); margin-bottom: 4px;
    }
    .excluded-toggle mat-slide-toggle { width: 100%; }
    .excluded-toggle-label { display: block; font-size: 0.85rem; font-weight: 600; }
    .excluded-toggle-hint { display: block; font-size: 0.7rem; color: var(--color-text-muted); margin-top: 2px; }
    .dialog-actions {
      padding: 12px 24px 16px !important;
      border-top: 1px solid var(--color-border);
      gap: 8px;
    }
    .save-btn {
      border-radius: var(--radius-sm) !important;
      padding: 0 20px !important;
      font-weight: 600 !important;
      letter-spacing: 0.02em;
      min-height: 40px;
    }
    @media (max-width: 600px) {
      mat-dialog-content { min-width: unset; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AddAccountDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(BankAccountService);
  private dialogRef = inject(MatDialogRef<AddAccountDialogComponent>);
  private data: BankAccount | null = inject(MAT_DIALOG_DATA, { optional: true });
  private cdr = inject(ChangeDetectorRef);

  editMode = !!this.data;
  saving = signal(false);

  form = this.fb.group({
    accountName: ['', Validators.required],
    accountType: ['Checking', Validators.required],
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    isExcluded: [false]
  });

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        accountName: this.data.accountName,
        accountType: this.data.accountType,
        currentBalance: this.data.currentBalance,
        isExcluded: this.data.isExcluded ?? false
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
      isExcluded: value.isExcluded ?? false
    };

    const req$ = this.editMode
      ? this.accountService.update(this.data!.id, payload)
      : this.accountService.create(payload);

    req$.subscribe({
      next: (result) => {
        this.dialogRef.close(result);
      },
      error: () => { this.saving.set(false); this.cdr.detectChanges(); }
    });
  }
}
