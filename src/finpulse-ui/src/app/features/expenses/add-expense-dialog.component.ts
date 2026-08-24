import { Component, inject, OnInit, signal } from '@angular/core';
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
import { FundingSource } from '../../core/models/funding-source.model';

export interface ExpenseDialogData {
  expense: DailyExpense | null;
  prefilledCategoryId?: number;
  prefill?: Partial<DailyExpense>;
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
    <h2 mat-dialog-title>{{ data?.expense ? 'Edit' : 'Log' }} Transaction</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="expense-form">
        <mat-button-toggle-group formControlName="transactionType" class="txn-toggle">
          <mat-button-toggle value="Expense">
            <mat-icon>trending_down</mat-icon> Expense
          </mat-button-toggle>
          <mat-button-toggle value="Income">
            <mat-icon>trending_up</mat-icon> Income
          </mat-button-toggle>
          <mat-button-toggle value="Transfer">
            <mat-icon>swap_horiz</mat-icon> Transfer
          </mat-button-toggle>
          <mat-button-toggle value="Refund">
            <mat-icon>undo</mat-icon> Refund
          </mat-button-toggle>
          <mat-button-toggle value="CardPayment">
            <mat-icon>credit_card_off</mat-icon> Pay Card
          </mat-button-toggle>
        </mat-button-toggle-group>

        <mat-form-field>
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        @if (form.value.transactionType !== 'Transfer' && form.value.transactionType !== 'CardPayment') {
          <mat-form-field>
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

          @if (showNewCategory()) {
            <div class="new-category-row">
              <mat-form-field class="flex-1">
                <mat-label>New Category Name</mat-label>
                <input matInput formControlName="newCategoryName">
              </mat-form-field>
              <mat-form-field>
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

        <mat-form-field>
          <mat-label>{{ form.value.transactionType === 'Transfer' ? 'Transfer Amount' : form.value.transactionType === 'Refund' ? 'Refund Amount' : 'Amount' }}</mat-label>
          <input matInput type="number" formControlName="amount" min="0.01" step="0.01">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        @if (form.value.transactionType === 'Transfer') {
          <mat-form-field>
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

          <mat-form-field>
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
          <mat-form-field>
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

          <mat-form-field>
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
          <mat-form-field>
            <mat-label>{{ form.value.transactionType === 'Income' ? 'Received into' : form.value.transactionType === 'Refund' ? 'Refunded to' : 'Paid with' }}</mat-label>
            <mat-select formControlName="fundingSourceKey">
              <mat-option [value]="null">-- None --</mat-option>
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
          <mat-form-field>
            <mat-label>Merchant (optional)</mat-label>
            <input matInput formControlName="merchant" placeholder="e.g. Walmart, Shell, Chipotle">
          </mat-form-field>
        }

        <mat-form-field>
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" placeholder="{{ form.value.transactionType === 'Transfer' ? 'e.g. Fund brokerage account' : 'What was this for?' }}">
        </mat-form-field>

        <mat-form-field>
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

        <mat-form-field>
          <mat-label>Tag Type (optional)</mat-label>
          <mat-select formControlName="tagType">
            <mat-option [value]="''">-- None --</mat-option>
            <mat-option value="Trip">Trip / Vacation</mat-option>
            <mat-option value="Project">Project</mat-option>
            <mat-option value="Event">Event</mat-option>
            <mat-option value="Business">Business</mat-option>
            <mat-option value="Other">Other</mat-option>
          </mat-select>
          <mat-icon matPrefix>category</mat-icon>
        </mat-form-field>
      </form>
    </mat-dialog-content>
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
            <mat-form-field class="split-cat">
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
            <mat-form-field class="split-amt">
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
    .expense-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 320px;
    }
    .txn-toggle {
      margin-bottom: 12px;
      width: 100%;
    }
    .txn-toggle mat-button-toggle { flex: 1; }
    .new-category-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .flex-1 { flex: 1; }
    .add-cat-btn { align-self: flex-start; }
    .split-section { border-top: 1px solid rgba(0,0,0,0.12); padding-top: 12px; margin-top: 8px; }
    .split-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .split-title { font-weight: 500; font-size: 0.9rem; }
    .split-total { font-size: 0.85rem; font-weight: 600; }
    .split-valid { color: #2e7d32; }
    .split-invalid { color: #c62828; }
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
  data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);

  categories = signal<Category[]>([]);
  allSources = signal<FundingSource[]>([]);
  filteredSources = signal<FundingSource[]>([]);
  bankAccountSources = signal<FundingSource[]>([]);
  creditCardSources = signal<FundingSource[]>([]);
  toAccountSources = signal<FundingSource[]>([]);
  showNewCategory = signal(false);
  allTagOptions = signal<string[]>([]);
  filteredTagOptions = signal<string[]>([]);
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
    transactionType: [(this.source?.transactionType ?? 'Expense') as TransactionType, Validators.required],
    date: [this.data?.expense ? new Date(this.data.expense.date) : new Date(), Validators.required],
    categoryId: [this.source?.categoryId ?? this.data?.prefilledCategoryId ?? null as number | null],
    amount: [this.source?.amount ?? null as number | null, [Validators.required, Validators.min(0.01)]],
    merchant: [this.source?.merchant ?? ''],
    description: [this.source?.description ?? '', [Validators.required, Validators.maxLength(500)]],
    fundingSourceKey: [this.buildSourceKey(this.source as DailyExpense | null) as string | null],
    toFundingSourceKey: [this.buildToSourceKey(this.source as DailyExpense | null) as string | null],
    tag: [this.source?.tag ?? ''],
    tagType: [this.source?.tagType ?? ''],
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

    this.form.get('transactionType')!.valueChanges.subscribe(() => {
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
          tagType: val.tag ? (val.tagType || null) : null
        };
      });
      this.dialogRef.close({ splits });
      return;
    }

    const expense: DailyExpenseCreate = {
      date: (val.date as Date).toISOString(),
      categoryId: val.categoryId ?? 1,
      amount: val.amount!,
      merchant: (isTransfer || isCardPayment) ? null : (val.merchant || null),
      description: val.description!,
      transactionType: val.transactionType as TransactionType,
      fundingSourceType,
      fundingSourceId,
      toFundingSourceId,
      tag: val.tag || null,
      tagType: val.tag ? (val.tagType || null) : null
    };
    this.dialogRef.close(expense);
  }
}
