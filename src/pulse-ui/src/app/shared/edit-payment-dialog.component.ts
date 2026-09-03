import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentService } from '../core/services/payment.service';
import { PaymentHistory } from '../core/models/payment-history.model';
import { toLocalISOString } from '../core/utils/date-utils';

@Component({
  selector: 'app-edit-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon blue">
        <mat-icon>edit</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>Edit Payment</h2>
        <span class="dialog-subtitle">Update payment details</span>
      </div>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="payment-form">
        <mat-form-field class="full-width">
          <mat-label>Payment Amount</mat-label>
          <input matInput type="number" formControlName="amountPaid" step="0.01">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Payment Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="paymentDate">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        @if (saving()) {
          Saving...
        } @else {
          Save
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
    .payment-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      min-width: 350px;
    }
    .full-width { width: 100%; }
    @media (max-width: 600px) {
      .payment-form { min-width: unset; }
    }
  `]
})
export class EditPaymentDialogComponent {
  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentService);
  private dialogRef = inject(MatDialogRef<EditPaymentDialogComponent>);
  data: PaymentHistory = inject(MAT_DIALOG_DATA);

  saving = signal(false);

  form = this.fb.group({
    amountPaid: [this.data.amountPaid, [Validators.required, Validators.min(0.01)]],
    paymentDate: [new Date(this.data.paymentDate), Validators.required],
    notes: [this.data.notes || '']
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const payload = {
      amountPaid: value.amountPaid!,
      paymentDate: toLocalISOString(value.paymentDate!),
      notes: value.notes || undefined
    };

    this.paymentService.update(this.data.id, payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.saving.set(false)
    });
  }
}
