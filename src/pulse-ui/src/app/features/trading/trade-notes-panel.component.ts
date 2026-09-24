import { Component, inject, input, signal, OnInit, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TradingService } from '../../core/services/trading.service';
import { NotificationService } from '../../core/services/notification.service';
import { TradeNote, TradeNoteEmotion } from '../../core/models/trading.model';
import { TradeNoteDialogComponent } from './trade-note-dialog.component';

const EMOTION_MAP: Record<TradeNoteEmotion, { label: string; icon: string; color: string }> = {
  confident: { label: 'Confident', icon: '💪', color: 'var(--color-success)' },
  calm: { label: 'Calm', icon: '😌', color: 'var(--color-stat-blue)' },
  neutral: { label: 'Neutral', icon: '😐', color: 'var(--color-text-muted)' },
  anxious: { label: 'Anxious', icon: '😰', color: 'var(--color-stat-amber)' },
  frustrated: { label: 'Frustrated', icon: '😤', color: 'var(--color-danger)' },
  fomo: { label: 'FOMO', icon: '🫣', color: 'var(--color-stat-purple)' },
  relieved: { label: 'Relieved', icon: '😮‍💨', color: 'var(--color-stat-green)' },
};

@Component({
  selector: 'app-trade-notes-panel',
  standalone: true,
  imports: [
    CommonModule, DatePipe, MatButtonModule, MatIconModule,
    MatDialogModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="notes-panel">
      @if (loading()) {
        <div class="loading-row"><mat-spinner diameter="20"></mat-spinner></div>
      } @else {
        @if (notes().length === 0) {
          <div class="empty-notes">
            <mat-icon>sticky_note_2</mat-icon>
            <span>No notes yet. Capture your thoughts while the trade is live.</span>
          </div>
        } @else {
          <div class="notes-timeline">
            @for (n of notes(); track n.id) {
              <div class="note-card">
                <div class="note-header">
                  @if (n.emotion && emotionInfo(n.emotion); as emo) {
                    <span class="emotion-chip" [style.color]="emo.color">
                      <span class="emotion-chip-icon">{{ emo.icon }}</span> {{ emo.label }}
                    </span>
                  }
                  <span class="note-time">{{ relativeTime(n.createdAt) }}</span>
                  <span class="note-actions">
                    <button mat-icon-button class="note-action-btn" (click)="editNote(n)" matTooltip="Edit">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button class="note-action-btn action-delete" (click)="deleteNote(n)" matTooltip="Delete">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </span>
                </div>
                <p class="note-text" [innerHTML]="n.note"></p>
              </div>
            }
          </div>
        }

        <button mat-stroked-button class="add-note-btn" (click)="addNote()">
          <mat-icon>add_comment</mat-icon> Add Note
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .notes-panel {
      padding: 12px 0 4px;
    }

    .loading-row {
      display: flex; justify-content: center; padding: 16px;
    }

    .empty-notes {
      display: flex; align-items: center; gap: 10px;
      padding: 14px 16px; border-radius: var(--radius-sm);
      background: var(--color-surface-hover);
      color: var(--color-text-secondary); font-size: var(--text-sm);
    }
    .empty-notes mat-icon {
      font-size: 20px; width: 20px; height: 20px;
      color: var(--color-text-muted); flex-shrink: 0;
    }

    .notes-timeline {
      display: flex; flex-direction: column; gap: 8px;
      margin-bottom: 12px;
    }

    .note-card {
      padding: 10px 14px;
      background: var(--color-surface-solid);
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      transition: border-color var(--transition-fast);
    }
    .note-card:hover { border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-border)); }

    .note-header {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 6px;
    }

    .emotion-chip {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: var(--text-xs); font-weight: var(--weight-semibold);
    }
    .emotion-chip-icon { font-size: 14px; line-height: 1; }

    .note-time {
      font-size: 0.65rem; color: var(--color-text-muted);
      font-weight: var(--weight-medium);
    }

    .note-actions {
      margin-left: auto; display: flex; gap: 0; opacity: 0;
      transition: opacity var(--transition-fast);
    }
    .note-card:hover .note-actions { opacity: 1; }

    .note-action-btn {
      width: 28px !important; height: 28px !important; min-width: 28px;
      line-height: 28px !important;
    }
    .note-action-btn mat-icon { font-size: 15px; width: 15px; height: 15px; color: var(--color-text-muted); }
    .action-delete mat-icon { color: var(--color-danger); }

    .note-text {
      margin: 0; font-size: var(--text-sm); line-height: var(--leading-relaxed);
      color: var(--color-text-primary); word-break: break-word;
    }
    .note-text ::ng-deep p { margin: 0; }

    .add-note-btn {
      width: 100%; border-radius: var(--radius-sm) !important;
      font-size: var(--text-xs) !important; font-weight: var(--weight-semibold) !important;
      color: var(--color-primary) !important; border-color: var(--color-border) !important;
      border-style: dashed !important;
    }
    .add-note-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }

    @media (max-width: 599px) {
      .note-actions { opacity: 1; }
    }
  `]
})
export class TradeNotesPanelComponent implements OnInit {
  tradeId = input.required<number>();
  instrument = input<string>('');

  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  notes = signal<TradeNote[]>([]);

  ngOnInit(): void {
    this.loadNotes();
  }

  loadNotes(): void {
    this.tradingService.getTradeNotes(this.tradeId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => { this.notes.set(data); this.loading.set(false); this.cdr.detectChanges(); },
        error: () => { this.notes.set([]); this.loading.set(false); this.cdr.detectChanges(); }
      });
  }

  emotionInfo(emotion: string): { label: string; icon: string; color: string } | null {
    return EMOTION_MAP[emotion as TradeNoteEmotion] ?? null;
  }

  relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  addNote(): void {
    const ref = this.dialog.open(TradeNoteDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: { tradeId: this.tradeId(), instrument: this.instrument() }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadNotes(); });
  }

  editNote(note: TradeNote): void {
    const ref = this.dialog.open(TradeNoteDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: { tradeId: this.tradeId(), instrument: this.instrument(), note }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadNotes(); });
  }

  deleteNote(note: TradeNote): void {
    if (!confirm('Delete this note?')) return;
    this.tradingService.deleteTradeNote(this.tradeId(), note.id).subscribe({
      next: () => { this.notify.success('Note deleted'); this.loadNotes(); },
      error: () => this.notify.error('Failed to delete note')
    });
  }
}
