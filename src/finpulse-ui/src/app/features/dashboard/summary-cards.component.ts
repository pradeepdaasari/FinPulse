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
      padding: 24px;
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
    @media (max-width: 480px) {
      .summary-grid {
        grid-template-columns: 1fr 1fr;
      }
      .stat-value {
        font-size: 1.125rem;
      }
    }
  `]
})
export class SummaryCardsComponent {
  @Input({ required: true }) summary!: DashboardSummary;
}
