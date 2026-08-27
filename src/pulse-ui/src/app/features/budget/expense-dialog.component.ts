import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BudgetExpense, BudgetExpenseCreate } from '../../core/models/budget.model';
import { Category } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatSlideToggleModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon red">
        <mat-icon>receipt_long</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Expense</h2>
        <span class="dialog-subtitle">Budget expense item</span>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="expense-form">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Rent, Groceries">
        </mat-form-field>

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

        <mat-form-field>
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount" min="0">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <div class="toggle-row">
          <mat-slide-toggle formControlName="isFixed">Fixed Bill</mat-slide-toggle>
          <mat-slide-toggle formControlName="isAutopay">Autopay</mat-slide-toggle>
        </div>

        @if (form.value.isFixed) {
          <mat-form-field>
            <mat-label>Due Day (1-28)</mat-label>
            <input matInput type="number" formControlName="dueDay" min="1" max="28">
            <mat-hint>Day of month the bill is due</mat-hint>
          </mat-form-field>
        }
      </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || loading()">
        {{ data ? 'Update' : 'Add' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 24px 12px;
    }
    .header-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .header-icon.red { background: rgba(211,47,47,0.12); }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #d32f2f; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    .expense-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 320px;
    }
    .toggle-row {
      display: flex;
      gap: 24px;
      margin: 8px 0;
    }
    .new-category-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .flex-1 { flex: 1; }
    .add-cat-btn { align-self: flex-start; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
  `]
})
export class ExpenseDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ExpenseDialogComponent>);
  private categoryService = inject(CategoryService);
  data = inject<BudgetExpense | null>(MAT_DIALOG_DATA);

  loading = signal(true);
  categories = signal<Category[]>([]);
  showNewCategory = signal(false);

  form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(200)]],
    categoryId: [this.data?.categoryId ?? null as number | null, Validators.required],
    amount: [this.data?.amount ?? null as number | null, [Validators.required, Validators.min(0.01)]],
    isFixed: [this.data?.isFixed ?? true],
    isAutopay: [this.data?.isAutopay ?? false],
    dueDay: [this.data?.dueDay ?? null as number | null],
    frequency: [this.data?.frequency ?? 'Monthly' as const],
    newCategoryName: [''],
    newCategoryParent: [null as number | null]
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getAll('Expense').subscribe(cats => {
      this.categories.set(cats);
      this.loading.set(false);
    });
  }

  createCategory(): void {
    const name = this.form.value.newCategoryName?.trim();
    const parentId = this.form.value.newCategoryParent;
    if (!name) return;

    this.categoryService.create({ name, isFixed: this.form.value.isFixed ?? false, type: 'Expense', parentId: parentId ?? null })
      .subscribe(created => {
        this.loadCategories();
        this.form.patchValue({ categoryId: created.id, newCategoryName: '' });
        this.showNewCategory.set(false);
      });
  }

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const expense: BudgetExpenseCreate = {
      name: val.name!,
      categoryId: val.categoryId!,
      amount: val.amount!,
      isFixed: val.isFixed!,
      dueDay: val.isFixed ? val.dueDay ?? null : null,
      frequency: val.frequency! as any,
      isAutopay: val.isAutopay!
    };
    this.dialogRef.close(expense);
  }
}
