import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { CreditCard } from '../../core/models/credit-card.model';
import { CreditCardService } from '../../core/services/credit-card.service';

@Component({
  selector: 'app-credit-card-form',
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
          <mat-label>Card Name</mat-label>
          <input matInput formControlName="cardName">
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
          <mat-label>Minimum Payment</mat-label>
          <input matInput type="number" formControlName="minimumPayment">
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
          <mat-label>Promo APR % (optional)</mat-label>
          <input matInput type="number" formControlName="promoAprPercent">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Promo End Date (optional)</mat-label>
          <input matInput [matDatepicker]="promoPicker" formControlName="promoEndDate">
          <mat-datepicker-toggle matIconSuffix [for]="promoPicker"></mat-datepicker-toggle>
          <mat-datepicker #promoPicker></mat-datepicker>
        </mat-form-field>
      </div>

      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
        Save Card
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
export class CreditCardFormComponent {
  @Output() saved = new EventEmitter<CreditCard>();

  private fb = inject(FormBuilder);
  private cardService = inject(CreditCardService);

  dueDays = Array.from({ length: 28 }, (_, i) => i + 1);

  form = this.fb.group({
    cardName: ['', Validators.required],
    currentBalance: [null as number | null, [Validators.required, Validators.min(0)]],
    aprPercent: [null as number | null, [Validators.required, Validators.min(0)]],
    minimumPayment: [null as number | null, [Validators.required, Validators.min(1)]],
    dueDay: [1, Validators.required],
    promoAprPercent: [null as number | null],
    promoEndDate: [null as Date | null]
  });

  onSubmit(): void {
    if (this.form.valid) {
      const value = this.form.getRawValue();
      this.cardService.create(value as any).subscribe({
        next: (card) => {
          this.saved.emit(card);
          this.form.reset({ dueDay: 1 });
        }
      });
    }
  }
}
