import { Component, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryService } from '../../core/services/category.service';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { Category } from '../../core/models/category.model';
import { ExpenseFilter } from '../../core/models/daily-expense.model';

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
          <mat-select [(ngModel)]="categoryId">
            <mat-option [value]="null">All</mat-option>
            @for (parent of categories(); track parent.id) {
              <mat-optgroup [label]="parent.name">
                @for (child of parent.children; track child.id) {
                  <mat-option [value]="child.id">{{ child.name }}</mat-option>
                }
                @if (!parent.children || parent.children.length === 0) {
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
          <input matInput type="number" [(ngModel)]="minAmount" min="0">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field class="filter-field">
          <mat-label>Max Amount</mat-label>
          <input matInput type="number" [(ngModel)]="maxAmount" min="0">
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
    @media (max-width: 600px) {
      .filter-grid { grid-template-columns: 1fr; }
      .search-field { grid-column: span 1; }
    }
  `]
})
export class ExpenseFilterBarComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private expenseService = inject(DailyExpenseService);

  filterChange = output<Partial<ExpenseFilter>>();

  loading = signal(true);
  private loadCount = 0;
  categories = signal<Category[]>([]);
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
    });
    this.expenseService.getTags().subscribe(tags => {
      this.allTags.set(tags);
      this.filteredTags.set(tags);
      this.checkLoaded();
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
    if (this.dateFrom) filter.dateFrom = this.dateFrom.toISOString().split('T')[0];
    if (this.dateTo) filter.dateTo = this.dateTo.toISOString().split('T')[0];
    if (this.minAmount) filter.minAmount = this.minAmount;
    if (this.maxAmount) filter.maxAmount = this.maxAmount;
    if (this.tag) filter.tag = this.tag;
    this.filterChange.emit(filter);
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
