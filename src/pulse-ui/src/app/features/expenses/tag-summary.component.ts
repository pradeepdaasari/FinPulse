import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { TagSummary } from '../../core/models/daily-expense.model';

@Component({
  selector: 'app-tag-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (tags().length === 0) {
      <mat-card class="empty-state">
        <mat-icon>label_off</mat-icon>
        <p>No tagged transactions yet. Tag expenses with trip or event names to see summaries here.</p>
        <div class="tag-help">
          <h4>How to use tags</h4>
          <ul>
            <li>Add a <strong>Tag</strong> when logging a transaction (e.g. "Hawaii 2026", "Kitchen Remodel")</li>
            <li>Select a <strong>Tag Type</strong> to group related tags (Trip, Project, Event, etc.)</li>
            <li>View totals and date ranges for each tag here</li>
          </ul>
        </div>
      </mat-card>
    } @else {
      <div class="filters-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter by Tag Type</mat-label>
          <mat-select [value]="selectedTagType()" (selectionChange)="selectedTagType.set($event.value)">
            <mat-option value="">All Types</mat-option>
            @for (type of availableTagTypes(); track type) {
              <mat-option [value]="type">
                <mat-icon>{{ typeIcon(type) }}</mat-icon>
                {{ type }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field search-field">
          <mat-label>Search tags</mat-label>
          <input matInput [value]="searchQuery()" (input)="searchQuery.set($any($event.target).value)" placeholder="Search by tag name...">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <div class="filter-stats">
          <span class="stat-badge">{{ filteredTags().length }} tags</span>
          <span class="stat-badge total">{{ grandTotal() | currency }}</span>
        </div>
      </div>

      <div class="chip-filters">
        <mat-chip-set>
          <mat-chip [highlighted]="selectedTagType() === ''" (click)="selectedTagType.set('')">
            All
          </mat-chip>
          @for (type of availableTagTypes(); track type) {
            <mat-chip [highlighted]="selectedTagType() === type" (click)="selectedTagType.set(type)">
              <mat-icon matChipAvatar>{{ typeIcon(type) }}</mat-icon>
              {{ type }} ({{ countByType(type) }})
            </mat-chip>
          }
        </mat-chip-set>
      </div>

      @for (group of groupedTags(); track group.type) {
        <div class="type-group">
          <h3 class="type-header">
            <mat-icon>{{ typeIcon(group.type) }}</mat-icon>
            {{ group.type || 'Uncategorized' }}
            <span class="type-count">{{ group.tags.length }} tags</span>
            <span class="type-total">{{ group.total | currency }}</span>
          </h3>
          <div class="summary-grid">
            @for (tag of group.tags; track tag.tag) {
              <mat-card class="tag-card">
                <div class="tag-header">
                  <mat-icon class="tag-icon">{{ typeIcon(group.type) }}</mat-icon>
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
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    .filters-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-sm);
      flex-wrap: wrap;
    }
    .filter-field { width: 200px; }
    .search-field { flex: 1; min-width: 200px; }
    .filter-stats { display: flex; gap: 8px; margin-left: auto; }
    .stat-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 600;
      background: var(--color-surface-variant, #f0f0f0);
      color: var(--color-text-secondary);
    }
    .stat-badge.total { background: rgba(0, 122, 255, 0.1); color: var(--color-primary); }
    .chip-filters { margin-bottom: var(--spacing-md); }
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
    .type-count { font-size: 0.8rem; opacity: 0.7; }
    .type-total { margin-left: auto; font-size: 0.9rem; color: var(--color-primary); font-weight: 700; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--spacing-md);
    }
    .tag-card { padding: var(--spacing-md) !important; transition: box-shadow 0.2s; }
    .tag-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .tag-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .tag-header h4 { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .tag-icon { color: var(--color-primary); }
    .tag-total { font-size: 1.4rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px; }
    .tag-details { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; color: var(--color-text-secondary); }
    .tag-dates { display: flex; align-items: center; gap: 4px; }
    .tag-dates mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .tag-count { margin-left: 20px; }
    .empty-state { text-align: center; padding: var(--spacing-xl) !important; }
    .empty-state mat-icon { font-size: 48px; height: 48px; width: 48px; opacity: 0.4; }
    .tag-help { text-align: left; max-width: 400px; margin: var(--spacing-md) auto 0; }
    .tag-help h4 { margin: 0 0 8px; font-size: 0.9rem; }
    .tag-help ul { margin: 0; padding-left: 20px; font-size: 0.85rem; color: var(--color-text-secondary); }
    .tag-help li { margin-bottom: 6px; }
    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: 1fr; }
      .filters-row { flex-direction: column; align-items: stretch; }
      .filter-field { width: 100%; }
      .filter-stats { margin-left: 0; }
    }
  `]
})
export class TagSummaryComponent implements OnInit {
  private expenseService = inject(DailyExpenseService);

  tags = signal<TagSummary[]>([]);
  loading = signal(true);
  selectedTagType = signal('');
  searchQuery = signal('');

  availableTagTypes = signal<string[]>([]);

  filteredTags = computed(() => {
    let result = this.tags();
    const typeFilter = this.selectedTagType();
    const search = this.searchQuery().toLowerCase().trim();

    if (typeFilter) {
      result = result.filter(t => t.tagType === typeFilter);
    }
    if (search) {
      result = result.filter(t => t.tag.toLowerCase().includes(search));
    }
    return result;
  });

  groupedTags = computed(() => {
    const filtered = this.filteredTags();
    const groups = new Map<string, TagSummary[]>();
    for (const tag of filtered) {
      const type = tag.tagType || 'Uncategorized';
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(tag);
    }
    return Array.from(groups.entries()).map(([type, tags]) => ({
      type,
      tags: tags.sort((a, b) => b.totalAmount - a.totalAmount),
      total: tags.reduce((sum, t) => sum + t.totalAmount, 0)
    })).sort((a, b) => b.total - a.total);
  });

  grandTotal = computed(() => {
    return this.filteredTags().reduce((sum, t) => sum + t.totalAmount, 0);
  });

  countByType(type: string): number {
    return this.tags().filter(t => t.tagType === type).length;
  }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      'Trip': 'flight',
      'Project': 'work',
      'Event': 'event',
      'Business': 'business_center',
      'Medical': 'local_hospital',
      'Gift': 'card_giftcard',
      'Emergency': 'warning',
      'Seasonal': 'ac_unit',
      'Reimbursable': 'receipt_long',
      'Subscription': 'autorenew',
    };
    return icons[type] || 'label';
  }

  ngOnInit(): void {
    this.expenseService.getTagSummary().subscribe({
      next: (tags) => {
        this.tags.set(tags);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.expenseService.getTagTypes().subscribe(types => this.availableTagTypes.set(types));
  }
}
