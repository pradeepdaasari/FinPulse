import { Component, ChangeDetectorRef, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CategoryService } from '../../../core/services/category.service';
import { RecurringService } from '../../../core/services/recurring.service';
import { NotificationService } from '../../../core/services/notification.service';
import { toLocalISOString } from '../../../core/utils/date-utils';
import { RecurringTransaction } from '../../../core/models/recurring.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-recurring-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatSlideToggleModule, MatButtonToggleModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>repeat</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Recurring Transaction</h2>
          <p class="dialog-subtitle">Automate your tracking</p>
        </div>
        <span class="banner-spacer"></span>
        <div class="dialog-header-actions">
          <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="expense-form" (submit)="$event.preventDefault()">
        <div class="txn-icons">
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 0" (click)="form.patchValue({transactionType: 0}); onTypeChange()">
            <div class="txn-circle expense"><mat-icon>remove_circle_outline</mat-icon></div>
            <span class="txn-label">Expense</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 1" (click)="form.patchValue({transactionType: 1}); onTypeChange()">
            <div class="txn-circle income"><mat-icon>add</mat-icon></div>
            <span class="txn-label">Income</span>
          </div>
        </div>

        <div class="amount-hero">
          <div class="amount-input-row">
            <span class="amount-dollar">$</span>
            <input class="amount-value" type="number" inputmode="decimal" formControlName="amount" placeholder="0.00" min="0.01" step="0.01">
          </div>
          <div class="amount-underline"></div>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" placeholder="e.g. Netflix, Rent, Salary">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [value]="selectedParentId()" (selectionChange)="onParentChange($event.value)" (opened)="parentSearch.set(''); focusInput(parentSearchInput)">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input #parentSearchInput matInput placeholder="Search..." (input)="parentSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
            </div>
            @for (parent of filteredParents(); track parent.id) {
              <mat-option [value]="parent.id">{{ parent.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Subcategory</mat-label>
          <mat-select formControlName="categoryId" (opened)="childSearch.set(''); focusInput(childSearchInput)">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input #childSearchInput matInput placeholder="Search..." (input)="childSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
            </div>
            @for (child of filteredChildren(); track child.id) {
              <mat-option [value]="child.id">{{ child.name }}</mat-option>
            }
            @if (filteredChildren().length === 0 && selectedParentId()) {
              <mat-option [value]="selectedParentId()">{{ selectedParentName() }} (no subs)</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Frequency</mat-label>
            <mat-select formControlName="frequency">
              <mat-option [value]="0">Daily</mat-option>
              <mat-option [value]="1">Weekly</mat-option>
              <mat-option [value]="2">Biweekly</mat-option>
              <mat-option [value]="3">Monthly</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="nextRunDate">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="more-options-toggle" (click)="showMore.set(!showMore())">
          <mat-icon class="more-icon">{{ showMore() ? 'expand_less' : 'expand_more' }}</mat-icon>
          <span>More options (Merchant, End Date)</span>
        </div>

        @if (showMore()) {
          <div class="more-options-section">
            <mat-form-field appearance="outline">
              <mat-label>Merchant (optional)</mat-label>
              <input matInput formControlName="merchant" placeholder="e.g. Netflix, Spotify">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>End Date (optional)</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <mat-slide-toggle formControlName="isActive" class="full-width">Active</mat-slide-toggle>
          </div>
        }
      </form>
      }
    </mat-dialog-content>
    <div class="sticky-save-bar">
      <button class="gradient-save-btn" [disabled]="form.invalid || loading() || saving()" (click)="save()">
        <mat-icon>check</mat-icon>
        {{ saving() ? 'Saving...' : (data ? 'Update' : 'Create') }}
      </button>
    </div>
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
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.3);
      flex-shrink: 0;
    }
    .dialog-header-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    h2[mat-dialog-title] {
      margin: 0 !important; padding: 0 !important;
      font-size: 1rem !important; font-weight: 700 !important;
      letter-spacing: var(--tracking-tight); color: #fff !important;
    }
    .dialog-subtitle { color: rgba(255, 255, 255, 0.75); font-size: 0.72rem; margin: 2px 0 0; }
    .banner-spacer { flex: 1; }
    .dialog-header-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; align-self: center; }
    .header-close {
      color: rgba(255, 255, 255, 0.9) !important;
      width: 40px !important; height: 40px !important;
      padding: 0 !important;
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      border-radius: 50% !important;
      background: rgba(255, 255, 255, 0.12) !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
    .header-close:hover { background: rgba(255, 255, 255, 0.25) !important; }
    .header-close mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .amount-hero { text-align: center; padding: 8px 0 4px; }
    .amount-input-row { display: flex; align-items: baseline; justify-content: center; gap: 2px; }
    .amount-dollar { font-size: 1.6rem; font-weight: 700; color: var(--color-text-muted); }
    .amount-value {
      font-size: 2.8rem; font-weight: 800; letter-spacing: -0.03em;
      color: var(--color-text-primary); font-variant-numeric: tabular-nums;
      border: none; background: none; text-align: center; width: 180px;
      outline: none; caret-color: var(--color-primary);
    }
    .amount-value::placeholder { color: #ccc; }
    .amount-value::-webkit-outer-spin-button,
    .amount-value::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .amount-value[type=number] { -moz-appearance: textfield; }
    .amount-underline {
      width: 200px; height: 3px; border-radius: 2px;
      background: var(--gradient-primary); margin: 4px auto 0; opacity: 0.4;
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); }
    .more-options-toggle {
      display: flex; align-items: center; gap: 4px;
      cursor: pointer; color: var(--color-primary);
      font-size: 0.82rem; font-weight: 600; padding: 4px 0;
    }
    .more-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; }
    .more-options-section {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px; background: rgba(var(--color-primary-rgb, 33,150,243), 0.03);
      border-radius: var(--radius-sm); border: 1px dashed rgba(var(--color-primary-rgb, 33,150,243), 0.15);
    }
    .sticky-save-bar {
      position: sticky; bottom: 0; z-index: 10;
      padding: 12px 24px 16px;
      background: linear-gradient(transparent, var(--color-surface) 30%);
    }
    .gradient-save-btn {
      width: 100%; height: 48px; border: none; border-radius: var(--radius-sm);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.95rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      cursor: pointer; box-shadow: 0 4px 16px rgba(var(--color-primary-rgb, 33,150,243), 0.3);
    }
    .gradient-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .gradient-save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .expense-form { display: flex; flex-direction: column; gap: 4px; min-width: 0; width: 100%; }
    .txn-icons { display: flex; justify-content: center; gap: 24px; margin-bottom: 12px; }
    .txn-icon-item {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      cursor: pointer; min-width: 0;
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
    .txn-icon-item.active .txn-label { color: var(--color-text-primary); font-weight: 700; }
    .full-width { width: 100%; }
    .search-box {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 16px; border-bottom: 1px solid var(--color-border);
      position: sticky; top: 0; background: var(--color-surface); z-index: 100;
    }
    .search-box mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    .search-box input { border: none; outline: none; flex: 1; font-size: 0.875rem; background: transparent; color: inherit; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    @media (max-width: 599px) {
      :host { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .dialog-banner { margin: -16px -16px 12px; padding: 14px 16px 12px; flex-shrink: 0; }
      .amount-value { font-size: 2rem; width: 140px; }
      .amount-underline { width: 140px; }
      .form-row { grid-template-columns: 1fr; }
      .sticky-save-bar { padding: 10px 16px 14px; }
    }
  `]
})
export class RecurringDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private recurringService = inject(RecurringService);
  private notify = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<RecurringDialogComponent>);
  data: RecurringTransaction | null = inject(MAT_DIALOG_DATA);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  showMore = signal(false);
  categories = signal<any[]>([]);
  selectedParentId = signal<number | null>(null);
  parentSearch = signal('');
  childSearch = signal('');

  filteredParents = computed(() => {
    const search = this.parentSearch().toLowerCase();
    return this.categories().filter(c => c.name.toLowerCase().includes(search));
  });

  filteredChildren = computed(() => {
    const parentId = this.selectedParentId();
    if (!parentId) return [];
    const parent = this.categories().find((c: any) => c.id === parentId);
    if (!parent || !parent.children) return [];
    const search = this.childSearch().toLowerCase();
    return parent.children.filter((c: any) => c.name.toLowerCase().includes(search));
  });

  selectedParentName = computed(() => {
    const parentId = this.selectedParentId();
    const parent = this.categories().find((c: any) => c.id === parentId);
    return parent?.name || '';
  });

  form: FormGroup = this.fb.group({
    description: ['', Validators.required],
    merchant: [''],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    categoryId: [null, Validators.required],
    transactionType: [0],
    frequency: [3, Validators.required],
    nextRunDate: [new Date(), Validators.required],
    endDate: [null],
    isActive: [true]
  });

  private frequencyMap: Record<string, number> = { Daily: 0, Weekly: 1, Biweekly: 2, Monthly: 3 };
  private typeMap: Record<string, number> = { Expense: 0, Income: 1, Transfer: 2, Refund: 3, CardPayment: 4 };

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        description: this.data.description,
        merchant: this.data.merchant,
        amount: this.data.amount,
        categoryId: this.data.categoryId,
        transactionType: this.typeMap[this.data.transactionType] ?? 0,
        frequency: this.frequencyMap[this.data.frequency] ?? 3,
        nextRunDate: new Date(this.data.nextRunDate),
        endDate: this.data.endDate ? new Date(this.data.endDate) : null,
        isActive: this.data.isActive
      });
      if (this.data.merchant || this.data.endDate) {
        this.showMore.set(true);
      }
    }

    this.loadCategories();

    this.form.get('transactionType')!.valueChanges.subscribe(() => {
      this.loadCategories();
      this.selectedParentId.set(0);
      this.form.patchValue({ categoryId: null });
    });
  }

  private loadCategories(): void {
    const type = this.form.value.transactionType === 1 ? 'Income' : 'Expense';
    this.categoryService.getAll(type).subscribe(cats => {
      this.categories.set(cats);
      if (this.data?.categoryId) {
        const parent = cats.find((c: any) =>
          c.children?.some((ch: any) => ch.id === this.data!.categoryId)
        );
        if (parent) {
          this.selectedParentId.set(parent.id);
        } else {
          const directParent = cats.find((c: any) => c.id === this.data!.categoryId);
          if (directParent) this.selectedParentId.set(directParent.id);
        }
      }
      this.loading.set(false);
      this.cdr.detectChanges();
    });
  }

  focusInput(el: HTMLInputElement): void {
    setTimeout(() => el.focus(), 0);
  }

  onParentChange(parentId: number): void {
    this.selectedParentId.set(parentId);
    this.childSearch.set('');
    this.form.patchValue({ categoryId: null });
  }

  onTypeChange(): void {
    this.loadCategories();
    this.selectedParentId.set(0);
    this.form.patchValue({ categoryId: null });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.value;
    const payload = {
      description: val.description,
      merchant: val.merchant || undefined,
      amount: val.amount,
      categoryId: val.categoryId,
      transactionType: val.transactionType,
      frequency: val.frequency,
      nextRunDate: toLocalISOString(new Date(val.nextRunDate)),
      endDate: val.endDate ? toLocalISOString(new Date(val.endDate)) : undefined,
      isActive: val.isActive
    };
    const op$ = this.data
      ? this.recurringService.update(this.data.id, payload)
      : this.recurringService.create(payload);
    (op$ as Observable<unknown>).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: any) => {
        this.notify.error(err.error?.message || `Failed to ${this.data ? 'update' : 'create'}`);
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
