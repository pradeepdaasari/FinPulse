import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { StrategyService } from '../../core/services/strategy.service';
import { NotificationService } from '../../core/services/notification.service';
import { StrategyComparison } from '../../core/models/strategy.model';

@Component({
  selector: 'app-strategy-comparison',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatListModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, CurrencyPipe
  ],
  template: `
    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (comparison()) {
      <div class="extra-payment-row">
        <mat-icon>rocket_launch</mat-icon>
        <span>What if you pay extra?</span>
        <mat-form-field appearance="outline" class="extra-input">
          <mat-label>Extra $/month</mat-label>
          <input matInput type="number" [value]="extraPayment()" (input)="onExtraChange($event)" min="0" step="25">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>
      </div>

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
            @if (chosenStrategy() === 'avalanche') {
              <div class="chosen-badge"><mat-icon>verified</mat-icon> Your Active Plan</div>
            }
            <button mat-raised-button color="primary" class="choose-btn" (click)="chooseStrategy('avalanche')">
              <mat-icon>check_circle</mat-icon> Follow This Plan
            </button>
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
            @if (chosenStrategy() === 'snowball') {
              <div class="chosen-badge"><mat-icon>verified</mat-icon> Your Active Plan</div>
            }
            <button mat-raised-button color="primary" class="choose-btn" (click)="chooseStrategy('snowball')">
              <mat-icon>check_circle</mat-icon> Follow This Plan
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .extra-payment-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      margin-bottom: var(--spacing-md);
      box-shadow: var(--shadow-sm);
    }
    .extra-payment-row mat-icon { color: var(--color-primary); }
    .extra-payment-row span { font-weight: 500; font-size: var(--text-sm); }
    .extra-input { width: 140px; margin-left: auto; }

    .savings-highlight {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-success-bg);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-md);
      font-size: 1rem;
      font-weight: 500;
      border: 1px solid var(--color-border);
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
      gap: var(--spacing-md);
    }
    .strategy-stats {
      display: flex;
      gap: var(--spacing-md);
      margin: var(--spacing-sm) 0;
      flex-wrap: wrap;
    }
    .stat { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500; letter-spacing: 0.05em; }
    .value { font-size: 1.1rem; font-weight: 700; }

    .choose-btn { margin-top: var(--spacing-md); width: 100%; }
    .choose-btn mat-icon { margin-right: 4px; }

    .chosen-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: rgba(48, 209, 88, 0.1);
      border: 1px solid rgba(48, 209, 88, 0.3);
      border-radius: var(--radius-sm);
      color: var(--color-success);
      font-weight: 600;
      font-size: var(--text-sm);
      margin-top: var(--spacing-sm);
    }

    @media (max-width: 768px) {
      .strategy-grid { grid-template-columns: 1fr; }
      .strategy-stats { gap: var(--spacing-md); }
    }
  `]
})
export class StrategyComparisonComponent implements OnInit {
  private strategyService = inject(StrategyService);
  private notificationService = inject(NotificationService);

  comparison = signal<StrategyComparison | null>(null);
  loading = signal(true);
  extraPayment = signal(0);
  chosenStrategy = signal<string | null>(localStorage.getItem('finpulse_chosen_strategy'));

  ngOnInit(): void {
    this.strategyService.getComparison().subscribe({
      next: (data) => {
        this.comparison.set(data);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  onExtraChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.extraPayment.set(value);
    // StrategyService does not yet support extra payment param;
    // UI-only feature: re-fetch base data (future enhancement will pass extra to API)
    this.strategyService.getComparison().subscribe({
      next: (data) => this.comparison.set(data),
      error: () => {}
    });
  }

  chooseStrategy(type: string): void {
    localStorage.setItem('finpulse_chosen_strategy', type);
    this.chosenStrategy.set(type);
    const label = type === 'avalanche' ? 'Avalanche' : 'Snowball';
    this.notificationService.success(`${label} strategy selected as your active plan!`);
  }
}
