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
import { CategoryService } from '../../core/services/category.service';
import { RecurringTransaction } from '../../core/models/recurring.model';

@Component({
  selector: 'app-recurring-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatSlideToggleModule, MatButtonToggleModule, MatIconModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon orange">
        <mat-icon>repeat</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Recurring Transaction</h2>
        <span class="dialog-subtitle">Automate your tracking</span>
      </div>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Merchant</mat-label>
          <input matInput formControlName="merchant">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount" min="0.01" step="0.01">
          <span matPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [value]="selectedParentId()" (selectionChange)="onParentChange($event.value)">
            <div class="search-box">
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

        <div class="toggle-row">
          <label>Type:</label>
          <mat-button-toggle-group formControlName="transactionType">
            <mat-button-toggle [value]="0">Expense</mat-button-toggle>
            <mat-button-toggle [value]="1">Income</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

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
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>End Date (optional)</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate">
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive" class="full-width">Active</mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data ? 'Update' : 'Create' }}
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
    .header-icon.orange { background: rgba(230,81,0,0.12); }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #e65100; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 8px 0; }
    .full-width { grid-column: 1 / -1; }
    .toggle-row { display: flex; align-items: center; gap: 12px; grid-column: 1 / -1; margin-bottom: 8px; }
    .toggle-row label { font-weight: 500; }
    .search-box { position: sticky; top: 0; z-index: 1; background: var(--mat-select-panel-background-color, white); padding: 8px; border-bottom: 1px solid #ddd; }
    .search-box input { width: 100%; padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; outline: none; }
    .search-box input:focus { border-color: var(--mdc-theme-primary, #6750a4); }
    @media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class RecurringDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private dialogRef = inject(MatDialogRef<RecurringDialogComponent>);
  data: RecurringTransaction | null = inject(MAT_DIALOG_DATA);

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
    });
  }

  onParentChange(parentId: number): void {
    this.selectedParentId.set(parentId);
    this.childSearch.set('');
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
