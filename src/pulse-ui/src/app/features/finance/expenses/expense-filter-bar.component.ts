import { Component, inject, OnInit, output, input, signal, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { toLocalDateString } from '../../../core/utils/date-utils';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CategoryService } from '../../../core/services/category.service';
import { DailyExpenseService } from '../../../core/services/daily-expense.service';
import { Category } from '../../../core/models/category.model';
import { ExpenseFilter } from '../../../core/models/daily-expense.model';

@Component({
  selector: 'app-expense-filter-bar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    MatAutocompleteModule, MatProgressSpinnerModule, MatCheckboxModule
  ],
  template: `
    <mat-expansion-panel class="filter-panel" [expanded]="false">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon>filter_list</mat-icon> Filters
          @if (hasActiveFilters()) {
            <span class="active-badge">Active</span>
          }
        </mat-panel-title>
      </mat-expansion-panel-header>

      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {

      <!-- Row 1: Search + Type -->
      <div class="filter-row">
        <mat-form-field class="filter-field flex-2" appearance="outline">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" placeholder="Merchant or description"
                 (keyup.enter)="applyFilters()">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field class="filter-field flex-1" appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="transactionType" (selectionChange)="onTypeChange()">
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="0">Expense</mat-option>
            <mat-option [value]="1">Income</mat-option>
            <mat-option [value]="2">Transfer</mat-option>
            <mat-option [value]="3">Refund</mat-option>
            <mat-option [value]="4">Card Payment</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Row 2: Categories (full width multi-select) -->
      <div class="filter-row">
        <mat-form-field class="filter-field flex-1" appearance="outline">
          <mat-label>{{ categoryIds.length > 0 ? 'Categories (' + categoryIds.length + ')' : 'Categories' }}</mat-label>
          <mat-select multiple [(ngModel)]="categoryIds" (opened)="categorySearch.set(''); focusInput(catSearchInput)">
            <div class="category-search-box">
              <mat-icon>search</mat-icon>
              <input #catSearchInput type="text" placeholder="Search categories..."
                     [value]="categorySearch()"
                     (input)="categorySearch.set(catSearchInput.value)"
                     (keydown)="$event.stopPropagation()">
            </div>
            @if (categoriesLoading()) {
              <div class="cat-loading"><mat-spinner diameter="24"></mat-spinner></div>
            } @else {
              @for (parent of filteredCategories(); track parent.id) {
                <div class="group-header" (click)="toggleGroup(parent, $event)">
                  <mat-checkbox [checked]="isGroupSelected(parent)" [indeterminate]="isGroupIndeterminate(parent)"
                                (click)="toggleGroup(parent, $event)">
                  </mat-checkbox>
                  <mat-icon class="group-icon">{{ parent.icon || 'folder' }}</mat-icon>
                  <span class="group-label">{{ parent.name }}</span>
                  <span class="group-count">{{ parent.filteredChildren.length }}</span>
                </div>
                <div class="group-children">
                  @for (child of parent.filteredChildren; track child.id) {
                    <mat-option [value]="child.id" class="child-option">
                      <span class="child-indent">└</span> {{ child.name }}
                    </mat-option>
                  }
                </div>
                @if (parent.showSelf) {
                  <mat-option [value]="parent.id">{{ parent.name }}</mat-option>
                }
              }
            }
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Selected category chips -->
      @if (categoryIds.length > 0) {
        <div class="selected-chips">
          @for (id of categoryIds; track id) {
            <span class="cat-chip">
              <mat-icon class="chip-icon">{{ getCategoryIcon(id) }}</mat-icon>
              {{ getCategoryName(id) }}
              <button class="chip-remove" (click)="removeCategory(id)">
                <mat-icon class="chip-x">close</mat-icon>
              </button>
            </span>
          }
          <button class="clear-cats" (click)="clearCategories()">
            <mat-icon class="clear-icon">clear_all</mat-icon> Clear all
          </button>
        </div>
      }

      <!-- Row 3: Period quick-select -->
      <div class="period-section">
        <span class="period-label">Period</span>
        <div class="period-chips">
          @for (p of periods; track p.key) {
            <button class="period-chip" [class.active]="selectedPeriod === p.key" (click)="selectPeriod(p.key)">
              {{ p.label }}
            </button>
          }
        </div>
      </div>

      <!-- Custom date pickers (only when Custom is selected) -->
      @if (selectedPeriod === 'custom') {
        <div class="filter-row">
          <mat-form-field class="filter-field flex-1" appearance="outline">
            <mat-label>From Date</mat-label>
            <input matInput [matDatepicker]="fromPicker" [(ngModel)]="dateFrom" placeholder="MM/DD/YYYY">
            <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field class="filter-field flex-1" appearance="outline">
            <mat-label>To Date</mat-label>
            <input matInput [matDatepicker]="toPicker" [(ngModel)]="dateTo" placeholder="MM/DD/YYYY">
            <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </mat-form-field>
        </div>
      }

      <!-- Row 4: Amount + Tag -->
      <div class="filter-row">
        <mat-form-field class="filter-field flex-1" appearance="outline">
          <mat-label>Min Amount</mat-label>
          <input matInput type="number" inputmode="decimal" [(ngModel)]="minAmount" min="0">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field class="filter-field flex-1" appearance="outline">
          <mat-label>Max Amount</mat-label>
          <input matInput type="number" inputmode="decimal" [(ngModel)]="maxAmount" min="0">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field class="filter-field flex-1" appearance="outline">
          <mat-label>Tag</mat-label>
          <input matInput [(ngModel)]="tag" [matAutocomplete]="tagAuto"
                 placeholder="e.g. Hawaii 2026" (input)="onTagInput()">
          <mat-icon matPrefix>label</mat-icon>
          <mat-autocomplete #tagAuto="matAutocomplete">
            @for (t of filteredTags(); track t) {
              <mat-option [value]="t">{{ t }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
      </div>

      <div class="filter-actions">
        <button mat-raised-button color="primary" (click)="applyFilters()">
          <mat-icon>search</mat-icon> Apply Filters
        </button>
        <button mat-stroked-button (click)="clearFilters()">
          <mat-icon>clear</mat-icon> Clear All
        </button>
      </div>
      }
    </mat-expansion-panel>
  `,
  styles: [`
    .filter-panel { margin-bottom: 16px; border-radius: var(--radius-md) !important; }
    .filter-row {
      display: flex; gap: 12px; margin-bottom: 4px;
    }
    .filter-field { min-width: 0; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .filter-actions { display: flex; gap: 10px; padding-top: 4px; }
    .active-badge {
      background: var(--color-primary);
      color: white;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 2px 10px;
      border-radius: var(--radius-full);
      margin-left: 8px;
      letter-spacing: 0.02em;
    }
    .loading-container { display: flex; justify-content: center; align-items: center; padding: 32px 0; }
    .category-search-box {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; position: sticky; top: 0; z-index: 1;
      background: var(--color-surface); border-bottom: 1px solid var(--color-border);
    }
    .category-search-box mat-icon { color: var(--color-text-muted); font-size: 20px; width: 20px; height: 20px; }
    .category-search-box input {
      border: none; outline: none; width: 100%; font-size: var(--text-sm);
      background: transparent; color: var(--color-text);
    }
    .cat-loading { display: flex; justify-content: center; padding: 16px 0; }
    .group-header {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px; cursor: pointer;
      font-weight: 600; font-size: 0.85rem;
      color: var(--color-text);
      background: var(--color-surface-hover, #f8f9fa);
      border-top: 1px solid var(--color-border);
    }
    .group-header:first-of-type { border-top: none; }
    .group-header:hover { background: #eef1f5; }
    .group-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-primary); }
    .group-label { flex: 1; }
    .group-count {
      font-size: 0.7rem; font-weight: 500; color: var(--color-text-muted);
      background: var(--color-border, #e0e0e0); padding: 1px 7px;
      border-radius: var(--radius-full); min-width: 18px; text-align: center;
    }
    .group-children { border-left: 2px solid var(--color-border, #e0e0e0); margin-left: 28px; }
    .child-option { padding-left: 8px !important; }
    .child-indent { color: var(--color-text-muted); font-size: 0.8rem; margin-right: 4px; }
    .selected-chips {
      display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
      margin-bottom: 12px;
    }
    .cat-chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: var(--color-primary-light, #e8f0fe);
      color: var(--color-primary);
      font-size: 0.8rem; font-weight: 500;
      padding: 4px 6px 4px 10px;
      border-radius: var(--radius-full);
      border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
    }
    .chip-icon { font-size: 16px; width: 16px; height: 16px; }
    .chip-remove {
      background: none; border: none; cursor: pointer;
      color: var(--color-primary); display: flex; align-items: center;
      padding: 0; opacity: 0.6; border-radius: 50%;
      transition: var(--transition-fast);
    }
    .chip-remove:hover { opacity: 1; background: color-mix(in srgb, var(--color-primary) 12%, transparent); }
    .chip-x { font-size: 16px; width: 16px; height: 16px; }
    .clear-cats {
      display: inline-flex; align-items: center; gap: 2px;
      background: none; border: none; cursor: pointer;
      color: var(--color-text-muted); font-size: 0.75rem;
      padding: 4px 8px; border-radius: var(--radius-sm);
    }
    .clear-cats:hover { color: var(--color-text); background: var(--color-surface-hover, #f5f5f5); }
    .clear-icon { font-size: 16px; width: 16px; height: 16px; }
    .period-section {
      display: flex; align-items: center; gap: 12px;
      margin-bottom: 12px;
    }
    .period-label {
      font-size: 0.78rem; font-weight: 600;
      color: var(--color-text-muted); white-space: nowrap;
    }
    .period-chips {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .period-chip {
      padding: 6px 14px; border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text-secondary);
      font-size: 0.8rem; font-weight: 500;
      cursor: pointer; transition: all 0.15s ease;
      white-space: nowrap;
    }
    .period-chip:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 6%, var(--color-surface));
    }
    .period-chip.active {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
      font-weight: 600;
    }
    @media (max-width: 600px) {
      .filter-row { flex-direction: column; gap: 0; }
    }
  `]
})
export class ExpenseFilterBarComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private expenseService = inject(DailyExpenseService);
  private cdr = inject(ChangeDetectorRef);

  filterChange = output<Partial<ExpenseFilter>>();
  usedCategoryIds = input<Set<number>>(new Set());

  loading = signal(true);
  categoriesLoading = signal(false);
  private loadCount = 0;
  categories = signal<Category[]>([]);
  private categoryMap = new Map<number, { name: string; icon: string }>();
  categorySearch = signal('');
  filteredCategories = computed(() => {
    const q = this.categorySearch().toLowerCase();

    let cats = this.categories().map(p => ({
      ...p,
      allChildren: p.children || []
    }));

    if (!q) return cats.map(p => ({
      ...p,
      filteredChildren: p.allChildren,
      showSelf: p.allChildren.length === 0
    }));
    return cats
      .map(p => {
        const parentMatch = p.name.toLowerCase().includes(q);
        const filteredChildren = p.allChildren.filter(c => c.name.toLowerCase().includes(q));
        return {
          ...p,
          filteredChildren: parentMatch ? p.allChildren : filteredChildren,
          showSelf: parentMatch && p.allChildren.length === 0
        };
      })
      .filter(p => p.filteredChildren.length > 0 || p.showSelf);
  });
  allTags = signal<string[]>([]);
  filteredTags = signal<string[]>([]);
  periods = [
    { key: 'month', label: 'This Month' },
    { key: '3m', label: '3 Months' },
    { key: '6m', label: '6 Months' },
    { key: 'ytd', label: 'YTD' },
    { key: 'all', label: 'All Time' },
    { key: 'custom', label: 'Custom' },
  ];
  selectedPeriod = 'month';
  search = '';
  categoryIds: number[] = [];
  transactionType: number | null = null;
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  minAmount: number | null = null;
  maxAmount: number | null = null;
  tag = '';

  private checkLoaded(): void {
    this.loadCount++;
    if (this.loadCount >= 2) {
      this.loading.set(false);
    }
  }

  ngOnInit(): void {
    this.loadCategories();
    this.expenseService.getTags().subscribe(tags => {
      this.allTags.set(tags);
      this.filteredTags.set(tags);
      this.checkLoaded();
      this.cdr.detectChanges();
    });
  }

  private loadCategories(type?: string): void {
    this.categoriesLoading.set(true);
    this.categoryService.getAll(type).subscribe(cats => {
      this.categories.set(cats);
      this.buildCategoryMap(cats);
      this.categoriesLoading.set(false);
      this.checkLoaded();
      this.cdr.detectChanges();
    });
  }

  onTypeChange(): void {
    this.categoryIds = [];
    const typeMap: Record<number, string> = { 0: 'Expense', 1: 'Income' };
    const type = this.transactionType !== null ? typeMap[this.transactionType] : undefined;
    this.loadCategories(type);
    this.applyFilters();
  }

  private buildCategoryMap(cats: Category[]): void {
    this.categoryMap.clear();
    for (const parent of cats) {
      this.categoryMap.set(parent.id, { name: parent.name, icon: parent.icon || 'category' });
      for (const child of parent.children || []) {
        this.categoryMap.set(child.id, { name: child.name, icon: child.icon || parent.icon || 'category' });
      }
    }
  }

  getCategoryName(id: number): string {
    return this.categoryMap.get(id)?.name || 'Unknown';
  }

  getCategoryIcon(id: number): string {
    return this.categoryMap.get(id)?.icon || 'category';
  }

  removeCategory(id: number): void {
    this.categoryIds = this.categoryIds.filter(cid => cid !== id);
  }

  clearCategories(): void {
    this.categoryIds = [];
  }

  toggleGroup(parent: { id: number; allChildren: Category[]; showSelf: boolean }, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const childIds = parent.allChildren.map(c => c.id);
    if (parent.showSelf) childIds.push(parent.id);
    const allSelected = childIds.every(id => this.categoryIds.includes(id));
    if (allSelected) {
      this.categoryIds = this.categoryIds.filter(id => !childIds.includes(id));
    } else {
      const newIds = childIds.filter(id => !this.categoryIds.includes(id));
      this.categoryIds = [...this.categoryIds, ...newIds];
    }
  }

  isGroupSelected(parent: { id: number; allChildren: Category[]; showSelf: boolean }): boolean {
    const childIds = parent.allChildren.map(c => c.id);
    if (parent.showSelf) childIds.push(parent.id);
    return childIds.length > 0 && childIds.every(id => this.categoryIds.includes(id));
  }

  isGroupIndeterminate(parent: { id: number; allChildren: Category[]; showSelf: boolean }): boolean {
    const childIds = parent.allChildren.map(c => c.id);
    if (parent.showSelf) childIds.push(parent.id);
    const selected = childIds.filter(id => this.categoryIds.includes(id));
    return selected.length > 0 && selected.length < childIds.length;
  }

  onTagInput(): void {
    const q = this.tag.toLowerCase();
    this.filteredTags.set(this.allTags().filter(t => t.toLowerCase().includes(q)));
  }

  selectPeriod(key: string): void {
    this.selectedPeriod = key;
    if (key !== 'custom') {
      this.dateFrom = null;
      this.dateTo = null;
    }
  }

  private getPeriodDates(): { from?: string; to?: string; allTime?: boolean } {
    const now = new Date();
    const today = toLocalDateString(now);
    switch (this.selectedPeriod) {
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: toLocalDateString(start), to: today };
      }
      case '3m': {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return { from: toLocalDateString(start), to: today };
      }
      case '6m': {
        const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return { from: toLocalDateString(start), to: today };
      }
      case 'ytd': {
        const start = new Date(now.getFullYear(), 0, 1);
        return { from: toLocalDateString(start), to: today };
      }
      case 'all':
        return { allTime: true };
      case 'custom':
        return {
          from: this.dateFrom ? toLocalDateString(this.dateFrom) : undefined,
          to: this.dateTo ? toLocalDateString(this.dateTo) : undefined
        };
      default:
        return {};
    }
  }

  hasActiveFilters(): boolean {
    return !!(this.search || this.categoryIds.length > 0 || this.transactionType !== null ||
              this.selectedPeriod !== 'month' || this.minAmount || this.maxAmount || this.tag);
  }

  applyFilters(): void {
    const filter: Partial<ExpenseFilter> = {};
    if (this.search) filter.search = this.search;
    if (this.categoryIds.length > 0) filter.categoryIds = this.categoryIds;
    if (this.transactionType !== null) filter.transactionType = this.transactionType;
    const dates = this.getPeriodDates();
    if (dates.allTime) filter.allTime = true;
    if (dates.from) filter.dateFrom = dates.from;
    if (dates.to) filter.dateTo = dates.to;
    if (this.minAmount) filter.minAmount = this.minAmount;
    if (this.maxAmount) filter.maxAmount = this.maxAmount;
    if (this.tag) filter.tag = this.tag;
    this.filterChange.emit(filter);
  }

  focusInput(el: HTMLInputElement): void {
    setTimeout(() => el.focus(), 0);
  }

  clearFilters(): void {
    this.search = '';
    this.categoryIds = [];
    this.transactionType = null;
    this.selectedPeriod = 'month';
    this.dateFrom = null;
    this.dateTo = null;
    this.minAmount = null;
    this.maxAmount = null;
    this.tag = '';
    this.filteredTags.set(this.allTags());
    this.loadCategories();
    this.filterChange.emit({});
  }
}
