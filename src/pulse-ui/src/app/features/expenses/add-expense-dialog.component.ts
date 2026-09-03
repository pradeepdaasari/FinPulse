import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DailyExpense, DailyExpenseCreate, TransactionType, FundingSourceType } from '../../core/models/daily-expense.model';
import { toLocalISOString } from '../../core/utils/date-utils';
import { Category } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';
import { DailyExpenseService } from '../../core/services/daily-expense.service';
import { FundingSourceService } from '../../core/services/funding-source.service';
import { MerchantService } from '../../core/services/merchant.service';
import { FundingSource } from '../../core/models/funding-source.model';

export interface ExpenseDialogData {
  expense: DailyExpense | null;
  prefilledCategoryId?: number;
  prefill?: Partial<DailyExpense>;
  preselectedType?: string;
}

@Component({
  selector: 'app-add-expense-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule, MatAutocompleteModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>receipt_long</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>{{ data?.expense ? 'Edit' : 'Log' }} Transaction</h2>
          <p class="dialog-subtitle">Track every dollar, build better habits</p>
        </div>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="expense-form">
        <div class="txn-icons">
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'Expense'" (click)="form.patchValue({transactionType: 'Expense'})">
            <div class="txn-circle expense"><mat-icon>remove_circle_outline</mat-icon></div>
            <span class="txn-label">Expense</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'Income'" (click)="form.patchValue({transactionType: 'Income'})">
            <div class="txn-circle income"><mat-icon>add_circle_outline</mat-icon></div>
            <span class="txn-label">Income</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'Transfer'" (click)="form.patchValue({transactionType: 'Transfer'})">
            <div class="txn-circle transfer"><mat-icon>swap_horiz</mat-icon></div>
            <span class="txn-label">Transfer</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'Refund'" (click)="form.patchValue({transactionType: 'Refund'})">
            <div class="txn-circle refund"><mat-icon>undo</mat-icon></div>
            <span class="txn-label">Refund</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 'CardPayment'" (click)="form.patchValue({transactionType: 'CardPayment'})">
            <div class="txn-circle card"><mat-icon>credit_card</mat-icon></div>
            <span class="txn-label">Card Pay</span>
          </div>
        </div>

        <div class="date-time-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline" class="time-field">
            <mat-label>Time</mat-label>
            <input matInput type="time" formControlName="time">
            <mat-icon matSuffix>schedule</mat-icon>
          </mat-form-field>
        </div>

        @if (form.value.transactionType !== 'Transfer' && form.value.transactionType !== 'CardPayment') {
          <div class="category-row">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Category</mat-label>
              <input matInput
                     [formControl]="categoryInputCtrl"
                     [matAutocomplete]="catAuto"
                     (blur)="onCategoryBlur()"
                     placeholder="Type to search...">
              <mat-icon matSuffix class="cat-arrow">arrow_drop_down</mat-icon>
              <mat-autocomplete #catAuto="matAutocomplete"
                                [displayWith]="displayCategory"
                                (optionSelected)="onCategorySelected($event)"
                                class="category-autocomplete">
                @for (parent of filteredCategories(); track parent.id; let pi = $index) {
                  <mat-optgroup [label]="parent.name">
                    @for (child of parent.children; track child.id) {
                      <mat-option [value]="child.id">
                        <span class="cat-opt">
                          <span class="cat-opt-icon" [style.background]="getCatColor(pi, 0.1)" [style.color]="getCatColor(pi, 1)">
                            <mat-icon>{{ child.icon || 'label' }}</mat-icon>
                          </span>
                          {{ child.name }}
                        </span>
                      </mat-option>
                    }
                    @if (!parent.children || parent.children.length === 0) {
                      <mat-option [value]="parent.id">
                        <span class="cat-opt">
                          <span class="cat-opt-icon" [style.background]="getCatColor(pi, 0.1)" [style.color]="getCatColor(pi, 1)">
                            <mat-icon>{{ parent.icon || 'label' }}</mat-icon>
                          </span>
                          {{ parent.name }}
                        </span>
                      </mat-option>
                    }
                  </mat-optgroup>
                }
              </mat-autocomplete>
            </mat-form-field>
            <button mat-icon-button type="button" class="add-cat-icon" (click)="showNewCategory.set(!showNewCategory())" [color]="showNewCategory() ? 'warn' : 'primary'">
              <mat-icon>{{ showNewCategory() ? 'close' : 'add' }}</mat-icon>
            </button>
          </div>

          @if (showNewCategory()) {
            <div class="new-category-row">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>New Category Name</mat-label>
                <input matInput formControlName="newCategoryName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Under</mat-label>
                <mat-select formControlName="newCategoryParent">
                  @for (parent of categories(); track parent.id) {
                    <mat-option [value]="parent.id">{{ parent.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button mat-icon-button color="primary" (click)="createCategory()" type="button">
                <mat-icon>check</mat-icon>
              </button>
            </div>
          }
        }

        <mat-form-field appearance="outline">
          <mat-label>{{ form.value.transactionType === 'Transfer' ? 'Transfer Amount' : form.value.transactionType === 'Refund' ? 'Refund Amount' : 'Amount' }}</mat-label>
          <input matInput type="number" formControlName="amount" min="0.01" step="0.01">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        @if (form.value.transactionType === 'Transfer') {
          <mat-form-field appearance="outline">
            <mat-label>From Account</mat-label>
            <mat-select formControlName="fundingSourceKey">
              @for (source of bankAccountSources(); track source.id) {
                <mat-option [value]="'BankAccount:' + source.id">
                  <mat-icon>account_balance</mat-icon>
                  {{ source.name }} ({{ source.currentBalance | currency }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>To Account</mat-label>
            <mat-select formControlName="toFundingSourceKey">
              @for (source of toAccountSources(); track source.id) {
                <mat-option [value]="'BankAccount:' + source.id">
                  <mat-icon>account_balance</mat-icon>
                  {{ source.name }} ({{ source.currentBalance | currency }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        } @else if (form.value.transactionType === 'CardPayment') {
          <mat-form-field appearance="outline">
            <mat-label>From Account</mat-label>
            <mat-select formControlName="fundingSourceKey">
              @for (source of bankAccountSources(); track source.id) {
                <mat-option [value]="'BankAccount:' + source.id">
                  <mat-icon>account_balance</mat-icon>
                  {{ source.name }} ({{ source.currentBalance | currency }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Pay Card</mat-label>
            <mat-select formControlName="toFundingSourceKey">
              @for (source of creditCardSources(); track source.id) {
                <mat-option [value]="'CreditCard:' + source.id">
                  <mat-icon>credit_card</mat-icon>
                  {{ source.name }} ({{ source.currentBalance | currency }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        } @else {
          <mat-form-field appearance="outline">
            <mat-label>{{ form.value.transactionType === 'Income' ? 'Received into' : form.value.transactionType === 'Refund' ? 'Refunded to' : 'Paid with' }}</mat-label>
            <mat-select formControlName="fundingSourceKey">
              @for (source of filteredSources(); track source.type + source.id) {
                <mat-option [value]="source.type + ':' + source.id">
                  <mat-icon>{{ source.type === 'BankAccount' ? 'account_balance' : 'credit_card' }}</mat-icon>
                  {{ source.name }} ({{ source.currentBalance | currency }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        @if (form.value.transactionType !== 'Transfer' && form.value.transactionType !== 'CardPayment') {
          <mat-form-field appearance="outline">
            <mat-label>Merchant (optional)</mat-label>
            <input matInput formControlName="merchant" [matAutocomplete]="merchantAuto" (input)="filterMerchants($event)" placeholder="e.g. Walmart, Shell, Chipotle">
            <mat-autocomplete #merchantAuto="matAutocomplete">
              @for (merchant of filteredMerchants(); track merchant) {
                <mat-option [value]="merchant">{{ merchant }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" [matAutocomplete]="descAuto"
                 (input)="onDescriptionInput()" placeholder="{{ form.value.transactionType === 'Transfer' ? 'e.g. Fund brokerage account' : 'What was this for?' }}">
          <mat-autocomplete #descAuto="matAutocomplete">
            @for (desc of filteredDescriptions(); track desc) {
              <mat-option [value]="desc">{{ desc }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tag (optional)</mat-label>
          <input matInput formControlName="tag" [matAutocomplete]="tagAutoDialog"
                 placeholder="e.g. Hawaii 2026" (input)="onTagDialogInput()">
          <mat-icon matPrefix>label</mat-icon>
          <mat-autocomplete #tagAutoDialog="matAutocomplete">
            @for (t of filteredTagOptions(); track t) {
              <mat-option [value]="t">{{ t }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tag Type (optional)</mat-label>
          <mat-select formControlName="tagType" (opened)="tagTypeSearch.set('')">
            <div class="category-search-box">
              <mat-icon>search</mat-icon>
              <input matInput placeholder="Search tag types..." (input)="tagTypeSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
            </div>
            <mat-option [value]="''">-- None --</mat-option>
            @for (tt of filteredTagTypes(); track tt) {
              <mat-option [value]="tt">{{ tt }}</mat-option>
            }
            <mat-option value="__other__">+ New tag type...</mat-option>
          </mat-select>
          <mat-icon matPrefix>category</mat-icon>
        </mat-form-field>
        @if (form.value.tagType === '__other__') {
          <mat-form-field appearance="outline">
            <mat-label>New Tag Type</mat-label>
            <input matInput formControlName="customTagType" placeholder="Enter new tag type" (input)="customTagTypeValue.set($any($event.target).value)">
            <mat-icon matPrefix>edit</mat-icon>
            @if (isTagTypeDuplicate()) {
              <mat-hint class="warn-hint">This tag type already exists — select it from the dropdown instead.</mat-hint>
            }
          </mat-form-field>
        }
      </form>
    @if (splitMode()) {
      <div class="split-section">
        <div class="split-header">
          <span class="split-title">Split across categories</span>
          <span class="split-total" [class.split-valid]="splitTotalValid()" [class.split-invalid]="!splitTotalValid()">
            Total: {{ splitTotal() | currency }} / {{ form.value.amount | currency }}
          </span>
        </div>
        @for (row of splitRows.controls; track $index) {
          <div class="split-row" [formGroup]="$any(row)">
            <mat-form-field appearance="outline" class="split-cat">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
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
            <mat-form-field appearance="outline" class="split-amt">
              <mat-label>Amount</mat-label>
              <input matInput type="number" formControlName="amount" min="0.01" step="0.01">
              <span matTextPrefix>$&nbsp;</span>
            </mat-form-field>
            <button mat-icon-button color="warn" (click)="removeSplitRow($index)" type="button" [disabled]="splitRows.length <= 2">
              <mat-icon>remove_circle</mat-icon>
            </button>
          </div>
        }
        <button mat-button type="button" (click)="addSplitRow()">
          <mat-icon>add</mat-icon> Add Row
        </button>
      </div>
    }
    }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      @if (!data?.expense && form.value.transactionType === 'Expense' && !splitMode()) {
        <button mat-button class="split-btn" (click)="enableSplit()" type="button">
          <mat-icon>call_split</mat-icon> Split
        </button>
      }
      @if (splitMode()) {
        <button mat-button (click)="splitMode.set(false)" type="button">Cancel Split</button>
      }
      <span class="action-spacer"></span>
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button color="primary" class="save-btn" (click)="save()" [disabled]="form.invalid || loading() || (splitMode() && !splitTotalValid())">
        <mat-icon>{{ data?.expense ? 'check' : 'save' }}</mat-icon>
        {{ data?.expense ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    .dialog-banner {
      position: relative;
      margin: -24px -24px 12px;
      padding: 16px 24px 14px;
      background: var(--gradient-primary);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .dialog-header-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
      flex-shrink: 0;
    }
    .dialog-header-icon mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #fff;
    }
    h2[mat-dialog-title] {
      margin: 0 !important;
      padding: 0 !important;
      font-size: 1rem !important;
      font-weight: 700 !important;
      letter-spacing: var(--tracking-tight);
      color: #fff !important;
    }
    .dialog-subtitle {
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.72rem;
      margin: 2px 0 0;
    }
    .expense-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      width: 100%;
    }
    .txn-icons {
      display: flex; justify-content: space-between;
      gap: 4px; margin-bottom: 8px;
    }
    .txn-icon-item {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      cursor: pointer; flex: 1; min-width: 0;
    }
    .txn-circle {
      width: 40px; height: 40px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-surface-secondary);
      transition: all 0.2s ease;
    }
    .txn-circle mat-icon { font-size: 19px; width: 19px; height: 19px; color: var(--color-text-secondary); }
    .txn-label {
      font-size: 0.62rem; font-weight: 600; color: var(--color-text-secondary);
      text-align: center; white-space: nowrap; transition: color 0.2s ease;
    }
    .txn-icon-item.active .txn-circle.expense {
      background: var(--color-stat-red-bg);
      box-shadow: 0 2px 8px rgba(255, 59, 48, 0.15);
    }
    .txn-icon-item.active .txn-circle.expense mat-icon { color: var(--color-danger); }
    .txn-icon-item.active .txn-circle.income {
      background: var(--color-stat-green-bg);
      box-shadow: 0 2px 8px rgba(52, 199, 89, 0.15);
    }
    .txn-icon-item.active .txn-circle.income mat-icon { color: var(--color-success); }
    .txn-icon-item.active .txn-circle.transfer {
      background: var(--color-stat-blue-bg);
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
    }
    .txn-icon-item.active .txn-circle.transfer mat-icon { color: var(--color-primary); }
    .txn-icon-item.active .txn-circle.refund {
      background: var(--color-stat-amber-bg);
      box-shadow: 0 2px 8px rgba(255, 149, 0, 0.15);
    }
    .txn-icon-item.active .txn-circle.refund mat-icon { color: var(--color-warning); }
    .txn-icon-item.active .txn-circle.card {
      background: var(--color-stat-purple-bg);
      box-shadow: 0 2px 8px rgba(175, 82, 222, 0.15);
    }
    .txn-icon-item.active .txn-circle.card mat-icon { color: var(--color-stat-purple); }
    .txn-icon-item.active .txn-label { color: var(--color-text-primary); font-weight: 700; }
    .category-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .add-cat-icon {
      margin-top: -8px;
    }
    .new-category-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .flex-1 { flex: 1; }
    .date-time-row { display: flex; gap: 10px; align-items: start; }
    .time-field { width: 130px; min-width: 110px; }
    .cat-arrow { color: var(--color-text-muted); cursor: pointer; }
    ::ng-deep .category-autocomplete .mat-mdc-option .mdc-list-item__primary-text {
      width: 100%;
    }
    .cat-opt {
      display: flex; align-items: center; gap: 10px;
      width: 100%;
    }
    .cat-opt-icon {
      width: 30px; height: 30px; border-radius: 8px;
      display: inline-flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      text-align: center;
    }
    .cat-opt-icon mat-icon {
      font-size: 17px; width: 17px; height: 17px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto;
    }
    .category-search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      background: var(--color-surface);
      z-index: 100;
    }
    .category-search-box mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    .category-search-box input { border: none; outline: none; flex: 1; font-size: 0.875rem; background: transparent; color: inherit; }
    .warn-hint { color: var(--color-warning) !important; }
    .split-section {
      border-top: 1px solid var(--color-border);
      padding-top: 14px;
      margin-top: 10px;
    }
    .split-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .split-title {
      font-weight: 600;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .split-total {
      font-size: 0.85rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-full);
    }
    .split-valid {
      color: var(--color-success);
      background: var(--color-stat-green-bg);
    }
    .split-invalid {
      color: var(--color-danger);
      background: var(--color-stat-red-bg);
    }
    .split-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .split-cat { flex: 2; }
    .split-amt { flex: 1; }

    /* Dialog Actions */
    .dialog-actions {
      padding: 12px 24px 16px !important;
      border-top: 1px solid var(--color-border);
      gap: 8px;
    }
    .action-spacer { flex: 1; }
    .split-btn {
      color: var(--color-stat-purple) !important;
      font-weight: 600 !important;
    }
    .split-btn mat-icon {
      font-size: 18px; width: 18px; height: 18px;
    }
    .cancel-btn {
      font-weight: 500 !important;
    }
    .save-btn {
      border-radius: var(--radius-sm) !important;
      padding: 0 20px !important;
      font-weight: 600 !important;
      letter-spacing: 0.02em;
    }
    .save-btn mat-icon {
      font-size: 18px; width: 18px; height: 18px; margin-right: 4px;
    }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    @media (max-width: 599px) {
      .dialog-banner { margin: -16px -16px 12px; padding: 14px 16px 12px; }
      .date-time-row { flex-wrap: wrap; }
      .time-field { width: 100%; min-width: 0; }
      .split-row { flex-wrap: wrap; }
    }
  `]
})
export class AddExpenseDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddExpenseDialogComponent>);
  private categoryService = inject(CategoryService);
  private expenseService = inject(DailyExpenseService);
  private fundingSourceService = inject(FundingSourceService);
  private merchantService = inject(MerchantService);
  data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);

  loading = signal(true);
  private loadCount = 0;
  categories = signal<Category[]>([]);
  categorySearch = signal('');
  categoryInputCtrl = new FormControl('');

  displayCategory = (value: any): string => {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value;
    for (const parent of this.categories()) {
      if (parent.id === value) return parent.name;
      for (const child of (parent.children || [])) {
        if (child.id === value) return child.name;
      }
    }
    return '';
  };

  onCategorySelected(event: any): void {
    this.form.patchValue({ categoryId: event.option.value });
    this.categorySearch.set('');
  }

  private catColorPalette = [
    '#1565c0', '#2e7d32', '#e65100', '#7b1fa2', '#00838f',
    '#c62828', '#4527a0', '#00695c', '#bf360c', '#283593'
  ];
  private catColorCache = new Map<number, string>();

  getCatColor(parentIndex: number, alpha: number): string {
    const parents = this.filteredCategories();
    const parent = parents[parentIndex];
    if (!parent) return alpha === 1 ? '#757575' : 'rgba(117,117,117,0.1)';
    if (!this.catColorCache.has(parent.id)) {
      let hash = 0;
      for (let i = 0; i < parent.name.length; i++) {
        hash = ((hash << 5) - hash) + parent.name.charCodeAt(i);
        hash |= 0;
      }
      this.catColorCache.set(parent.id, this.catColorPalette[Math.abs(hash) % this.catColorPalette.length]);
    }
    const hex = this.catColorCache.get(parent.id)!;
    if (alpha === 1) return hex;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  onCategoryBlur(): void {
    const currentId = this.form.value.categoryId;
    setTimeout(() => {
      if (currentId) {
        this.categoryInputCtrl.setValue(currentId as any, { emitEvent: false });
      } else {
        this.categoryInputCtrl.setValue('', { emitEvent: false });
      }
      this.categorySearch.set('');
    }, 200);
  }
  filteredCategories = computed(() => {
    const q = this.categorySearch().toLowerCase();
    if (!q) return this.categories();
    return this.categories()
      .map(parent => {
        const matchedChildren = (parent.children || []).filter(c => c.name.toLowerCase().includes(q));
        if (parent.name.toLowerCase().includes(q)) return parent;
        if (matchedChildren.length > 0) return { ...parent, children: matchedChildren };
        return null;
      })
      .filter(Boolean) as Category[];
  });
  allSources = signal<FundingSource[]>([]);
  filteredSources = signal<FundingSource[]>([]);
  bankAccountSources = signal<FundingSource[]>([]);
  creditCardSources = signal<FundingSource[]>([]);
  toAccountSources = signal<FundingSource[]>([]);
  showNewCategory = signal(false);
  allTagOptions = signal<string[]>([]);
  filteredTagOptions = signal<string[]>([]);
  tagTypes = signal<string[]>([]);
  tagTypeSearch = signal('');
  filteredTagTypes = computed(() => {
    const q = this.tagTypeSearch().toLowerCase();
    return q ? this.tagTypes().filter(t => t.toLowerCase().includes(q)) : this.tagTypes();
  });
  customTagTypeValue = signal('');
  isTagTypeDuplicate = computed(() => {
    const custom = this.customTagTypeValue().toLowerCase().trim();
    return custom.length > 0 && this.tagTypes().some(t => t.toLowerCase() === custom);
  });
  filteredDescriptions = signal<string[]>([]);
  private allDescriptions = signal<string[]>([]);
  filteredMerchants = signal<string[]>([]);
  splitMode = signal(false);
  splitRows = this.fb.array<FormGroup>([]);
  splitTotal = signal(0);

  splitTotalValid(): boolean {
    const total = this.form.value.amount;
    return !!total && Math.abs(this.splitTotal() - total) < 0.01;
  }

  onTagDialogInput(): void {
    const q = (this.form.value.tag || '').toLowerCase();
    this.filteredTagOptions.set(this.allTagOptions().filter(t => t.toLowerCase().includes(q)));
  }

  filterMerchants(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filteredMerchants.set(this.merchantService.filter(value));
  }

  onDescriptionInput(): void {
    const q = (this.form.value.description || '').toLowerCase();
    if (!q) {
      this.filteredDescriptions.set(this.allDescriptions().slice(0, 10));
    } else {
      this.filteredDescriptions.set(this.allDescriptions().filter(d => d.toLowerCase().includes(q)).slice(0, 8));
    }
  }

  enableSplit(): void {
    this.splitMode.set(true);
    this.splitRows.clear();
    this.addSplitRow();
    this.addSplitRow();
  }

  addSplitRow(): void {
    this.splitRows.push(this.fb.group({
      categoryId: [null as number | null, Validators.required],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]]
    }) as any);
  }

  removeSplitRow(index: number): void {
    this.splitRows.removeAt(index);
    this.updateSplitTotal();
  }

  private updateSplitTotal(): void {
    const total = this.splitRows.controls.reduce((sum, row) => sum + ((row as FormGroup).value.amount || 0), 0);
    this.splitTotal.set(total);
  }

  private get source() { return this.data?.expense ?? this.data?.prefill ?? null; }

  private getTimeInUserTz(d: Date): string {
    const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    const hh = parts.find(p => p.type === 'hour')!.value.padStart(2, '0');
    const mm = parts.find(p => p.type === 'minute')!.value.padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private getDateInUserTz(d: Date): Date {
    const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    const year = +parts.find(p => p.type === 'year')!.value;
    const month = +parts.find(p => p.type === 'month')!.value - 1;
    const day = +parts.find(p => p.type === 'day')!.value;
    return new Date(year, month, day);
  }

  form = this.fb.group({
    transactionType: [(this.data?.preselectedType ?? this.source?.transactionType ?? 'Expense') as TransactionType, Validators.required],
    date: [this.data?.expense ? this.getDateInUserTz(new Date(this.data.expense.date)) : this.getDateInUserTz(new Date()), Validators.required],
    time: [this.data?.expense ? this.getTimeInUserTz(new Date(this.data.expense.date)) : this.getTimeInUserTz(new Date()), Validators.required],
    categoryId: [this.source?.categoryId ?? this.data?.prefilledCategoryId ?? null as number | null],
    amount: [this.source?.amount ?? null as number | null, [Validators.required, Validators.min(0.01)]],
    merchant: [this.source?.merchant ?? ''],
    description: [this.source?.description ?? '', [Validators.required, Validators.maxLength(500)]],
    fundingSourceKey: [this.buildSourceKey(this.source as DailyExpense | null) as string | null, Validators.required],
    toFundingSourceKey: [this.buildToSourceKey(this.source as DailyExpense | null) as string | null],
    tag: [this.source?.tag ?? ''],
    tagType: [this.source?.tagType ?? ''],
    customTagType: [''],
    newCategoryName: [''],
    newCategoryParent: [null as number | null]
  });

  private checkLoaded(): void {
    this.loadCount++;
    if (this.loadCount >= 3) {
      this.loading.set(false);
    }
  }

  ngOnInit(): void {
    this.categoryInputCtrl.valueChanges.subscribe(val => {
      if (typeof val === 'string') {
        this.categorySearch.set(val);
      }
    });

    this.loadCategories();
    this.fundingSourceService.getAll().subscribe(sources => {
      this.allSources.set(sources);
      this.filterSources();
      this.checkLoaded();
    });
    this.expenseService.getTags().subscribe(tags => {
      this.allTagOptions.set(tags);
      this.filteredTagOptions.set(tags);
      this.checkLoaded();
    });
    this.expenseService.getTagTypes().subscribe(types => { this.tagTypes.set(types); this.checkLoaded(); });
    this.merchantService.getMerchants().subscribe(merchants => {
      this.filteredMerchants.set(merchants.slice(0, 10));
    });
    this.expenseService.getDescriptions().subscribe(descs => {
      this.allDescriptions.set(descs);
      this.filteredDescriptions.set(descs.slice(0, 10));
    });

    this.form.get('transactionType')!.valueChanges.subscribe(() => {
      this.form.patchValue({ categoryId: null });
      this.categoryInputCtrl.setValue('', { emitEvent: false });
      this.loadCategories();
      this.filterSources();
    });

    this.form.get('fundingSourceKey')!.valueChanges.subscribe(() => {
      this.updateToAccounts();
    });

    this.splitRows.valueChanges.subscribe(() => this.updateSplitTotal());
  }

  private loadCategories(): void {
    const type = this.form.value.transactionType === 'Income' ? 'Income' : 'Expense';
    this.categoryService.getAll(type).subscribe(cats => {
      this.categories.set(cats);
      const currentId = this.form.value.categoryId;
      if (currentId) {
        this.categoryInputCtrl.setValue(currentId as any, { emitEvent: false });
      }
    });
  }

  private filterSources(): void {
    const txnType = this.form.value.transactionType;
    const banks = this.allSources().filter(s => s.type === 'BankAccount');
    const cards = this.allSources().filter(s => s.type === 'CreditCard');
    this.bankAccountSources.set(banks);
    this.creditCardSources.set(cards);
    this.updateToAccounts();

    if (txnType === 'Income') {
      this.filteredSources.set(banks);
    } else {
      this.filteredSources.set(this.allSources());
    }
  }

  private updateToAccounts(): void {
    const fromKey = this.form.value.fundingSourceKey;
    let fromId: number | null = null;
    if (fromKey) {
      const parts = fromKey.split(':');
      fromId = parseInt(parts[1], 10);
    }
    this.toAccountSources.set(this.bankAccountSources().filter(s => s.id !== fromId));
  }

  private buildSourceKey(expense: DailyExpense | null | undefined): string | null {
    if (!expense?.fundingSourceType || !expense?.fundingSourceId) return null;
    return `${expense.fundingSourceType}:${expense.fundingSourceId}`;
  }

  private buildToSourceKey(expense: DailyExpense | null | undefined): string | null {
    if (!expense?.toFundingSourceId) return null;
    return `BankAccount:${expense.toFundingSourceId}`;
  }

  createCategory(): void {
    const name = this.form.value.newCategoryName?.trim();
    const parentId = this.form.value.newCategoryParent;
    if (!name) return;

    const type = this.form.value.transactionType === 'Income' ? 'Income' : 'Expense';
    this.categoryService.create({ name, isFixed: false, type, parentId: parentId ?? null })
      .subscribe(created => {
        this.loadCategories();
        this.form.patchValue({ categoryId: created.id, newCategoryName: '' });
        this.categoryInputCtrl.setValue(created.id as any, { emitEvent: false });
        this.showNewCategory.set(false);
      });
  }

  private buildDateTime(): Date {
    const val = this.form.value;
    const tz = localStorage.getItem('pulse_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const d = val.date instanceof Date ? val.date : new Date(val.date!);
    const [hh, mm] = (val.time || '00:00').split(':').map(Number);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(hh).padStart(2, '0');
    const minutes = String(mm).padStart(2, '0');
    // Interpret entered date+time as wall-clock time in user's timezone
    const naiveUtc = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);
    const tzParts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(naiveUtc);
    const tzDate = new Date(Date.UTC(
      +tzParts.find(p => p.type === 'year')!.value,
      +tzParts.find(p => p.type === 'month')!.value - 1,
      +tzParts.find(p => p.type === 'day')!.value,
      +tzParts.find(p => p.type === 'hour')!.value,
      +tzParts.find(p => p.type === 'minute')!.value,
      +tzParts.find(p => p.type === 'second')!.value
    ));
    const offsetMs = naiveUtc.getTime() - tzDate.getTime();
    return new Date(naiveUtc.getTime() + offsetMs);
  }

  save(): void {
    const val = this.form.value;
    const isTransfer = val.transactionType === 'Transfer';
    const isCardPayment = val.transactionType === 'CardPayment';

    if (!isTransfer && !isCardPayment && !val.categoryId) return;
    if (!val.amount || !val.description) return;
    if ((isTransfer || isCardPayment) && (!val.fundingSourceKey || !val.toFundingSourceKey)) return;

    let fundingSourceType: FundingSourceType | null = null;
    let fundingSourceId: number | null = null;
    let toFundingSourceId: number | null = null;

    if (val.fundingSourceKey) {
      const [type, id] = val.fundingSourceKey.split(':');
      fundingSourceType = type as FundingSourceType;
      fundingSourceId = parseInt(id, 10);
    }

    if (isTransfer && val.toFundingSourceKey) {
      const [, id] = val.toFundingSourceKey.split(':');
      toFundingSourceId = parseInt(id, 10);
      fundingSourceType = 'BankAccount';
    }

    if (isCardPayment && val.toFundingSourceKey) {
      const [, id] = val.toFundingSourceKey.split(':');
      toFundingSourceId = parseInt(id, 10);
      fundingSourceType = 'BankAccount';
    }

    const resolvedTagType = val.tagType === '__other__' ? (val.customTagType || null) : (val.tagType || null);

    if (this.splitMode()) {
      const splits: DailyExpenseCreate[] = this.splitRows.controls.map(ctrl => {
        const row = (ctrl as FormGroup).value;
        return {
          date: toLocalISOString(this.buildDateTime()),
          categoryId: row.categoryId!,
          amount: row.amount!,
          merchant: val.merchant || null,
          description: val.description!,
          transactionType: 'Expense' as TransactionType,
          fundingSourceType,
          fundingSourceId,
          toFundingSourceId: null,
          tag: val.tag || null,
          tagType: val.tag ? resolvedTagType : null
        };
      });
      this.dialogRef.close({ splits });
      return;
    }

    const expense: DailyExpenseCreate = {
      date: toLocalISOString(this.buildDateTime()),
      categoryId: val.categoryId || null,
      amount: val.amount!,
      merchant: (isTransfer || isCardPayment) ? null : (val.merchant || null),
      description: val.description!,
      transactionType: val.transactionType as TransactionType,
      fundingSourceType,
      fundingSourceId,
      toFundingSourceId,
      tag: val.tag || null,
      tagType: val.tag ? resolvedTagType : null
    };
    this.dialogRef.close(expense);
  }
}
