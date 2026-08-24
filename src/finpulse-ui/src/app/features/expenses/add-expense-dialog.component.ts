import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DailyExpense, DailyExpenseCreate } from '../../core/models/daily-expense.model';
import { Category } from '../../core/models/category.model';
import { CategoryService } from '../../core/services/category.service';

export interface ExpenseDialogData {
  expense: DailyExpense | null;
  prefilledCategoryId?: number;
}

@Component({
  selector: 'app-add-expense-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data?.expense ? 'Edit' : 'Log' }} Expense</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="expense-form">
        <mat-form-field>
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="date">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
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
          <input matInput type="number" formControlName="amount" min="0.01" step="0.01">
          <span matTextPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Merchant (optional)</mat-label>
          <input matInput formControlName="merchant" placeholder="e.g. Walmart, Shell, Chipotle">
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" placeholder="What was this for?">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
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
    .new-category-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .flex-1 { flex: 1; }
    .add-cat-btn { align-self: flex-start; }
  `]
})
export class AddExpenseDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddExpenseDialogComponent>);
  private categoryService = inject(CategoryService);
  data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);

  categories = signal<Category[]>([]);
  showNewCategory = signal(false);

  form = this.fb.group({
    date: [this.data?.expense ? new Date(this.data.expense.date) : new Date(), Validators.required],
    categoryId: [this.data?.expense?.categoryId ?? this.data?.prefilledCategoryId ?? null as number | null, Validators.required],
    amount: [this.data?.expense?.amount ?? null as number | null, [Validators.required, Validators.min(0.01)]],
    merchant: [this.data?.expense?.merchant ?? ''],
    description: [this.data?.expense?.description ?? '', [Validators.required, Validators.maxLength(500)]],
    newCategoryName: [''],
    newCategoryParent: [null as number | null]
  });

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
  }

  createCategory(): void {
    const name = this.form.value.newCategoryName?.trim();
    const parentId = this.form.value.newCategoryParent;
    if (!name) return;

    this.categoryService.create({ name, isFixed: false, type: 'Expense', parentId: parentId ?? null })
      .subscribe(created => {
        this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
        this.form.patchValue({ categoryId: created.id, newCategoryName: '' });
        this.showNewCategory.set(false);
      });
  }

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const expense: DailyExpenseCreate = {
      date: (val.date as Date).toISOString(),
      categoryId: val.categoryId!,
      amount: val.amount!,
      merchant: val.merchant || null,
      description: val.description!
    };
    this.dialogRef.close(expense);
  }
}
