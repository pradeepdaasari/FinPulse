import { Component, inject, OnInit, output, signal, computed, ChangeDetectorRef } from '@angular/core';
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
    MatAutocompleteModule, MatProgressSpinnerModule
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
      <div class="filter-grid">
        <mat-form-field class="filter-field search-field">
          <mat-label>Search</mat-label>
          <input matInput [(ngModel)]="search" placeholder="Merchant or description"
                 (keyup.enter)="applyFilters()">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="categoryId" (opened)="categorySearch.set(''); focusInput(catSearchInput)">
            <div class="category-search-box">
              <mat-icon>search</mat-icon>
              <input #catSearchInput type="text" placeholder="Search categories..."
                     [value]="categorySearch()"
                     (input)="categorySearch.set(catSearchInput.value)"
                     (keydown)="$event.stopPropagation()">
            </div>
            <mat-option [value]="null">All</mat-option>
            @for (parent of filteredCategories(); track parent.id) {
              <mat-optgroup [label]="parent.name">
                @for (child of parent.filteredChildren; track child.id) {
                  <mat-option [value]="child.id">{{ child.name }}</mat-option>
                }
                @if (parent.showSelf) {
                  <mat-option [value]="parent.id">{{ parent.name }}</mat-option>
                }
              </mat-optgroup>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="transactionType">
            <mat-option [value]="null">All</mat-option>
            <mat-option [value]="0">Expense</mat-option>
            <mat-option [value]="1">Income</mat-option>
            <mat-option [value]="2">Transfer</mat-option>
            <mat-option [value]="3">Refund</mat-option>
            <mat-option [value]="4">Card Payment</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>From Date</mat-label>
          <input matInput [matDatepicker]="fromPicker" [(ngModel)]="dateFrom">
          <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>To Date</mat-label>
          <input matInput [matDatepicker]="toPicker" [(ngModel)]="dateTo">
          <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>Min Amount</mat-label>
          <input matInput type="number" inputmode="decimal" [(ngModel)]="minAmount" min="0">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>Max Amount</mat-label>
          <input matInput type="number" inputmode="decimal" [(ngModel)]="maxAmount" min="0">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field class="filter-field">
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
          <mat-icon>search</mat-icon> Apply
        </button>
        <button mat-button (click)="clearFilters()">
          <mat-icon>clear</mat-icon> Clear
        </button>
      </div>
      }
    </mat-expansion-panel>
  `,
  styles: [`
    .filter-panel { margin-bottom: 16px; }
    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .search-field { grid-column: span 2; }
    .filter-actions { display: flex; gap: 8px; }
    .active-badge {
      background: #1976d2;
      color: white;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 8px;
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
    @media (max-width: 600px) {
      .filter-grid { grid-template-columns: 1fr; }
      .search-field { grid-column: span 1; }
    }
  `]
})
export class ExpenseFilterBarComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private expenseService = inject(DailyExpenseService);
  private cdr = inject(ChangeDetectorRef);

  filterChange = output<Partial<ExpenseFilter>>();

  loading = signal(true);
  private loadCount = 0;
  categories = signal<Category[]>([]);
  categorySearch = signal('');
  filteredCategories = computed(() => {
    const q = this.categorySearch().toLowerCase();
    if (!q) return this.categories().map(p => ({
      ...p,
      filteredChildren: p.children || [],
      showSelf: !p.children || p.children.length === 0
    }));
    return this.categories()
      .map(p => {
        const parentMatch = p.name.toLowerCase().includes(q);
        const filteredChildren = (p.children || []).filter(c => c.name.toLowerCase().includes(q));
        return {
          ...p,
          filteredChildren: parentMatch ? (p.children || []) : filteredChildren,
          showSelf: parentMatch && (!p.children || p.children.length === 0)
        };
      })
      .filter(p => p.filteredChildren.length > 0 || p.showSelf);
  });
  allTags = signal<string[]>([]);
  filteredTags = signal<string[]>([]);
  search = '';
  categoryId: number | null = null;
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
    this.categoryService.getAll('Expense').subscribe(cats => {
      this.categories.set(cats);
      this.checkLoaded();
      this.cdr.detectChanges();
    });
    this.expenseService.getTags().subscribe(tags => {
      this.allTags.set(tags);
      this.filteredTags.set(tags);
      this.checkLoaded();
      this.cdr.detectChanges();
    });
  }

  onTagInput(): void {
    const q = this.tag.toLowerCase();
    this.filteredTags.set(this.allTags().filter(t => t.toLowerCase().includes(q)));
  }

  hasActiveFilters(): boolean {
    return !!(this.search || this.categoryId || this.transactionType !== null ||
              this.dateFrom || this.dateTo || this.minAmount || this.maxAmount || this.tag);
  }

  applyFilters(): void {
    const filter: Partial<ExpenseFilter> = {};
    if (this.search) filter.search = this.search;
    if (this.categoryId) filter.categoryId = this.categoryId;
    if (this.transactionType !== null) filter.transactionType = this.transactionType;
    if (this.dateFrom) filter.dateFrom = toLocalDateString(this.dateFrom);
    if (this.dateTo) filter.dateTo = toLocalDateString(this.dateTo);
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
    this.categoryId = null;
    this.transactionType = null;
    this.dateFrom = null;
    this.dateTo = null;
    this.minAmount = null;
    this.maxAmount = null;
    this.tag = '';
    this.filteredTags.set(this.allTags());
    this.filterChange.emit({});
  }
}
