import { Component, inject, signal, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { BloodWorkService } from '../../core/services/blood-work.service';
import { BloodWorkReport, BloodWorkResult } from '../../core/models/blood-work.model';

@Component({
  selector: 'app-blood-work-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, DatePipe, DecimalPipe, LocalDatePipe],
  template: `
    <h2 mat-dialog-title>
      @if (report()) {
        Blood Work — {{ report()!.reportDate | localDate:'MMM d, yyyy' }}
      } @else {
        Blood Work Details
      }
    </h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-state"><mat-spinner diameter="32"></mat-spinner></div>
      } @else if (report()) {
        @if (report()!.labName) {
          <p class="lab-info"><mat-icon>science</mat-icon> {{ report()!.labName }}</p>
        }
        <div class="results-table">
          <div class="results-header-row">
            <span class="col-name">Test</span>
            <span class="col-value">Value</span>
            <span class="col-range">Reference Range</span>
            <span class="col-status">Status</span>
          </div>
          @for (result of report()!.results; track result.testName) {
            <div class="result-row" [class.abnormal]="isAbnormal(result)" [class.normal]="!isAbnormal(result) && hasRange(result)">
              <span class="col-name">{{ result.testName }}</span>
              <span class="col-value">{{ result.value | number:'1.0-2' }} {{ result.unit }}</span>
              <span class="col-range">
                @if (hasRange(result)) {
                  {{ result.referenceMin | number:'1.0-2' }} – {{ result.referenceMax | number:'1.0-2' }}
                } @else {
                  —
                }
              </span>
              <span class="col-status">
                @if (isAbnormal(result)) {
                  <mat-icon class="status-abnormal">warning</mat-icon>
                } @else if (hasRange(result)) {
                  <mat-icon class="status-normal">check_circle</mat-icon>
                } @else {
                  <mat-icon class="status-none">remove_circle_outline</mat-icon>
                }
              </span>
            </div>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 400px; }
    .loading-state { display: flex; justify-content: center; padding: 24px; }
    .lab-info { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--color-text-secondary); margin: 0 0 16px; }
    .lab-info mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .results-table { border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
    .results-header-row {
      display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 50px;
      padding: 8px 12px; background: var(--color-surface-secondary);
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
      color: var(--color-text-secondary);
    }
    .result-row {
      display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 50px;
      padding: 10px 12px; border-top: 1px solid var(--color-border);
      font-size: 0.85rem; align-items: center;
    }
    .result-row.abnormal { background: rgba(255, 59, 48, 0.05); }
    .status-abnormal { color: #ff3b30; font-size: 18px; width: 18px; height: 18px; }
    .status-normal { color: #34c759; font-size: 18px; width: 18px; height: 18px; }
    .status-none { color: var(--color-text-secondary); font-size: 18px; width: 18px; height: 18px; opacity: 0.4; }
    @media (max-width: 599px) {
      mat-dialog-content { min-width: auto; }
      .results-header-row, .result-row { grid-template-columns: 1.5fr 1fr 1fr 40px; font-size: 0.75rem; }
    }
  `]
})
export class BloodWorkDetailDialogComponent implements OnInit {
  private bloodWorkService = inject(BloodWorkService);
  private data: { reportId: number } = inject(MAT_DIALOG_DATA);

  loading = signal(true);
  report = signal<BloodWorkReport | null>(null);

  ngOnInit() {
    this.bloodWorkService.getById(this.data.reportId).subscribe({
      next: r => { this.report.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  isAbnormal(result: BloodWorkResult): boolean {
    if (result.referenceMin != null && result.value < result.referenceMin) return true;
    if (result.referenceMax != null && result.value > result.referenceMax) return true;
    return false;
  }

  hasRange(result: BloodWorkResult): boolean {
    return result.referenceMin != null || result.referenceMax != null;
  }
}
