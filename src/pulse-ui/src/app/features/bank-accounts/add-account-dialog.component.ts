import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BankAccountService } from '../../core/services/bank-account.service';
import { BankAccount } from '../../core/models/bank-account.model';

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
    MatIconModule
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
      </form>
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
    mat-dialog-content { min-width: 350px; max-width: 500px; }
    .account-form { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .full-width { width: 100%; }
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

  editMode = !!this.data;
  saving = signal(false);

  form = this.fb.group({
    accountName: ['', Validators.required],
    accountType: ['Checking', Validators.required],
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        accountName: this.data.accountName,
        accountType: this.data.accountType,
        currentBalance: this.data.currentBalance
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
      currentBalance: value.currentBalance!
    };

    const req$ = this.editMode
      ? this.accountService.update(this.data!.id, payload)
      : this.accountService.create(payload);

    req$.subscribe({
      next: (result) => this.dialogRef.close(result),
      error: () => this.saving.set(false)
    });
  }
}
