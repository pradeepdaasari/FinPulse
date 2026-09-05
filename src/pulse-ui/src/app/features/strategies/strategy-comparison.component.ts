import { Component, ChangeDetectorRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
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
    SkeletonLoaderComponent, PullToRefreshDirective, MatFormFieldModule, MatInputModule,
    MatButtonModule, CurrencyPipe
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    @if (loading()) {
      <app-skeleton type="card" [count]="2"></app-skeleton>
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
        <div class="savings-icon-wrap">
          <mat-icon>savings</mat-icon>
        </div>
        <span class="savings-text">
          Avalanche saves you <strong class="savings-amount">{{ comparison()!.interestSaved | currency }}</strong>
          and <strong class="savings-amount">{{ comparison()!.timeDifference }} months</strong> compared to Snowball.
        </span>
      </div>

      <div class="strategy-grid">
        <!-- Avalanche Card -->
        <mat-card class="strategy-card avalanche-card">
          <div class="card-accent avalanche-accent"></div>
          <mat-card-header class="card-header">
            <div class="header-icon avalanche-icon-wrap">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="header-text">
              <mat-card-title>Avalanche</mat-card-title>
              <mat-card-subtitle>Highest APR First</mat-card-subtitle>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="strategy-stats">
              <div class="stat">
                <span class="label">Total Interest</span>
                <span class="value interest-badge">{{ comparison()!.avalanche.totalInterest | currency }}</span>
              </div>
              <div class="stat">
                <span class="label">Months to Payoff</span>
                <span class="value months-value">
                  <mat-icon class="months-icon">schedule</mat-icon>
                  {{ comparison()!.avalanche.monthsToPayoff }}
                </span>
              </div>
            </div>
            <h4 class="payoff-heading">Payoff Order</h4>
            <div class="payoff-list">
              @for (debt of comparison()!.avalanche.debtPayoffOrder; track debt.debtName; let i = $index) {
                <div class="payoff-item">
                  <div class="payoff-number avalanche-number">{{ i + 1 }}</div>
                  <div class="payoff-info">
                    <span class="payoff-name">{{ debt.debtName }}</span>
                    <span class="payoff-detail">
                      <span class="apr-badge">{{ debt.aprPercent }}% APR</span>
                      <span class="payoff-meta">Month {{ debt.payoffMonth }} | {{ debt.totalInterestPaid | currency }} interest</span>
                    </span>
                  </div>
                </div>
              }
            </div>
            @if (chosenStrategy() === 'avalanche') {
              <div class="chosen-badge"><mat-icon>verified</mat-icon> Your Active Plan</div>
            }
            <button mat-raised-button color="primary" class="choose-btn" (click)="chooseStrategy('avalanche')">
              <mat-icon>check_circle</mat-icon> Follow This Plan
            </button>
          </mat-card-content>
        </mat-card>

        <!-- Snowball Card -->
        <mat-card class="strategy-card snowball-card">
          <div class="card-accent snowball-accent"></div>
          <mat-card-header class="card-header">
            <div class="header-icon snowball-icon-wrap">
              <mat-icon>ac_unit</mat-icon>
            </div>
            <div class="header-text">
              <mat-card-title>Snowball</mat-card-title>
              <mat-card-subtitle>Lowest Balance First</mat-card-subtitle>
            </div>
          </mat-card-header>
          <mat-card-content>
            <div class="strategy-stats">
              <div class="stat">
                <span class="label">Total Interest</span>
                <span class="value interest-badge">{{ comparison()!.snowball.totalInterest | currency }}</span>
              </div>
              <div class="stat">
                <span class="label">Months to Payoff</span>
                <span class="value months-value">
                  <mat-icon class="months-icon">schedule</mat-icon>
                  {{ comparison()!.snowball.monthsToPayoff }}
                </span>
              </div>
            </div>
            <h4 class="payoff-heading">Payoff Order</h4>
            <div class="payoff-list">
              @for (debt of comparison()!.snowball.debtPayoffOrder; track debt.debtName; let i = $index) {
                <div class="payoff-item">
                  <div class="payoff-number snowball-number">{{ i + 1 }}</div>
                  <div class="payoff-info">
                    <span class="payoff-name">{{ debt.debtName }}</span>
                    <span class="payoff-detail">
                      <span class="balance-badge">{{ debt.balance | currency }}</span>
                      <span class="payoff-meta">Month {{ debt.payoffMonth }} | {{ debt.totalInterestPaid | currency }} interest</span>
                    </span>
                  </div>
                </div>
              }
            </div>
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
    </div>
  `,
  styles: [`
    /* Extra Payment Row */
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
    .extra-payment-row > span { font-weight: 500; font-size: var(--text-sm); }
    .extra-input { width: 140px; margin-left: auto; }

    /* Savings Highlight */
    .savings-highlight {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-lg);
      background: linear-gradient(135deg, var(--color-success-bg) 0%, var(--color-stat-green-bg) 100%);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-md);
      font-size: 1rem;
      font-weight: 500;
      border: 1px solid var(--color-success);
    }
    .savings-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      min-width: 44px;
      border-radius: var(--radius-full);
      background: var(--color-stat-green-bg);
    }
    .savings-icon-wrap mat-icon {
      color: var(--color-success);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .savings-text {
      line-height: 1.5;
    }
    .savings-amount {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-success);
    }

    /* Strategy Grid */
    .strategy-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }

    /* Strategy Cards */
    .strategy-card {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      border: 1px solid var(--color-border);
    }
    .card-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }
    .avalanche-accent {
      background: var(--gradient-primary);
    }
    .snowball-accent {
      background: linear-gradient(90deg, var(--color-success), var(--color-stat-green));
    }

    /* Card Header */
    .card-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-md) !important;
    }
    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: var(--radius-full, 50%);
    }
    .header-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .avalanche-icon-wrap {
      background: var(--color-stat-blue-bg);
    }
    .avalanche-icon-wrap mat-icon {
      color: var(--color-primary);
    }
    .snowball-icon-wrap {
      background: var(--color-stat-green-bg);
    }
    .snowball-icon-wrap mat-icon {
      color: var(--color-success);
    }
    .header-text mat-card-title {
      font-size: 1.1rem !important;
      font-weight: 700 !important;
    }
    .header-text mat-card-subtitle {
      margin-top: 2px !important;
      font-size: 0.8rem !important;
      color: var(--color-text-muted);
    }

    /* Strategy Stats */
    .strategy-stats {
      display: flex;
      gap: var(--spacing-lg);
      margin: var(--spacing-md) 0;
      flex-wrap: wrap;
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .label {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .value {
      font-size: 1.25rem;
      font-weight: 800;
    }
    .interest-badge {
      display: inline-block;
      padding: 4px 10px;
      background: var(--color-stat-red-bg);
      color: var(--color-danger);
      border-radius: var(--radius-full);
      font-size: 1.1rem;
      font-weight: 800;
    }
    .months-value {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 1.25rem;
      font-weight: 800;
    }
    .months-icon {
      color: var(--color-stat-purple);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Payoff Order */
    .payoff-heading {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: var(--spacing-md) 0 var(--spacing-sm);
      padding-bottom: 6px;
      border-bottom: 1px solid var(--color-border);
    }
    .payoff-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .payoff-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid var(--color-border);
    }
    .payoff-item:last-child {
      border-bottom: none;
    }
    .payoff-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      min-width: 28px;
      border-radius: var(--radius-full, 50%);
      font-size: 0.75rem;
      font-weight: 700;
      color: white;
    }
    .avalanche-number {
      background: var(--color-primary);
    }
    .snowball-number {
      background: var(--color-success);
    }
    .payoff-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .payoff-name {
      font-size: 0.9rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .payoff-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .apr-badge {
      display: inline-block;
      padding: 2px 8px;
      background: var(--color-stat-amber-bg);
      color: var(--color-stat-amber);
      border-radius: var(--radius-full);
      font-size: 0.7rem;
      font-weight: 700;
    }
    .balance-badge {
      display: inline-block;
      padding: 2px 8px;
      background: var(--color-stat-blue-bg);
      color: var(--color-stat-blue);
      border-radius: var(--radius-full);
      font-size: 0.7rem;
      font-weight: 700;
    }
    .payoff-meta {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    /* Choose Button */
    .choose-btn { margin-top: var(--spacing-md); width: 100%; }
    .choose-btn mat-icon { margin-right: 4px; }

    /* Chosen Badge */
    .chosen-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: var(--color-stat-green-bg);
      border: 1px solid var(--color-success);
      border-radius: var(--radius-sm);
      color: var(--color-success);
      font-weight: 600;
      font-size: var(--text-sm);
      margin-top: var(--spacing-sm);
    }

    /* Mobile */
    @media (max-width: 768px) {
      .strategy-grid { grid-template-columns: 1fr; gap: var(--spacing-lg); }
      .strategy-card { padding: var(--spacing-sm); }
      .strategy-stats { gap: var(--spacing-lg); }
      .savings-highlight {
        flex-direction: column;
        text-align: center;
        padding: var(--spacing-md);
      }
      .extra-payment-row {
        flex-wrap: wrap;
      }
      .extra-input {
        width: 100%;
        margin-left: 0;
        margin-top: 8px;
      }
    }

  `]
})
export class StrategyComparisonComponent implements OnInit {
  private strategyService = inject(StrategyService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  comparison = signal<StrategyComparison | null>(null);
  loading = signal(true);
  extraPayment = signal(0);
  chosenStrategy = signal<string | null>(localStorage.getItem('pulse_chosen_strategy'));

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.strategyService.getComparison().subscribe({
      next: (data) => {
        this.comparison.set(data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  onExtraChange(event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    this.extraPayment.set(value);
    // StrategyService does not yet support extra payment param;
    // UI-only feature: re-fetch base data (future enhancement will pass extra to API)
    this.strategyService.getComparison().subscribe({
      next: (data) => { this.comparison.set(data); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  chooseStrategy(type: string): void {
    localStorage.setItem('pulse_chosen_strategy', type);
    this.chosenStrategy.set(type);
    const label = type === 'avalanche' ? 'Avalanche' : 'Snowball';
    this.notificationService.success(`${label} strategy selected as your active plan!`);
  }
}
