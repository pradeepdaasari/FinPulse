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
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { MoneyMovementService } from '../core/services/money-movement.service';
import { FundingSourceService } from '../core/services/funding-source.service';
import { LoanService } from '../core/services/loan.service';
import { MoneyMovementEntityType, MovementType } from '../core/models/money-movement.model';
import { FundingSource } from '../core/models/funding-source.model';
import { PersonalLoan } from '../core/models/personal-loan.model';

interface EntityOption {
  type: MoneyMovementEntityType;
  id: number | string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-add-movement-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon cyan">
        <mat-icon>sync_alt</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>Add Money Movement</h2>
        <span class="dialog-subtitle">Track a manual money flow</span>
      </div>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="movement-form" (submit)="$event.preventDefault(); save()">
        <mat-form-field>
          <mat-label>Movement Type</mat-label>
          <mat-select formControlName="movementType">
            <mat-option value="Transfer">Transfer</mat-option>
            <mat-option value="LoanPayment">Loan Payment</mat-option>
            <mat-option value="CardPayment">Card Payment</mat-option>
            <mat-option value="LoanFunding">Loan Funding</mat-option>
            <mat-option value="Deposit">Deposit</mat-option>
            <mat-option value="Withdrawal">Withdrawal</mat-option>
            <mat-option value="TradePnl">Trade P&amp;L</mat-option>
            <mat-option value="TradeFee">Trade Fee</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field>
            <mat-label>From (Source Type)</mat-label>
            <mat-select formControlName="sourceType">
              <mat-option value="BankAccount">Bank Account</mat-option>
              <mat-option value="Loan">Loan</mat-option>
              <mat-option value="CreditCard">Credit Card</mat-option>
              <mat-option value="External">External</mat-option>
            </mat-select>
          </mat-form-field>

          @if (form.get('sourceType')?.value !== 'External') {
            <mat-form-field>
              <mat-label>Source Account</mat-label>
              <mat-select formControlName="sourceId">
                @for (entity of sourceOptions(); track entity.id) {
                  <mat-option [value]="entity.id">
                    <mat-icon>{{ entity.icon }}</mat-icon> {{ entity.name }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>To (Destination Type)</mat-label>
            <mat-select formControlName="destinationType">
              <mat-option value="BankAccount">Bank Account</mat-option>
              <mat-option value="Loan">Loan</mat-option>
              <mat-option value="CreditCard">Credit Card</mat-option>
              <mat-option value="External">External</mat-option>
            </mat-select>
          </mat-form-field>

          @if (form.get('destinationType')?.value !== 'External') {
            <mat-form-field>
              <mat-label>Destination Account</mat-label>
              <mat-select formControlName="destinationId">
                @for (entity of destOptions(); track entity.id) {
                  <mat-option [value]="entity.id">
                    <mat-icon>{{ entity.icon }}</mat-icon> {{ entity.name }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          }
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>Amount</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="amount">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="datePicker" formControlName="movementDate">
            <mat-datepicker-toggle matIconSuffix [for]="datePicker"></mat-datepicker-toggle>
            <mat-datepicker #datePicker></mat-datepicker>
          </mat-form-field>
        </div>

        <mat-form-field>
          <mat-label>Note (optional)</mat-label>
          <input matInput formControlName="note" placeholder="What is this movement for?">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-stroked-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-flat-button color="primary" class="save-btn" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Saving...' : 'Add Movement' }}
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
    .header-icon.cyan { background: rgba(0,150,136,0.12); }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #00796b; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    mat-dialog-content { min-width: 400px; max-width: 550px; }
    .movement-form { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .dialog-actions {
      padding: 12px 24px 16px !important;
      border-top: 1px solid var(--color-border);
      gap: 8px;
    }
    .cancel-btn, .save-btn {
      border-radius: var(--radius-sm) !important;
      padding: 0 20px !important;
      font-weight: 600 !important;
      min-height: 40px;
    }
    @media (max-width: 600px) {
      mat-dialog-content { min-width: unset; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AddMovementDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private movementService = inject(MoneyMovementService);
  private fundingSourceService = inject(FundingSourceService);
  private loanService = inject(LoanService);
  private dialogRef = inject(MatDialogRef<AddMovementDialogComponent>);
  private cdr = inject(ChangeDetectorRef);

  saving = signal(false);
  bankAccounts = signal<EntityOption[]>([]);
  creditCards = signal<EntityOption[]>([]);
  loans = signal<EntityOption[]>([]);

  sourceType = signal<MoneyMovementEntityType>('BankAccount');
  destType = signal<MoneyMovementEntityType>('BankAccount');

  sourceOptions = computed(() => this.getEntitiesForType(this.sourceType()));
  destOptions = computed(() => this.getEntitiesForType(this.destType()));

  form = this.fb.group({
    movementType: ['Transfer' as string, Validators.required],
    sourceType: ['BankAccount' as string, Validators.required],
    sourceId: [null as number | null],
    destinationType: ['BankAccount' as string, Validators.required],
    destinationId: [null as number | null],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    movementDate: [new Date(), Validators.required],
    note: ['']
  });

  ngOnInit(): void {
    forkJoin([
      this.fundingSourceService.getAll(),
      this.loanService.getAll()
    ]).subscribe(([sources, loansData]) => {
      this.bankAccounts.set(
        sources.filter(s => s.type === 'BankAccount').map(s => ({ type: 'BankAccount' as const, id: s.id, name: s.name, icon: 'account_balance' }))
      );
      this.creditCards.set(
        sources.filter(s => s.type === 'CreditCard').map(s => ({ type: 'CreditCard' as const, id: s.id, name: s.name, icon: 'credit_card' }))
      );
      this.loans.set(
        loansData.map(l => ({ type: 'Loan' as const, id: l.id, name: l.lenderName, icon: 'account_balance_wallet' }))
      );
      this.cdr.detectChanges();
    });

    this.form.get('sourceType')!.valueChanges.subscribe(val => {
      this.sourceType.set(val as MoneyMovementEntityType);
      this.form.patchValue({ sourceId: null });
    });
    this.form.get('destinationType')!.valueChanges.subscribe(val => {
      this.destType.set(val as MoneyMovementEntityType);
      this.form.patchValue({ destinationId: null });
    });
  }

  private getEntitiesForType(type: MoneyMovementEntityType): EntityOption[] {
    switch (type) {
      case 'BankAccount': return this.bankAccounts();
      case 'CreditCard': return this.creditCards();
      case 'Loan': return this.loans();
      default: return [];
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const v = this.form.getRawValue();
    this.movementService.create({
      sourceType: v.sourceType as MoneyMovementEntityType,
      sourceId: v.sourceType === 'External' ? null : (v.sourceId != null ? +v.sourceId : null),
      destinationType: v.destinationType as MoneyMovementEntityType,
      destinationId: v.destinationType === 'External' ? null : (v.destinationId != null ? +v.destinationId : null),
      amount: v.amount!,
      movementDate: v.movementDate!.toISOString(),
      movementType: v.movementType as MovementType,
      note: v.note || undefined
    }).subscribe({
      next: (created) => this.dialogRef.close(created),
      error: () => {
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
