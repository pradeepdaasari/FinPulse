import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { PersonalLoan } from '../../core/models/personal-loan.model';
import { LoanService } from '../../core/services/loan.service';

@Component({
  selector: 'app-loan-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-grid">
        <mat-form-field>
          <mat-label>Lender Name</mat-label>
          <input matInput formControlName="lenderName">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Original Amount</mat-label>
          <input matInput type="number" formControlName="originalAmount">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Current Balance</mat-label>
          <input matInput type="number" formControlName="currentBalance">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field>
          <mat-label>APR %</mat-label>
          <input matInput type="number" formControlName="aprPercent">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Duration (Months)</mat-label>
          <input matInput type="number" formControlName="durationMonths">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Start Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="startDate">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Monthly Payment</mat-label>
          <input matInput type="number" formControlName="monthlyPayment">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Due Day</mat-label>
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

      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
        Save Loan
      </button>
    </form>
  `,
  styles: [`
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
    }
    button {
      margin-top: 16px;
    }
  `]
})
export class LoanFormComponent {
  @Output() saved = new EventEmitter<PersonalLoan>();

  private fb = inject(FormBuilder);
  private loanService = inject(LoanService);

  dueDays = Array.from({ length: 28 }, (_, i) => i + 1);

  form = this.fb.group({
    lenderName: ['', Validators.required],
    originalAmount: [null as number | null, [Validators.required, Validators.min(1)]],
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    aprPercent: [null as number | null, [Validators.required, Validators.min(0)]],
    durationMonths: [null as number | null, [Validators.required, Validators.min(1)]],
    startDate: [null as Date | null, Validators.required],
    monthlyPayment: [null as number | null, [Validators.required, Validators.min(1)]],
    dueDay: [1, Validators.required],
    paymentFrequency: ['Monthly' as 'Monthly' | 'Biweekly' | 'Weekly', Validators.required]
  });

  onSubmit(): void {
    if (this.form.valid) {
      const value = this.form.getRawValue();
      this.loanService.create(value as any).subscribe({
        next: (loan) => {
          this.saved.emit(loan);
          this.form.reset({ paymentFrequency: 'Monthly', dueDay: 1 });
        }
      });
    }
  }
}
