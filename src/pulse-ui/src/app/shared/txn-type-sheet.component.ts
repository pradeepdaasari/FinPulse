import { Component, ElementRef, NgZone, OnInit, OnDestroy, inject } from '@angular/core';
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
    :host {
      display: block;
      padding: 0 0 env(safe-area-inset-bottom, 16px);
      will-change: transform;
      touch-action: none;
    }
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
export class TxnTypeSheetComponent implements OnInit, OnDestroy {
  private sheetRef = inject(MatBottomSheetRef<TxnTypeSheetComponent>);
  private elRef = inject(ElementRef);
  private zone = inject(NgZone);

  private startY = 0;
  private currentY = 0;
  private dragging = false;
  private dismissThreshold = 80;

  private touchStartHandler = (e: TouchEvent) => this.onTouchStart(e);
  private touchMoveHandler = (e: TouchEvent) => this.onTouchMove(e);
  private touchEndHandler = () => this.onTouchEnd();

  options: TxnTypeOption[] = [
    { value: 'Expense', label: 'Expense', icon: 'remove_circle_outline', color: '#d32f2f', bg: 'rgba(255,59,48,0.1)' },
    { value: 'Income', label: 'Income', icon: 'add_circle_outline', color: '#2e7d32', bg: 'rgba(48,209,88,0.1)' },
    { value: 'Transfer', label: 'Transfer', icon: 'swap_horiz', color: '#1565c0', bg: 'rgba(0,122,255,0.1)' },
    { value: 'Refund', label: 'Refund', icon: 'undo', color: '#e65100', bg: 'rgba(255,159,10,0.1)' },
    { value: 'CardPayment', label: 'Card Payment', icon: 'credit_card', color: '#7b1fa2', bg: 'rgba(191,90,242,0.1)' },
    { value: 'LoanPayment', label: 'Loan Payment', icon: 'account_balance', color: '#007AFF', bg: 'rgba(0,122,255,0.1)' },
    { value: 'LogTrade', label: 'Log Trade', icon: 'candlestick_chart', color: '#1565c0', bg: 'rgba(0,122,255,0.1)' },
    { value: 'LogMetric', label: 'Log Metric', icon: 'monitor_heart', color: '#d32f2f', bg: 'rgba(211,47,47,0.1)' },
  ];

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      const el = this.elRef.nativeElement as HTMLElement;
      el.addEventListener('touchstart', this.touchStartHandler, { passive: true });
      el.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
      el.addEventListener('touchend', this.touchEndHandler, { passive: true });
    });
  }

  ngOnDestroy(): void {
    const el = this.elRef.nativeElement as HTMLElement;
    el.removeEventListener('touchstart', this.touchStartHandler);
    el.removeEventListener('touchmove', this.touchMoveHandler);
    el.removeEventListener('touchend', this.touchEndHandler);
  }

  select(value: string): void {
    this.sheetRef.dismiss(value);
  }

  private onTouchStart(e: TouchEvent): void {
    this.startY = e.touches[0].clientY;
    this.currentY = this.startY;
    this.dragging = true;
    const el = this.elRef.nativeElement as HTMLElement;
    el.style.transition = 'none';
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.dragging) return;
    this.currentY = e.touches[0].clientY;
    const dy = this.currentY - this.startY;
    if (dy > 0) {
      e.preventDefault();
      const el = this.elRef.nativeElement as HTMLElement;
      el.style.transform = `translateY(${dy}px)`;
      el.style.opacity = String(Math.max(0.4, 1 - dy / 300));
    }
  }

  private onTouchEnd(): void {
    if (!this.dragging) return;
    this.dragging = false;
    const dy = this.currentY - this.startY;
    const el = this.elRef.nativeElement as HTMLElement;
    el.style.transition = 'transform 0.25s ease, opacity 0.25s ease';

    if (dy >= this.dismissThreshold) {
      el.style.transform = `translateY(${el.offsetHeight}px)`;
      el.style.opacity = '0';
      setTimeout(() => this.zone.run(() => this.sheetRef.dismiss()), 200);
    } else {
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    }
  }
}
