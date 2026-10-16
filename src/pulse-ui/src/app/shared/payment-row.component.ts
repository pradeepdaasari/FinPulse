import { Component, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MonthlyPaymentRow } from '../core/models/dashboard.model';

@Component({
  selector: 'app-payment-row',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, CurrencyPipe],
  template: `
    <div class="pay-row" [class]="'status-' + row().status" (click)="recordPayment.emit(row())">
      <div class="pay-icon" [style.background]="row().iconColor">
        <mat-icon>{{ row().icon }}</mat-icon>
      </div>
      <div class="pay-main">
        <div class="pay-top-line">
          <span class="pay-name">
            {{ row().name }}
            @if (row().isAutopay) {
              <mat-icon class="autopay-badge" matTooltip="Autopay enabled">autorenew</mat-icon>
            }
          </span>
          <span class="pay-amount" [class.paid-through]="row().status === 'paid'">{{ row().amount | currency }}</span>
        </div>
        <div class="pay-meta-line">
          <span class="pay-due">
            @if (row().status === 'overdue') {
              <mat-icon class="meta-icon overdue">error</mat-icon>
            } @else if (row().status === 'paid') {
              <mat-icon class="meta-icon paid">check_circle</mat-icon>
            }
            {{ row().dueLabel }}
          </span>
          @if (!compact()) {
            <div class="pay-pills">
              @if (row().kind === 'loan') {
                <span class="pill pill-loan">Loan</span>
              } @else if (row().kind === 'card') {
                <span class="pill pill-card">Card</span>
              } @else {
                <span class="pill pill-bill">Bill</span>
              }
              @if (row().minimumPayment !== null && row().minimumPayment! > 0) {
                <span class="pill pill-min">Min {{ row().minimumPayment | currency:'USD':'symbol':'1.0-0' }}</span>
              }
              @if (row().apr !== null && row().apr! > 0) {
                <span class="pill pill-apr">{{ row().apr | number:'1.1-1' }}%</span>
              }
              @if (row().subType) {
                <span class="pill pill-type">{{ row().subType }}</span>
              }
            </div>
          }
        </div>
        @if (!compact() && row().balance !== null && row().balance !== undefined) {
          <div class="pay-balance-line">
            <span class="bal-label">Balance</span>
            <span class="bal-value">{{ row().balance | currency }}</span>
            @if (row().paidAmount > 0 && row().status !== 'paid') {
              <span class="bal-paid">{{ row().paidAmount | currency }} paid</span>
            }
          </div>
        }
      </div>
      @if (!compact()) {
        <div class="pay-status-col">
          @if (row().status === 'paid') {
            <span class="status-badge s-paid"><mat-icon>check</mat-icon></span>
          } @else {
            <button class="record-btn" (click)="recordPayment.emit(row()); $event.stopPropagation()" matTooltip="Record payment">
              <mat-icon>payments</mat-icon>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .pay-row {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 14px 16px; border-bottom: 1px solid var(--color-border);
      transition: background 0.15s; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .pay-row:last-child { border-bottom: none; }
    .pay-row:hover { background: var(--color-surface-secondary); }
    .pay-row.status-overdue { background: color-mix(in srgb, var(--color-danger) 5%, var(--color-surface)); }
    .pay-row.status-paid { opacity: 0.55; }

    .pay-icon {
      width: 36px; height: 36px; min-width: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      margin-top: 2px;
    }
    .pay-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }

    .pay-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .pay-top-line { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .pay-name {
      font-size: 0.88rem; font-weight: 600; display: flex; align-items: center; gap: 4px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .autopay-badge { font-size: 14px; width: 14px; height: 14px; color: var(--color-primary); flex-shrink: 0; }
    .pay-amount { font-size: 0.92rem; font-weight: 700; font-variant-numeric: tabular-nums; flex-shrink: 0; }
    .paid-through { text-decoration: line-through; opacity: 0.5; }

    .pay-meta-line {
      display: flex; justify-content: space-between; align-items: center; gap: 8px;
      flex-wrap: wrap;
    }
    .pay-due {
      font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500;
      display: flex; align-items: center; gap: 3px;
    }
    .meta-icon { font-size: 13px; width: 13px; height: 13px; }
    .meta-icon.overdue { color: var(--color-danger); }
    .meta-icon.paid { color: var(--color-success); }
    .pay-pills { display: flex; gap: 4px; flex-wrap: wrap; }
    .pill {
      font-size: 0.58rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.03em; padding: 1px 6px; border-radius: var(--radius-full);
    }
    .pill-loan { background: color-mix(in srgb, #007AFF 12%, transparent); color: #007AFF; }
    .pill-card { background: color-mix(in srgb, #5856D6 12%, transparent); color: #5856D6; }
    .pill-bill { background: color-mix(in srgb, #FF9500 12%, transparent); color: #FF9500; }
    .pill-min { background: color-mix(in srgb, var(--color-warning) 12%, transparent); color: var(--color-warning); }
    .pill-apr { background: color-mix(in srgb, var(--color-danger) 10%, transparent); color: var(--color-danger); }
    .pill-type { background: var(--color-surface-secondary); color: var(--color-text-muted); }

    .pay-balance-line {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.72rem; color: var(--color-text-muted); margin-top: 2px;
    }
    .bal-label { font-weight: 500; }
    .bal-value { font-weight: 600; color: var(--color-text); font-variant-numeric: tabular-nums; }
    .bal-paid { color: var(--color-success); font-weight: 600; margin-left: auto; }

    .pay-status-col {
      display: flex; align-items: center; flex-shrink: 0; margin-top: 2px;
    }
    .status-badge {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .status-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .s-paid { background: var(--color-success); color: #fff; }
    .record-btn {
      width: 34px; height: 34px; border: 1px solid var(--color-border);
      border-radius: 10px; background: var(--color-surface); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s, border-color 0.15s;
    }
    .record-btn:hover { border-color: var(--color-success); background: color-mix(in srgb, var(--color-success) 8%, var(--color-surface)); }
    .record-btn mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-success); }

    @media (max-width: 599px) {
      .pay-row { padding: 12px 14px; gap: 10px; }
      .pay-icon { width: 32px; height: 32px; min-width: 32px; }
      .pay-amount { font-size: 0.85rem; }
      .pay-pills { gap: 3px; }
    }
  `]
})
export class PaymentRowComponent {
  row = input.required<MonthlyPaymentRow>();
  compact = input(false);
  recordPayment = output<MonthlyPaymentRow>();
}
