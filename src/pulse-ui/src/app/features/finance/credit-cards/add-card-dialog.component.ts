import { Component, ChangeDetectorRef, inject, signal } from '@angular/core';
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
import { CreditCardService } from '../../../core/services/credit-card.service';

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
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>credit_card</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>Add Credit Card</h2>
          <p class="dialog-subtitle">Track your credit cards</p>
        </div>
        <span class="banner-spacer"></span>
        <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="card-form" (submit)="$event.preventDefault()">
        <div class="amount-hero">
          <div class="amount-input-row">
            <span class="amount-dollar">$</span>
            <input class="amount-value" type="number" inputmode="decimal" formControlName="currentBalance" placeholder="0.00">
          </div>
          <div class="amount-underline"></div>
          <span class="amount-hint">Statement Balance</span>
        </div>

        <mat-form-field class="full-width">
          <mat-label>Card Name</mat-label>
          <input matInput formControlName="cardName" placeholder="e.g. Chase Sapphire, Amex Gold">
        </mat-form-field>

        <div class="form-row">
          <mat-form-field>
            <mat-label>Credit Limit</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="creditLimit">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Minimum Payment</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="minimumPayment">
            <span matTextPrefix>$&nbsp;</span>
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field>
            <mat-label>APR %</mat-label>
            <input matInput type="number" inputmode="decimal" formControlName="aprPercent" step="0.01">
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

        <div class="more-options-toggle" (click)="showMore.set(!showMore())">
          <mat-icon class="more-icon">{{ showMore() ? 'expand_less' : 'expand_more' }}</mat-icon>
          <span>More options (Billing, Autopay, Promo)</span>
        </div>

        @if (showMore()) {
          <div class="more-options-section">
            <mat-form-field class="full-width">
              <mat-label>Billing Cycle Days</mat-label>
              <input matInput type="number" inputmode="decimal" formControlName="billingCycleDays">
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
                      <input matInput type="number" inputmode="decimal" formControlName="promoAprPercent" step="0.01">
                    </mat-form-field>

                    <mat-form-field>
                      <mat-label>Promo Ends On</mat-label>
                      <input matInput [matDatepicker]="promoPicker" formControlName="promoEndDate">
                      <mat-datepicker-toggle matIconSuffix [for]="promoPicker"></mat-datepicker-toggle>
                      <mat-datepicker #promoPicker></mat-datepicker>
                    </mat-form-field>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </form>
    </mat-dialog-content>
    <div class="sticky-save-bar">
      <button class="gradient-save-btn" (click)="save()" [disabled]="form.invalid || saving()">
        <mat-icon>check</mat-icon>
        {{ saving() ? 'Saving...' : 'Add Card' }}
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
    .card-form { display: flex; flex-direction: column; gap: var(--spacing-xs); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .full-width { width: 100%; }

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
    .promo-section {
      margin-top: var(--spacing-sm);
      padding: var(--spacing-sm);
      background: var(--color-bg); border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }
    .promo-fields { margin-top: var(--spacing-sm); }

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
export class AddCardDialogComponent {
  private fb = inject(FormBuilder);
  private cardService = inject(CreditCardService);
  private dialogRef = inject(MatDialogRef<AddCardDialogComponent>);
  private cdr = inject(ChangeDetectorRef);

  dueDays = Array.from({ length: 31 }, (_, i) => i + 1);
  saving = signal(false);
  showMore = signal(false);

  form = this.fb.group({
    cardName: ['', Validators.required],
    creditLimit: [null as number | null, [Validators.required, Validators.min(1)]],
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
      creditLimit: value.creditLimit,
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
        this.cdr.detectChanges();
      }
    });
  }
}
