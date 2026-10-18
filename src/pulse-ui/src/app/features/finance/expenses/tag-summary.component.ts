import { Component, OnInit, inject, signal, computed, ChangeDetectorRef, input, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { DailyExpenseService } from '../../../core/services/daily-expense.service';
import { TagSummary } from '../../../core/models/daily-expense.model';

@Component({
  selector: 'app-tag-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, MatFormFieldModule, MatSelectModule, MatInputModule, MatButtonModule, MatMenuModule, CurrencyPipe, DatePipe, LocalDatePipe],
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
      <div class="ts-fb">
        <div class="ts-fb-primary">
          <div class="ts-fb-search" [class.ts-fb-search-active]="tsSearchFocused">
            <mat-icon class="ts-fb-search-icon">search</mat-icon>
            <input class="ts-fb-search-input" [ngModel]="searchQuery()"
                   (ngModelChange)="searchQuery.set($event)"
                   placeholder="Search tags..."
                   (focus)="tsSearchFocused = true"
                   (blur)="tsSearchFocused = false">
            @if (searchQuery()) {
              <button class="ts-fb-search-clear" (click)="searchQuery.set('')">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>

          <div class="ts-fb-controls">
            <button class="ts-fb-dropdown" [class.ts-fb-dropdown-active]="selectedTagType() !== ''"
                    [matMenuTriggerFor]="tagTypeMenu">
              <mat-icon class="ts-fb-dd-icon">{{ selectedTagType() ? typeIcon(selectedTagType()) : 'label' }}</mat-icon>
              <span>{{ selectedTagType() || 'Tag Type' }}</span>
              <mat-icon class="ts-fb-dd-arrow">expand_more</mat-icon>
            </button>

            <span class="ts-fb-stat">{{ filteredTags().length }} tags</span>
            <span class="ts-fb-stat ts-fb-stat-total">{{ grandTotal() | currency }}</span>
          </div>
        </div>

        <div class="ts-fb-periods">
          <button class="ts-fb-period" [class.ts-fb-period-active]="selectedTagType() === ''"
                  (click)="selectedTagType.set('')">All</button>
          @for (type of availableTagTypes(); track type) {
            <button class="ts-fb-period" [class.ts-fb-period-active]="selectedTagType() === type"
                    (click)="selectedTagType.set(type)">
              {{ type }} ({{ countByType(type) }})
            </button>
          }
        </div>

        @if (selectedTagType() || searchQuery()) {
          <div class="ts-fb-active">
            @if (selectedTagType()) {
              <span class="ts-fb-chip ts-fb-chip-type">
                <mat-icon class="ts-fb-chip-icon">{{ typeIcon(selectedTagType()) }}</mat-icon>
                {{ selectedTagType() }}
                <button class="ts-fb-chip-x" (click)="selectedTagType.set('')"><mat-icon>close</mat-icon></button>
              </span>
            }
            @if (searchQuery()) {
              <span class="ts-fb-chip">
                <mat-icon class="ts-fb-chip-icon">search</mat-icon>
                "{{ searchQuery() }}"
                <button class="ts-fb-chip-x" (click)="searchQuery.set('')"><mat-icon>close</mat-icon></button>
              </span>
            }
            <button class="ts-fb-clear-all" (click)="selectedTagType.set(''); searchQuery.set('')">Clear all</button>
          </div>
        }
      </div>

      <mat-menu #tagTypeMenu="matMenu">
        <button mat-menu-item (click)="selectedTagType.set('')">
          <mat-icon>list</mat-icon> All Types
        </button>
        @for (type of availableTagTypes(); track type) {
          <button mat-menu-item (click)="selectedTagType.set(type)">
            <mat-icon>{{ typeIcon(type) }}</mat-icon> {{ type }}
          </button>
        }
      </mat-menu>

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
                    {{ tag.firstDate | localDate:'MMM d, yyyy' }}
                    @if (tag.firstDate !== tag.lastDate) {
                      — {{ tag.lastDate | localDate:'MMM d, yyyy' }}
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

    /* ─── Filter bar (pill style) ─── */
    .ts-fb {
      display: flex; flex-direction: column; gap: 10px;
      padding: 14px 18px;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      margin-bottom: var(--spacing-md);
    }
    .ts-fb-primary { display: flex; gap: 10px; align-items: center; }
    .ts-fb-search {
      flex: 1; display: flex; align-items: center; gap: 8px;
      padding: 0 12px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: #f8f9fb;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .ts-fb-search-active {
      border-color: var(--color-primary); background: white;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
    }
    .ts-fb-search-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }
    .ts-fb-search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 0.85rem; color: var(--color-text);
    }
    .ts-fb-search-input::placeholder { color: var(--color-text-muted); }
    .ts-fb-search-clear {
      display: flex; align-items: center; padding: 0; border: none;
      background: none; cursor: pointer; color: var(--color-text-muted);
      border-radius: 50%; transition: var(--transition-fast);
    }
    .ts-fb-search-clear mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .ts-fb-search-clear:hover { color: var(--color-text); background: var(--color-border); }

    .ts-fb-controls { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    .ts-fb-dropdown {
      display: flex; align-items: center; gap: 5px;
      padding: 0 12px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: white;
      color: var(--color-text-secondary);
      font-size: 0.82rem; font-weight: 500;
      cursor: pointer; white-space: nowrap;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .ts-fb-dropdown:hover {
      border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
      color: var(--color-text);
    }
    .ts-fb-dropdown-active {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: var(--color-primary);
      color: var(--color-primary); font-weight: 600;
    }
    .ts-fb-dd-icon { font-size: 18px; width: 18px; height: 18px; }
    .ts-fb-dd-arrow { font-size: 16px; width: 16px; height: 16px; opacity: 0.5; margin-left: -2px; }
    .ts-fb-stat {
      padding: 4px 12px; border-radius: var(--radius-full);
      font-size: 0.78rem; font-weight: 600;
      background: #f1f3f5; color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .ts-fb-stat-total {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      color: var(--color-primary);
    }

    .ts-fb-periods { display: flex; flex-wrap: wrap; gap: 6px; }
    .ts-fb-period {
      padding: 5px 14px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      background: white;
      color: var(--color-text-secondary);
      font-size: 0.78rem; font-weight: 500;
      cursor: pointer; white-space: nowrap;
      transition: all 0.15s ease;
    }
    .ts-fb-period:hover {
      border-color: var(--color-primary); color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 4%, white);
    }
    .ts-fb-period-active {
      background: var(--color-primary) !important;
      color: white !important;
      border-color: var(--color-primary) !important;
      font-weight: 600;
      box-shadow: 0 1px 4px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }

    .ts-fb-active {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      padding-top: 8px;
      border-top: 1px dashed color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
    }
    .ts-fb-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 6px 3px 8px;
      font-size: 0.76rem; font-weight: 500;
      border-radius: var(--radius-full);
      background: #f1f3f5; color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .ts-fb-chip-type {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
      color: var(--color-primary);
    }
    .ts-fb-chip-icon { font-size: 14px; width: 14px; height: 14px; }
    .ts-fb-chip-x {
      display: flex; align-items: center; padding: 0;
      border: none; background: none; cursor: pointer;
      color: inherit; opacity: 0.5; border-radius: 50%;
      transition: var(--transition-fast);
    }
    .ts-fb-chip-x mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .ts-fb-chip-x:hover { opacity: 1; background: color-mix(in srgb, currentColor 10%, transparent); }
    .ts-fb-clear-all {
      border: none; background: none; cursor: pointer;
      color: var(--color-text-muted); font-size: 0.74rem; font-weight: 500;
      padding: 2px 8px; border-radius: var(--radius-sm);
      transition: var(--transition-fast);
    }
    .ts-fb-clear-all:hover { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, white); }
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
    .empty-state mat-icon { font-size: 32px; height: 32px; width: 32px; opacity: 0.4; }
    .tag-help { text-align: left; max-width: 400px; margin: var(--spacing-md) auto 0; }
    .tag-help h4 { margin: 0 0 8px; font-size: 0.9rem; }
    .tag-help ul { margin: 0; padding-left: 20px; font-size: 0.85rem; color: var(--color-text-secondary); }
    .tag-help li { margin-bottom: 6px; }
    @media (max-width: 768px) {
      .summary-grid { grid-template-columns: 1fr; }
      .ts-fb-primary { flex-wrap: wrap; }
      .ts-fb-search { min-width: 100%; }
      .ts-fb-controls { flex-wrap: wrap; }
    }
  `]
})
export class TagSummaryComponent implements OnInit {
  private expenseService = inject(DailyExpenseService);
  private cdr = inject(ChangeDetectorRef);

  dateFrom = input<string | undefined>();
  dateTo = input<string | undefined>();

  tags = signal<TagSummary[]>([]);
  loading = signal(true);
  selectedTagType = signal('');
  searchQuery = signal('');
  tsSearchFocused = false;

  availableTagTypes = signal<string[]>([]);

  constructor() {
    effect(() => {
      const from = this.dateFrom();
      const to = this.dateTo();
      this.loadTags(from, to);
    });
  }

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
    this.expenseService.getTagTypes().subscribe(types => { this.availableTagTypes.set(types); this.cdr.detectChanges(); });
  }

  private loadTags(dateFrom?: string, dateTo?: string): void {
    this.loading.set(true);
    this.expenseService.getTagSummary(undefined, dateFrom, dateTo).subscribe({
      next: (response) => {
        this.tags.set(response.tags);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }
}
