import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe, DecimalPipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { BloodWorkService } from '../../core/services/blood-work.service';
import { BloodWorkReport, BloodWorkResult } from '../../core/models/blood-work.model';

@Component({
  selector: 'app-blood-work-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, DatePipe, DecimalPipe, LocalDatePipe],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>bloodtype</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>
            @if (report()) {
              {{ report()!.reportDate | localDate:'MMM d, yyyy' }}
            } @else {
              Blood Work Details
            }
          </h2>
          <p class="dialog-subtitle">
            @if (report()?.labName) { {{ report()!.labName }} }
            @if (report()) { · {{ report()!.results.length }} tests }
          </p>
        </div>
        <span class="banner-spacer"></span>
        <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-state"><mat-spinner diameter="32"></mat-spinner></div>
      } @else if (report()) {
        @if (report()!.notes) {
          <p class="notes-text"><mat-icon>notes</mat-icon> {{ report()!.notes }}</p>
        }

        <!-- Summary pills -->
        @if (report()!.results.length > 0) {
          <div class="summary-pills">
            <div class="pill normal-pill">
              <mat-icon>check_circle</mat-icon>
              <span>{{ normalCount() }} normal</span>
            </div>
            @if (abnormalCount() > 0) {
              <div class="pill abnormal-pill">
                <mat-icon>warning</mat-icon>
                <span>{{ abnormalCount() }} abnormal</span>
              </div>
            }
            @if (noRangeCount() > 0) {
              <div class="pill norange-pill">
                <mat-icon>remove_circle_outline</mat-icon>
                <span>{{ noRangeCount() }} no range</span>
              </div>
            }
          </div>
        }

        <!-- Desktop table -->
        <div class="results-table desktop-only">
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

        <!-- Mobile cards -->
        <div class="mobile-cards">
          @for (result of report()!.results; track result.testName) {
            <div class="result-card" [class.card-abnormal]="isAbnormal(result)">
              <div class="rc-top">
                <span class="rc-name">{{ result.testName }}</span>
                @if (isAbnormal(result)) {
                  <mat-icon class="status-abnormal">warning</mat-icon>
                } @else if (hasRange(result)) {
                  <mat-icon class="status-normal">check_circle</mat-icon>
                }
              </div>
              <div class="rc-bottom">
                <span class="rc-value">{{ result.value | number:'1.0-2' }} <small>{{ result.unit }}</small></span>
                @if (hasRange(result)) {
                  <span class="rc-range">Ref: {{ result.referenceMin | number:'1.0-2' }} – {{ result.referenceMax | number:'1.0-2' }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </mat-dialog-content>
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

    .notes-text {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.82rem; color: var(--color-text-secondary); margin: 0 0 12px;
      padding: 8px 12px; background: var(--color-surface-secondary);
      border-radius: var(--radius-sm);
    }
    .notes-text mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-text-muted); }

    .summary-pills {
      display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;
    }
    .pill {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.72rem; font-weight: 600;
      padding: 4px 10px; border-radius: var(--radius-full);
    }
    .pill mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .normal-pill { background: var(--color-success-bg); color: var(--color-success); }
    .abnormal-pill { background: var(--color-danger-bg); color: var(--color-danger); }
    .norange-pill { background: var(--color-surface-secondary); color: var(--color-text-muted); }

    .loading-state { display: flex; justify-content: center; padding: 24px; }

    .results-table { border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
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

    .mobile-cards { display: none; }
    .result-card {
      display: flex; flex-direction: column; gap: 4px;
      padding: 12px; background: var(--color-surface);
      border-radius: var(--radius-sm); margin-bottom: 8px;
      border: 1px solid var(--color-border);
    }
    .result-card.card-abnormal {
      border-left: 3px solid #ff3b30;
      background: rgba(255, 59, 48, 0.03);
    }
    .rc-top {
      display: flex; align-items: center; justify-content: space-between;
    }
    .rc-name { font-weight: 600; font-size: 0.88rem; }
    .rc-bottom { display: flex; align-items: baseline; justify-content: space-between; }
    .rc-value { font-size: 1.05rem; font-weight: 700; color: var(--color-primary); }
    .rc-value small { font-size: 0.72rem; font-weight: 500; color: var(--color-text-muted); }
    .rc-range { font-size: 0.72rem; color: var(--color-text-muted); }

    @media (max-width: 1199px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
    }

    @media (max-width: 599px) {
      :host { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .dialog-banner { margin: -16px -16px 16px; padding: 14px 16px 12px; flex-shrink: 0; }
    }
  `]
})
export class BloodWorkDetailDialogComponent implements OnInit {
  private bloodWorkService = inject(BloodWorkService);
  private data: { reportId: number } = inject(MAT_DIALOG_DATA);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  report = signal<BloodWorkReport | null>(null);

  ngOnInit() {
    this.bloodWorkService.getById(this.data.reportId).subscribe({
      next: r => { this.report.set(r); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  normalCount(): number {
    if (!this.report()) return 0;
    return this.report()!.results.filter(r => this.hasRange(r) && !this.isAbnormal(r)).length;
  }

  abnormalCount(): number {
    if (!this.report()) return 0;
    return this.report()!.results.filter(r => this.isAbnormal(r)).length;
  }

  noRangeCount(): number {
    if (!this.report()) return 0;
    return this.report()!.results.filter(r => !this.hasRange(r)).length;
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
