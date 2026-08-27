import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TradingService } from '../../core/services/trading.service';
import { TradingSetup, ChecklistItem } from '../../core/models/trading.model';
import { NotificationService } from '../../core/services/notification.service';

export interface SetupEditorData {
  setup: TradingSetup | null;
}

@Component({
  selector: 'app-setup-editor-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatSlideToggleModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">{{ data?.setup ? 'edit' : 'add_circle' }}</mat-icon>
      {{ data?.setup ? 'Edit Setup' : 'New Setup' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="setup-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Setup Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g., Morning Breakout, SPX Put Credit Spread">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput formControlName="description" rows="2"
                    placeholder="Describe when and how you trade this setup"></textarea>
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive" color="primary">
          Active
        </mat-slide-toggle>

        <div class="checklist-section">
          <label class="checklist-label">
            <mat-icon>checklist</mat-icon> Checklist Items
          </label>
          <p class="checklist-hint">These must ALL be confirmed before you can enter a trade with this setup.</p>

          <div class="checklist-items">
            @for (item of items.controls; track $index) {
              <div class="checklist-item">
                <mat-icon class="drag-icon">drag_indicator</mat-icon>
                <mat-form-field appearance="outline" class="item-field">
                  <input matInput [formControl]="$any(item)" placeholder="e.g., Trend confirmed on 5min chart">
                </mat-form-field>
                <button mat-icon-button color="warn" (click)="removeItem($index)" [disabled]="items.length <= 1">
                  <mat-icon>remove_circle</mat-icon>
                </button>
              </div>
            }
          </div>

          <button mat-button type="button" class="add-item-btn" (click)="addItem()">
            <mat-icon>add</mat-icon> Add Checklist Item
          </button>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || items.invalid || saving()">
        <mat-icon>{{ data?.setup ? 'check' : 'save' }}</mat-icon>
        {{ data?.setup ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title-icon { vertical-align: middle; margin-right: 8px; color: var(--color-primary); }
    .setup-form { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
    .full-width { width: 100%; }

    mat-slide-toggle { margin-bottom: 8px; }

    .checklist-section { margin-top: 8px; }
    .checklist-label {
      display: flex; align-items: center; gap: 8px;
      font-weight: 700; font-size: 0.95rem; margin-bottom: 4px;
    }
    .checklist-label mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .checklist-hint { font-size: 0.8rem; color: var(--color-text-secondary); margin: 0 0 12px; }

    .checklist-items { display: flex; flex-direction: column; gap: 6px; }
    .checklist-item { display: flex; align-items: center; gap: 4px; }
    .drag-icon { color: var(--color-text-muted); font-size: 18px; width: 18px; height: 18px; cursor: grab; }
    .item-field { flex: 1; }

    .add-item-btn {
      margin-top: 8px; color: var(--color-primary) !important; font-weight: 600 !important;
    }
    .add-item-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    mat-dialog-actions button mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }
  `]
})
export class SetupEditorDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tradingService = inject(TradingService);
  private dialogRef = inject(MatDialogRef<SetupEditorDialogComponent>);
  private notify = inject(NotificationService);
  data = inject<SetupEditorData>(MAT_DIALOG_DATA);

  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isActive: [true]
  });

  items = this.fb.array([this.fb.control('', Validators.required)]);

  ngOnInit(): void {
    if (this.data?.setup) {
      const s = this.data.setup;
      this.form.patchValue({ name: s.name, description: s.description || '', isActive: s.isActive });
      this.items.clear();
      const sorted = [...s.checklistItems].sort((a, b) => a.orderIndex - b.orderIndex);
      sorted.forEach(item => this.items.push(this.fb.control(item.label, Validators.required)));
      if (this.items.length === 0) this.addItem();
    }
  }

  addItem(): void {
    this.items.push(this.fb.control('', Validators.required));
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }

  save(): void {
    if (this.form.invalid || this.items.invalid) return;
    this.saving.set(true);

    const checklistItems: ChecklistItem[] = this.items.controls.map((ctrl, i) => ({
      label: ctrl.value as string,
      orderIndex: i
    }));

    const payload: Partial<TradingSetup> = {
      name: this.form.value.name!,
      description: this.form.value.description || undefined,
      isActive: this.form.value.isActive!,
      checklistItems
    };

    const obs = this.data?.setup
      ? this.tradingService.updateSetup(this.data.setup.id, payload)
      : this.tradingService.createSetup(payload);

    obs.subscribe({
      next: () => {
        this.notify.success(this.data?.setup ? 'Setup updated' : 'Setup created');
        this.dialogRef.close(true);
      },
      error: () => {
        this.notify.error('Failed to save setup');
        this.saving.set(false);
      }
    });
  }
}
