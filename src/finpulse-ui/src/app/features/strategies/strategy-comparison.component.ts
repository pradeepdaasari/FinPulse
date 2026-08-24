import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StrategyService } from '../../core/services/strategy.service';
import { StrategyComparison } from '../../core/models/strategy.model';

@Component({
  selector: 'app-strategy-comparison',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe],
  template: `
    <h2>Payoff Strategy Comparison</h2>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (comparison()) {
      <div class="savings-highlight">
        <mat-icon>savings</mat-icon>
        <span>
          Avalanche saves you <strong>{{ comparison()!.interestSaved | currency }}</strong>
          and <strong>{{ comparison()!.timeDifference }} months</strong> compared to Snowball.
        </span>
      </div>

      <div class="strategy-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Avalanche (Highest APR First)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="strategy-stats">
              <div class="stat">
                <span class="label">Total Interest</span>
                <span class="value">{{ comparison()!.avalanche.totalInterest | currency }}</span>
              </div>
              <div class="stat">
                <span class="label">Months to Payoff</span>
                <span class="value">{{ comparison()!.avalanche.monthsToPayoff }}</span>
              </div>
            </div>
            <h4>Payoff Order:</h4>
            <mat-list>
              @for (debt of comparison()!.avalanche.debtPayoffOrder; track debt.debtName; let i = $index) {
                <mat-list-item>
                  <span matListItemTitle>{{ i + 1 }}. {{ debt.debtName }} ({{ debt.aprPercent }}% APR)</span>
                  <span matListItemLine>Paid off month {{ debt.payoffMonth }} | Interest: {{ debt.totalInterestPaid | currency }}</span>
                </mat-list-item>
              }
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Snowball (Lowest Balance First)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="strategy-stats">
              <div class="stat">
                <span class="label">Total Interest</span>
                <span class="value">{{ comparison()!.snowball.totalInterest | currency }}</span>
              </div>
              <div class="stat">
                <span class="label">Months to Payoff</span>
                <span class="value">{{ comparison()!.snowball.monthsToPayoff }}</span>
              </div>
            </div>
            <h4>Payoff Order:</h4>
            <mat-list>
              @for (debt of comparison()!.snowball.debtPayoffOrder; track debt.debtName; let i = $index) {
                <mat-list-item>
                  <span matListItemTitle>{{ i + 1 }}. {{ debt.debtName }} ({{ debt.balance | currency }})</span>
                  <span matListItemLine>Paid off month {{ debt.payoffMonth }} | Interest: {{ debt.totalInterestPaid | currency }}</span>
                </mat-list-item>
              }
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .savings-highlight {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-lg);
      background: var(--color-success-bg);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-lg);
      font-size: 1rem;
      font-weight: 500;
      border: 1px solid #bbf7d0;
    }
    .savings-highlight mat-icon {
      color: var(--color-success);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .strategy-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
    }
    .strategy-stats {
      display: flex;
      gap: var(--spacing-xl);
      margin: var(--spacing-md) 0;
      flex-wrap: wrap;
    }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 500; letter-spacing: 0.05em; }
    .value { font-size: 1.25rem; font-weight: 700; }
    @media (max-width: 768px) {
      .strategy-grid { grid-template-columns: 1fr; }
      .strategy-stats { gap: var(--spacing-md); }
    }
  `]
})
export class StrategyComparisonComponent implements OnInit {
  private strategyService = inject(StrategyService);

  comparison = signal<StrategyComparison | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.strategyService.getComparison().subscribe({
      next: (data) => {
        this.comparison.set(data);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }
}
