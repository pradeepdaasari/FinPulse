import { Component, inject, signal } from '@angular/core';
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
import { CreditCardService } from '../../core/services/credit-card.service';

@Component({
  selector: 'app-add-card-dialog',
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
    <h2 mat-dialog-title>Add Credit Card</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="card-form">
        <mat-form-field class="full-width">
          <mat-label>Card Name</mat-label>
          <input matInput formControlName="cardName" placeholder="e.g. Chase Sapphire, Amex Gold">
        </mat-form-field>

        <div class="form-row">
          <mat-form-field>
            <mat-label>Statement Balance</mat-label>
            <input matInput type="number" formControlName="currentBalance">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Minimum Payment</mat-label>
            <input matInput type="number" formControlName="minimumPayment">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>APR %</mat-label>
            <input matInput type="number" formControlName="aprPercent" step="0.01">
          </mat-form-field>

          <mat-form-field>
            <mat-label>Due Day of Month</mat-label>
            <mat-select formControlName="dueDay">
              @for (day of dueDays; track day) {
                <mat-option [value]="day">{{ day }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field class="full-width">
          <mat-label>Billing Cycle Days</mat-label>
          <input matInput type="number" formControlName="billingCycleDays">
          <mat-hint>Number of days in your billing cycle (typically 28-31)</mat-hint>
        </mat-form-field>

        <mat-slide-toggle formControlName="isAutopay" color="primary">
          This card is on autopay
        </mat-slide-toggle>

        <div class="promo-section">
          <mat-slide-toggle formControlName="hasPromo" color="primary">
            This card has a promotional rate
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
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        @if (saving()) {
          Saving...
        } @else {
          Add Card
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
      max-width: 550px;
    }
    .card-form {
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
export class AddCardDialogComponent {
  private fb = inject(FormBuilder);
  private cardService = inject(CreditCardService);
  private dialogRef = inject(MatDialogRef<AddCardDialogComponent>);

  dueDays = Array.from({ length: 28 }, (_, i) => i + 1);
  saving = signal(false);

  form = this.fb.group({
    cardName: ['', Validators.required],
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    minimumPayment: [null as number | null, [Validators.required, Validators.min(1)]],
    aprPercent: [null as number | null, [Validators.required, Validators.min(0)]],
    dueDay: [1, Validators.required],
    billingCycleDays: [30, [Validators.required, Validators.min(20), Validators.max(45)]],
    isAutopay: [false],
    hasPromo: [false],
    promoAprPercent: [null as number | null],
    promoEndDate: [null as Date | null]
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const card: any = {
      cardName: value.cardName,
      currentBalance: value.currentBalance,
      minimumPayment: value.minimumPayment,
      aprPercent: value.aprPercent,
      dueDay: value.dueDay,
      billingCycleDays: value.billingCycleDays,
      isAutopay: value.isAutopay
    };

    if (value.hasPromo && value.promoAprPercent != null) {
      card.promoAprPercent = value.promoAprPercent;
      card.promoEndDate = value.promoEndDate;
    }

    this.cardService.create(card).subscribe({
      next: (created) => {
        this.dialogRef.close(created);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
}
