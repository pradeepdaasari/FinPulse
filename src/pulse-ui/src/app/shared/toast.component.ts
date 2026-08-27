import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="toast" [class]="'toast-' + data.type">
      <div class="toast-icon">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <span class="toast-msg">{{ data.message }}</span>
      <button class="toast-close" (click)="dismiss()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 12px;
      font-family: var(--font-primary, -apple-system, BlinkMacSystemFont, sans-serif);
      font-size: 0.95rem;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      min-width: 320px;
      max-width: 440px;
    }
    @media (min-width: 600px) {
      .toast {
        min-width: 360px;
        max-width: 480px;
        font-size: 1rem;
        padding: 16px 20px;
      }
    }
    .toast-icon {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .toast-icon mat-icon {
      font-size: 20px; width: 20px; height: 20px;
    }
    .toast-msg {
      flex: 1;
      line-height: 1.4;
    }
    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
      transition: opacity 0.15s;
    }
    .toast-close:hover { opacity: 1; }
    .toast-close mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .toast-success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .toast-success .toast-icon { background: #dcfce7; }
    .toast-success .toast-icon mat-icon { color: #16a34a; }
    .toast-success .toast-close { color: #166534; }

    .toast-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .toast-error .toast-icon { background: #fee2e2; }
    .toast-error .toast-icon mat-icon { color: #dc2626; }
    .toast-error .toast-close { color: #991b1b; }

    .toast-warning {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .toast-warning .toast-icon { background: #fef3c7; }
    .toast-warning .toast-icon mat-icon { color: #d97706; }
    .toast-warning .toast-close { color: #92400e; }

    .toast-info {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .toast-info .toast-icon { background: #dbeafe; }
    .toast-info .toast-icon mat-icon { color: #2563eb; }
    .toast-info .toast-close { color: #1e40af; }
  `]
})
export class ToastComponent {
  data = inject<ToastData>(MAT_SNACK_BAR_DATA);
  private snackBarRef = inject(MatSnackBarRef);

  get icon(): string {
    switch (this.data.type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
    }
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
