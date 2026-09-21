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
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoanService } from '../../../core/services/loan.service';
import { FundingSourceService } from '../../../core/services/funding-source.service';
import { FundingSource } from '../../../core/models/funding-source.model';
import { PersonalLoan } from '../../../core/models/personal-loan.model';
import { NotificationService } from '../../../core/services/notification.service';
import { toLocalISOString } from '../../../core/utils/date-utils';

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
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>account_balance_wallet</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>Add New Loan</h2>
          <p class="dialog-subtitle">Track your loan details</p>
        </div>
        <span class="banner-spacer"></span>
        <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="loan-form" (submit)="$event.preventDefault(); save()">
        <div class="amount-hero">
          <div class="amount-input-row">
            <span class="amount-dollar">$</span>
            <input class="amount-value" type="number" inputmode="decimal" formControlName="currentBalance" placeholder="0.00">
          </div>
          <div class="amount-underline"></div>
          <span class="amount-hint">Current Balance</span>
        </div>

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
            <input matInput type="number" inputmode="decimal" formControlName="originalAmount">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field>
            <mat-label>APR %</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="aprPercent" step="0.01">
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
            <input matInput type="number" inputmode="numeric" formControlName="durationMonths" step="1">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>{{ emiLabel() }}</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="monthlyPayment">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Payment Frequency</mat-label>
            <mat-select formControlName="paymentFrequency" (selectionChange)="onFrequencyChange($event.value)">
              <mat-option value="Monthly">Monthly</mat-option>
              <mat-option value="Biweekly">Biweekly</mat-option>
              <mat-option value="Weekly">Weekly</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field>
          <mat-label>{{ dueDayLabel() }}</mat-label>
          <mat-select formControlName="dueDay">
            @if (isWeeklyOrBiweekly()) {
              @for (day of weekDays; track day; let i = $index) {
                <mat-option [value]="i">{{ day }}</mat-option>
              }
            } @else {
              @for (day of dueDays; track day) {
                <mat-option [value]="day">{{ day }}</mat-option>
              }
            }
          </mat-select>
        </mat-form-field>

        <div class="more-options-toggle" (click)="showMore.set(!showMore())">
          <mat-icon class="more-icon">{{ showMore() ? 'expand_less' : 'expand_more' }}</mat-icon>
          <span>More options (Account, Rate, Autopay)</span>
        </div>

        @if (showMore()) {
          <div class="more-options-section">
            <mat-form-field>
              <mat-label>Funded to (Bank Account)</mat-label>
              <mat-select formControlName="fundedBankAccountId" (opened)="bankSearch.set(''); focusInput(bankSearchInput)">
                <div class="category-search-box">
                  <mat-icon>search</mat-icon>
                  <input #bankSearchInput matInput placeholder="Search accounts..." (input)="bankSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
                </div>
                <mat-option [value]="null">-- None --</mat-option>
                @for (source of filteredBankSources(); track source.id) {
                  <mat-option [value]="source.id">
                    <mat-icon>account_balance</mat-icon>
                    {{ source.name }} ({{ source.currentBalance | currency }})
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Next Payment Date</mat-label>
              <input matInput [matDatepicker]="nextPayPicker" formControlName="nextPaymentDate">
              <mat-datepicker-toggle matIconSuffix [for]="nextPayPicker"></mat-datepicker-toggle>
              <mat-datepicker #nextPayPicker></mat-datepicker>
              <mat-hint>Leave empty if payments are due every month</mat-hint>
            </mat-form-field>

            <div class="toggle-row">
              <mat-form-field class="rate-type-field">
                <mat-label>Rate Type</mat-label>
                <mat-select formControlName="rateType">
                  <mat-option value="Fixed">Fixed</mat-option>
                  <mat-option value="Variable">Variable</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-slide-toggle formControlName="isAutopay" color="primary">
                Autopay
              </mat-slide-toggle>
            </div>
          </div>
        }
      </form>
    </mat-dialog-content>
    <div class="sticky-save-bar">
      <button class="gradient-save-btn" (click)="save()" [disabled]="form.invalid || saving()">
        <mat-icon>check</mat-icon>
        {{ saving() ? 'Saving...' : 'Add Loan' }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-banner {
      position: relative; margin: -24px -24px 12px;
      padding: 16px 24px 14px; background: var(--gradient-primary); overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content { position: relative; display: flex; align-items: center; gap: 12px; }
    .dialog-header-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,0.3); flex-shrink: 0;
    }
    .dialog-header-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    h2[mat-dialog-title] {
      margin: 0 !important; padding: 0 !important;
      font-size: 1rem !important; font-weight: 700 !important; color: #fff !important;
    }
    .dialog-subtitle { color: rgba(255,255,255,0.75); font-size: 0.72rem; margin: 2px 0 0; }
    .banner-spacer { flex: 1; }
    .header-close {
      color: rgba(255,255,255,0.9) !important;
      width: 40px !important; height: 40px !important; padding: 0 !important;
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      border-radius: 50% !important;
      background: rgba(255,255,255,0.12) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
    }
    .header-close:hover { background: rgba(255,255,255,0.25) !important; }
    .header-close mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .amount-hero { text-align: center; padding: 8px 0 4px; }
    .amount-input-row { display: flex; align-items: baseline; justify-content: center; gap: 2px; }
    .amount-dollar { font-size: 1.6rem; font-weight: 700; color: var(--color-text-muted); }
    .amount-value {
      font-size: 2.8rem; font-weight: 800; letter-spacing: -0.03em;
      color: var(--color-text-primary); font-variant-numeric: tabular-nums;
      border: none; background: none; text-align: center; width: 180px;
      outline: none; caret-color: var(--color-primary);
    }
    .amount-value::placeholder { color: #ccc; }
    .amount-value::-webkit-outer-spin-button,
    .amount-value::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .amount-value[type=number] { -moz-appearance: textfield; }
    .amount-underline {
      width: 200px; height: 3px; border-radius: 2px;
      background: var(--gradient-primary); margin: 4px auto 0; opacity: 0.4;
    }
    .amount-hint { font-size: 0.7rem; color: var(--color-text-muted); margin-top: 4px; display: inline-block; }

    mat-dialog-content { min-width: 400px; max-width: 550px; }
    .loan-form { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .toggle-row { display: flex; align-items: center; gap: var(--spacing-lg); flex-wrap: wrap; }
    .rate-type-field { max-width: 140px; }
    .category-search-box {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border-bottom: 1px solid var(--color-border);
      position: sticky; top: 0; background: var(--color-surface); z-index: 100;
    }
    .category-search-box mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    .category-search-box input { border: none; outline: none; flex: 1; font-size: 0.875rem; background: transparent; color: inherit; }

    .more-options-toggle {
      display: flex; align-items: center; gap: 4px;
      cursor: pointer; color: var(--color-primary);
      font-size: 0.82rem; font-weight: 600; padding: 4px 0;
    }
    .more-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; }
    .more-options-section {
      display: flex; flex-direction: column; gap: var(--spacing-xs);
      padding: 12px; background: rgba(var(--color-primary-rgb, 33,150,243), 0.03);
      border-radius: var(--radius-sm); border: 1px dashed rgba(var(--color-primary-rgb, 33,150,243), 0.15);
    }

    .sticky-save-bar {
      position: sticky; bottom: 0; z-index: 10;
      padding: 12px 24px 16px;
      background: linear-gradient(transparent, var(--color-surface) 30%);
    }
    .gradient-save-btn {
      width: 100%; height: 48px; border: none; border-radius: var(--radius-sm);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.95rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      cursor: pointer; box-shadow: 0 4px 16px rgba(var(--color-primary-rgb, 33,150,243), 0.3);
    }
    .gradient-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .gradient-save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    @media (max-width: 600px) {
      mat-dialog-content { min-width: unset; }
      .form-row { grid-template-columns: 1fr; }
      .dialog-banner { margin: -16px -16px 12px; padding: 14px 16px 12px; }
      .amount-value { font-size: 2rem; width: 140px; }
      .amount-underline { width: 140px; }
      .sticky-save-bar { padding: 10px 16px 14px; }
    }
  `]
})
export class AddLoanDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private loanService = inject(LoanService);
  private fundingSourceService = inject(FundingSourceService);
  private dialogRef = inject(MatDialogRef<AddLoanDialogComponent>);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  dueDays = Array.from({ length: 28 }, (_, i) => i + 1);
  weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  saving = signal(false);
  showMore = signal(false);
  bankSources = signal<FundingSource[]>([]);
  bankSearch = signal('');
  filteredBankSources = computed(() => {
    const q = this.bankSearch().toLowerCase();
    return q ? this.bankSources().filter(s => s.name.toLowerCase().includes(q)) : this.bankSources();
  });
  paymentFrequencyValue = signal('Monthly');
  isWeeklyOrBiweekly = computed(() => {
    const f = this.paymentFrequencyValue();
    return f === 'Weekly' || f === 'Biweekly';
  });
  dueDayLabel = computed(() => this.isWeeklyOrBiweekly() ? 'Due Day of Week' : 'Due Day of Month');
  emiLabel = computed(() => {
    const freq = this.paymentFrequencyValue();
    if (freq === 'Biweekly') return 'Biweekly Payment';
    if (freq === 'Weekly') return 'Weekly Payment';
    return 'Monthly EMI';
  });

  focusInput(el: HTMLInputElement): void {
    setTimeout(() => el.focus(), 0);
  }

  onFrequencyChange(value: string): void {
    this.paymentFrequencyValue.set(value);
    const isWeekly = value === 'Weekly' || value === 'Biweekly';
    this.form.patchValue({ dueDay: isWeekly ? 1 : 1 });
  }

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
    rateType: ['Fixed' as string],
    fundedBankAccountId: [null as number | null],
    nextPaymentDate: [null as Date | null],
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
      durationMonths: Math.round(value.durationMonths!),
      startDate: value.startDate ? toLocalISOString(value.startDate) : null,
      monthlyPayment: value.monthlyPayment,
      dueDay: Math.round(value.dueDay!),
      paymentFrequency: value.paymentFrequency,
      rateType: value.rateType,
      fundedBankAccountId: value.fundedBankAccountId,
      nextPaymentDate: value.nextPaymentDate ? toLocalISOString(value.nextPaymentDate) : null
    };

    this.loanService.create(loan).subscribe({
      next: (result) => {
        if (result.warning) this.notify.warning(result.warning);
        this.dialogRef.close(result.loan);
      },
      error: (err) => {
        let msg = err?.error?.message || err?.error?.title || 'Failed to add loan';
        if (err?.error?.errors) {
          const first = Object.values(err.error.errors).flat()[0];
          if (first) msg = String(first);
        }
        this.notify.error(msg);
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
