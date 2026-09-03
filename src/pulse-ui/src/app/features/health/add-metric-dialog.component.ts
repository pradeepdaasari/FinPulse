import { Component, inject, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HealthMetric } from '../../core/models/health-metric.model';
import { toLocalISOString } from '../../core/utils/date-utils';

interface MetricConfig {
  type: string;
  label: string;
  unit: string;
  icon: string;
}

@Component({
  selector: 'app-add-metric-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, FormsModule],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>monitor_heart</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>{{ isEdit ? 'Edit' : 'Log' }} Health Metric</h2>
          <p class="dialog-subtitle">{{ isEdit ? 'Update your entry' : 'Track your vitals & progress' }}</p>
        </div>
      </div>
    </div>
    <mat-dialog-content>
      <div class="metric-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Metric Type</mat-label>
          <mat-select [(value)]="selectedType" [disabled]="isEdit">
            @for (config of metricConfigs; track config.type) {
              <mat-option [value]="config.type">
                <mat-icon class="option-icon">{{ config.icon }}</mat-icon>
                {{ config.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (selectedType) {
          <div class="value-row">
            <mat-form-field appearance="outline" class="value-field">
              <mat-label>Value</mat-label>
              <input matInput type="number" [(ngModel)]="value" step="0.1">
            </mat-form-field>
            <div class="unit-badge">{{ getUnit() }}</div>
          </div>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Date & Time</mat-label>
          <input matInput type="datetime-local" [(ngModel)]="measuredAt">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (optional)</mat-label>
          <input matInput [(ngModel)]="notes" placeholder="e.g. after morning coffee">
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions class="dialog-actions">
      @if (isEdit) {
        <button mat-button color="warn" class="delete-btn" (click)="onDelete()">
          <mat-icon>delete</mat-icon> Delete
        </button>
      }
      <span class="action-spacer"></span>
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button color="primary" class="save-btn" [disabled]="!selectedType || !value" (click)="save()">
        <mat-icon>check</mat-icon>
        {{ isEdit ? 'Update' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    .dialog-banner {
      position: relative;
      margin: -24px -24px 20px;
      padding: 20px 24px 16px;
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
    .metric-form { display: flex; flex-direction: column; gap: 4px; min-width: 0; width: 100%; padding-top: 4px; }
    .full-width { width: 100%; }
    .value-row { display: flex; align-items: center; gap: 12px; }
    .value-field { flex: 1; }
    .unit-badge {
      font-size: 0.8rem; font-weight: 600;
      color: var(--color-primary);
      background: rgba(0, 122, 255, 0.08);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      white-space: nowrap;
    }
    .option-icon {
      font-size: 18px; width: 18px; height: 18px;
      margin-right: 8px; vertical-align: middle;
      color: var(--color-primary);
    }
    .dialog-actions {
      padding: 12px 24px 16px !important;
      border-top: 1px solid var(--color-border);
      gap: 8px;
      display: flex; align-items: center;
    }
    .action-spacer { flex: 1; }
    .cancel-btn { font-weight: 500 !important; }
    .delete-btn mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }
    .save-btn {
      border-radius: var(--radius-sm) !important;
      padding: 0 20px !important;
      font-weight: 600 !important;
      letter-spacing: 0.02em;
    }
    .save-btn mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    @media (max-width: 599px) {
      .dialog-banner { margin: -16px -16px 16px; padding: 14px 16px 12px; }
      .value-row { flex-wrap: wrap; }
      .value-field { min-width: 100%; }
    }
  `]
})
export class AddMetricDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AddMetricDialogComponent>);
  data: HealthMetric | null = inject(MAT_DIALOG_DATA);

  isEdit = false;

  metricConfigs: MetricConfig[] = [
    { type: 'Weight', label: 'Weight', unit: 'lbs', icon: 'monitor_weight' },
    { type: 'BloodPressureSystolic', label: 'Blood Pressure (Systolic)', unit: 'mmHg', icon: 'favorite' },
    { type: 'BloodPressureDiastolic', label: 'Blood Pressure (Diastolic)', unit: 'mmHg', icon: 'favorite' },
    { type: 'HeartRate', label: 'Heart Rate', unit: 'bpm', icon: 'heart_broken' },
    { type: 'BloodSugar', label: 'Blood Sugar', unit: 'mg/dL', icon: 'water_drop' },
    { type: 'SpO2', label: 'Oxygen (SpO2)', unit: '%', icon: 'air' },
    { type: 'Temperature', label: 'Temperature', unit: '°F', icon: 'thermostat' },
    { type: 'SleepHours', label: 'Sleep Duration', unit: 'hrs', icon: 'bedtime' },
    { type: 'WaterIntakeMl', label: 'Water Intake', unit: 'ml', icon: 'local_drink' },
    { type: 'BodyFatPercent', label: 'Body Fat', unit: '%', icon: 'percent' },
    { type: 'Steps', label: 'Steps', unit: 'steps', icon: 'directions_walk' },
    { type: 'WaistCm', label: 'Waist', unit: 'cm', icon: 'straighten' },
  ];

  selectedType = '';
  value: number | null = null;
  measuredAt = this.formatDateLocal(new Date());
  notes = '';

  ngOnInit() {
    if (this.data) {
      this.isEdit = true;
      this.selectedType = this.data.metricType;
      this.value = this.data.value;
      this.measuredAt = this.formatDateLocal(new Date(this.data.measuredAt));
      this.notes = this.data.notes || '';
    }
  }

  getUnit(): string {
    return this.metricConfigs.find(c => c.type === this.selectedType)?.unit || '';
  }

  save() {
    this.dialogRef.close({
      metricType: this.selectedType,
      value: this.value,
      unit: this.getUnit(),
      measuredAt: toLocalISOString(new Date(this.measuredAt)),
      notes: this.notes || undefined
    });
  }

  onDelete() {
    this.dialogRef.close('delete');
  }

  private formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }
}
