import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TradingService } from '../../core/services/trading.service';
import { TradingRule, RuleCategory } from '../../core/models/trading.model';
import { NotificationService } from '../../core/services/notification.service';
import { RichTextEditorComponent } from '../../shared/rich-text-editor.component';

export interface RuleEditorDialogData {
  rule: TradingRule | null;
}

@Component({
  selector: 'app-rule-editor-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatTooltipModule, MatSlideToggleModule,
    RichTextEditorComponent
  ],
  template: `
    <div class="dialog-title-row">
      <h2 mat-dialog-title>
        <mat-icon class="title-icon">rule</mat-icon>
        {{ data?.rule ? 'Edit' : 'Add' }} Trading Rule
      </h2>
      <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    <mat-dialog-content>
      <form [formGroup]="form" class="rule-form" (submit)="$event.preventDefault()">
        <app-rich-text-editor label="Rule" formControlName="text" height="100px"
          placeholder="e.g., Never enter without a defined stop loss"></app-rich-text-editor>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            <mat-option value="entry"><mat-icon>login</mat-icon> Entry</mat-option>
            <mat-option value="exit"><mat-icon>logout</mat-icon> Exit</mat-option>
            <mat-option value="risk"><mat-icon>shield</mat-icon> Risk</mat-option>
            <mat-option value="mindset"><mat-icon>psychology</mat-icon> Mindset</mat-option>
            <mat-option value="general"><mat-icon>rule</mat-icon> General</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive" color="primary">Active</mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">
        <mat-icon>save</mat-icon> Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title-row { display: flex; align-items: center; gap: 8px; }
    .dialog-title-row h2 { flex: 1; }
    .header-close {
      color: var(--color-text-muted) !important;
      width: 34px !important; height: 34px !important;
      padding: 0 !important;
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      border-radius: 50% !important;
      background: var(--color-surface-secondary) !important;
      border: 1px solid var(--color-border) !important;
    }
    .header-close:hover { background: var(--color-surface-hover) !important; }
    .header-close mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .title-icon { vertical-align: middle; margin-right: 8px; color: var(--color-primary); }
    .rule-form { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
    mat-slide-toggle { margin-top: 8px; }
  `]
})
export class RuleEditorDialogComponent {
  private fb = inject(FormBuilder);
  private tradingService = inject(TradingService);
  private dialogRef = inject(MatDialogRef<RuleEditorDialogComponent>);
  private notify = inject(NotificationService);
  data: RuleEditorDialogData = inject(MAT_DIALOG_DATA);

  form = this.fb.group({
    text: [this.data?.rule?.text ?? '', Validators.required],
    category: [this.data?.rule?.category ?? 'general' as RuleCategory, Validators.required],
    isActive: [this.data?.rule?.isActive ?? true]
  });

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload: Partial<TradingRule> = {
      text: val.text!,
      category: val.category as RuleCategory,
      isActive: val.isActive ?? true,
      orderIndex: 0
    };

    const obs = this.data.rule
      ? this.tradingService.updateRule(this.data.rule.id, payload)
      : this.tradingService.createRule(payload);

    obs.subscribe({
      next: () => { this.notify.success('Rule saved'); this.dialogRef.close(true); },
      error: () => this.notify.error('Failed to save rule')
    });
  }
}
