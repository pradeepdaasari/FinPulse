import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { UpcomingPayment } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-upcoming-payments',
  standalone: true,
  imports: [CommonModule, MatListModule, MatChipsModule, MatIconModule, CurrencyPipe, DatePipe],
  template: `
    <h3>Upcoming Payments</h3>
    <mat-list>
      @for (payment of payments; track payment.debtName) {
        <mat-list-item>
          <mat-icon matListItemIcon>event</mat-icon>
          <span matListItemTitle>{{ payment.debtName }}</span>
          <span matListItemLine>
            {{ payment.amount | currency }} &mdash; Due {{ payment.dueDate | date:'mediumDate' }}
          </span>
          <span matListItemMeta>
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
  `]
})
export class UpcomingPaymentsComponent {
  @Input({ required: true }) payments!: UpcomingPayment[];
}
