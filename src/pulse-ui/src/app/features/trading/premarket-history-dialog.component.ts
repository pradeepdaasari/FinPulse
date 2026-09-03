import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TradingService } from '../../core/services/trading.service';
import { PreMarketNote } from '../../core/models/trading.model';

@Component({
  selector: 'app-premarket-history-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    <h2 mat-dialog-title>Pre-Market History</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      @if (notes().length === 0) {
        <p class="empty">No past notes found.</p>
      }
      @for (note of notes(); track note.id) {
        <div class="history-card">
          <div class="history-header">
            <span class="history-date">{{ note.date | date:'mediumDate' }}</span>
            <span class="mental-badge" [class]="'mental-' + note.mentalState">{{ note.mentalState }}</span>
            <span class="bias-badge" [class]="'bias-' + note.marketBias">{{ note.marketBias }}</span>
          </div>
          <p class="history-plan" [innerHTML]="note.plan"></p>
          <div class="history-footer">
            <span>Max {{ note.maxTrades }} trades</span>
            <span>Max loss {{ note.maxLoss | currency:'USD':'symbol':'1.0-0' }}</span>
          </div>
        </div>
      }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .empty { color: var(--color-text-muted); text-align: center; padding: 24px; }
    .history-card {
      padding: 14px;
      border-radius: var(--radius-md);
      background: var(--color-surface-secondary);
      margin-bottom: 10px;
    }
    .history-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .history-date { font-weight: 700; font-size: 0.9rem; }
    .mental-badge, .bias-badge {
      font-size: 0.7rem; font-weight: 600; padding: 2px 8px;
      border-radius: var(--radius-full); text-transform: capitalize;
    }
    .mental-green { background: var(--color-stat-green-bg); color: var(--color-success); }
    .mental-yellow { background: var(--color-stat-amber-bg); color: var(--color-warning); }
    .mental-red { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .bias-bullish { background: var(--color-stat-green-bg); color: var(--color-success); }
    .bias-bearish { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .bias-neutral { background: var(--color-stat-blue-bg); color: var(--color-primary); }
    .bias-no-trade { background: var(--color-border); color: var(--color-text-muted); }
    .history-plan { font-size: 0.85rem; margin: 0 0 8px; line-height: 1.4; }
    .history-footer { display: flex; gap: 12px; font-size: 0.75rem; color: var(--color-text-secondary); font-weight: 500; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }

    @media (max-width: 599px) {
      .history-card { padding: 12px; }
      .history-date { font-size: 0.85rem; }
      .history-plan { white-space: normal; }
    }
  `]
})
export class PremarketHistoryDialogComponent implements OnInit {
  private tradingService = inject(TradingService);
  loading = signal(true);
  notes = signal<PreMarketNote[]>([]);

  ngOnInit(): void {
    this.tradingService.getPreMarketNotes().subscribe({
      next: (data) => { this.notes.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }
}
