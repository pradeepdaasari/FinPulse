import { Component, inject, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { BloodWorkService } from '../../core/services/blood-work.service';
import { BloodWorkResult } from '../../core/models/blood-work.model';

@Component({
  selector: 'app-add-blood-work-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatAutocompleteModule, MatProgressSpinnerModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Add Blood Work Report</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <div class="form-row">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Report Date</mat-label>
          <input matInput type="date" [(ngModel)]="reportDate">
        </mat-form-field>
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Lab Name</mat-label>
          <input matInput [(ngModel)]="labName" placeholder="e.g. Quest Diagnostics">
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Notes (optional)</mat-label>
        <input matInput [(ngModel)]="notes">
      </mat-form-field>

      <h3 class="results-header">
        Test Results
        <button mat-icon-button (click)="addResult()"><mat-icon>add_circle</mat-icon></button>
      </h3>

      <div class="results-list">
        @for (result of results; track $index; let i = $index) {
          <div class="result-row">
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
            <mat-form-field appearance="outline" class="value-field">
              <mat-label>Value</mat-label>
              <input matInput type="number" [(ngModel)]="result.value" step="0.01">
            </mat-form-field>
            <mat-form-field appearance="outline" class="unit-field">
              <mat-label>Unit</mat-label>
              <input matInput [(ngModel)]="result.unit" placeholder="mg/dL">
            </mat-form-field>
            <mat-form-field appearance="outline" class="ref-field">
              <mat-label>Ref Min</mat-label>
              <input matInput type="number" [(ngModel)]="result.referenceMin" step="0.01">
            </mat-form-field>
            <mat-form-field appearance="outline" class="ref-field">
              <mat-label>Ref Max</mat-label>
              <input matInput type="number" [(ngModel)]="result.referenceMax" step="0.01">
            </mat-form-field>
            <button mat-icon-button (click)="removeResult(i)" class="remove-btn">
              <mat-icon>close</mat-icon>
            </button>
          </div>
        }
      </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!reportDate || results.length === 0 || loading()" (click)="save()">Save Report</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 480px; max-height: 65vh; overflow-y: auto; }
    .full-width { width: 100%; }
    .half-width { width: 48%; }
    .form-row { display: flex; gap: 4%; }
    .results-header {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.9rem; font-weight: 600; margin: 8px 0 4px;
    }
    .results-list { display: flex; flex-direction: column; gap: 4px; }
    .result-row {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    }
    .test-name-field { flex: 2; min-width: 140px; }
    .value-field { flex: 1; min-width: 70px; }
    .unit-field { flex: 1; min-width: 60px; }
    .ref-field { flex: 1; min-width: 60px; }
    .remove-btn { flex-shrink: 0; }
    .mat-mdc-form-field-subscript-wrapper { display: none; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    @media (max-width: 599px) {
      mat-dialog-content { min-width: auto; }
      .form-row { flex-direction: column; gap: 0; }
      .half-width { width: 100%; }
      .result-row { flex-direction: column; align-items: stretch; gap: 0; }
      .test-name-field, .value-field, .unit-field, .ref-field { min-width: auto; flex: auto; }
    }
  `]
})
export class AddBloodWorkDialogComponent {
  private dialogRef = inject(MatDialogRef<AddBloodWorkDialogComponent>);
  private bloodWorkService = inject(BloodWorkService);

  loading = signal(true);
  reportDate = this.formatDate(new Date());
  labName = '';
  notes = '';
  results: BloodWorkResult[] = [{ testName: '', value: 0, unit: '' }];

  allTestNames = signal<string[]>([]);
  filteredTestNames = signal<string[]>([]);

  constructor() {
    this.bloodWorkService.getTestNames().subscribe(names => {
      this.allTestNames.set(names);
      this.loading.set(false);
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
    const validResults = this.results.filter(r => r.testName && r.value);
    this.dialogRef.close({
      reportDate: new Date(this.reportDate).toISOString(),
      labName: this.labName || undefined,
      notes: this.notes || undefined,
      results: validResults
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
