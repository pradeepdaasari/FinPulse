import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DashboardSummary } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, CurrencyPipe, DatePipe],
  template: `
    <div class="summary-grid">
      <mat-card>
        <mat-card-content>
          <div class="stat-card">
            <div class="stat-icon icon-blue">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Debt</span>
              <span class="stat-value">{{ summary.totalDebt | currency }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <div class="stat-card">
            <div class="stat-icon icon-green">
              <mat-icon>payments</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Monthly Payment</span>
              <span class="stat-value">{{ summary.totalMonthlyPayment | currency }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <div class="stat-card">
            <div class="stat-icon icon-purple">
              <mat-icon>event_available</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Debt-Free Date</span>
              <span class="stat-value">{{ summary.estimatedDebtFreeDate | date:'mediumDate' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content>
          <div class="stat-card">
            <div class="stat-icon icon-amber">
              <mat-icon>format_list_numbered</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-label">Number of Debts</span>
              <span class="stat-value">{{ summary.numberOfDebts }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--spacing-md);
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: 16px;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform var(--transition-fast);
    }
    .stat-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    mat-card:hover .stat-icon {
      transform: scale(1.08);
    }
    .icon-blue {
      background: var(--gradient-icon-blue);
      color: var(--color-primary);
    }
    .icon-green {
      background: var(--gradient-icon-green);
      color: var(--color-success);
    }
    .icon-purple {
      background: var(--gradient-icon-purple);
      color: var(--color-accent);
    }
    .icon-amber {
      background: var(--gradient-icon-amber);
      color: var(--color-warning);
    }
    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 500;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
      letter-spacing: -0.02em;
    }
    .stat-card:nth-child(1) { border-left: 4px solid var(--color-danger); }
    .stat-card:nth-child(2) { border-left: 4px solid var(--color-value-blue); }
    .stat-card:nth-child(3) { border-left: 4px solid var(--color-value-green); }
    .stat-card:nth-child(4) { border-left: 4px solid var(--color-value-purple); }
    .stat-card:nth-child(1) .stat-value { color: var(--color-danger); }
    .stat-card:nth-child(2) .stat-value { color: var(--color-value-blue); }
    .stat-card:nth-child(3) .stat-value { color: var(--color-value-green); }
    .stat-card:nth-child(4) .stat-value { color: var(--color-value-purple); }
    @media (max-width: 599px) {
      .summary-grid {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .stat-card {
        padding: 10px;
        gap: 8px;
      }
      .stat-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
      }
      .stat-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .stat-value {
        font-size: 1rem;
      }
      .stat-label {
        font-size: 0.65rem;
      }
    }
  `]
})
export class SummaryCardsComponent {
  @Input({ required: true }) summary!: DashboardSummary;
}
