import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { CreditCardService } from '../core/services/credit-card.service';
import { LoanService } from '../core/services/loan.service';
import { FundingSourceService } from '../core/services/funding-source.service';
import { FundingSource } from '../core/models/funding-source.model';

export interface RecordPaymentData {
  debtId: string;
  debtName: string;
  debtType: 'PersonalLoan' | 'CreditCard';
  currentBalance: number;
  minimumPayment?: number;
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
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>Record Payment</h2>
    <mat-dialog-content>
      <div class="debt-info">
        <mat-icon>{{ data.debtType === 'CreditCard' ? 'credit_card' : 'account_balance' }}</mat-icon>
        <div>
          <span class="debt-name">{{ data.debtName }}</span>
          <span class="debt-balance">Balance: {{ data.currentBalance | currency }}</span>
        </div>
      </div>

      <form [formGroup]="form" class="payment-form">
        <div class="payment-type-row">
          <mat-button-toggle-group [value]="paymentType()" (change)="setPaymentType($event.value)">
            <mat-button-toggle value="full">Full ({{ data.currentBalance | currency }})</mat-button-toggle>
            @if (data.minimumPayment) {
              <mat-button-toggle value="minimum">Min ({{ data.minimumPayment | currency }})</mat-button-toggle>
            }
            <mat-button-toggle value="custom">Custom</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <mat-form-field class="full-width">
          <mat-label>Payment Amount</mat-label>
          <input matInput type="number" formControlName="amountPaid" step="0.01" [readonly]="paymentType() !== 'custom'">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

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
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        @if (saving()) {
          Recording...
        } @else {
          Record Payment
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 350px;
      max-width: 450px;
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
  private fundingSourceService = inject(FundingSourceService);
  private dialogRef = inject(MatDialogRef<RecordPaymentDialogComponent>);
  data: RecordPaymentData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  paymentType = signal<'full' | 'minimum' | 'custom'>('full');
  bankAccounts = signal<FundingSource[]>([]);

  form = this.fb.group({
    amountPaid: [this.data.currentBalance as number | null, [Validators.required, Validators.min(0.01)]],
    fromAccountId: [null as number | null],
    paymentDate: [new Date(), Validators.required],
    notes: ['']
  });

  constructor() {
    this.fundingSourceService.getAll().subscribe(sources => {
      this.bankAccounts.set(sources.filter(s => s.type === 'BankAccount'));
    });
  }

  setPaymentType(type: 'full' | 'minimum' | 'custom'): void {
    this.paymentType.set(type);
    if (type === 'full') {
      this.form.patchValue({ amountPaid: this.data.currentBalance });
    } else if (type === 'minimum') {
      this.form.patchValue({ amountPaid: this.data.minimumPayment ?? null });
    } else {
      this.form.patchValue({ amountPaid: null });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const payload = {
      amountPaid: value.amountPaid!,
      paymentDate: value.paymentDate!.toISOString(),
      notes: value.notes || undefined,
      fromAccountId: value.fromAccountId || undefined
    };

    const request$ = this.data.debtType === 'CreditCard'
      ? this.cardService.recordPayment(this.data.debtId, payload)
      : this.loanService.recordPayment(this.data.debtId, payload);

    request$.subscribe({
      next: (payment) => {
        this.dialogRef.close(payment);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
}
