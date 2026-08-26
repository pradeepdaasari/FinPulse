import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DailyExpense, DailyExpenseCreate, TransactionType, FundingSourceType } from '../../core/models/daily-expense.model';
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
    MatButtonModule, MatIconModule, MatButtonToggleModule, MatAutocompleteModule
  ],
  template: `
    <div class="dialog-header">
      <div class="dialog-header-icon">
        <mat-icon>receipt_long</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ data?.expense ? 'Edit' : 'Log' }} Transaction</h2>
      <p class="dialog-subtitle">Track every dollar, build better habits</p>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="expense-form">
        <mat-button-toggle-group formControlName="transactionType" class="txn-toggle">
          <mat-button-toggle value="Expense" class="toggle-expense"><mat-icon>remove_circle_outline</mat-icon>Expense</mat-button-toggle>
          <mat-button-toggle value="Income" class="toggle-income"><mat-icon>add_circle_outline</mat-icon>Income</mat-button-toggle>
          <mat-button-toggle value="Transfer" class="toggle-transfer"><mat-icon>swap_horiz</mat-icon>Transfer</mat-button-toggle>
          <mat-button-toggle value="Refund" class="toggle-refund"><mat-icon>undo</mat-icon>Refund</mat-button-toggle>
          <mat-button-toggle value="CardPayment" class="toggle-card"><mat-icon>credit_card</mat-icon>Card Pay</mat-button-toggle>
        </mat-button-toggle-group>

        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        @if (form.value.transactionType !== 'Transfer' && form.value.transactionType !== 'CardPayment') {
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId" (opened)="categorySearch.set('')">
              <div class="category-search-box">
                <mat-icon>search</mat-icon>
                <input matInput placeholder="Search categories..." (input)="categorySearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
              </div>
              @for (parent of filteredCategories(); track parent.id) {
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
              <button mat-icon-button (click)="showNewCategory.set(false)" type="button">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          } @else {
            <button mat-button type="button" (click)="showNewCategory.set(true)" class="add-cat-btn">
              <mat-icon>add</mat-icon> New Category
            </button>
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
          <input matInput formControlName="description" placeholder="{{ form.value.transactionType === 'Transfer' ? 'e.g. Fund brokerage account' : 'What was this for?' }}">
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
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (!data?.expense && form.value.transactionType === 'Expense' && !splitMode()) {
        <button mat-button (click)="enableSplit()" type="button">
          <mat-icon>call_split</mat-icon> Split
        </button>
      }
      @if (splitMode()) {
        <button mat-button (click)="splitMode.set(false)" type="button">Cancel Split</button>
      }
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || (splitMode() && !splitTotalValid())">
        {{ data?.expense ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    .dialog-header {
      text-align: center;
      padding: 4px 0 10px;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 12px;
    }
    .dialog-header-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(0, 122, 255, 0.12) 0%, rgba(88, 86, 214, 0.12) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
    }
    .dialog-header-icon mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: var(--color-primary);
    }
    h2[mat-dialog-title] {
      margin: 0 !important;
      padding: 0 !important;
      font-size: var(--text-lg) !important;
      font-weight: 700 !important;
    }
    .dialog-subtitle {
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      margin: 2px 0 0;
    }
    .expense-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      width: 100%;
    }
    .txn-toggle {
      margin-bottom: 8px;
      width: 100%;
      border-radius: var(--radius-md) !important;
      background: var(--color-surface-secondary) !important;
      border: none !important;
      padding: 5px !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch;
    }
    .txn-toggle .mat-button-toggle-appearance-standard .mat-button-toggle-label-content {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px !important;
      font-size: 0.9rem !important;
      font-weight: 600 !important;
      line-height: 1.2 !important;
    }
    .txn-toggle mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .txn-toggle .mat-button-toggle-appearance-standard {
      border-radius: var(--radius-sm) !important;
      border: none !important;
      transition: all 0.15s ease;
    }
    .txn-toggle .mat-button-toggle-checked.toggle-expense {
      background: rgba(255, 59, 48, 0.12) !important;
      color: #d32f2f !important;
    }
    .txn-toggle .mat-button-toggle-checked.toggle-income {
      background: rgba(48, 209, 88, 0.12) !important;
      color: #2e7d32 !important;
    }
    .txn-toggle .mat-button-toggle-checked.toggle-transfer {
      background: rgba(0, 122, 255, 0.12) !important;
      color: #1565c0 !important;
    }
    .txn-toggle .mat-button-toggle-checked.toggle-refund {
      background: rgba(255, 159, 10, 0.12) !important;
      color: #e65100 !important;
    }
    .txn-toggle .mat-button-toggle-checked.toggle-card {
      background: rgba(191, 90, 242, 0.12) !important;
      color: #7b1fa2 !important;
    }
    .new-category-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .flex-1 { flex: 1; }
    .add-cat-btn { align-self: flex-start; }
    .category-search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      background: var(--color-surface);
      z-index: 1;
    }
    .category-search-box mat-icon { font-size: 20px; width: 20px; height: 20px; opacity: 0.6; }
    .category-search-box input { border: none; outline: none; flex: 1; font-size: 0.875rem; background: transparent; color: inherit; }
    .warn-hint { color: #e65100 !important; }
    .split-section { border-top: 1px solid var(--color-border); padding-top: 12px; margin-top: 8px; }
    .split-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .split-title { font-weight: 500; font-size: 0.9rem; }
    .split-total { font-size: 0.85rem; font-weight: 600; }
    .split-valid { color: var(--color-success); }
    .split-invalid { color: var(--color-danger); }
    .split-row { display: flex; gap: 8px; align-items: center; }
    .split-cat { flex: 2; }
    .split-amt { flex: 1; }
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

  categories = signal<Category[]>([]);
  categorySearch = signal('');
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

  form = this.fb.group({
    transactionType: [(this.data?.preselectedType ?? this.source?.transactionType ?? 'Expense') as TransactionType, Validators.required],
    date: [this.data?.expense ? new Date(this.data.expense.date) : new Date(), Validators.required],
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

  ngOnInit(): void {
    this.loadCategories();
    this.fundingSourceService.getAll().subscribe(sources => {
      this.allSources.set(sources);
      this.filterSources();
    });
    this.expenseService.getTags().subscribe(tags => {
      this.allTagOptions.set(tags);
      this.filteredTagOptions.set(tags);
    });
    this.expenseService.getTagTypes().subscribe(types => this.tagTypes.set(types));
    this.merchantService.getMerchants().subscribe(merchants => {
      this.filteredMerchants.set(merchants.slice(0, 10));
    });

    this.form.get('transactionType')!.valueChanges.subscribe(() => {
      this.form.patchValue({ categoryId: null });
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
        this.showNewCategory.set(false);
      });
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
          date: (val.date as Date).toISOString(),
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
      date: (val.date as Date).toISOString(),
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
