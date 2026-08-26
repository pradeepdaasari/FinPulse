import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { LoanService } from '../../core/services/loan.service';
import { PersonalLoan } from '../../core/models/personal-loan.model';

@Component({
  selector: 'app-edit-loan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon teal">
        <mat-icon>edit</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>Edit Loan</h2>
        <span class="dialog-subtitle">Update loan details</span>
      </div>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="loan-form">
        <div class="form-row">
          <mat-form-field>
            <mat-label>Loan Type</mat-label>
            <mat-select formControlName="loanType">
              <mat-option value="Personal">Personal Loan</mat-option>
              <mat-option value="Vehicle">Vehicle Loan</mat-option>
              <mat-option value="Mortgage">Mortgage</mat-option>
              <mat-option value="Student">Student Loan</mat-option>
              <mat-option value="Business">Business Loan</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Lender Name</mat-label>
            <input matInput formControlName="lenderName">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>Loan Amount</mat-label>
            <input matInput type="number" formControlName="originalAmount">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Current Balance</mat-label>
            <input matInput type="number" formControlName="currentBalance">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>Loan Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Duration (Months)</mat-label>
            <input matInput type="number" formControlName="durationMonths">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>Monthly EMI</mat-label>
            <input matInput type="number" formControlName="monthlyPayment">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field>
            <mat-label>APR %</mat-label>
            <input matInput type="number" formControlName="aprPercent" step="0.01">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>Due Day of Month</mat-label>
            <mat-select formControlName="dueDay">
              @for (day of dueDays; track day) {
                <mat-option [value]="day">{{ day }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Payment Frequency</mat-label>
            <mat-select formControlName="paymentFrequency">
              <mat-option value="Monthly">Monthly</mat-option>
              <mat-option value="Biweekly">Biweekly</mat-option>
              <mat-option value="Weekly">Weekly</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-slide-toggle formControlName="isAutopay" color="primary">
          This loan is on autopay
        </mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        @if (saving()) {
          Saving...
        } @else {
          Save Changes
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
    .header-icon.teal { background: rgba(0,105,92,0.12); }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #00695c; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    mat-dialog-content {
      min-width: 400px;
      max-width: 550px;
    }
    .loan-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: unset;
      }
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class EditLoanDialogComponent {
  private fb = inject(FormBuilder);
  private loanService = inject(LoanService);
  private dialogRef = inject(MatDialogRef<EditLoanDialogComponent>);
  private data: PersonalLoan = inject(MAT_DIALOG_DATA);

  dueDays = Array.from({ length: 28 }, (_, i) => i + 1);
  saving = signal(false);

  form = this.fb.group({
    loanType: [this.data.loanType || 'Personal', Validators.required],
    lenderName: [this.data.lenderName, Validators.required],
    isAutopay: [this.data.isAutopay ?? false],
    originalAmount: [this.data.originalAmount, [Validators.required, Validators.min(1)]],
    currentBalance: [this.data.currentBalance, [Validators.required, Validators.min(0)]],
    aprPercent: [this.data.aprPercent, [Validators.required, Validators.min(0)]],
    durationMonths: [this.data.durationMonths, [Validators.required, Validators.min(1)]],
    startDate: [new Date(this.data.startDate), Validators.required],
    monthlyPayment: [this.data.monthlyPayment, [Validators.required, Validators.min(1)]],
    dueDay: [this.data.dueDay, Validators.required],
    paymentFrequency: [this.data.paymentFrequency, Validators.required]
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const payload: any = {
      loanType: value.loanType,
      lenderName: value.lenderName,
      isAutopay: value.isAutopay,
      originalAmount: value.originalAmount,
      currentBalance: value.currentBalance,
      aprPercent: value.aprPercent,
      durationMonths: value.durationMonths,
      startDate: value.startDate,
      monthlyPayment: value.monthlyPayment,
      dueDay: value.dueDay,
      paymentFrequency: value.paymentFrequency
    };

    this.loanService.update(this.data.id, payload).subscribe({
      next: (updated) => {
        this.dialogRef.close(updated);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
}
