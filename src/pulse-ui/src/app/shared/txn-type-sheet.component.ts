import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';

export interface TxnTypeOption {
  value: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-txn-type-sheet',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="sheet-header">
      <div class="sheet-handle"></div>
      <h3>What would you like to log?</h3>
    </div>
    <div class="sheet-options">
      @for (opt of options; track opt.value) {
        <button class="type-btn" (click)="select(opt.value)">
          <div class="type-icon" [style.background]="opt.bg">
            <mat-icon [style.color]="opt.color">{{ opt.icon }}</mat-icon>
          </div>
          <span class="type-label">{{ opt.label }}</span>
          <mat-icon class="chevron">chevron_right</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; padding: 0 0 env(safe-area-inset-bottom, 16px); }
    .sheet-header {
      text-align: center;
      padding: 12px 20px 16px;
    }
    .sheet-handle {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: rgba(0,0,0,0.15);
      margin: 0 auto 14px;
    }
    .sheet-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text);
    }
    .sheet-options {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 12px 12px;
    }
    .type-btn {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.15s ease;
      width: 100%;
      text-align: left;
      -webkit-tap-highlight-color: transparent;
    }
    .type-btn:active {
      background: var(--color-surface-secondary);
    }
    .type-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .type-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .type-label {
      flex: 1;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .chevron {
      color: var(--color-text-muted);
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class TxnTypeSheetComponent {
  options: TxnTypeOption[] = [
    { value: 'Expense', label: 'Expense', icon: 'remove_circle_outline', color: '#d32f2f', bg: 'rgba(255,59,48,0.1)' },
    { value: 'Income', label: 'Income', icon: 'add_circle_outline', color: '#2e7d32', bg: 'rgba(48,209,88,0.1)' },
    { value: 'Transfer', label: 'Transfer', icon: 'swap_horiz', color: '#1565c0', bg: 'rgba(0,122,255,0.1)' },
    { value: 'Refund', label: 'Refund', icon: 'undo', color: '#e65100', bg: 'rgba(255,159,10,0.1)' },
    { value: 'CardPayment', label: 'Card Payment', icon: 'credit_card', color: '#7b1fa2', bg: 'rgba(191,90,242,0.1)' },
    { value: 'LogMetric', label: 'Log Metric', icon: 'monitor_heart', color: '#d32f2f', bg: 'rgba(211,47,47,0.1)' },
  ];

  constructor(private sheetRef: MatBottomSheetRef<TxnTypeSheetComponent>) {}

  select(value: string): void {
    this.sheetRef.dismiss(value);
  }
}
