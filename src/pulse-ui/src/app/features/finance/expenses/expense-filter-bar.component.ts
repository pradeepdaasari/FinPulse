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
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CategoryService } from '../../../core/services/category.service';
import { DailyExpenseService } from '../../../core/services/daily-expense.service';
import { LoanService } from '../../../core/services/loan.service';
import { CreditCardService } from '../../../core/services/credit-card.service';
import { BankAccountService } from '../../../core/services/bank-account.service';
import { Category } from '../../../core/models/category.model';
import { ExpenseFilter } from '../../../core/models/daily-expense.model';

@Component({
  selector: 'app-expense-filter-bar',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDatepickerModule, MatNativeDateModule, MatMenuModule,
    MatAutocompleteModule, MatProgressSpinnerModule, MatCheckboxModule
  ],
  template: `
    @if (loading()) {
      <div class="loading-bar"><mat-spinner diameter="24"></mat-spinner></div>
    } @else {
    <div class="fb">
      <!-- Row 1: Primary controls — always visible -->
      <div class="fb-primary">
        <div class="fb-search" [class.fb-search-active]="searchFocused">
          <mat-icon class="fb-search-icon">search</mat-icon>
          <input class="fb-search-input" [(ngModel)]="search"
                 placeholder="Search transactions..."
                 (keyup.enter)="applyFilters()"
                 (focus)="searchFocused = true"
                 (blur)="searchFocused = false">
          @if (search) {
            <button class="fb-search-clear" (click)="search = ''; applyFilters()">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <div class="fb-controls">
          <button class="fb-dropdown" [class.fb-dropdown-active]="transactionType !== null"
                  [matMenuTriggerFor]="typeMenu">
            <mat-icon class="fb-dd-icon">{{ typeIcon() }}</mat-icon>
            <span>{{ typeLabel() }}</span>
            <mat-icon class="fb-dd-arrow">expand_more</mat-icon>
          </button>

          @if (transactionType !== 4 && transactionType !== 5) {
            <button class="fb-dropdown" [class.fb-dropdown-active]="categoryIds.length > 0"
                    [matMenuTriggerFor]="catMenu">
              <mat-icon class="fb-dd-icon">category</mat-icon>
              <span>{{ categoryIds.length > 0 ? categoryIds.length + ' Categories' : 'Category' }}</span>
              <mat-icon class="fb-dd-arrow">expand_more</mat-icon>
            </button>
          }

          @if (transactionType === 4 || transactionType === 5) {
            <button class="fb-dropdown" [class.fb-dropdown-active]="toFundingSourceId !== null"
                    [matMenuTriggerFor]="acctMenu">
              <mat-icon class="fb-dd-icon">{{ transactionType === 5 ? 'account_balance' : 'credit_card' }}</mat-icon>
              <span>{{ accountLabel() }}</span>
              <mat-icon class="fb-dd-arrow">expand_more</mat-icon>
            </button>
          }

          <button class="fb-dropdown" [class.fb-dropdown-active]="fundingSourceId !== null"
                  [matMenuTriggerFor]="sourceMenu">
            <mat-icon class="fb-dd-icon">account_balance_wallet</mat-icon>
            <span>{{ sourceLabel() }}</span>
            <mat-icon class="fb-dd-arrow">expand_more</mat-icon>
          </button>

          <button class="fb-more-toggle" [class.fb-more-active]="showMore"
                  (click)="showMore = !showMore">
            <mat-icon>{{ showMore ? 'expand_less' : 'tune' }}</mat-icon>
            @if (advancedFilterCount() > 0 && !showMore) {
              <span class="fb-badge">{{ advancedFilterCount() }}</span>
            }
          </button>
        </div>
      </div>

      <!-- Row 2: Period pills -->
      <div class="fb-periods">
        @for (p of periods; track p.key) {
          <button class="fb-period" [class.fb-period-active]="selectedPeriod === p.key"
                  (click)="selectPeriod(p.key); applyFilters()">
            {{ p.label }}
          </button>
        }
      </div>

      @if (selectedPeriod === 'custom') {
        <div class="fb-dates">
          <mat-form-field class="fb-date-field" appearance="outline">
            <mat-label>From</mat-label>
            <input matInput [matDatepicker]="fromPicker" [(ngModel)]="dateFrom">
            <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </mat-form-field>
          <mat-icon class="fb-date-arrow">arrow_forward</mat-icon>
          <mat-form-field class="fb-date-field" appearance="outline">
            <mat-label>To</mat-label>
            <input matInput [matDatepicker]="toPicker" [(ngModel)]="dateTo">
            <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </mat-form-field>
          <button class="fb-date-apply" (click)="applyFilters()">
            <mat-icon>check</mat-icon>
          </button>
        </div>
      }

      <!-- Row 3: Advanced filters (collapsible) -->
      @if (showMore) {
        <div class="fb-advanced">
          <div class="fb-adv-row">
            <div class="fb-adv-group">
              <span class="fb-adv-label">Amount Range</span>
              <div class="fb-range">
                <div class="fb-pill-input fb-pill-sm">
                  <span class="fb-pill-prefix">$</span>
                  <input type="number" inputmode="decimal" [(ngModel)]="minAmount" min="0"
                         placeholder="Min" (keyup.enter)="applyFilters()">
                </div>
                <span class="fb-range-sep">–</span>
                <div class="fb-pill-input fb-pill-sm">
                  <span class="fb-pill-prefix">$</span>
                  <input type="number" inputmode="decimal" [(ngModel)]="maxAmount" min="0"
                         placeholder="Max" (keyup.enter)="applyFilters()">
                </div>
              </div>
            </div>
            <div class="fb-adv-group fb-adv-tag">
              <span class="fb-adv-label">Tag</span>
              <div class="fb-pill-input">
                <mat-icon class="fb-pill-icon">label</mat-icon>
                <input [(ngModel)]="tag" [matAutocomplete]="tagAuto"
                       placeholder="e.g. Hawaii 2026" (input)="onTagInput()"
                       (keyup.enter)="applyFilters()">
                @if (tag) {
                  <button class="fb-pill-clear" (click)="tag = ''; applyFilters()">
                    <mat-icon>close</mat-icon>
                  </button>
                }
                <mat-autocomplete #tagAuto="matAutocomplete" (optionSelected)="applyFilters()">
                  @for (t of filteredTags(); track t) {
                    <mat-option [value]="t">{{ t }}</mat-option>
                  }
                </mat-autocomplete>
              </div>
            </div>
            <button class="fb-apply-btn" (click)="applyFilters()">
              <mat-icon>check</mat-icon> Apply
            </button>
          </div>
        </div>
      }

      <!-- Active filter chips -->
      @if (hasActiveFilters()) {
        <div class="fb-active">
          @if (transactionType !== null) {
            <span class="fb-chip fb-chip-type">
              <mat-icon class="fb-chip-icon">{{ typeIcon() }}</mat-icon>
              {{ typeLabel() }}
              <button class="fb-chip-x" (click)="clearType()"><mat-icon>close</mat-icon></button>
            </span>
          }
          @if (toFundingSourceId !== null) {
            <span class="fb-chip fb-chip-acct">
              <mat-icon class="fb-chip-icon">{{ transactionType === 5 ? 'account_balance' : 'credit_card' }}</mat-icon>
              {{ accountLabel() }}
              <button class="fb-chip-x" (click)="toFundingSourceId = null; applyFilters()"><mat-icon>close</mat-icon></button>
            </span>
          }
          @if (fundingSourceId !== null) {
            <span class="fb-chip fb-chip-source">
              <mat-icon class="fb-chip-icon">{{ fundingSourceType === 'CreditCard' ? 'credit_card' : 'account_balance' }}</mat-icon>
              {{ sourceLabel() }}
              <button class="fb-chip-x" (click)="clearSource()"><mat-icon>close</mat-icon></button>
            </span>
          }
          @for (id of categoryIds; track id) {
            <span class="fb-chip fb-chip-cat">
              <mat-icon class="fb-chip-icon">{{ getCategoryIcon(id) }}</mat-icon>
              {{ getCategoryName(id) }}
              <button class="fb-chip-x" (click)="removeCategory(id); applyFilters()"><mat-icon>close</mat-icon></button>
            </span>
          }
          @if (search) {
            <span class="fb-chip">
              <mat-icon class="fb-chip-icon">search</mat-icon>
              "{{ search }}"
              <button class="fb-chip-x" (click)="search = ''; applyFilters()"><mat-icon>close</mat-icon></button>
            </span>
          }
          @if (minAmount || maxAmount) {
            <span class="fb-chip">
              <mat-icon class="fb-chip-icon">attach_money</mat-icon>
              {{ minAmount ? '$' + minAmount : '$0' }} – {{ maxAmount ? '$' + maxAmount : '∞' }}
              <button class="fb-chip-x" (click)="minAmount = null; maxAmount = null; applyFilters()"><mat-icon>close</mat-icon></button>
            </span>
          }
          @if (tag) {
            <span class="fb-chip">
              <mat-icon class="fb-chip-icon">label</mat-icon>
              {{ tag }}
              <button class="fb-chip-x" (click)="tag = ''; applyFilters()"><mat-icon>close</mat-icon></button>
            </span>
          }
          <button class="fb-clear-all" (click)="clearFilters()">Clear all</button>
        </div>
      }
    </div>

    <!-- Hidden mat-select menus for dropdown triggers -->
    <mat-menu #typeMenu="matMenu" class="fb-menu">
      <button mat-menu-item (click)="transactionType = null; onTypeChange()">
        <mat-icon>list</mat-icon> All Types
      </button>
      <button mat-menu-item (click)="transactionType = 0; onTypeChange()">
        <mat-icon>shopping_cart</mat-icon> Expense
      </button>
      <button mat-menu-item (click)="transactionType = 1; onTypeChange()">
        <mat-icon>trending_up</mat-icon> Income
      </button>
      <button mat-menu-item (click)="transactionType = 2; onTypeChange()">
        <mat-icon>swap_horiz</mat-icon> Transfer
      </button>
      <button mat-menu-item (click)="transactionType = 3; onTypeChange()">
        <mat-icon>replay</mat-icon> Refund
      </button>
      <button mat-menu-item (click)="transactionType = 4; onTypeChange()">
        <mat-icon>credit_card</mat-icon> Card Payment
      </button>
      <button mat-menu-item (click)="transactionType = 5; onTypeChange()">
        <mat-icon>account_balance</mat-icon> Loan Payment
      </button>
    </mat-menu>

    <mat-menu #catMenu="matMenu" class="fb-cat-menu">
      <div class="category-search-box" (click)="$event.stopPropagation()">
        <mat-icon>search</mat-icon>
        <input #catSearchInput2 type="text" placeholder="Search categories..."
               [value]="categorySearch()"
               (input)="categorySearch.set(catSearchInput2.value)"
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
          @for (child of parent.filteredChildren; track child.id) {
            <button mat-menu-item (click)="toggleCategoryItem(child.id); $event.stopPropagation()">
              <mat-icon [class.cat-selected-icon]="categoryIds.includes(child.id)">
                {{ categoryIds.includes(child.id) ? 'check_box' : 'check_box_outline_blank' }}
              </mat-icon>
              {{ child.name }}
            </button>
          }
        }
        <div class="cat-menu-actions" (click)="$event.stopPropagation()">
          <button class="cat-done-btn" (click)="applyFilters()">Done</button>
        </div>
      }
    </mat-menu>

    <mat-menu #acctMenu="matMenu" class="fb-menu">
      <button mat-menu-item (click)="toFundingSourceId = null; applyFilters()">
        <mat-icon>list</mat-icon> All {{ transactionType === 5 ? 'Loans' : 'Cards' }}
      </button>
      @for (acct of debtAccounts(); track acct.id) {
        <button mat-menu-item (click)="toFundingSourceId = acct.id; applyFilters()">
          <mat-icon>{{ transactionType === 5 ? 'account_balance' : 'credit_card' }}</mat-icon>
          {{ acct.name }}
        </button>
      }
    </mat-menu>

    <mat-menu #sourceMenu="matMenu" class="fb-menu">
      <button mat-menu-item (click)="clearSource()">
        <mat-icon>list</mat-icon> All Sources
      </button>
      @for (src of sourceAccounts(); track src.id + src.type) {
        <button mat-menu-item (click)="selectSource(src)">
          <mat-icon>{{ src.type === 'CreditCard' ? 'credit_card' : 'account_balance' }}</mat-icon>
          {{ src.name }}
        </button>
      }
    </mat-menu>
    }
  `,
  styles: [`
    .loading-bar { display: flex; justify-content: center; padding: 16px 0; }

    .fb {
      display: flex; flex-direction: column; gap: 10px;
      padding: 14px 18px;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      margin-bottom: 16px;
    }

    /* Primary row */
    .fb-primary {
      display: flex; gap: 10px; align-items: center;
    }
    .fb-search {
      flex: 1; display: flex; align-items: center; gap: 8px;
      padding: 0 12px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: #f8f9fb;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .fb-search-active {
      border-color: var(--color-primary);
      background: white;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
    }
    .fb-search-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }
    .fb-search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 0.85rem; color: var(--color-text);
    }
    .fb-search-input::placeholder { color: var(--color-text-muted); }
    .fb-search-clear {
      display: flex; align-items: center; padding: 0; border: none;
      background: none; cursor: pointer; color: var(--color-text-muted);
      border-radius: 50%; transition: var(--transition-fast);
    }
    .fb-search-clear mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .fb-search-clear:hover { color: var(--color-text); background: var(--color-border); }

    .fb-controls { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }

    .fb-dropdown {
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
    .fb-dropdown:hover {
      border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
      color: var(--color-text);
    }
    .fb-dropdown-active {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: var(--color-primary);
      color: var(--color-primary);
      font-weight: 600;
    }
    .fb-dd-icon { font-size: 18px; width: 18px; height: 18px; }
    .fb-dd-arrow { font-size: 16px; width: 16px; height: 16px; opacity: 0.5; margin-left: -2px; }

    .fb-more-toggle {
      display: flex; align-items: center; justify-content: center;
      width: 38px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: 50%;
      background: white;
      color: var(--color-text-muted);
      cursor: pointer; position: relative;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .fb-more-toggle:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .fb-more-active {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .fb-more-toggle mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .fb-badge {
      position: absolute; top: -4px; right: -4px;
      background: var(--color-primary); color: white;
      font-size: 0.6rem; font-weight: 700;
      width: 16px; height: 16px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }

    /* Period pills */
    .fb-periods {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .fb-period {
      padding: 5px 14px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      background: white;
      color: var(--color-text-secondary);
      font-size: 0.78rem; font-weight: 500;
      cursor: pointer; white-space: nowrap;
      transition: all 0.15s ease;
    }
    .fb-period:hover {
      border-color: var(--color-primary); color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 4%, white);
    }
    .fb-period-active {
      background: var(--color-primary) !important;
      color: white !important;
      border-color: var(--color-primary) !important;
      font-weight: 600;
      box-shadow: 0 1px 4px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }

    /* Custom date row */
    .fb-dates {
      display: flex; align-items: center; gap: 8px;
    }
    .fb-date-field { flex: 1; }
    .fb-date-arrow { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }
    .fb-date-apply {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%;
      border: none; background: var(--color-primary); color: white;
      cursor: pointer; flex-shrink: 0;
    }
    .fb-date-apply:hover { opacity: 0.9; }
    .fb-date-apply mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Advanced filters */
    .fb-advanced {
      padding-top: 10px;
      border-top: 1px solid var(--color-border);
    }
    .fb-adv-row {
      display: flex; gap: 14px; align-items: flex-end;
    }
    .fb-adv-group { display: flex; flex-direction: column; gap: 5px; }
    .fb-adv-tag { flex: 1; }
    .fb-adv-label {
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--color-text-muted); padding-left: 4px;
    }
    .fb-range { display: flex; align-items: center; gap: 6px; }
    .fb-range-sep { color: var(--color-text-muted); font-weight: 500; font-size: 0.85rem; }

    .fb-pill-input {
      display: flex; align-items: center; gap: 6px;
      padding: 0 12px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: #f8f9fb;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .fb-pill-input:focus-within {
      border-color: var(--color-primary); background: white;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
    }
    .fb-pill-sm { width: 120px; }
    .fb-pill-prefix {
      color: var(--color-text-muted); font-size: 0.85rem; font-weight: 500;
      flex-shrink: 0;
    }
    .fb-pill-icon {
      font-size: 18px; width: 18px; height: 18px;
      color: var(--color-text-muted); flex-shrink: 0;
    }
    .fb-pill-input input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 0.85rem; color: var(--color-text);
      min-width: 0;
    }
    .fb-pill-input input::placeholder { color: var(--color-text-muted); }
    .fb-pill-input input[type="number"] { -moz-appearance: textfield; }
    .fb-pill-input input[type="number"]::-webkit-outer-spin-button,
    .fb-pill-input input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .fb-pill-clear {
      display: flex; align-items: center; padding: 0; border: none;
      background: none; cursor: pointer; color: var(--color-text-muted);
      border-radius: 50%; transition: var(--transition-fast);
    }
    .fb-pill-clear mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .fb-pill-clear:hover { color: var(--color-text); background: var(--color-border); }

    .fb-apply-btn {
      display: flex; align-items: center; gap: 4px;
      padding: 0 18px; height: 38px;
      border: none; border-radius: var(--radius-full);
      background: var(--color-primary); color: white;
      font-size: 0.82rem; font-weight: 600;
      cursor: pointer; white-space: nowrap; flex-shrink: 0;
      transition: opacity 0.15s;
    }
    .fb-apply-btn:hover { opacity: 0.9; }
    .fb-apply-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Active filter chips */
    .fb-active {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      padding-top: 8px;
      border-top: 1px dashed color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
    }
    .fb-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 6px 3px 8px;
      font-size: 0.76rem; font-weight: 500;
      border-radius: var(--radius-full);
      background: #f1f3f5; color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .fb-chip-type {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
      color: var(--color-primary);
    }
    .fb-chip-acct {
      background: color-mix(in srgb, #6366f1 8%, white);
      border-color: color-mix(in srgb, #6366f1 25%, transparent);
      color: #6366f1;
    }
    .fb-chip-source {
      background: color-mix(in srgb, #d97706 8%, white);
      border-color: color-mix(in srgb, #d97706 25%, transparent);
      color: #d97706;
    }
    .fb-chip-cat {
      background: color-mix(in srgb, #059669 8%, white);
      border-color: color-mix(in srgb, #059669 25%, transparent);
      color: #059669;
    }
    .fb-chip-icon { font-size: 14px; width: 14px; height: 14px; }
    .fb-chip-x {
      display: flex; align-items: center; padding: 0;
      border: none; background: none; cursor: pointer;
      color: inherit; opacity: 0.5; border-radius: 50%;
      transition: var(--transition-fast);
    }
    .fb-chip-x mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .fb-chip-x:hover { opacity: 1; background: color-mix(in srgb, currentColor 10%, transparent); }
    .fb-clear-all {
      border: none; background: none; cursor: pointer;
      color: var(--color-text-muted); font-size: 0.74rem; font-weight: 500;
      padding: 2px 8px; border-radius: var(--radius-sm);
      transition: var(--transition-fast);
    }
    .fb-clear-all:hover { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, white); }

    /* Category menu */
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
    .cat-selected-icon { color: var(--color-primary) !important; }
    .cat-menu-actions {
      display: flex; justify-content: flex-end;
      padding: 8px 16px; border-top: 1px solid var(--color-border);
    }
    .cat-done-btn {
      padding: 6px 20px; border-radius: var(--radius-full);
      border: none; background: var(--color-primary); color: white;
      font-size: 0.82rem; font-weight: 600; cursor: pointer;
    }
    .cat-done-btn:hover { opacity: 0.9; }

    @media (max-width: 600px) {
      .fb-primary { flex-wrap: wrap; }
      .fb-search { min-width: 100%; }
      .fb-controls { flex-wrap: wrap; }
      .fb-adv-row { flex-wrap: wrap; }
      .fb-pill-sm { width: 100px; }
      .fb-adv-tag { min-width: 100%; }
    }
  `]
})
export class ExpenseFilterBarComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private expenseService = inject(DailyExpenseService);
  private loanService = inject(LoanService);
  private creditCardService = inject(CreditCardService);
  private bankAccountService = inject(BankAccountService);
  private cdr = inject(ChangeDetectorRef);

  filterChange = output<Partial<ExpenseFilter>>();
  usedCategoryIds = input<Set<number>>(new Set());
  initialCategoryIds = input<number[]>([]);
  initialTransactionType = input<number | null>(null);
  initialToFundingSourceId = input<number | null>(null);
  initialFundingSourceId = input<number | null>(null);
  initialFundingSourceType = input<string | null>(null);

  hasInitialFilters = false;
  searchFocused = false;
  showMore = false;
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
  toFundingSourceId: number | null = null;
  fundingSourceId: number | null = null;
  fundingSourceType: string | null = null;
  debtAccounts = signal<{ id: number; name: string }[]>([]);
  sourceAccounts = signal<{ id: number; name: string; type: string }[]>([]);
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  minAmount: number | null = null;
  maxAmount: number | null = null;
  tag = '';

  private typeLabels: Record<number, { label: string; icon: string }> = {
    0: { label: 'Expense', icon: 'shopping_cart' },
    1: { label: 'Income', icon: 'trending_up' },
    2: { label: 'Transfer', icon: 'swap_horiz' },
    3: { label: 'Refund', icon: 'replay' },
    4: { label: 'Card Payment', icon: 'credit_card' },
    5: { label: 'Loan Payment', icon: 'account_balance' },
  };

  typeLabel(): string {
    return this.transactionType !== null ? this.typeLabels[this.transactionType]?.label ?? 'Type' : 'Type';
  }

  typeIcon(): string {
    return this.transactionType !== null ? this.typeLabels[this.transactionType]?.icon ?? 'list' : 'list';
  }

  accountLabel(): string {
    if (this.toFundingSourceId === null) return this.transactionType === 5 ? 'All Loans' : 'All Cards';
    const acct = this.debtAccounts().find(a => a.id === this.toFundingSourceId);
    return acct?.name ?? 'Account';
  }

  advancedFilterCount(): number {
    let c = 0;
    if (this.minAmount) c++;
    if (this.maxAmount) c++;
    if (this.tag) c++;
    return c;
  }

  clearType(): void {
    this.transactionType = null;
    this.toFundingSourceId = null;
    this.debtAccounts.set([]);
    this.loadCategories();
    this.applyFilters();
  }

  sourceLabel(): string {
    if (this.fundingSourceId === null) return 'Source';
    const src = this.sourceAccounts().find(s => s.id === this.fundingSourceId && s.type === this.fundingSourceType);
    return src?.name ?? 'Source';
  }

  selectSource(src: { id: number; name: string; type: string }): void {
    this.fundingSourceId = src.id;
    this.fundingSourceType = src.type;
    this.applyFilters();
  }

  clearSource(): void {
    this.fundingSourceId = null;
    this.fundingSourceType = null;
    this.applyFilters();
  }

  toggleCategoryItem(id: number): void {
    if (this.categoryIds.includes(id)) {
      this.categoryIds = this.categoryIds.filter(c => c !== id);
    } else {
      this.categoryIds = [...this.categoryIds, id];
    }
  }

  private checkLoaded(): void {
    this.loadCount++;
    if (this.loadCount >= 2) {
      this.loading.set(false);
    }
  }

  ngOnInit(): void {
    const initial = this.initialCategoryIds();
    if (initial.length > 0) {
      this.categoryIds = [...initial];
    }
    const initialType = this.initialTransactionType();
    if (initialType !== null) {
      this.transactionType = initialType;
      this.loadDebtAccounts(initialType);
    }
    const initialFundId = this.initialToFundingSourceId();
    if (initialFundId !== null) {
      this.toFundingSourceId = initialFundId;
    }
    const initFsId = this.initialFundingSourceId();
    const initFsType = this.initialFundingSourceType();
    if (initFsId !== null) {
      this.fundingSourceId = initFsId;
      this.fundingSourceType = initFsType;
    }
    this.hasInitialFilters = initial.length > 0 || initialType !== null || initFsId !== null;
    this.loadSourceAccounts();
    this.loadCategories();
    this.expenseService.getTags().subscribe(tags => {
      this.allTags.set(tags);
      this.filteredTags.set(tags);
      this.checkLoaded();
      this.cdr.detectChanges();
    });
  }

  private loadSourceAccounts(): void {
    this.bankAccountService.getAll().subscribe(banks => {
      const bankItems = banks.map(b => ({ id: b.id, name: b.accountName, type: 'BankAccount' }));
      this.creditCardService.getAll().subscribe(cards => {
        const cardItems = cards.map(c => ({ id: +c.id, name: c.cardName, type: 'CreditCard' }));
        this.sourceAccounts.set([...bankItems, ...cardItems]);
        this.cdr.detectChanges();
      });
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
    this.toFundingSourceId = null;
    const typeMap: Record<number, string> = { 0: 'Expense', 1: 'Income' };
    const type = this.transactionType !== null ? typeMap[this.transactionType] : undefined;
    this.loadCategories(type);
    this.loadDebtAccounts(this.transactionType);
    this.applyFilters();
  }

  private loadDebtAccounts(type: number | null): void {
    if (type === 5) {
      this.loanService.getAll().subscribe(loans => {
        this.debtAccounts.set(loans.map(l => ({ id: l.id, name: l.lenderName })));
        this.cdr.detectChanges();
      });
    } else if (type === 4) {
      this.creditCardService.getAll().subscribe(cards => {
        this.debtAccounts.set(cards.map(c => ({ id: +c.id, name: c.cardName })));
        this.cdr.detectChanges();
      });
    } else {
      this.debtAccounts.set([]);
    }
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
              this.toFundingSourceId !== null || this.fundingSourceId !== null ||
              this.selectedPeriod !== 'month' || this.minAmount || this.maxAmount || this.tag);
  }

  applyFilters(): void {
    const filter: Partial<ExpenseFilter> = {};
    if (this.search) filter.search = this.search;
    if (this.categoryIds.length > 0) filter.categoryIds = this.categoryIds;
    if (this.transactionType !== null) filter.transactionType = this.transactionType;
    if (this.toFundingSourceId !== null) filter.toFundingSourceId = this.toFundingSourceId;
    if (this.fundingSourceId !== null) filter.fundingSourceId = this.fundingSourceId;
    if (this.fundingSourceType) filter.fundingSourceType = this.fundingSourceType;
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
    this.toFundingSourceId = null;
    this.fundingSourceId = null;
    this.fundingSourceType = null;
    this.debtAccounts.set([]);
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
