import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CreditCardService } from '../../core/services/credit-card.service';
import { CreditCard } from '../../core/models/credit-card.model';

@Component({
  selector: 'app-update-balance-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>credit_card</mat-icon>
      </div>
      <div class="header-text">
        <h2>Update Card</h2>
        <span class="card-name">{{ data.cardName }}</span>
      </div>
    </div>

    <mat-divider></mat-divider>

    <mat-dialog-content>
      <form [formGroup]="form" class="update-form">
        <div class="form-section">
          <span class="section-label">Balance & Payments</span>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Credit Limit</mat-label>
            <mat-icon matPrefix>credit_score</mat-icon>
            <input matInput type="number" formControlName="creditLimit" step="0.01">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Statement Balance</mat-label>
            <mat-icon matPrefix>account_balance_wallet</mat-icon>
            <input matInput type="number" formControlName="currentBalance" step="0.01">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Minimum Payment</mat-label>
            <mat-icon matPrefix>payments</mat-icon>
            <input matInput type="number" formControlName="minimumPayment" step="0.01">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        <div class="form-section">
          <span class="section-label">Card Terms</span>
          <div class="field-row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>APR</mat-label>
              <mat-icon matPrefix>percent</mat-icon>
              <input matInput type="number" formControlName="aprPercent" step="0.01">
              <span matTextSuffix>%</span>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Due Day</mat-label>
              <mat-icon matPrefix>event</mat-icon>
              <input matInput type="number" formControlName="dueDay">
              <mat-hint>1–31</mat-hint>
            </mat-form-field>
          </div>
        </div>

        <div class="form-section promo-section">
          <mat-slide-toggle formControlName="hasPromo" color="primary">
            Promotional Rate
          </mat-slide-toggle>

          @if (form.get('hasPromo')?.value) {
            <div class="field-row promo-fields">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Promo APR</mat-label>
                <input matInput type="number" formControlName="promoAprPercent" step="0.01">
                <span matTextSuffix>%</span>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Promo End Date</mat-label>
                <input matInput [matDatepicker]="promoPicker" formControlName="promoEndDate">
                <mat-datepicker-toggle matIconSuffix [for]="promoPicker"></mat-datepicker-toggle>
                <mat-datepicker #promoPicker></mat-datepicker>
              </mat-form-field>
            </div>
          }
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancel
      </button>
      @if (saving()) {
        <button mat-flat-button color="primary" disabled class="save-btn">
          <mat-icon class="spin">sync</mat-icon>
          Saving...
        </button>
      } @else {
        <button mat-flat-button color="primary" (click)="save()" [disabled]="form.invalid" class="save-btn">
          <mat-icon>check</mat-icon>
          Save Changes
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px 12px;
    }

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(106,27,154,0.12);
    }

    .header-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #6a1b9a;
    }

    .header-text h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text, #1a1a2e);
    }

    .card-name {
      font-size: 0.75rem;
      color: var(--color-text-secondary, #64748b);
      font-weight: 500;
    }

    mat-dialog-content {
      padding: 20px 24px !important;
      min-width: 340px;
      max-width: 440px;
    }

    .update-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-secondary, #64748b);
      margin-bottom: 8px;
      margin-top: 8px;
    }

    .field-row {
      display: flex;
      gap: 12px;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    mat-dialog-actions {
      padding: 12px 24px 20px !important;
      gap: 8px;
    }

    .cancel-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .save-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      border-radius: 8px !important;
      padding: 0 20px !important;
      font-weight: 500;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    mat-form-field mat-icon[matPrefix] {
      color: var(--color-text-secondary, #64748b);
      margin-right: 8px;
    }

    .promo-section {
      margin-top: 8px;
      padding: 12px;
      background: var(--color-surface-secondary, #f8fafc);
      border-radius: 8px;
      border: 1px solid var(--color-border, #e2e8f0);
    }

    .promo-fields {
      margin-top: 12px;
    }

    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: unset;
      }
      .field-row {
        flex-direction: column;
        gap: 4px;
      }
    }
  `]
})
export class UpdateBalanceDialogComponent {
  private fb = inject(FormBuilder);
  private cardService = inject(CreditCardService);
  private dialogRef = inject(MatDialogRef<UpdateBalanceDialogComponent>);
  data: CreditCard = inject(MAT_DIALOG_DATA);

  saving = signal(false);

  form = this.fb.group({
    creditLimit: [this.data.creditLimit, [Validators.required, Validators.min(1)]],
    currentBalance: [this.data.currentBalance, [Validators.required, Validators.min(0)]],
    minimumPayment: [this.data.minimumPayment, [Validators.required, Validators.min(0)]],
    aprPercent: [this.data.aprPercent, [Validators.required, Validators.min(0)]],
    dueDay: [this.data.dueDay, [Validators.required, Validators.min(1), Validators.max(31)]],
    hasPromo: [this.data.promoAprPercent != null],
    promoAprPercent: [this.data.promoAprPercent as number | null],
    promoEndDate: [this.data.promoEndDate ? new Date(this.data.promoEndDate) : null as Date | null]
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const payload: any = {
      cardName: this.data.cardName,
      creditLimit: value.creditLimit!,
      currentBalance: value.currentBalance!,
      minimumPayment: value.minimumPayment!,
      aprPercent: value.aprPercent!,
      dueDay: value.dueDay!,
      isAutopay: this.data.isAutopay
    };
    if (value.hasPromo && value.promoAprPercent != null) {
      payload.promoAprPercent = value.promoAprPercent;
      payload.promoEndDate = value.promoEndDate;
    } else {
      payload.promoAprPercent = null;
      payload.promoEndDate = null;
    }
    this.cardService.update(this.data.id, payload).subscribe({
      next: (updated) => {
        this.dialogRef.close(updated);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
}
