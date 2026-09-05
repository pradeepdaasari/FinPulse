import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { BloodWorkService } from '../../core/services/blood-work.service';
import { BloodWorkReportSummary } from '../../core/models/blood-work.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-blood-work-page',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, DatePipe, LocalDatePipe, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadReports()">
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAddDialog()">
        <mat-icon>add</mat-icon> Add Report
      </button>
    </div>

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else if (reports().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap red">
          <mat-icon>bloodtype</mat-icon>
        </div>
        <h3>No blood work reports yet</h3>
        <p>Add your lab results to track trends and spot abnormalities over time.</p>
        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>add</mat-icon> Add Your First Report
        </button>
      </div>
    } @else {
      <div class="reports-list">
        @for (report of reports(); track report.id) {
          <div class="report-card" (click)="viewReport(report)">
            <div class="rc-icon">
              <mat-icon>science</mat-icon>
            </div>
            <div class="rc-mid">
              <span class="rc-date">{{ report.reportDate | localDate:'MMM d, yyyy' }}</span>
              <span class="rc-meta">
                @if (report.labName) { {{ report.labName }} · }
                {{ report.resultCount }} tests
              </span>
            </div>
            <div class="rc-right">
              @if (report.abnormalCount > 0) {
                <span class="rc-abnormal">{{ report.abnormalCount }} abnormal</span>
              } @else {
                <span class="rc-normal">All normal</span>
              }
            </div>
            <button mat-icon-button class="rc-delete" (click)="deleteReport(report, $event)">
              <mat-icon>delete_outline</mat-icon>
            </button>
          </div>
        }
      </div>
    }
    </div>
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }

    .empty-state {
      text-align: center; padding: var(--spacing-xl) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-icon-wrap.red { background: rgba(211,47,47,0.1); }
    .empty-icon-wrap.red mat-icon { color: #d32f2f; }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { margin: 0 0 var(--spacing-xs); font-size: 1.1rem; }
    .empty-state p { color: var(--color-text-muted); margin: 0 auto var(--spacing-md); max-width: 360px; }

    .reports-list { display: flex; flex-direction: column; gap: 8px; }
    .report-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 12px; background: var(--color-surface);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);
      cursor: pointer; transition: box-shadow var(--transition-fast);
      position: relative;
    }
    .report-card:active { box-shadow: var(--shadow-md); }
    .rc-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(211,47,47,0.1);
    }
    .rc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: #d32f2f; }
    .rc-mid { flex: 1; min-width: 0; }
    .rc-date { display: block; font-weight: 600; font-size: 0.9rem; }
    .rc-meta { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .rc-right { text-align: right; }
    .rc-abnormal {
      display: inline-block; font-size: 0.7rem; font-weight: 600;
      padding: 3px 8px; border-radius: var(--radius-full);
      background: rgba(211,47,47,0.1); color: #d32f2f;
    }
    .rc-normal {
      display: inline-block; font-size: 0.7rem; font-weight: 600;
      padding: 3px 8px; border-radius: var(--radius-full);
      background: rgba(46,125,50,0.1); color: #2e7d32;
    }
    .rc-delete { position: absolute; top: 4px; right: 4px; opacity: 0; transition: opacity var(--transition-fast); }
    .report-card:hover .rc-delete { opacity: 0.7; }

    @media (max-width: 599px) {
      .rc-delete { opacity: 0.6; min-width: 44px; min-height: 44px; top: 2px; right: 2px; }
    }
  `]
})
export class BloodWorkPageComponent implements OnInit {
  private bloodWorkService = inject(BloodWorkService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  reports = signal<BloodWorkReportSummary[]>([]);

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading.set(true);
    this.bloodWorkService.getAll().subscribe({
      next: r => { this.reports.set(r); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  openAddDialog() {
    import('./add-blood-work-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddBloodWorkDialogComponent, { width: '600px', maxWidth: '95vw', maxHeight: '90vh' });
      ref.afterClosed().subscribe(result => {
        if (result) {
          this.bloodWorkService.create(result).subscribe({
            next: () => { this.notify.success('Report saved'); this.loadReports(); },
            error: () => this.notify.error('Failed to save report')
          });
        }
      });
    });
  }

  viewReport(report: BloodWorkReportSummary) {
    import('./blood-work-detail-dialog.component').then(m => {
      this.dialog.open(m.BloodWorkDetailDialogComponent, {
        width: '600px', maxWidth: '95vw', maxHeight: '90vh',
        data: { reportId: report.id }
      });
    });
  }

  deleteReport(report: BloodWorkReportSummary, event: Event) {
    event.stopPropagation();
    this.loading.set(true);
    this.bloodWorkService.delete(report.id).subscribe({
      next: () => { this.notify.success('Report deleted'); this.loadReports(); },
      error: () => { this.loading.set(false); this.notify.error('Failed to delete'); this.cdr.detectChanges(); }
    });
  }
}
