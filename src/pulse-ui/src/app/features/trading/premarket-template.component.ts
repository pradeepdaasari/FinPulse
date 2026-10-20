import { Component, OnInit, inject, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TradingService } from '../../core/services/trading.service';
import { NotificationService } from '../../core/services/notification.service';
import { RichTextEditorComponent } from '../../shared/rich-text-editor.component';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { PreMarketTemplate } from '../../core/models/trading.model';

@Component({
  selector: 'app-premarket-template',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatIconModule, MatButtonModule,
    RouterModule, DatePipe, RichTextEditorComponent, SkeletonLoaderComponent, PullToRefreshDirective
  ],
  template: `
    <div appPullToRefresh (refresh)="load()">

    <div class="back-row">
      <a mat-button routerLink="/trading/premarket" class="back-link">
        <mat-icon>arrow_back</mat-icon> Back to Pre-Market
      </a>
    </div>

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else {
      <form [formGroup]="form" class="template-form" (ngSubmit)="save()">
        <div class="info-card">
          <mat-icon>info</mat-icon>
          <p>These values auto-populate when you open a new day's pre-market plan. You can still edit them per day.</p>
        </div>

        <div class="form-section">
          <app-rich-text-editor label="Key Levels" formControlName="keyLevels" height="120px"
            placeholder="e.g., SPX 5450 support, 5520 resistance, NQ 19800 pivot"></app-rich-text-editor>
        </div>

        <div class="form-section">
          <app-rich-text-editor label="Catalysts & Events" formControlName="catalysts" height="100px"
            placeholder="e.g., FOMC minutes at 2pm, NVDA earnings, CPI data"></app-rich-text-editor>
        </div>

        <div class="form-section">
          <app-rich-text-editor label="Today's Plan" formControlName="plan" height="150px"
            placeholder="Your default trading plan — what you focus on most days"></app-rich-text-editor>
        </div>

        @if (lastUpdated()) {
          <p class="last-updated">Last saved: {{ lastUpdated() | date:'MMM d, y h:mm a' }}</p>
        }

        <div class="save-row">
          <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
            @if (saving()) {
              <mat-icon class="spin">sync</mat-icon> Saving...
            } @else {
              <mat-icon>save</mat-icon> Save Template
            }
          </button>
          @if (hasContent()) {
            <button mat-stroked-button type="button" color="warn" (click)="clear()">
              <mat-icon>delete_outline</mat-icon> Clear
            </button>
          }
        </div>
      </form>
    }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .back-row { margin-bottom: var(--spacing-md); }
    .back-link { color: var(--color-text-secondary); font-size: 0.85rem; }
    .back-link mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .info-card {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 14px; margin-bottom: var(--spacing-lg);
      border-radius: var(--radius-md);
      background: var(--color-stat-blue-bg);
      border: 1px solid var(--color-primary-light, rgba(33, 150, 243, 0.2));
    }
    .info-card mat-icon { color: var(--color-primary); flex-shrink: 0; margin-top: 1px; }
    .info-card p { margin: 0; font-size: 0.85rem; color: var(--color-text-secondary); line-height: 1.5; }

    .template-form { display: flex; flex-direction: column; gap: 8px; }
    .form-section { margin-bottom: var(--spacing-sm); }

    .last-updated {
      text-align: center; font-size: 0.8rem;
      color: var(--color-text-muted); margin: var(--spacing-sm) 0;
    }

    .save-row {
      display: flex; justify-content: center; gap: 12px;
      margin-top: var(--spacing-md);
    }
    .save-row button mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }

  `]
})
export class PremarketTemplateComponent implements OnInit {
  private tradingService = inject(TradingService);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  saving = signal(false);
  lastUpdated = signal<string | null>(null);

  form = this.fb.group({
    keyLevels: [''],
    catalysts: [''],
    plan: ['']
  });

  hasContent = signal(false);

  ngOnInit(): void {
    this.load();
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => {
      this.hasContent.set(!!(v.keyLevels || v.catalysts || v.plan));
    });
  }

  load(): void {
    this.loading.set(true);
    this.tradingService.getPreMarketTemplate().subscribe({
      next: (t) => {
        this.form.patchValue({
          keyLevels: t.keyLevels || '',
          catalysts: t.catalysts || '',
          plan: t.plan || ''
        });
        this.lastUpdated.set(t.updatedAt || null);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    this.saving.set(true);
    const val = this.form.value;
    this.tradingService.savePreMarketTemplate({
      keyLevels: val.keyLevels || undefined,
      catalysts: val.catalysts || undefined,
      plan: val.plan || undefined
    }).subscribe({
      next: (t) => {
        this.lastUpdated.set(t.updatedAt || null);
        this.saving.set(false);
        this.notify.success('Template saved — will auto-populate new days');
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Failed to save template');
        this.cdr.detectChanges();
      }
    });
  }

  clear(): void {
    if (!confirm('Clear all template fields? This will save immediately.')) return;
    this.form.reset({ keyLevels: '', catalysts: '', plan: '' });
    this.save();
  }
}
