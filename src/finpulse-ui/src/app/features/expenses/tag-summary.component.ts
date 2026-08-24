import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { TagSummary } from '../../core/models/daily-expense.model';

@Component({
  selector: 'app-tag-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (tags().length === 0) {
      <mat-card class="empty-state">
        <mat-icon>label_off</mat-icon>
        <p>No tagged transactions yet. Tag expenses with trip or event names to see summaries here.</p>
      </mat-card>
    } @else {
      <div class="summary-grid">
        @for (tag of tags(); track tag.tag) {
          <mat-card class="tag-card">
            <div class="tag-header">
              <mat-icon class="tag-icon">label</mat-icon>
              <h3>{{ tag.tag }}</h3>
            </div>
            <div class="tag-total">{{ tag.totalAmount | currency }}</div>
            <div class="tag-details">
              <span class="tag-dates">
                <mat-icon>date_range</mat-icon>
                {{ tag.firstDate | date:'MMM d, yyyy' }}
                @if (tag.firstDate !== tag.lastDate) {
                  — {{ tag.lastDate | date:'MMM d, yyyy' }}
                }
              </span>
              <span class="tag-count">{{ tag.transactionCount }} transactions</span>
            </div>
          </mat-card>
        }
      </div>

      <div class="grand-total">
        <strong>All tags total:</strong> {{ grandTotal() | currency }}
      </div>
    }
  `,
  styles: [`
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-md);
    }
    .tag-card { padding: var(--spacing-md) !important; }
    .tag-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .tag-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .tag-icon { color: #1565c0; }
    .tag-total { font-size: 1.5rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px; }
    .tag-details { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: var(--color-text-secondary); }
    .tag-dates { display: flex; align-items: center; gap: 4px; }
    .tag-dates mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .tag-count { margin-left: 20px; }
    .grand-total { margin-top: var(--spacing-md); text-align: right; font-size: 1.1rem; padding: var(--spacing-sm) var(--spacing-md); }
    .empty-state { text-align: center; padding: var(--spacing-xl) !important; }
    .empty-state mat-icon { font-size: 48px; height: 48px; width: 48px; opacity: 0.4; }
    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TagSummaryComponent implements OnInit {
  private expenseService = inject(DailyExpenseService);

  tags = signal<TagSummary[]>([]);
  loading = signal(true);
  grandTotal = signal(0);

  ngOnInit(): void {
    this.expenseService.getTagSummary().subscribe({
      next: (tags) => {
        this.tags.set(tags);
        this.grandTotal.set(tags.reduce((sum, t) => sum + t.totalAmount, 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
