import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TradingService } from '../../core/services/trading.service';
import { NotificationService } from '../../core/services/notification.service';
import { TradeNote, TradeNoteEmotion } from '../../core/models/trading.model';
import { RichTextEditorComponent } from '../../shared/rich-text-editor.component';

export interface TradeNoteDialogData {
  tradeId: number;
  instrument: string;
  note?: TradeNote;
}

const EMOTIONS: { value: TradeNoteEmotion; label: string; icon: string }[] = [
  { value: 'confident', label: 'Confident', icon: '💪' },
  { value: 'calm', label: 'Calm', icon: '😌' },
  { value: 'neutral', label: 'Neutral', icon: '😐' },
  { value: 'anxious', label: 'Anxious', icon: '😰' },
  { value: 'frustrated', label: 'Frustrated', icon: '😤' },
  { value: 'fomo', label: 'FOMO', icon: '🫣' },
  { value: 'relieved', label: 'Relieved', icon: '😮‍💨' },
];

@Component({
  selector: 'app-trade-note-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, RichTextEditorComponent
  ],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon">
          <mat-icon>{{ data.note ? 'edit_note' : 'add_comment' }}</mat-icon>
        </div>
        <div class="banner-text">
          <h2>{{ data.note ? 'Edit Note' : 'Add Note' }}</h2>
          <p>{{ data.instrument }}</p>
        </div>
        <span class="banner-spacer"></span>
        <button mat-icon-button mat-dialog-close class="header-close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <mat-dialog-content>
      <div class="emotion-section">
        <label class="section-label">
          <mat-icon>mood</mat-icon> Emotion Tag
        </label>
        <div class="emotion-pills">
          @for (e of emotions; track e.value) {
            <button class="emotion-pill" [attr.data-emotion]="e.value"
                    [class.selected]="selectedEmotion() === e.value"
                    (click)="selectedEmotion.set(e.value)">
              <span class="emotion-icon">{{ e.icon }}</span>
              <span class="emotion-label">{{ e.label }}</span>
            </button>
          }
        </div>
      </div>

      <div class="note-section">
        <app-rich-text-editor
          label="Note"
          [(ngModel)]="noteText"
          placeholder="Quick thought about this trade..."
          height="120px">
        </app-rich-text-editor>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button class="save-action-btn"
              [disabled]="!hasContent() || saving()"
              (click)="save()">
        @if (saving()) {
          <span class="btn-spinner"></span>
        } @else {
          <mat-icon>{{ data.note ? 'check' : 'send' }}</mat-icon>
        }
        {{ saving() ? 'Saving...' : (data.note ? 'Update' : 'Save') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }

    .dialog-banner {
      position: relative;
      padding: 18px 20px;
      background: var(--gradient-primary);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.07) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%);
    }
    .banner-content { position: relative; display: flex; align-items: center; gap: 12px; }
    .banner-icon {
      width: 38px; height: 38px; border-radius: var(--radius-md);
      background: rgba(255,255,255,0.18);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; border: 1px solid rgba(255,255,255,0.25);
    }
    .banner-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: #fff; }
    .banner-text h2 { margin: 0; color: #fff; font-size: 0.95rem; font-weight: var(--weight-bold); letter-spacing: -0.02em; }
    .banner-text p { color: rgba(255,255,255,0.7); font-size: var(--text-xs); margin: 1px 0 0; }
    .banner-spacer { flex: 1; }
    .header-close { color: rgba(255,255,255,0.7) !important; }

    mat-dialog-content { padding: 20px 24px 8px !important; }

    .emotion-section { margin-bottom: 20px; }

    .section-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.8rem; font-weight: var(--weight-semibold);
      color: var(--color-text-secondary); margin-bottom: 10px;
    }
    .section-label mat-icon {
      font-size: 16px; width: 16px; height: 16px;
      color: var(--color-primary); opacity: 0.7;
    }

    .emotion-pills { display: flex; flex-wrap: wrap; gap: 8px; }
    .emotion-pill {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: var(--radius-full);
      border: 1.5px solid var(--color-border);
      background: var(--color-surface-solid);
      cursor: pointer; transition: all var(--transition-fast);
      font-size: 0.82rem; font-weight: var(--weight-medium);
      color: var(--color-text-secondary); font-family: inherit;
    }
    .emotion-pill:hover { border-color: var(--color-text-muted); }
    .emotion-icon { font-size: 17px; line-height: 1; }
    .emotion-label { white-space: nowrap; }

    /* Color-coded selected states */
    .emotion-pill.selected[data-emotion="confident"] {
      border-color: #34c759; background: rgba(52,199,89,0.1); color: #28a745;
    }
    .emotion-pill.selected[data-emotion="calm"] {
      border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary);
    }
    .emotion-pill.selected[data-emotion="neutral"] {
      border-color: #8e8e93; background: rgba(142,142,147,0.1); color: #636366;
    }
    .emotion-pill.selected[data-emotion="anxious"] {
      border-color: #ff9500; background: rgba(255,149,0,0.1); color: #e08600;
    }
    .emotion-pill.selected[data-emotion="frustrated"] {
      border-color: #ff3b30; background: rgba(255,59,48,0.08); color: #e0342a;
    }
    .emotion-pill.selected[data-emotion="fomo"] {
      border-color: #af52de; background: rgba(175,82,222,0.1); color: #9b3dc8;
    }
    .emotion-pill.selected[data-emotion="relieved"] {
      border-color: #30d158; background: rgba(48,209,88,0.1); color: #28b54a;
    }

    .note-section { margin-bottom: 0; }

    /* Actions */
    mat-dialog-actions {
      padding: 12px 24px 16px !important;
      gap: 10px; justify-content: flex-end;
    }
    .cancel-btn {
      font-size: 0.85rem !important; font-weight: var(--weight-semibold) !important;
      color: var(--color-text-secondary) !important;
    }
    .save-action-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 22px; border: none; border-radius: var(--radius-md);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.85rem; font-weight: var(--weight-bold);
      font-family: inherit; cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
      transition: all var(--transition-fast);
    }
    .save-action-btn:hover:not(:disabled) {
      box-shadow: 0 4px 14px rgba(0, 122, 255, 0.35);
      transform: translateY(-1px);
    }
    .save-action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .save-action-btn mat-icon { font-size: 17px; width: 17px; height: 17px; }
    .btn-spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 599px) {
      .dialog-banner { padding: 14px 16px; }
      mat-dialog-content { padding: 16px 16px 8px !important; }
      mat-dialog-actions { padding: 10px 16px 14px !important; }
      .emotion-pills { gap: 6px; }
      .emotion-pill { padding: 6px 11px; font-size: 0.78rem; }
    }
  `]
})
export class TradeNoteDialogComponent implements OnInit {
  data = inject<TradeNoteDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<TradeNoteDialogComponent>);
  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);

  emotions = EMOTIONS;
  selectedEmotion = signal<TradeNoteEmotion>('neutral');
  noteText = '';
  saving = signal(false);

  hasContent(): boolean {
    return this.noteText.replace(/<[^>]*>/g, '').trim().length > 0;
  }

  ngOnInit(): void {
    if (this.data.note) {
      this.noteText = this.data.note.note;
      this.selectedEmotion.set(this.data.note.emotion ?? 'neutral');
    }
  }

  save(): void {
    if (!this.hasContent()) return;
    this.saving.set(true);
    const dto = { note: this.noteText, emotion: this.selectedEmotion() };

    const obs = this.data.note
      ? this.tradingService.updateTradeNote(this.data.tradeId, this.data.note.id, dto)
      : this.tradingService.createTradeNote(this.data.tradeId, dto);

    obs.subscribe({
      next: (result) => {
        this.notify.success(this.data.note ? 'Note updated' : 'Note saved');
        this.dialogRef.close(result);
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Failed to save note');
      }
    });
  }
}
