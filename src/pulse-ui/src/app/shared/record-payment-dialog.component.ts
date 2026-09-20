import { Component, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CreditCardService } from '../core/services/credit-card.service';
import { LoanService } from '../core/services/loan.service';
import { PaymentService } from '../core/services/payment.service';
import { FundingSourceService } from '../core/services/funding-source.service';
import { NotificationService } from '../core/services/notification.service';
import { toLocalISOString } from '../core/utils/date-utils';
import { FundingSource } from '../core/models/funding-source.model';
import { PaymentHistory } from '../core/models/payment-history.model';

export interface RecordPaymentData {
  debtId: number | string;
  debtName: string;
  debtType: 'PersonalLoan' | 'CreditCard';
  currentBalance: number;
  minimumPayment?: number;
  aprPercent?: number;
  paymentFrequency?: 'Monthly' | 'Biweekly' | 'Weekly';
  fundedBankAccountId?: number | null;
  existingPayment?: PaymentHistory;
}

@Component({
  selector: 'app-record-payment-dialog',
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
    MatButtonToggleModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CurrencyPipe,
    DecimalPipe
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon green">
        <mat-icon>payments</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Record' }} Payment</h2>
        <span class="dialog-subtitle">{{ data.debtName }}</span>
      </div>
      <span class="header-spacer"></span>
      <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content>
      @if (loadingAccounts()) {
        <div class="dialog-loading"><mat-spinner diameter="32"></mat-spinner></div>
      } @else {
      <div class="debt-info">
        <mat-icon>{{ data.debtType === 'CreditCard' ? 'credit_card' : 'account_balance' }}</mat-icon>
        <div>
          <span class="debt-name">{{ data.debtName }}</span>
          <span class="debt-balance">Balance: {{ data.currentBalance | currency }}</span>
        </div>
      </div>

      <form [formGroup]="form" class="payment-form">
        @if (!isEdit) {
        <div class="payment-type-row">
          <mat-button-toggle-group [value]="paymentType()" (change)="setPaymentType($event.value)">
            <mat-button-toggle value="full">Full ({{ data.currentBalance | currency }})</mat-button-toggle>
            @if (data.minimumPayment) {
              <mat-button-toggle value="minimum">Min ({{ data.minimumPayment | currency }})</mat-button-toggle>
            }
            <mat-button-toggle value="custom">Custom</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
        }

        <mat-form-field class="full-width">
          <mat-label>Payment Amount</mat-label>
          <input matInput type="number" inputmode="decimal" formControlName="amountPaid" step="0.01" [readonly]="!isEdit && paymentType() !== 'custom'">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        @if (data.debtType === 'PersonalLoan' && data.aprPercent && calculatedSplit()) {
          <div class="split-breakdown">
            <div class="split-label">Payment Breakdown</div>
            <div class="split-items">
              <div class="split-item principal">
                <span class="split-item-label">Principal</span>
                <span class="split-item-value">{{ calculatedSplit()!.principal | currency }}</span>
              </div>
              <div class="split-item interest">
                <span class="split-item-label">Interest</span>
                <span class="split-item-value">{{ calculatedSplit()!.interest | currency }}</span>
              </div>
            </div>
            <div class="split-bar">
              <div class="split-bar-principal" [style.width.%]="calculatedSplit()!.principalPct"></div>
            </div>
            <div class="split-note">Based on {{ data.aprPercent }}% APR &middot; {{ calculatedSplit()!.principalPct | number:'1.0-0' }}% goes to principal</div>
          </div>
        }

        <mat-form-field class="full-width">
          <mat-label>From Account</mat-label>
          <mat-select formControlName="fromAccountId">
            <mat-option [value]="null">-- Select account --</mat-option>
            @for (acct of bankAccounts(); track acct.id) {
              <mat-option [value]="acct.id">
                {{ acct.name }} ({{ acct.currentBalance | currency }})
              </mat-option>
            }
          </mat-select>
          <mat-icon matPrefix>account_balance</mat-icon>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Payment Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="paymentDate">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="e.g. Paid via bank transfer"></textarea>
        </mat-form-field>
      </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        @if (saving()) {
          {{ isEdit ? 'Saving...' : 'Recording...' }}
        } @else {
          {{ isEdit ? 'Update Payment' : 'Record Payment' }}
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
    .header-icon.green { background: rgba(46,125,50,0.12); }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #2e7d32; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    .header-spacer { flex: 1; }
    .header-close { color: var(--color-text-muted); }
    .header-close mat-icon { font-size: 20px; width: 20px; height: 20px; }
    mat-dialog-content {
      min-width: 0;
      max-width: 450px;
      width: 100%;
    }
    .debt-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: var(--spacing-md);
      background: var(--color-bg);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      margin-bottom: var(--spacing-lg);
    }
    .debt-info mat-icon {
      color: var(--color-primary);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .debt-name {
      display: block;
      font-weight: 600;
    }
    .debt-balance {
      display: block;
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
    }
    .payment-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }
    .payment-type-row {
      margin-bottom: var(--spacing-sm);
    }
    .payment-type-row mat-button-toggle-group {
      width: 100%;
    }
    .payment-type-row mat-button-toggle {
      flex: 1;
      font-size: 0.8125rem;
    }
    .full-width {
      width: 100%;
    }
    .dialog-loading {
      display: flex; justify-content: center; align-items: center;
      min-height: 200px;
    }
    .split-breakdown {
      background: var(--color-surface-secondary, #f8f9fa);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      margin-bottom: 8px;
    }
    .split-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-muted);
      margin-bottom: 8px;
    }
    .split-items {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .split-item { display: flex; flex-direction: column; gap: 2px; }
    .split-item-label { font-size: 0.8rem; color: var(--color-text-secondary); }
    .split-item-value { font-size: 1rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .split-item.principal .split-item-value { color: var(--color-success, #2e7d32); }
    .split-item.interest .split-item-value { color: var(--color-danger, #d32f2f); }
    .split-bar {
      height: 6px;
      background: var(--color-danger, #d32f2f);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .split-bar-principal {
      height: 100%;
      background: var(--color-success, #2e7d32);
      border-radius: 3px;
      transition: width 0.3s;
    }
    .split-note {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      text-align: center;
    }
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: unset;
      }
    }
  `]
})
export class RecordPaymentDialogComponent {
  private fb = inject(FormBuilder);
  private cardService = inject(CreditCardService);
  private loanService = inject(LoanService);
  private paymentService = inject(PaymentService);
  private fundingSourceService = inject(FundingSourceService);
  private notify = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<RecordPaymentDialogComponent>);
  private cdr = inject(ChangeDetectorRef);
  data: RecordPaymentData = inject(MAT_DIALOG_DATA);

  isEdit = !!this.data.existingPayment;
  saving = signal(false);
  loadingAccounts = signal(true);
  paymentType = signal<'full' | 'minimum' | 'custom'>(this.data.existingPayment ? 'custom' : 'full');
  bankAccounts = signal<FundingSource[]>([]);
  currentAmount = signal<number | null>(this.data.existingPayment?.amountPaid ?? this.data.currentBalance);

  form = this.fb.group({
    amountPaid: [(this.data.existingPayment?.amountPaid ?? this.data.currentBalance) as number | null, [Validators.required, Validators.min(0.01)]],
    fromAccountId: [(this.data.existingPayment?.fromAccountId ?? null) as number | null],
    paymentDate: [this.data.existingPayment ? new Date(this.data.existingPayment.paymentDate) : new Date(), Validators.required],
    notes: [this.data.existingPayment?.notes ?? '']
  });

  calculatedSplit = computed(() => {
    const amount = this.currentAmount();
    const apr = this.data.aprPercent;
    const balance = this.data.currentBalance;
    if (!amount || !apr || !balance || amount <= 0) return null;
    const periodsPerYear = this.data.paymentFrequency === 'Biweekly' ? 26
      : this.data.paymentFrequency === 'Weekly' ? 52 : 12;
    const periodicRate = apr / 100 / periodsPerYear;
    const interest = Math.round(balance * periodicRate * 100) / 100;
    const principal = Math.max(0, Math.round((amount - interest) * 100) / 100);
    const actualInterest = Math.round((amount - principal) * 100) / 100;
    const principalPct = amount > 0 ? (principal / amount) * 100 : 0;
    return { principal, interest: actualInterest, principalPct };
  });

  constructor() {
    this.form.get('amountPaid')!.valueChanges.subscribe(v => this.currentAmount.set(v));
    this.fundingSourceService.getAll().subscribe({
      next: (sources) => {
        const banks = sources.filter(s => s.type === 'BankAccount');
        this.bankAccounts.set(banks);
        if (!this.isEdit && this.data.fundedBankAccountId && banks.some(b => b.id === this.data.fundedBankAccountId)) {
          this.form.patchValue({ fromAccountId: this.data.fundedBankAccountId });
        }
        this.loadingAccounts.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAccounts.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  setPaymentType(type: 'full' | 'minimum' | 'custom'): void {
    this.paymentType.set(type);
    if (type === 'full') {
      const val = this.data.currentBalance;
      this.form.patchValue({ amountPaid: val });
      this.currentAmount.set(val);
    } else if (type === 'minimum') {
      const val = this.data.minimumPayment ?? null;
      this.form.patchValue({ amountPaid: val });
      this.currentAmount.set(val);
    } else {
      this.form.patchValue({ amountPaid: null });
      this.currentAmount.set(null);
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const split = this.calculatedSplit();
    const payload: any = {
      amountPaid: value.amountPaid!,
      paymentDate: toLocalISOString(value.paymentDate!),
      notes: value.notes || undefined,
      fromAccountId: value.fromAccountId || undefined
    };
    if (split && this.data.debtType === 'PersonalLoan') {
      payload.principalAmount = split.principal;
      payload.interestAmount = split.interest;
    }

    const id = String(this.data.debtId);
    const request$ = this.isEdit
      ? this.paymentService.update(this.data.existingPayment!.id, payload)
      : this.data.debtType === 'CreditCard'
        ? this.cardService.recordPayment(id, payload)
        : this.loanService.recordPayment(id, payload);

    request$.subscribe({
      next: (payment) => {
        this.dialogRef.close(payment);
      },
      error: (err) => {
        this.notify.error(err?.error?.error || err?.error?.message || 'Failed to save payment');
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
