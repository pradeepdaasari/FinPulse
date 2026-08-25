import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  color?: 'primary' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="confirm-header">
      <div class="confirm-icon-wrap" [class.warn]="data.color === 'warn'">
        <mat-icon>{{ data.color === 'warn' ? 'warning' : 'help_outline' }}</mat-icon>
      </div>
      <h2>{{ data.title }}</h2>
    </div>
    <mat-dialog-content>
      <p class="confirm-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="dialogRef.close(false)">{{ data.cancelText || 'Cancel' }}</button>
      <button mat-raised-button [color]="data.color || 'primary'" (click)="dialogRef.close(true)">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: var(--spacing-md);
    }
    .confirm-header h2 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: 600;
    }
    .confirm-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gradient-icon-blue);
    }
    .confirm-icon-wrap mat-icon {
      color: var(--color-primary);
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .confirm-icon-wrap.warn {
      background: var(--color-danger-bg);
    }
    .confirm-icon-wrap.warn mat-icon {
      color: var(--color-danger);
    }
    .confirm-message {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin: 0;
    }
  `]
})
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}
