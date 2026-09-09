import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
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
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>auto_fix_high</mat-icon></div>
        <h2>Pre-Market Template</h2>
        <p class="banner-subtitle">Set your defaults — auto-fills every new day</p>
      </div>
    </div>

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

    .page-banner {
      position: relative;
      margin: -24px -24px 24px;
      padding: 40px 24px 32px;
      background: var(--gradient-primary);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content { position: relative; text-align: center; }
    .banner-icon {
      width: 56px; height: 56px; border-radius: 16px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px; border: 1px solid rgba(255,255,255,0.3);
    }
    .banner-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: #fff; }
    h2 { margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .banner-subtitle { color: rgba(255,255,255,0.75); font-size: 0.9rem; margin: 4px 0 0; }

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

    @media (max-width: 599px) {
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
    }
  `]
})
export class PremarketTemplateComponent implements OnInit {
  private tradingService = inject(TradingService);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

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
    this.form.valueChanges.subscribe(v => {
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
    this.form.reset({ keyLevels: '', catalysts: '', plan: '' });
    this.save();
  }
}
