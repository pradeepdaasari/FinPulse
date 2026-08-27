import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
import { CategoryService } from '../../core/services/category.service';
import { RecurringTransaction } from '../../core/models/recurring.model';

@Component({
  selector: 'app-recurring-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatSlideToggleModule, MatButtonToggleModule, MatIconModule, MatProgressSpinnerModule
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
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="expense-form">
        <div class="txn-icons">
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 0" (click)="form.patchValue({transactionType: 0}); onTypeChange()">
            <div class="txn-circle expense"><mat-icon>remove_circle_outline</mat-icon></div>
            <span class="txn-label">Expense</span>
          </div>
          <div class="txn-icon-item" [class.active]="form.value.transactionType === 1" (click)="form.patchValue({transactionType: 1}); onTypeChange()">
            <div class="txn-circle income"><mat-icon>add_circle_outline</mat-icon></div>
            <span class="txn-label">Income</span>
          </div>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" placeholder="e.g. Netflix, Rent, Salary">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount" min="0.01" step="0.01">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [value]="selectedParentId()" (selectionChange)="onParentChange($event.value)">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input matInput placeholder="Search..." (input)="parentSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
            </div>
            @for (parent of filteredParents(); track parent.id) {
              <mat-option [value]="parent.id">{{ parent.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Subcategory</mat-label>
          <mat-select formControlName="categoryId">
            <div class="search-box">
              <mat-icon>search</mat-icon>
              <input matInput placeholder="Search..." (input)="childSearch.set($any($event.target).value)" (keydown)="$event.stopPropagation()">
            </div>
            @for (child of filteredChildren(); track child.id) {
              <mat-option [value]="child.id">{{ child.name }}</mat-option>
            }
            @if (filteredChildren().length === 0 && selectedParentId()) {
              <mat-option [value]="selectedParentId()">{{ selectedParentName() }} (no subs)</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Merchant (optional)</mat-label>
          <input matInput formControlName="merchant" placeholder="e.g. Netflix, Spotify">
        </mat-form-field>

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

        <mat-form-field appearance="outline">
          <mat-label>End Date (optional)</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate">
          <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive" class="full-width">Active</mat-slide-toggle>
      </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="dialog-actions">
      <span class="action-spacer"></span>
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button color="primary" class="save-btn" [disabled]="form.invalid || loading()" (click)="save()">
        <mat-icon>{{ data ? 'check' : 'save' }}</mat-icon>
        {{ data ? 'Update' : 'Create' }}
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
    .dialog-actions {
      padding: 12px 24px 16px !important;
      border-top: 1px solid var(--color-border);
      gap: 8px;
    }
    .action-spacer { flex: 1; }
    .cancel-btn { font-weight: 500 !important; }
    .save-btn {
      border-radius: var(--radius-sm) !important;
      padding: 0 20px !important;
      font-weight: 600 !important;
      letter-spacing: 0.02em;
    }
    .save-btn mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
  `]
})
export class RecurringDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private dialogRef = inject(MatDialogRef<RecurringDialogComponent>);
  data: RecurringTransaction | null = inject(MAT_DIALOG_DATA);

  loading = signal(true);
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
    });
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
    const val = this.form.value;
    const result = {
      description: val.description,
      merchant: val.merchant || undefined,
      amount: val.amount,
      categoryId: val.categoryId,
      transactionType: val.transactionType,
      frequency: val.frequency,
      nextRunDate: new Date(val.nextRunDate).toISOString(),
      endDate: val.endDate ? new Date(val.endDate).toISOString() : undefined,
      isActive: val.isActive
    };
    this.dialogRef.close(result);
  }
}
