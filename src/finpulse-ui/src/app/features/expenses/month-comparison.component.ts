import { Component, inject, input, OnChanges, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { MonthComparison, CategoryComparison } from '../../core/models/daily-expense.model';

@Component({
  selector: 'app-month-comparison',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule, CurrencyPipe, PercentPipe],
  template: `
    @if (loading()) {
      <mat-spinner diameter="40"></mat-spinner>
    } @else if (data()) {
      <div class="comparison-container">
        <mat-card class="totals-compare">
          <mat-card-content>
            <div class="totals-row">
              <div class="total-col">
                <span class="total-label">This Month</span>
                <span class="total-value">{{ data()!.currentTotal | currency }}</span>
              </div>
              <div class="total-col">
                <span class="total-label">Last Month</span>
                <span class="total-value muted">{{ data()!.previousTotal | currency }}</span>
              </div>
              <div class="total-col">
                <span class="total-label">Change</span>
                <span class="total-value" [class.positive]="totalDiff() < 0" [class.negative]="totalDiff() > 0">
                  {{ totalDiff() >= 0 ? '+' : '' }}{{ totalDiff() | currency }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        @if (data()!.categories.length > 0) {
          <div class="category-list">
            @for (cat of data()!.categories; track cat.categoryId) {
              <mat-card class="cat-card">
                <mat-card-content>
                  <div class="cat-header">
                    <span class="cat-name">
                      @if (cat.categoryIcon) {
                        <mat-icon class="cat-icon">{{ cat.categoryIcon }}</mat-icon>
                      }
                      {{ cat.categoryName }}
                    </span>
                    <span class="cat-change" [class.positive]="cat.difference < 0" [class.negative]="cat.difference > 0">
                      {{ cat.difference >= 0 ? '+' : '' }}{{ cat.difference | currency }}
                      <span class="pct">({{ cat.percentChange >= 0 ? '+' : '' }}{{ cat.percentChange }}%)</span>
                    </span>
                  </div>
                  <div class="cat-bars">
                    <div class="bar-row">
                      <span class="bar-label">This</span>
                      <mat-progress-bar mode="determinate" [value]="getBarWidth(cat.currentMonthAmount)" color="primary"></mat-progress-bar>
                      <span class="bar-value">{{ cat.currentMonthAmount | currency }}</span>
                    </div>
                    <div class="bar-row">
                      <span class="bar-label">Last</span>
                      <mat-progress-bar mode="determinate" [value]="getBarWidth(cat.previousMonthAmount)" color="accent"></mat-progress-bar>
                      <span class="bar-value muted">{{ cat.previousMonthAmount | currency }}</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        } @else {
          <mat-card>
            <mat-card-content><p>No expense data for comparison.</p></mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .comparison-container { display: flex; flex-direction: column; gap: 12px; }
    .totals-compare { margin-bottom: 8px; }
    .totals-row { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 16px; }
    .total-col { text-align: center; }
    .total-label { display: block; font-size: 0.85rem; opacity: 0.7; }
    .total-value { display: block; font-size: 1.4rem; font-weight: 700; margin-top: 4px; }
    .total-value.muted { opacity: 0.6; }
    .positive { color: #2e7d32; }
    .negative { color: #c62828; }

    .category-list { display: flex; flex-direction: column; gap: 8px; }
    .cat-card { transition: box-shadow 0.2s; }
    .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .cat-name { font-weight: 500; display: flex; align-items: center; gap: 6px; }
    .cat-icon { font-size: 18px; width: 18px; height: 18px; }
    .cat-change { font-weight: 600; font-size: 0.9rem; }
    .pct { font-size: 0.8rem; opacity: 0.7; }

    .cat-bars { display: flex; flex-direction: column; gap: 4px; }
    .bar-row { display: flex; align-items: center; gap: 8px; }
    .bar-label { font-size: 0.75rem; opacity: 0.6; min-width: 30px; }
    .bar-row mat-progress-bar { flex: 1; }
    .bar-value { font-size: 0.85rem; min-width: 70px; text-align: right; }
    .bar-value.muted { opacity: 0.6; }
  `]
})
export class MonthComparisonComponent implements OnChanges {
  private expenseService = inject(DailyExpenseService);

  year = input<number>();
  month = input<number>();

  data = signal<MonthComparison | null>(null);
  loading = signal(false);
  totalDiff = signal(0);
  private maxAmount = 1;

  ngOnChanges(): void {
    this.loadComparison();
  }

  private loadComparison(): void {
    this.loading.set(true);
    this.expenseService.getComparison(this.year(), this.month()).subscribe({
      next: (comparison) => {
        this.data.set(comparison);
        this.totalDiff.set(comparison.currentTotal - comparison.previousTotal);
        this.maxAmount = Math.max(
          ...comparison.categories.map(c => Math.max(c.currentMonthAmount, c.previousMonthAmount)),
          1
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getBarWidth(amount: number): number {
    return Math.min(100, (amount / this.maxAmount) * 100);
  }
}
