import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { SkipHistory } from '../../../core/models/recurring.model';

@Component({
  selector: 'app-skip-history-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, MatButtonModule, DatePipe, LocalDatePipe],
  template: `
    <h2 mat-dialog-title>Skip History — {{ data.description }}</h2>
    <mat-dialog-content>
      @if (data.skips.length === 0) {
        <p class="empty">No skips recorded.</p>
      } @else {
        <div class="skip-list">
          @for (s of data.skips; track s.id) {
            <div class="skip-item">
              <div class="skip-date">
                <mat-icon class="skip-icon">skip_next</mat-icon>
                <span>{{ s.skippedDate | localDate:'mediumDate' }}</span>
              </div>
              @if (s.reason) {
                <div class="skip-reason">{{ s.reason }}</div>
              }
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
    .skip-list { display: flex; flex-direction: column; gap: 10px; }
    .skip-item { padding: 10px 12px; border-radius: 8px; background: var(--color-surface-hover, #f5f5f5); }
    .skip-date { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.9rem; }
    .skip-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-warning); }
    .skip-reason { margin-top: 4px; padding-left: 26px; font-size: 0.82rem; color: var(--color-text-muted); }
    .empty { color: var(--color-text-muted); text-align: center; padding: 20px 0; }
  `]
})
export class SkipHistoryDialogComponent {
  data = inject<{ description: string; skips: SkipHistory[] }>(MAT_DIALOG_DATA);
}
