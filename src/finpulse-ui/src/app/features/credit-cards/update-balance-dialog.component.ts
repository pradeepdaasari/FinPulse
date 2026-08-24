import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Update Statement — {{ data.cardName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="balance-form">
        <mat-form-field class="full-width">
          <mat-label>Statement Balance</mat-label>
          <input matInput type="number" formControlName="currentBalance">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field class="full-width">
          <mat-label>Minimum Payment</mat-label>
          <input matInput type="number" formControlName="minimumPayment">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        @if (saving()) {
          Updating...
        } @else {
          Update
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 320px;
      max-width: 400px;
    }
    .balance-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
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
export class UpdateBalanceDialogComponent {
  private fb = inject(FormBuilder);
  private cardService = inject(CreditCardService);
  private dialogRef = inject(MatDialogRef<UpdateBalanceDialogComponent>);
  data: CreditCard = inject(MAT_DIALOG_DATA);

  saving = signal(false);

  form = this.fb.group({
    currentBalance: [this.data.currentBalance, [Validators.required, Validators.min(0)]],
    minimumPayment: [this.data.minimumPayment, [Validators.required, Validators.min(0)]]
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    this.cardService.update(this.data.id, {
      currentBalance: value.currentBalance!,
      minimumPayment: value.minimumPayment!
    }).subscribe({
      next: (updated) => {
        this.dialogRef.close(updated);
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }
}
