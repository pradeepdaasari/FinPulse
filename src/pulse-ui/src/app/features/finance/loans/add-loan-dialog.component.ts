import { Component, ChangeDetectorRef, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { LoanService } from '../../../core/services/loan.service';
import { FundingSourceService } from '../../../core/services/funding-source.service';
import { FundingSource } from '../../../core/models/funding-source.model';
import { PersonalLoan } from '../../../core/models/personal-loan.model';

@Component({
  selector: 'app-add-loan-dialog',
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
        <mat-icon>account_balance_wallet</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>Add New Loan</h2>
        <span class="dialog-subtitle">Track your loan details</span>
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
            <input matInput formControlName="lenderName" placeholder="e.g. SoFi, Marcus">
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

        <mat-form-field>
          <mat-label>Funded to (Bank Account)</mat-label>
          <mat-select formControlName="fundedBankAccountId" (opened)="bankSearch.set('')">
            <div class="category-search-box">
              <mat-icon>search</mat-icon>
              <input matInput placeholder="Search accounts..." (input)="bankSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
            </div>
            <mat-option [value]="null">-- None --</mat-option>
            @for (source of filteredBankSources(); track source.id) {
              <mat-option [value]="source.id">
                <mat-icon>account_balance</mat-icon>
                {{ source.name }} ({{ source.currentBalance | currency }})
              </mat-option>
            }
          </mat-select>
          <mat-hint>Which bank account received the loan funds</mat-hint>
        </mat-form-field>

        <mat-slide-toggle formControlName="isAutopay" color="primary">
          This loan is on autopay
        </mat-slide-toggle>

        <div class="promo-section">
          <mat-slide-toggle formControlName="hasPromo" color="primary">
            This loan has a promotional rate
          </mat-slide-toggle>

          @if (form.get('hasPromo')?.value) {
            <div class="promo-fields">
              <div class="form-row">
                <mat-form-field>
                  <mat-label>Promo APR %</mat-label>
                  <input matInput type="number" formControlName="promoAprPercent" step="0.01">
                  <mat-hint>Current promotional rate</mat-hint>
                </mat-form-field>

                <mat-form-field>
                  <mat-label>Promo Ends On</mat-label>
                  <input matInput [matDatepicker]="promoPicker" formControlName="promoEndDate">
                  <mat-datepicker-toggle matIconSuffix [for]="promoPicker"></mat-datepicker-toggle>
                  <mat-datepicker #promoPicker></mat-datepicker>
                  <mat-hint>When regular APR kicks in</mat-hint>
                </mat-form-field>
              </div>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-stroked-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-flat-button color="primary" class="save-btn" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Saving...' : 'Add Loan' }}
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
    .full-width {
      width: 100%;
    }
    .promo-section {
      margin-top: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--color-bg);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }
    .promo-fields {
      margin-top: var(--spacing-md);
    }
    .category-search-box {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border-bottom: 1px solid var(--color-border);
      position: sticky; top: 0; background: var(--color-surface); z-index: 100;
    }
    .category-search-box mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    .category-search-box input { border: none; outline: none; flex: 1; font-size: 0.875rem; background: transparent; color: inherit; }
    .dialog-actions {
      padding: 12px 24px 16px !important;
      border-top: 1px solid var(--color-border);
      gap: 8px;
    }
    .cancel-btn {
      border-radius: var(--radius-sm) !important;
      padding: 0 20px !important;
      font-weight: 600 !important;
      min-height: 40px;
    }
    .save-btn {
      border-radius: var(--radius-sm) !important;
      padding: 0 20px !important;
      font-weight: 600 !important;
      letter-spacing: 0.02em;
      min-height: 40px;
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
export class AddLoanDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private loanService = inject(LoanService);
  private fundingSourceService = inject(FundingSourceService);
  private dialogRef = inject(MatDialogRef<AddLoanDialogComponent>);
  private cdr = inject(ChangeDetectorRef);

  dueDays = Array.from({ length: 28 }, (_, i) => i + 1);
  saving = signal(false);
  bankSources = signal<FundingSource[]>([]);
  bankSearch = signal('');
  filteredBankSources = computed(() => {
    const q = this.bankSearch().toLowerCase();
    return q ? this.bankSources().filter(s => s.name.toLowerCase().includes(q)) : this.bankSources();
  });

  ngOnInit(): void {
    this.fundingSourceService.getAll().subscribe(sources => {
      this.bankSources.set(
        sources.filter(s => s.type === 'BankAccount').sort((a, b) => a.name.localeCompare(b.name))
      );
      this.cdr.detectChanges();
    });
  }

  form = this.fb.group({
    loanType: ['Personal', Validators.required],
    lenderName: ['', Validators.required],
    isAutopay: [false],
    originalAmount: [null as number | null, [Validators.required, Validators.min(1)]],
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    aprPercent: [null as number | null, [Validators.required, Validators.min(0)]],
    durationMonths: [null as number | null, [Validators.required, Validators.min(1)]],
    startDate: [null as Date | null, Validators.required],
    monthlyPayment: [null as number | null, [Validators.required, Validators.min(1)]],
    dueDay: [1, Validators.required],
    paymentFrequency: ['Monthly' as string, Validators.required],
    fundedBankAccountId: [null as number | null],
    hasPromo: [false],
    promoAprPercent: [null as number | null],
    promoEndDate: [null as Date | null]
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const loan: any = {
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
      paymentFrequency: value.paymentFrequency,
      fundedBankAccountId: value.fundedBankAccountId
    };

    if (value.hasPromo && value.promoAprPercent != null) {
      loan.promoAprPercent = value.promoAprPercent;
      loan.promoEndDate = value.promoEndDate;
    }

    this.loanService.create(loan).subscribe({
      next: (created) => {
        this.dialogRef.close(created);
      },
      error: () => {
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
