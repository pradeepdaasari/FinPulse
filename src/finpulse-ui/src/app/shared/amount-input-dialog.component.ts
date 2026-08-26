import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface AmountInputDialogData {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: number;
  icon?: string;
}

@Component({
  selector: 'app-amount-input-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatDialogModule],
  template: `
    <div class="amount-header">
      <div class="amount-icon-wrap">
        <mat-icon>{{ data.icon || 'savings' }}</mat-icon>
      </div>
      <h2>{{ data.title }}</h2>
    </div>
    <mat-dialog-content>
      @if (data.message) {
        <p class="amount-message">{{ data.message }}</p>
      }
      <mat-form-field appearance="outline" class="amount-field">
        <mat-label>{{ data.placeholder || 'Amount' }}</mat-label>
        <span matTextPrefix>$&nbsp;</span>
        <input matInput type="number" [(ngModel)]="amount" min="0.01" step="1" (keydown.enter)="submit()" autofocus>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close(null)">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!amount || amount <= 0" (click)="submit()">
        Add
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .amount-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: var(--spacing-md);
    }
    .amount-header h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
    }
    .amount-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gradient-icon-green);
    }
    .amount-icon-wrap mat-icon {
      color: var(--color-success);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .amount-message {
      font-size: var(--text-base);
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-md);
      line-height: 1.5;
    }
    .amount-field { width: 100%; }
  `]
})
export class AmountInputDialogComponent {
  data = inject<AmountInputDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<AmountInputDialogComponent>);
  amount: number = this.data.defaultValue || 50;

  submit(): void {
    if (this.amount && this.amount > 0) {
      this.dialogRef.close(this.amount);
    }
  }
}
