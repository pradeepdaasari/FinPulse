import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { TradingService } from '../../core/services/trading.service';
import { TradingSetupSummary } from '../../core/models/trading.model';
import { SetupEditorDialogComponent } from './setup-editor-dialog.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-setups',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>tune</mat-icon></div>
        <h2>My Setups</h2>
        <p class="banner-subtitle">Define your edge. Trade only what you've mastered.</p>
      </div>
    </div>

    @if (setups().length > 3) {
      <div class="mentor-tip">
        <mat-icon>lightbulb</mat-icon>
        <span>Focus on mastering 1–2 setups. More setups = more confusion = more losses. Simplify.</span>
      </div>
    }

    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openEditor(null)">
        <mat-icon>add</mat-icon> New Setup
      </button>
    </div>

    @if (loading()) {
      <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (setups().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap">
          <mat-icon>tune</mat-icon>
        </div>
        <h3>No Setups Defined</h3>
        <p>A setup is your repeatable trading strategy with a checklist.<br>Define your edge — then trade ONLY that.</p>
        <button mat-raised-button color="primary" (click)="openEditor(null)">
          <mat-icon>add</mat-icon> Create Your First Setup
        </button>
      </div>
    } @else {
      <div class="setups-grid">
        @for (setup of setups(); track setup.id) {
          <div class="setup-card" [class.inactive]="!setup.isActive">
            <div class="setup-card-header">
              <div class="setup-icon" [class.active-icon]="setup.isActive">
                <mat-icon>{{ setup.isActive ? 'verified' : 'pause_circle' }}</mat-icon>
              </div>
              <div class="setup-info">
                <span class="setup-name">{{ setup.name }}</span>
                @if (setup.description) {
                  <span class="setup-desc">{{ setup.description }}</span>
                }
              </div>
              <span class="status-chip" [class.active-chip]="setup.isActive" [class.inactive-chip]="!setup.isActive">
                {{ setup.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <div class="setup-stats">
              <div class="setup-stat">
                <mat-icon>checklist</mat-icon>
                <span>{{ setup.itemCount }} items</span>
              </div>
              <div class="setup-stat">
                <mat-icon>receipt_long</mat-icon>
                <span>{{ setup.tradeCount }} trades</span>
              </div>
            </div>

            @if (setup.tradeCount > 0) {
              <div class="win-rate-bar">
                <div class="win-rate-fill" [style.width.%]="setup.winRate ?? 0"></div>
              </div>
              <span class="win-rate-label">{{ setup.winRate ?? 0 }}% win rate</span>
            }

            <div class="setup-actions">
              <button mat-button (click)="openEditor(setup)">
                <mat-icon>edit</mat-icon> Edit
              </button>
              <button mat-button color="warn" (click)="deleteSetup(setup)">
                <mat-icon>delete</mat-icon> Delete
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .page-banner {
      position: relative; margin: -24px -24px 24px; padding: 40px 24px 32px;
      background: var(--gradient-primary); border-radius: 0 0 var(--radius-lg) var(--radius-lg); overflow: hidden;
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
    h2 { margin: 0; color: #fff; font-size: 1.5rem; font-weight: 700; }
    .banner-subtitle { color: rgba(255,255,255,0.75); font-size: 0.9rem; margin: 4px 0 0; }

    .mentor-tip {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; margin-bottom: var(--spacing-md);
      border-radius: var(--radius-md); background: var(--color-stat-amber-bg);
      border: 1px solid rgba(255, 149, 0, 0.2);
      font-size: 0.85rem; font-weight: 500; color: var(--color-warning);
    }
    .mentor-tip mat-icon { flex-shrink: 0; }

    .header-row { display: flex; margin-bottom: var(--spacing-md); }

    .loading-center { display: flex; justify-content: center; align-items: center; min-height: 40vh; }

    .empty-state {
      text-align: center; padding: 48px 24px;
      background: var(--color-surface); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 18px;
      background: var(--color-stat-purple-bg); display: flex;
      align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--color-stat-purple); }
    .empty-state h3 { margin: 0 0 8px; font-weight: 700; }
    .empty-state p { color: var(--color-text-secondary); font-size: 0.9rem; margin: 0 0 20px; }

    .setups-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md); }

    .setup-card {
      background: var(--color-surface); border-radius: var(--radius-md);
      padding: 18px; box-shadow: var(--shadow-sm);
      transition: box-shadow 0.2s ease, transform 0.15s ease;
    }
    .setup-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .setup-card.inactive { opacity: 0.65; }

    .setup-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
    .setup-icon {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-surface-secondary);
    }
    .setup-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-text-muted); }
    .setup-icon.active-icon { background: var(--color-stat-green-bg); }
    .setup-icon.active-icon mat-icon { color: var(--color-success); }
    .setup-info { flex: 1; min-width: 0; }
    .setup-name { display: block; font-weight: 700; font-size: 1rem; }
    .setup-desc { display: block; font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .status-chip {
      font-size: 0.68rem; font-weight: 700; padding: 3px 8px;
      border-radius: var(--radius-full); text-transform: uppercase;
    }
    .active-chip { background: var(--color-stat-green-bg); color: var(--color-success); }
    .inactive-chip { background: var(--color-surface-secondary); color: var(--color-text-muted); }

    .setup-stats { display: flex; gap: 16px; margin-bottom: 12px; }
    .setup-stat {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 500;
    }
    .setup-stat mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .win-rate-bar {
      height: 6px; border-radius: 3px; background: var(--color-surface-secondary);
      overflow: hidden; margin-bottom: 4px;
    }
    .win-rate-fill { height: 100%; border-radius: 3px; background: var(--color-success); transition: width 0.3s ease; }
    .win-rate-label { font-size: 0.72rem; font-weight: 600; color: var(--color-success); }

    .setup-actions {
      display: flex; gap: 8px; margin-top: 12px; border-top: 1px solid var(--color-border); padding-top: 10px;
    }
    .setup-actions button mat-icon { font-size: 16px; width: 16px; height: 16px; }

    @media (max-width: 599px) {
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
      .setups-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SetupsComponent implements OnInit {
  private tradingService = inject(TradingService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);

  setups = signal<TradingSetupSummary[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadSetups();
  }

  loadSetups(): void {
    this.loading.set(true);
    this.tradingService.getSetups().subscribe({
      next: (data) => { this.setups.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  openEditor(setup: TradingSetupSummary | null): void {
    if (setup) {
      this.tradingService.getSetup(setup.id).subscribe(fullSetup => {
        this.openDialog(fullSetup);
      });
    } else {
      this.openDialog(null);
    }
  }

  private openDialog(setup: any): void {
    const ref = this.dialog.open(SetupEditorDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: { setup }
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadSetups();
    });
  }

  deleteSetup(setup: TradingSetupSummary): void {
    if (confirm(`Delete setup "${setup.name}"?`)) {
      this.tradingService.deleteSetup(setup.id).subscribe({
        next: () => { this.notify.success('Setup deleted'); this.loadSetups(); },
        error: () => this.notify.error('Failed to delete setup')
      });
    }
  }
}
