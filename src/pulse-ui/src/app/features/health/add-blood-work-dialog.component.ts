import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { BloodWorkService } from '../../core/services/blood-work.service';
import { NotificationService } from '../../core/services/notification.service';
import { toLocalISOString } from '../../core/utils/date-utils';
import { BloodWorkResult } from '../../core/models/blood-work.model';

@Component({
  selector: 'app-add-blood-work-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatAutocompleteModule, MatProgressSpinnerModule, MatTooltipModule, FormsModule],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>bloodtype</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>Add Blood Work Report</h2>
          <p class="dialog-subtitle">Log your lab results & track trends</p>
        </div>
        <span class="banner-spacer"></span>
        <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <div class="form-content">
        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Report Date</mat-label>
            <input matInput type="date" [(ngModel)]="reportDate">
            <mat-icon matPrefix class="field-icon">calendar_today</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Lab Name</mat-label>
            <input matInput [(ngModel)]="labName" placeholder="e.g. Quest Diagnostics">
            <mat-icon matPrefix class="field-icon">science</mat-icon>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes (optional)</mat-label>
          <input matInput [(ngModel)]="notes" placeholder="e.g. Fasting blood draw">
          <mat-icon matPrefix class="field-icon">notes</mat-icon>
        </mat-form-field>

        <div class="results-header">
          <span class="results-count">{{ results.length }} test{{ results.length !== 1 ? 's' : '' }}</span>
          <button mat-stroked-button class="add-test-btn" (click)="addResult()">
            <mat-icon>add</mat-icon> Add Test
          </button>
        </div>

        <div class="results-list">
          @for (result of results; track $index; let i = $index) {
            <div class="result-card">
              <div class="result-card-header">
                <span class="result-num">{{ i + 1 }}</span>
                <mat-form-field appearance="outline" class="test-name-field">
                  <mat-label>Test Name</mat-label>
                  <input matInput [(ngModel)]="result.testName" [matAutocomplete]="testAuto"
                         (input)="filterTestNames($event)">
                  <mat-autocomplete #testAuto="matAutocomplete">
                    @for (name of filteredTestNames(); track name) {
                      <mat-option [value]="name">{{ name }}</mat-option>
                    }
                  </mat-autocomplete>
                </mat-form-field>
                <button mat-icon-button (click)="removeResult(i)" class="remove-btn" matTooltip="Remove">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div class="result-card-fields">
                <mat-form-field appearance="outline" class="value-field">
                  <mat-label>Value</mat-label>
                  <input matInput type="number" inputmode="decimal" [(ngModel)]="result.value" step="0.01">
                </mat-form-field>
                <mat-form-field appearance="outline" class="unit-field">
                  <mat-label>Unit</mat-label>
                  <input matInput [(ngModel)]="result.unit" placeholder="mg/dL">
                </mat-form-field>
              </div>
              <div class="result-card-fields">
                <mat-form-field appearance="outline" class="ref-field">
                  <mat-label>Ref Min</mat-label>
                  <input matInput type="number" inputmode="decimal" [(ngModel)]="result.referenceMin" step="0.01">
                </mat-form-field>
                <mat-form-field appearance="outline" class="ref-field">
                  <mat-label>Ref Max</mat-label>
                  <input matInput type="number" inputmode="decimal" [(ngModel)]="result.referenceMax" step="0.01">
                </mat-form-field>
              </div>
            </div>
          }
        </div>
      </div>
      }
    </mat-dialog-content>
    <div class="save-bar">
      <button class="save-btn" [disabled]="!reportDate || results.length === 0 || loading() || saving()" (click)="save()">
        <mat-icon>check</mat-icon>
        {{ saving() ? 'Saving...' : 'Save Report' }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-banner {
      position: relative;
      margin: -24px -24px 20px;
      padding: 20px 24px 16px;
      background: linear-gradient(135deg, #FF2D55 0%, #AF52DE 100%);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content {
      position: relative;
      display: flex; align-items: center; gap: 12px;
    }
    .dialog-header-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,0.3);
      flex-shrink: 0;
    }
    .dialog-header-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    h2[mat-dialog-title] {
      margin: 0 !important; padding: 0 !important;
      font-size: 1rem !important; font-weight: 700 !important;
      color: #fff !important;
    }
    .dialog-subtitle { color: rgba(255,255,255,0.75); font-size: 0.72rem; margin: 2px 0 0; }
    .banner-spacer { flex: 1; }
    .header-close {
      color: rgba(255,255,255,0.9) !important;
      width: 44px !important; height: 44px !important;
      padding: 0 !important;
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      border-radius: 50% !important;
      background: rgba(255,255,255,0.12) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
    }
    .header-close:hover { background: rgba(255,255,255,0.25) !important; }
    .header-close mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .form-content { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; }
    .full-width { width: 100%; }
    .half-width { width: 48%; }
    .form-row { display: flex; gap: 4%; }
    .field-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); margin-right: 4px; }

    .results-header {
      display: flex; align-items: center; justify-content: space-between;
      margin: 8px 0 4px;
    }
    .results-count {
      font-size: 0.78rem; font-weight: 600; color: var(--color-text-muted);
    }
    .add-test-btn {
      border-style: dashed !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
    }
    .add-test-btn mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    .results-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
    .result-card {
      background: var(--color-surface-secondary);
      border-radius: var(--radius-sm);
      padding: 12px;
      border: 1px solid var(--color-border);
    }
    .result-card-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
    }
    .result-num {
      width: 24px; height: 24px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      font-size: 0.7rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .test-name-field { flex: 1; }
    .remove-btn { flex-shrink: 0; }
    .remove-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .result-card-fields { display: flex; gap: 8px; }
    .value-field { flex: 2; }
    .unit-field { flex: 1; }
    .ref-field { flex: 1; }

    .mat-mdc-form-field-subscript-wrapper { display: none; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }

    .save-bar {
      position: sticky; bottom: 0; left: 0; right: 0;
      padding: 12px 24px 16px;
      background: linear-gradient(transparent, var(--color-surface) 30%);
    }
    .save-btn {
      width: 100%; height: 48px; border: none; border-radius: var(--radius-sm);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.9rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      cursor: pointer; box-shadow: 0 4px 16px rgba(0,122,255,0.3);
      transition: opacity 0.15s;
    }
    .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    @media (max-width: 599px) {
      :host { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .dialog-banner { margin: -16px -16px 16px; padding: 14px 16px 12px; flex-shrink: 0; }
      .form-row { flex-direction: column; gap: 0; }
      .half-width { width: 100%; }
      .result-card-fields { flex-wrap: wrap; }
      .value-field, .unit-field, .ref-field { min-width: calc(50% - 4px); }
      .save-bar { padding: 12px 16px 16px; }
    }
  `]
})
export class AddBloodWorkDialogComponent {
  private dialogRef = inject(MatDialogRef<AddBloodWorkDialogComponent>);
  private bloodWorkService = inject(BloodWorkService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  reportDate = this.formatDate(new Date());
  labName = '';
  notes = '';
  results: BloodWorkResult[] = [{ testName: '', value: 0, unit: '' }];

  allTestNames = signal<string[]>([]);
  filteredTestNames = signal<string[]>([]);

  constructor() {
    this.bloodWorkService.getTestNames().subscribe({
      next: names => {
        this.allTestNames.set(names);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  addResult() {
    this.results = [...this.results, { testName: '', value: 0, unit: '' }];
  }

  removeResult(i: number) {
    this.results = this.results.filter((_, idx) => idx !== i);
  }

  filterTestNames(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredTestNames.set(
      this.allTestNames().filter(n => n.toLowerCase().includes(query))
    );
  }

  save() {
    this.saving.set(true);
    const validResults = this.results.filter(r => r.testName && r.value != null);
    const payload = {
      reportDate: toLocalISOString(new Date(this.reportDate)),
      labName: this.labName || undefined,
      notes: this.notes || undefined,
      results: validResults
    };
    this.bloodWorkService.create(payload).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.notify.error(err.error?.message || 'Failed to save report');
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
