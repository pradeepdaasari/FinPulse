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
            <mat-icon class="stat-icon">account_balance_wallet</mat-icon>
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
            <mat-icon class="stat-icon">payments</mat-icon>
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
            <mat-icon class="stat-icon">event_available</mat-icon>
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
            <mat-icon class="stat-icon">format_list_numbered</mat-icon>
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
      padding: var(--spacing-md);
    }
    .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: var(--color-primary);
      background: #e3f2fd;
      padding: 8px;
      border-radius: 10px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 1.375rem;
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
