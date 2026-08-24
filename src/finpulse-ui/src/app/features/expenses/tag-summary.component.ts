import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { TagSummary } from '../../core/models/daily-expense.model';

@Component({
  selector: 'app-tag-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (tags().length === 0) {
      <mat-card class="empty-state">
        <mat-icon>label_off</mat-icon>
        <p>No tagged transactions yet. Tag expenses with trip or event names to see summaries here.</p>
      </mat-card>
    } @else {
      <div class="filter-chips">
        <mat-chip-set>
          <mat-chip [highlighted]="activeFilter() === null" (click)="setFilter(null)">All</mat-chip>
          @for (type of tagTypes(); track type) {
            <mat-chip [highlighted]="activeFilter() === type" (click)="setFilter(type)">
              <mat-icon matChipAvatar>{{ typeIcon(type) }}</mat-icon>
              {{ type }}
            </mat-chip>
          }
        </mat-chip-set>
      </div>

      @for (group of groupedTags(); track group.type) {
        <div class="type-group">
          <h3 class="type-header">
            <mat-icon>{{ typeIcon(group.type) }}</mat-icon>
            {{ group.type || 'Uncategorized' }}
            <span class="type-total">{{ group.total | currency }}</span>
          </h3>
          <div class="summary-grid">
            @for (tag of group.tags; track tag.tag) {
              <mat-card class="tag-card">
                <div class="tag-header">
                  <mat-icon class="tag-icon">label</mat-icon>
                  <h4>{{ tag.tag }}</h4>
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
        </div>
      }

      <div class="grand-total">
        <strong>Total:</strong> {{ grandTotal() | currency }}
      </div>
    }
  `,
  styles: [`
    .filter-chips { margin-bottom: var(--spacing-md); }
    .type-group { margin-bottom: var(--spacing-lg); }
    .type-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 var(--spacing-sm) 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }
    .type-total { margin-left: auto; font-size: 0.9rem; color: var(--color-primary); }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-md);
    }
    .tag-card { padding: var(--spacing-md) !important; }
    .tag-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .tag-header h4 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .tag-icon { color: #1565c0; }
    .tag-total { font-size: 1.4rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px; }
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
  activeFilter = signal<string | null>(null);

  tagTypes = computed(() => {
    const types = new Set(this.tags().map(t => t.tagType).filter(Boolean));
    return Array.from(types) as string[];
  });

  groupedTags = computed(() => {
    const filter = this.activeFilter();
    const filtered = filter ? this.tags().filter(t => t.tagType === filter) : this.tags();

    const groups = new Map<string, TagSummary[]>();
    for (const tag of filtered) {
      const type = tag.tagType || 'Uncategorized';
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(tag);
    }

    return Array.from(groups.entries()).map(([type, tags]) => ({
      type,
      tags,
      total: tags.reduce((sum, t) => sum + t.totalAmount, 0)
    }));
  });

  grandTotal = computed(() => {
    return this.groupedTags().reduce((sum, g) => sum + g.total, 0);
  });

  typeIcon(type: string): string {
    switch (type) {
      case 'Trip': return 'flight';
      case 'Project': return 'work';
      case 'Event': return 'event';
      case 'Business': return 'business_center';
      default: return 'label';
    }
  }

  setFilter(type: string | null): void {
    this.activeFilter.set(type);
  }

  ngOnInit(): void {
    this.expenseService.getTagSummary().subscribe({
      next: (tags) => {
        this.tags.set(tags);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
