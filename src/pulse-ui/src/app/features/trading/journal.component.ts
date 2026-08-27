import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TradingService } from '../../core/services/trading.service';
import { TradeEntry, TradingSetupSummary } from '../../core/models/trading.model';
import { NotificationService } from '../../core/services/notification.service';
import { TradeEntryDialogComponent } from './trade-entry-dialog.component';

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatDialogModule, MatTooltipModule,
    MatProgressSpinnerModule, CurrencyPipe, DatePipe, DecimalPipe
  ],
  template: `
    <div class="page-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="banner-icon"><mat-icon>auto_stories</mat-icon></div>
        <h2>Trade Journal</h2>
        <p class="banner-subtitle">Every trade tells a story. Learn from yours.</p>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner></mat-spinner></div>
    } @else {
    <div class="stats-row">
      <div class="stat-card stat-blue">
        <mat-icon>bar_chart</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ trades().length }}</span>
          <span class="stat-label">Total Trades</span>
        </div>
      </div>
      <div class="stat-card stat-green">
        <mat-icon>percent</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ winRate() | number:'1.0-0' }}%</span>
          <span class="stat-label">Win Rate</span>
        </div>
      </div>
      <div class="stat-card" [class.stat-green]="totalNetPnl() >= 0" [class.stat-red]="totalNetPnl() < 0">
        <mat-icon>account_balance_wallet</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ totalNetPnl() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="stat-label">Net P&L</span>
        </div>
      </div>
      <div class="stat-card stat-amber">
        <mat-icon>receipt_long</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ totalFees() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="stat-label">Total Fees</span>
        </div>
      </div>
      <div class="stat-card" [class.stat-green]="avgPnl() >= 0" [class.stat-red]="avgPnl() < 0">
        <mat-icon>trending_up</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ avgPnl() | currency:'USD':'symbol':'1.0-0' }}</span>
          <span class="stat-label">Avg P&L</span>
        </div>
      </div>
      <div class="stat-card stat-purple">
        <mat-icon>verified</mat-icon>
        <div class="stat-content">
          <span class="stat-value">{{ complianceRate() | number:'1.0-0' }}%</span>
          <span class="stat-label">Compliance</span>
        </div>
      </div>
    </div>

    <div class="controls-row">
      <div class="month-nav">
        <button mat-icon-button (click)="prevMonth()"><mat-icon>chevron_left</mat-icon></button>
        <span class="month-label">{{ monthLabel() }}</span>
        <button mat-icon-button (click)="nextMonth()"><mat-icon>chevron_right</mat-icon></button>
      </div>
      <div class="filter-chips">
        <button mat-stroked-button [class.active-chip]="filter() === 'all'" (click)="filter.set('all')">All</button>
        <button mat-stroked-button [class.active-chip]="filter() === 'compliant'" (click)="filter.set('compliant')">
          <mat-icon>check_circle</mat-icon> Compliant
        </button>
        <button mat-stroked-button [class.active-chip]="filter() === 'non-compliant'" (click)="filter.set('non-compliant')">
          <mat-icon>cancel</mat-icon> Non-Compliant
        </button>
      </div>
      <button mat-raised-button color="primary" (click)="openAddTrade()">
        <mat-icon>add</mat-icon> Quick Add
      </button>
    </div>

    @if (filteredTrades().length > 0) {
      <!-- Desktop table -->
      <mat-card class="desktop-only">
        <mat-card-content>
          <div class="table-wrapper">
            <table mat-table [dataSource]="filteredTrades()">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let t">{{ t.date | date:'MMM d, h:mm a' }}</td>
              </ng-container>
              <ng-container matColumnDef="setup">
                <th mat-header-cell *matHeaderCellDef>Setup</th>
                <td mat-cell *matCellDef="let t">
                  <span class="setup-badge">{{ t.setupName || 'Unknown' }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="instrument">
                <th mat-header-cell *matHeaderCellDef>Instrument</th>
                <td mat-cell *matCellDef="let t">
                  {{ t.instrument }}
                  @if (t.spreadType) {
                    <span class="spread-badge">{{ t.spreadType }}</span>
                  }
                  @if (t.expirationDate) {
                    <span class="expiry-label">{{ t.expirationDate | date:'M/d' }}</span>
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="direction">
                <th mat-header-cell *matHeaderCellDef>Dir</th>
                <td mat-cell *matCellDef="let t">
                  <span class="dir-pill" [class.dir-long]="t.direction === 'long'" [class.dir-short]="t.direction === 'short'">
                    {{ t.direction === 'long' ? 'LONG' : 'SHORT' }}
                  </span>
                </td>
              </ng-container>
              <ng-container matColumnDef="pnl">
                <th mat-header-cell *matHeaderCellDef>P&L</th>
                <td mat-cell *matCellDef="let t">
                  <div class="pnl-breakdown">
                    <span class="pnl-gross" [class.pnl-positive]="(t.pnl ?? 0) >= 0" [class.pnl-negative]="(t.pnl ?? 0) < 0">
                      {{ (t.pnl ?? 0) >= 0 ? '+' : '' }}{{ t.pnl | currency }}
                    </span>
                    @if (t.totalFees) {
                      <span class="pnl-fees">-{{ t.totalFees | currency }} fees</span>
                    }
                    @if (t.netPnl != null) {
                      <span class="pnl-net" [class.pnl-positive]="(t.netPnl ?? 0) >= 0" [class.pnl-negative]="(t.netPnl ?? 0) < 0">
                        Net: {{ (t.netPnl ?? 0) >= 0 ? '+' : '' }}{{ t.netPnl | currency }}
                      </span>
                    }
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="compliance">
                <th mat-header-cell *matHeaderCellDef>Checklist</th>
                <td mat-cell *matCellDef="let t">
                  <mat-icon class="compliance-icon" [class.compliant]="t.checklistCompleted" [class.non-compliant]="!t.checklistCompleted">
                    {{ t.checklistCompleted ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let t">
                  <button mat-icon-button (click)="editTrade(t)" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteTrade(t)" matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"
                  [class.row-non-compliant]="!row.checklistCompleted"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Mobile card feed -->
      <div class="mobile-feed">
        @for (t of filteredTrades(); track t.id) {
          <div class="trade-card" [class.card-non-compliant]="!t.checklistCompleted" (click)="editTrade(t)">
            <div class="trade-left">
              <div class="trade-dir-dot" [class.dot-long]="t.direction === 'long'" [class.dot-short]="t.direction === 'short'">
                <mat-icon>{{ t.direction === 'long' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </div>
            </div>
            <div class="trade-mid">
              <span class="trade-instrument">{{ t.instrument }}
                @if (t.spreadType) { <span class="spread-badge-sm">{{ t.spreadType }}</span> }
                <span class="setup-badge-sm">{{ t.setupName }}</span>
              </span>
              <span class="trade-meta">{{ t.date | date:'MMM d, h:mm a' }} · {{ t.quantity }} contracts
                @if (t.expirationDate) { · exp {{ t.expirationDate | date:'M/d' }} }
              </span>
            </div>
            <div class="trade-right">
              <span class="pnl-value" [class.pnl-positive]="(t.netPnl ?? t.pnl ?? 0) >= 0" [class.pnl-negative]="(t.netPnl ?? t.pnl ?? 0) < 0">
                {{ (t.netPnl ?? t.pnl ?? 0) >= 0 ? '+' : '' }}{{ (t.netPnl ?? t.pnl) | currency }}
              </span>
              @if (t.totalFees) {
                <span class="mobile-fees">{{ t.totalFees | currency }} fees</span>
              }
              <mat-icon class="compliance-icon-sm" [class.compliant]="t.checklistCompleted" [class.non-compliant]="!t.checklistCompleted">
                {{ t.checklistCompleted ? 'check_circle' : 'cancel' }}
              </mat-icon>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="empty-state">
        <div class="empty-icon-wrap">
          <mat-icon>auto_stories</mat-icon>
        </div>
        <h3>No trades logged</h3>
        <p>Use the checklist to log your first trade, or quick-add a past trade.</p>
        <button mat-raised-button color="primary" (click)="openAddTrade()">
          <mat-icon>add</mat-icon> Log a Trade
        </button>
      </div>
    }
    }
  `,
  styles: [`
    :host { display: block; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
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
      width: 52px; height: 52px; border-radius: 16px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px; border: 1px solid rgba(255,255,255,0.3);
    }
    .banner-icon mat-icon { font-size: 26px; width: 26px; height: 26px; color: #fff; }
    h2 { margin: 0; color: #fff; font-size: 1.4rem; font-weight: 700; }
    .banner-subtitle { color: rgba(255,255,255,0.75); font-size: 0.85rem; margin: 4px 0 0; }

    .stats-row {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-sm); margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--color-surface); border-radius: var(--radius-md);
      padding: 16px; box-shadow: var(--shadow-sm);
    }
    .stat-card > mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .stat-card.stat-blue > mat-icon { color: var(--color-stat-blue); }
    .stat-card.stat-green > mat-icon { color: var(--color-stat-green); }
    .stat-card.stat-red > mat-icon { color: var(--color-stat-red); }
    .stat-card.stat-purple > mat-icon { color: var(--color-stat-purple); }
    .stat-card.stat-amber > mat-icon { color: var(--color-stat-amber); }
    .stat-content { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.2rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .stat-label { font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.02em; }

    .controls-row {
      display: flex; align-items: center; gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md); flex-wrap: wrap;
    }
    .month-nav {
      display: flex; align-items: center; gap: var(--spacing-xs);
      background: var(--color-surface-secondary); border-radius: var(--radius-full); padding: 4px;
    }
    .month-label { font-size: var(--text-sm); font-weight: 600; min-width: 120px; text-align: center; }
    .filter-chips { display: flex; gap: 6px; flex: 1; }
    .filter-chips button { font-size: 0.75rem; border-radius: var(--radius-full) !important; }
    .filter-chips button mat-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 2px; }
    .active-chip { background: var(--color-primary) !important; color: #fff !important; }

    .table-wrapper { overflow-x: auto; }
    table { width: 100%; min-width: 650px; }
    .setup-badge {
      display: inline-block; padding: 3px 10px; border-radius: var(--radius-full);
      font-size: 0.72rem; font-weight: 600; background: var(--color-stat-blue-bg); color: var(--color-stat-blue);
    }
    .spread-badge {
      display: inline-block; padding: 2px 6px; border-radius: var(--radius-full);
      font-size: 0.65rem; font-weight: 600; background: var(--color-stat-purple-bg); color: var(--color-stat-purple);
      margin-left: 4px; vertical-align: middle;
    }
    .spread-badge-sm {
      font-size: 0.6rem; padding: 1px 5px; border-radius: var(--radius-full);
      background: var(--color-stat-purple-bg); color: var(--color-stat-purple); font-weight: 600; margin-left: 4px;
    }
    .expiry-label {
      font-size: 0.68rem; color: var(--color-text-muted); margin-left: 6px;
    }
    .dir-pill {
      display: inline-block; padding: 2px 8px; border-radius: var(--radius-full);
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
    }
    .dir-long { background: var(--color-stat-green-bg); color: var(--color-success); }
    .dir-short { background: var(--color-stat-red-bg); color: var(--color-danger); }
    .pnl-value { font-weight: 700; }
    .pnl-positive { color: var(--color-success); }
    .pnl-negative { color: var(--color-danger); }
    .pnl-breakdown { display: flex; flex-direction: column; gap: 1px; }
    .pnl-gross { font-size: 0.8rem; font-weight: 600; }
    .pnl-fees { font-size: 0.68rem; color: var(--color-text-muted); }
    .pnl-net { font-size: 0.78rem; font-weight: 700; }
    .mobile-fees { font-size: 0.65rem; color: var(--color-text-muted); }
    .compliance-icon { font-size: 20px; width: 20px; height: 20px; }
    .compliance-icon.compliant { color: var(--color-success); }
    .compliance-icon.non-compliant { color: var(--color-danger); }
    .row-non-compliant { background: var(--color-stat-red-bg) !important; }

    /* Mobile feed */
    .mobile-feed { display: none; }
    .trade-card {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 4px; border-bottom: 1px solid var(--color-border); cursor: pointer;
    }
    .trade-card:active { background: var(--color-surface-hover); }
    .card-non-compliant { background: var(--color-stat-red-bg); border-radius: var(--radius-sm); }
    .trade-dir-dot {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .trade-dir-dot mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .dot-long { background: var(--color-stat-green-bg); }
    .dot-long mat-icon { color: var(--color-success); }
    .dot-short { background: var(--color-stat-red-bg); }
    .dot-short mat-icon { color: var(--color-danger); }
    .trade-mid { flex: 1; min-width: 0; }
    .trade-instrument { display: block; font-weight: 600; font-size: 0.9rem; }
    .setup-badge-sm {
      font-size: 0.65rem; padding: 1px 6px; border-radius: var(--radius-full);
      background: var(--color-stat-blue-bg); color: var(--color-stat-blue); font-weight: 600; margin-left: 6px;
    }
    .trade-meta { display: block; font-size: 0.72rem; color: var(--color-text-muted); }
    .trade-right { text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .compliance-icon-sm { font-size: 14px; width: 14px; height: 14px; }

    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 20px;
      background: var(--color-stat-blue-bg); display: flex;
      align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; color: var(--color-stat-blue); }
    .empty-state h3 { margin: 0 0 8px; font-weight: 700; }
    .empty-state p { color: var(--color-text-secondary); margin: 0 0 20px; font-size: 0.9rem; }

    .desktop-only { display: block; }
    @media (max-width: 599px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .controls-row { flex-direction: column; align-items: stretch; }
      .filter-chips { justify-content: center; }
      .desktop-only { display: none !important; }
      .mobile-feed { display: block; }
      .page-banner { margin: -16px -16px 20px; padding: 32px 16px 24px; }
    }
  `]
})
export class JournalComponent implements OnInit {
  private tradingService = inject(TradingService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  trades = signal<TradeEntry[]>([]);
  setups = signal<TradingSetupSummary[]>([]);
  filter = signal<'all' | 'compliant' | 'non-compliant'>('all');
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  monthLabel = signal('');
  columns = ['date', 'setup', 'instrument', 'direction', 'pnl', 'compliance', 'actions'];

  filteredTrades = computed(() => {
    const f = this.filter();
    if (f === 'all') return this.trades();
    return this.trades().filter(t => f === 'compliant' ? t.checklistCompleted : !t.checklistCompleted);
  });

  winRate = computed(() => {
    const t = this.trades();
    if (!t.length) return 0;
    return (t.filter(x => (x.pnl ?? 0) > 0).length / t.length) * 100;
  });

  avgPnl = computed(() => {
    const t = this.trades();
    if (!t.length) return 0;
    return t.reduce((s, x) => s + (x.pnl ?? 0), 0) / t.length;
  });

  totalFees = computed(() => {
    return this.trades().reduce((s, x) => s + (x.totalFees ?? 0), 0);
  });

  totalNetPnl = computed(() => {
    return this.trades().reduce((s, x) => s + (x.netPnl ?? x.pnl ?? 0), 0);
  });

  complianceRate = computed(() => {
    const t = this.trades();
    if (!t.length) return 0;
    return (t.filter(x => x.checklistCompleted).length / t.length) * 100;
  });

  ngOnInit(): void {
    this.updateMonthLabel();
    this.loadTrades();
    this.tradingService.getSetups().subscribe(s => this.setups.set(s));
  }

  loadTrades(): void {
    const from = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    const to = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${lastDay}`;
    this.tradingService.getTrades(from, to).subscribe({
      next: data => { this.trades.set(data); this.loading.set(false); },
      error: () => { this.trades.set([]); this.loading.set(false); }
    });
  }

  prevMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 1) { this.currentMonth = 12; this.currentYear--; }
    this.updateMonthLabel();
    this.loadTrades();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 12) { this.currentMonth = 1; this.currentYear++; }
    this.updateMonthLabel();
    this.loadTrades();
  }

  private updateMonthLabel(): void {
    const d = new Date(this.currentYear, this.currentMonth - 1);
    this.monthLabel.set(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  }

  openAddTrade(): void {
    const ref = this.dialog.open(TradeEntryDialogComponent, {
      width: '500px', data: { trade: null, setups: this.setups() }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadTrades(); });
  }

  editTrade(t: TradeEntry): void {
    const ref = this.dialog.open(TradeEntryDialogComponent, {
      width: '500px', data: { trade: t, setups: this.setups() }
    });
    ref.afterClosed().subscribe(r => { if (r) this.loadTrades(); });
  }

  deleteTrade(t: TradeEntry): void {
    if (!confirm('Delete this trade entry?')) return;
    this.tradingService.deleteTrade(t.id).subscribe({
      next: () => { this.notify.success('Trade deleted'); this.loadTrades(); },
      error: () => this.notify.error('Failed to delete trade')
    });
  }
}
