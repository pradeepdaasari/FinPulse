import { Component, inject, input, OnChanges, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { MultiMonthComparison, MultiMonthTotal, MultiMonthCategory } from '../../core/models/daily-expense.model';

@Component({
  selector: 'app-month-comparison',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatButtonModule, CurrencyPipe,
    PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    <div class="controls">
      <mat-form-field class="months-input">
        <mat-label>Months to compare</mat-label>
        <input matInput type="number" [(ngModel)]="monthCount" min="1" max="12"
               (keyup.enter)="loadData()">
        <mat-hint>1–12 months ending at current view</mat-hint>
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="loadData()">
        <mat-icon>compare_arrows</mat-icon> Compare
      </button>
    </div>

    @if (loading()) {
      <mat-spinner diameter="40"></mat-spinner>
    } @else if (data()) {
      <div class="comparison-container">
        <!-- Monthly Totals Row -->
        <mat-card class="totals-card">
          <mat-card-content>
            <div class="totals-scroll">
              <div class="totals-row">
                @for (m of data()!.months; track m.label) {
                  <div class="month-col">
                    <span class="month-label">{{ m.label }}</span>
                    <span class="month-total">{{ m.total | currency }}</span>
                  </div>
                }
              </div>
            </div>
            @if (data()!.months.length > 1) {
              <div class="trend-summary">
                <span class="trend-label">Avg/month:</span>
                <span class="trend-value">{{ avgMonthly() | currency }}</span>
                <span class="trend-label" style="margin-left: 16px;">Total:</span>
                <span class="trend-value">{{ grandTotal() | currency }}</span>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Category Breakdown Table -->
        @if (data()!.categories.length > 0) {
          <mat-card>
            <mat-card-content>
              <div class="table-scroll">
                <table class="compare-table">
                  <thead>
                    <tr>
                      <th class="cat-col">Category</th>
                      @for (m of data()!.months; track m.label) {
                        <th class="amt-col">{{ m.label }}</th>
                      }
                      <th class="amt-col total-col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (cat of data()!.categories; track cat.categoryId) {
                      <tr>
                        <td class="cat-col">
                          @if (cat.categoryIcon) {
                            <mat-icon class="cat-icon">{{ cat.categoryIcon }}</mat-icon>
                          }
                          {{ cat.categoryName }}
                        </td>
                        @for (amt of cat.monthlyAmounts; track amt.month) {
                          <td class="amt-col" [class.zero]="amt.amount === 0">
                            {{ amt.amount === 0 ? '—' : (amt.amount | currency) }}
                          </td>
                        }
                        <td class="amt-col total-col">{{ cat.total | currency }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="totals-footer">
                      <td class="cat-col"><strong>Total</strong></td>
                      @for (m of data()!.months; track m.label) {
                        <td class="amt-col"><strong>{{ m.total | currency }}</strong></td>
                      }
                      <td class="amt-col total-col"><strong>{{ grandTotal() | currency }}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card>
            <mat-card-content><p>No expense data for the selected period.</p></mat-card-content>
          </mat-card>
        }
      </div>
    }
    </div>
  `,
  styles: [`
    .controls { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
    .months-input { width: 160px; }
    .comparison-container { display: flex; flex-direction: column; gap: 12px; }

    .totals-card { margin-bottom: 4px; }
    .totals-scroll { overflow-x: auto; }
    .totals-row { display: flex; gap: 12px; min-width: max-content; padding: 4px 0; }
    .month-col { text-align: center; min-width: 90px; flex: 1; }
    .month-label { display: block; font-size: 0.8rem; opacity: 0.7; }
    .month-total { display: block; font-size: 1.2rem; font-weight: 700; margin-top: 2px; }

    .trend-summary {
      display: flex; align-items: center; justify-content: center;
      margin-top: 12px; padding-top: 10px;
      border-top: 1px solid rgba(0,0,0,0.08);
      font-size: 0.9rem;
    }
    .trend-label { opacity: 0.6; margin-right: 4px; }
    .trend-value { font-weight: 600; }

    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .compare-table { width: 100%; border-collapse: collapse; min-width: 400px; }
    .compare-table th, .compare-table td { padding: 8px 12px; text-align: right; white-space: nowrap; }
    .compare-table th { font-size: 0.8rem; opacity: 0.7; border-bottom: 2px solid rgba(0,0,0,0.1); }
    .compare-table td { border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.9rem; }
    .cat-col { text-align: left !important; font-weight: 500; display: flex; align-items: center; gap: 6px; }
    th.cat-col { display: table-cell; }
    .cat-icon { font-size: 16px; width: 16px; height: 16px; }
    .amt-col { min-width: 90px; }
    .total-col { font-weight: 600; background: rgba(0,0,0,0.02); }
    .zero { opacity: 0.3; }
    .totals-footer td { border-top: 2px solid rgba(0,0,0,0.1); }

    @media (max-width: 599px) {
      .controls { flex-wrap: wrap; }
      .months-input { width: 120px; }
      .totals-row { gap: 8px; }
      .month-col { min-width: 70px; }
      .month-total { font-size: 1rem; }
      .trend-summary { flex-wrap: wrap; justify-content: center; font-size: 0.8rem; gap: 4px; }
      .compare-table { min-width: 0; }
      .compare-table th, .compare-table td { padding: 6px 8px; font-size: 0.78rem; }
      .amt-col { min-width: 65px; }
      .cat-col { max-width: 100px; overflow: hidden; text-overflow: ellipsis; }
    }
  `]
})
export class MonthComparisonComponent implements OnChanges {
  private expenseService = inject(DailyExpenseService);
  private cdr = inject(ChangeDetectorRef);

  year = input<number>();
  month = input<number>();

  monthCount = 1;
  data = signal<MultiMonthComparison | null>(null);
  loading = signal(false);
  avgMonthly = signal(0);
  grandTotal = signal(0);

  ngOnChanges(): void {
    this.loadData();
  }

  loadData(): void {
    const count = Math.max(1, Math.min(12, this.monthCount || 1));
    this.monthCount = count;
    this.loading.set(true);
    this.expenseService.getMultiComparison(this.year(), this.month(), count).subscribe({
      next: (result) => {
        this.data.set(result);
        const total = result.months.reduce((s, m) => s + m.total, 0);
        this.grandTotal.set(total);
        this.avgMonthly.set(result.months.length > 0 ? total / result.months.length : 0);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }
}
