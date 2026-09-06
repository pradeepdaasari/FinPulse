import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface MarkPaidDialogData {
  description: string;
  amount: number;
}

@Component({
  selector: 'app-mark-paid-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <div class="header-icon">
        <mat-icon>check_circle</mat-icon>
      </div>
      <h2>Mark as Paid</h2>
    </div>
    <mat-dialog-content>
      <p class="desc">{{ data.description }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Amount Paid</mat-label>
        <span matTextPrefix>$&nbsp;</span>
        <input matInput type="number" [(ngModel)]="amount" step="0.01" min="0.01">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!amount || amount <= 0" (click)="confirm()">
        <mat-icon>check</mat-icon> Confirm
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 24px 8px;
    }
    .header-icon {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-green-bg);
    }
    .header-icon mat-icon { color: var(--color-success); font-size: 20px; width: 20px; height: 20px; }
    h2 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .desc { color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 12px; }
    .full-width { width: 100%; }
    mat-dialog-actions button mat-icon { margin-right: 4px; }
  `]
})
export class MarkPaidDialogComponent {
  data: MarkPaidDialogData = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<MarkPaidDialogComponent>);

  amount = this.data.amount;

  confirm(): void {
    this.dialogRef.close(this.amount);
  }
}
