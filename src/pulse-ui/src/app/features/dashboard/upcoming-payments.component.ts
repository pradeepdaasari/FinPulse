import { Component, Input, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UpcomingPayment } from '../../core/models/dashboard.model';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-upcoming-payments',
  standalone: true,
  imports: [CommonModule, MatListModule, MatChipsModule, MatIconModule, MatButtonModule, MatTooltipModule, CurrencyPipe, DatePipe, LocalDatePipe],
  template: `
    <h3><mat-icon class="section-title-icon">schedule</mat-icon> Upcoming Payments</h3>
    <mat-list>
      @for (payment of payments; track payment.debtName) {
        <mat-list-item>
          <mat-icon matListItemIcon>event</mat-icon>
          <span matListItemTitle>{{ payment.debtName }}</span>
          <span matListItemLine>
            {{ payment.amount | currency }} &mdash; Due {{ payment.dueDate | localDate:'mediumDate' }}
          </span>
          <span matListItemMeta class="meta-actions">
            @if (!paidSet().has(payment.debtId)) {
              <button mat-icon-button class="pay-btn" (click)="markAsPaid(payment)"
                      matTooltip="Record payment" [disabled]="paying()">
                <mat-icon>payments</mat-icon>
              </button>
            } @else {
              <span class="paid-badge">
                <mat-icon>check_circle</mat-icon> Paid
              </span>
            }
            <span class="urgency-badge" [class]="'urgency-' + payment.urgencyLevel.toLowerCase()">
              {{ payment.urgencyLevel }}
            </span>
          </span>
        </mat-list-item>
      }
    </mat-list>
  `,
  styles: [`
    h3 {
      margin: var(--spacing-md) 0;
      display: flex;
      align-items: center;
    }
    .section-title-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-right: 8px;
      color: #5AC8FA;
    }
    .urgency-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .urgency-high, .urgency-warning {
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
    }
    .urgency-medium {
      background-color: var(--color-warning-bg);
      color: var(--color-warning);
    }
    .urgency-low {
      background-color: var(--color-success-bg);
      color: var(--color-success);
    }
    .meta-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pay-btn {
      color: var(--color-success) !important;
    }
    .pay-btn:hover {
      background: var(--color-success-bg) !important;
    }
    .paid-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-success);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: var(--color-success-bg);
    }
    .paid-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
  `]
})
export class UpcomingPaymentsComponent {
  private paymentService = inject(PaymentService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) payments!: UpcomingPayment[];

  paying = signal(false);
  paidSet = signal<Set<number>>(new Set());

  markAsPaid(payment: UpcomingPayment): void {
    this.paying.set(true);
    this.paymentService.recordPayment(payment.debtType, payment.debtId, payment.amount, `Paid from dashboard`).subscribe({
      next: () => {
        const updated = new Set(this.paidSet());
        updated.add(payment.debtId);
        this.paidSet.set(updated);
        this.paying.set(false);
        this.notify.success(`Payment of ${payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} recorded for ${payment.debtName}`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.paying.set(false);
        this.notify.error('Failed to record payment');
        this.cdr.detectChanges();
      }
    });
  }
}
