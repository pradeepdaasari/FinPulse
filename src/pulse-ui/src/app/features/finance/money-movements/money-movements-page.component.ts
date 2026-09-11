import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MoneyMovementService } from '../../../core/services/money-movement.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MoneyMovement, MovementType } from '../../../core/models/money-movement.model';
import { AddMovementDialogComponent } from '../../../shared/add-movement-dialog.component';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';

@Component({
  selector: 'app-money-movements-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatTableModule, MatChipsModule, MatIconModule, MatButtonModule, CurrencyPipe, DatePipe, LocalDatePipe, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadMovements()">
      <div class="header-row">
        <div>
          <h2 class="page-title">Money Flow</h2>
          <p class="page-subtitle">Track where your money moves</p>
        </div>
        <button mat-flat-button color="primary" class="add-btn" (click)="addMovement()">
          <mat-icon>add</mat-icon> Add Movement
        </button>
      </div>

      <div class="filter-section">
        <div class="filter-row">
          <mat-chip-set>
            <mat-chip [highlighted]="activeFilter() === 'all'" (click)="filterByType('all')">All</mat-chip>
            <mat-chip [highlighted]="activeFilter() === 'LoanFunding'" (click)="filterByType('LoanFunding')">Loan Funding</mat-chip>
            <mat-chip [highlighted]="activeFilter() === 'LoanPayment'" (click)="filterByType('LoanPayment')">Loan Payments</mat-chip>
            <mat-chip [highlighted]="activeFilter() === 'CardPayment'" (click)="filterByType('CardPayment')">Card Payments</mat-chip>
            <mat-chip [highlighted]="activeFilter() === 'Transfer'" (click)="filterByType('Transfer')">Transfers</mat-chip>
            <mat-chip [highlighted]="activeFilter() === 'Deposit'" (click)="filterByType('Deposit')">Deposits</mat-chip>
            <mat-chip [highlighted]="activeFilter() === 'Withdrawal'" (click)="filterByType('Withdrawal')">Withdrawals</mat-chip>
            <mat-chip [highlighted]="activeFilter() === 'TradePnl'" (click)="filterByType('TradePnl')">Trade P&amp;L</mat-chip>
            <mat-chip [highlighted]="activeFilter() === 'TradeFee'" (click)="filterByType('TradeFee')">Trade Fees</mat-chip>
          </mat-chip-set>
        </div>

        <div class="date-filter-row">
          <div class="date-presets">
            @for (p of datePresets; track p.label) {
              <button class="preset-chip" [class.active]="activePreset() === p.label" (click)="applyPreset(p)">
                {{ p.label }}
              </button>
            }
          </div>
          <div class="date-inputs">
            <div class="date-field">
              <label>From</label>
              <input type="date" [ngModel]="dateFrom()" (ngModelChange)="setDateFrom($event)">
            </div>
            <div class="date-field">
              <label>To</label>
              <input type="date" [ngModel]="dateTo()" (ngModelChange)="setDateTo($event)">
            </div>
            @if (dateFrom() || dateTo()) {
              <button class="clear-dates-btn" (click)="clearDates()" aria-label="Clear dates">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
        </div>
      </div>

      @if (loading()) {
        <app-skeleton type="table"></app-skeleton>
      } @else {
        <div class="summary-row">
          <div class="summary-card stat-total">
            <div class="summary-item">
              <div class="stat-icon-pill green-pill">
                <mat-icon>sync_alt</mat-icon>
              </div>
              <div class="stat-content">
                <span class="summary-value">{{ summary().totalAmount | currency }}</span>
                <span class="summary-label">Total Moved</span>
              </div>
            </div>
          </div>
          <div class="summary-card stat-count">
            <div class="summary-item">
              <div class="stat-icon-pill blue-pill">
                <mat-icon>receipt</mat-icon>
              </div>
              <div class="stat-content">
                <span class="summary-value">{{ summary().count }}</span>
                <span class="summary-label">Movements</span>
              </div>
            </div>
          </div>
          <div class="summary-card stat-auto">
            <div class="summary-item">
              <div class="stat-icon-pill purple-pill">
                <mat-icon>auto_awesome</mat-icon>
              </div>
              <div class="stat-content">
                <span class="summary-value">{{ summary().autoCount }}</span>
                <span class="summary-label">Auto-Tracked</span>
              </div>
            </div>
          </div>
          <div class="summary-card stat-manual">
            <div class="summary-item">
              <div class="stat-icon-pill amber-pill">
                <mat-icon>edit</mat-icon>
              </div>
              <div class="stat-content">
                <span class="summary-value">{{ summary().manualCount }}</span>
                <span class="summary-label">Manual</span>
              </div>
            </div>
          </div>
        </div>

        @if (filteredMovements().length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrap blue">
              <mat-icon>sync_alt</mat-icon>
            </div>
            <h3>No money movements yet</h3>
            <p>Movements are auto-tracked when you record loan or credit card payments. You can also add manual entries.</p>
            <button mat-flat-button color="primary" (click)="addMovement()">
              <mat-icon>add</mat-icon> Add First Movement
            </button>
          </div>
        } @else {
          <!-- Desktop table -->
          <mat-card class="desktop-table">
            <div class="table-wrapper">
              <table mat-table [dataSource]="filteredMovements()">
                <ng-container matColumnDef="movementDate">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let m">{{ m.movementDate | localDate:'mediumDate' }}</td>
                </ng-container>

                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let m">
                    <span class="type-badge" [class]="'type-' + m.movementType">
                      {{ typeLabel(m.movementType) }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="from">
                  <th mat-header-cell *matHeaderCellDef>From</th>
                  <td mat-cell *matCellDef="let m">
                    <span class="entity-name">
                      <mat-icon class="entity-icon">{{ entityIcon(m.sourceType) }}</mat-icon>
                      {{ m.sourceName }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="to">
                  <th mat-header-cell *matHeaderCellDef>To</th>
                  <td mat-cell *matCellDef="let m">
                    <span class="entity-name">
                      <mat-icon class="entity-icon">{{ entityIcon(m.destinationType) }}</mat-icon>
                      {{ m.destinationName }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef>Amount</th>
                  <td mat-cell *matCellDef="let m" class="amount-cell">{{ m.amount | currency }}</td>
                </ng-container>

                <ng-container matColumnDef="note">
                  <th mat-header-cell *matHeaderCellDef>Note</th>
                  <td mat-cell *matCellDef="let m" class="note-cell">
                    {{ m.note || '—' }}
                    @if (m.isAutoGenerated) {
                      <mat-icon class="auto-badge" matTooltip="Auto-tracked">auto_awesome</mat-icon>
                    }
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let m">
                    <button mat-icon-button class="action-delete" (click)="deleteMovement(m)" aria-label="Delete">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns;"></tr>
              </table>
            </div>
          </mat-card>

          <!-- Mobile cards -->
          <div class="mobile-cards">
            @for (m of filteredMovements(); track m.id) {
              <div class="movement-card">
                <div class="movement-card-top">
                  <div class="movement-card-icon" [class]="'card-icon-' + m.movementType">
                    <mat-icon>{{ typeIcon(m.movementType) }}</mat-icon>
                  </div>
                  <div class="movement-card-info">
                    <span class="movement-card-type">
                      <span class="type-badge" [class]="'type-' + m.movementType">{{ typeLabel(m.movementType) }}</span>
                      @if (m.isAutoGenerated) {
                        <mat-icon class="auto-badge-sm">auto_awesome</mat-icon>
                      }
                    </span>
                    <span class="movement-card-flow">
                      {{ m.sourceName }} <mat-icon class="flow-arrow">arrow_forward</mat-icon> {{ m.destinationName }}
                    </span>
                    <span class="movement-card-date">{{ m.movementDate | localDate:'mediumDate' }}</span>
                  </div>
                  <div class="movement-card-amount">{{ m.amount | currency }}</div>
                </div>
                @if (m.note) {
                  <div class="movement-card-note">{{ m.note }}</div>
                }
                <div class="movement-card-actions">
                  <button mat-icon-button class="action-delete" (click)="deleteMovement(m)" aria-label="Delete">
                    <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      margin: 2px 0 0;
    }
    .add-btn {
      border-radius: var(--radius-sm) !important;
      font-weight: 600 !important;
    }

    /* --- Filter section --- */
    .filter-section {
      margin-bottom: var(--spacing-md);
    }
    .filter-row {
      margin-bottom: 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .filter-row::-webkit-scrollbar { display: none; }
    mat-chip { cursor: pointer; }

    /* Date filter */
    .date-filter-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .date-presets {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      flex-shrink: 0;
    }
    .date-presets::-webkit-scrollbar { display: none; }
    .preset-chip {
      padding: 6px 14px;
      border-radius: 20px;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text-secondary);
      font-size: 0.8125rem;
      font-weight: 500;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .preset-chip:active {
      transform: scale(0.96);
    }
    .preset-chip.active {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
    }
    .date-inputs {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }
    .date-field {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .date-field label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .date-field input[type="date"] {
      padding: 7px 10px;
      border-radius: 10px;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: 0.8125rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s ease;
      -webkit-appearance: none;
      min-height: 36px;
    }
    .date-field input[type="date"]:focus {
      border-color: var(--color-primary);
    }
    .clear-dates-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--color-surface-secondary);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
      -webkit-tap-highlight-color: transparent;
      flex-shrink: 0;
    }
    .clear-dates-btn:active {
      transform: scale(0.9);
    }
    .clear-dates-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* --- Summary cards (iOS grouped style) --- */
    .summary-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
      margin-bottom: var(--spacing-md);
    }
    .summary-card {
      padding: 14px 16px;
      background: var(--color-surface);
      border-radius: 14px;
      box-shadow: var(--shadow-sm);
    }
    .summary-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stat-icon-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      border-radius: 12px;
    }
    .stat-icon-pill mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .green-pill { background: var(--color-stat-green-bg); color: var(--color-stat-green); }
    .blue-pill { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .purple-pill { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }
    .amber-pill { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }
    .stat-content { display: flex; flex-direction: column; gap: 2px; }
    .summary-label { font-size: 0.6875rem; color: var(--color-text-muted); font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; }
    .summary-value { font-size: 1.1rem; font-weight: 700; font-variant-numeric: tabular-nums; }
    .stat-total .summary-value { color: var(--color-value-green); }
    .stat-count .summary-value { color: var(--color-value-blue); }
    .stat-auto .summary-value { color: var(--color-value-purple); }
    .stat-manual .summary-value { color: var(--color-value-amber); }

    /* --- Desktop table --- */
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 600px; }
    .amount-cell { font-weight: 600; color: var(--color-success); font-variant-numeric: tabular-nums; }
    .note-cell { color: var(--color-text-secondary); font-size: 0.875rem; }
    .entity-name { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; }
    .entity-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }
    .auto-badge {
      font-size: 14px; width: 14px; height: 14px;
      color: var(--color-stat-purple);
      vertical-align: middle;
      margin-left: 4px;
    }

    .type-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .type-LoanFunding { background: rgba(33,150,243,0.1); color: #1976d2; }
    .type-LoanPayment { background: rgba(76,175,80,0.1); color: #388e3c; }
    .type-CardPayment { background: rgba(156,39,176,0.1); color: #7b1fa2; }
    .type-Transfer { background: rgba(0,150,136,0.1); color: #00796b; }
    .type-Deposit { background: rgba(255,152,0,0.1); color: #f57c00; }
    .type-Withdrawal { background: rgba(244,67,54,0.1); color: #d32f2f; }
    .type-TradePnl { background: rgba(0,122,255,0.1); color: #007AFF; }
    .type-TradeFee { background: rgba(255,149,0,0.1); color: #c77700; }

    .action-delete {
      color: var(--color-action-delete) !important;
      width: 34px !important; height: 34px !important;
      border-radius: 8px !important;
    }
    .action-delete mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-delete:hover { background: var(--color-action-delete-bg) !important; }

    /* --- Mobile cards (iOS native feel) --- */
    .mobile-cards { display: none; }
    @media (max-width: 599px) {
      .desktop-table { display: none !important; }
      .mobile-cards { display: block; }
      .summary-row { grid-template-columns: 1fr 1fr; gap: 8px; }
      .summary-card { padding: 12px 14px; }
      .stat-icon-pill { padding: 8px; }
      .stat-icon-pill mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .summary-value { font-size: 1rem; }
      .action-delete { min-width: 44px !important; min-height: 44px !important; }
      .date-filter-row { flex-direction: column; align-items: stretch; }
      .date-inputs { width: 100%; }
      .date-field { flex: 1; }
      .date-field input[type="date"] { width: 100%; }
    }

    .movement-card {
      background: var(--color-surface);
      border-radius: 14px;
      margin-bottom: 10px;
      padding: 14px 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      transition: transform 0.15s ease;
    }
    .movement-card:active {
      transform: scale(0.985);
    }
    .movement-card-top { display: flex; align-items: center; gap: 12px; }
    .movement-card-icon {
      width: 42px; height: 42px; min-width: 42px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .movement-card-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .card-icon-LoanFunding { background: rgba(33,150,243,0.1); color: #1976d2; }
    .card-icon-LoanPayment { background: rgba(76,175,80,0.1); color: #388e3c; }
    .card-icon-CardPayment { background: rgba(156,39,176,0.1); color: #7b1fa2; }
    .card-icon-Transfer { background: rgba(0,150,136,0.1); color: #00796b; }
    .card-icon-Deposit { background: rgba(255,152,0,0.1); color: #f57c00; }
    .card-icon-Withdrawal { background: rgba(244,67,54,0.1); color: #d32f2f; }
    .card-icon-TradePnl { background: rgba(0,122,255,0.1); color: #007AFF; }
    .card-icon-TradeFee { background: rgba(255,149,0,0.1); color: #c77700; }
    .movement-card-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .movement-card-type { display: flex; align-items: center; gap: 6px; }
    .auto-badge-sm { font-size: 14px; width: 14px; height: 14px; color: var(--color-stat-purple); }
    .movement-card-flow {
      font-size: 0.8125rem; color: var(--color-text-secondary);
      display: flex; align-items: center; gap: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .flow-arrow { font-size: 14px; width: 14px; height: 14px; color: var(--color-text-muted); flex-shrink: 0; }
    .movement-card-date { font-size: 0.75rem; color: var(--color-text-muted); }
    .movement-card-amount { font-weight: 700; font-size: 1rem; color: var(--color-success); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .movement-card-note {
      font-size: 0.8125rem; color: var(--color-text-secondary);
      margin-top: 8px; padding-top: 8px;
      border-top: 1px solid var(--color-border);
    }
    .movement-card-actions {
      display: flex; justify-content: flex-end;
      margin-top: 8px; padding-top: 8px;
      border-top: 1px solid var(--color-border);
    }
  `]
})
export class MoneyMovementsPageComponent implements OnInit {
  private movementService = inject(MoneyMovementService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  allMovements = signal<MoneyMovement[]>([]);
  loading = signal(true);
  activeFilter = signal<string>('all');
  dateFrom = signal<string>('');
  dateTo = signal<string>('');
  activePreset = signal<string>('');
  columns = ['movementDate', 'type', 'from', 'to', 'amount', 'note', 'actions'];

  datePresets: { label: string; from: () => string; to: () => string }[] = [
    { label: 'This Month', from: () => this.monthStart(0), to: () => this.toIso(new Date()) },
    { label: 'Last Month', from: () => this.monthStart(-1), to: () => this.monthEnd(-1) },
    { label: 'Last 90 Days', from: () => this.daysAgo(90), to: () => this.toIso(new Date()) },
    { label: 'This Year', from: () => this.yearStart(), to: () => this.toIso(new Date()) },
  ];

  filteredMovements = computed(() => {
    let movements = this.allMovements();
    const filter = this.activeFilter();
    if (filter !== 'all') {
      movements = movements.filter(m => m.movementType === filter);
    }
    const from = this.dateFrom();
    const to = this.dateTo();
    if (from) {
      movements = movements.filter(m => m.movementDate >= from);
    }
    if (to) {
      movements = movements.filter(m => m.movementDate <= to);
    }
    return movements;
  });

  summary = computed(() => {
    const movements = this.filteredMovements();
    return {
      totalAmount: movements.reduce((sum, m) => sum + m.amount, 0),
      count: movements.length,
      autoCount: movements.filter(m => m.isAutoGenerated).length,
      manualCount: movements.filter(m => !m.isAutoGenerated).length
    };
  });

  ngOnInit(): void {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading.set(true);
    this.movementService.getAll().subscribe({
      next: (movements) => {
        this.allMovements.set(movements);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  filterByType(filter: string): void {
    this.activeFilter.set(filter);
  }

  setDateFrom(val: string): void {
    this.dateFrom.set(val);
    this.activePreset.set('');
  }

  setDateTo(val: string): void {
    this.dateTo.set(val);
    this.activePreset.set('');
  }

  applyPreset(p: { label: string; from: () => string; to: () => string }): void {
    if (this.activePreset() === p.label) {
      this.clearDates();
      return;
    }
    this.dateFrom.set(p.from());
    this.dateTo.set(p.to());
    this.activePreset.set(p.label);
  }

  clearDates(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.activePreset.set('');
  }

  typeLabel(type: MovementType): string {
    const labels: Record<string, string> = {
      LoanFunding: 'Loan Funding',
      LoanPayment: 'Loan Payment',
      CardPayment: 'Card Payment',
      Transfer: 'Transfer',
      Deposit: 'Deposit',
      Withdrawal: 'Withdrawal',
      TradePnl: 'Trade P&L',
      TradeFee: 'Trade Fee'
    };
    return labels[type] || type;
  }

  typeIcon(type: MovementType): string {
    const icons: Record<string, string> = {
      LoanFunding: 'account_balance',
      LoanPayment: 'payments',
      CardPayment: 'credit_card',
      Transfer: 'sync_alt',
      Deposit: 'arrow_downward',
      Withdrawal: 'arrow_upward',
      TradePnl: 'candlestick_chart',
      TradeFee: 'receipt_long'
    };
    return icons[type] || 'swap_horiz';
  }

  entityIcon(type: string): string {
    const icons: Record<string, string> = {
      BankAccount: 'account_balance',
      Loan: 'account_balance_wallet',
      CreditCard: 'credit_card',
      External: 'public'
    };
    return icons[type] || 'help_outline';
  }

  addMovement(): void {
    const dialogRef = this.dialog.open(AddMovementDialogComponent, {
      width: '520px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Movement added');
        this.loadMovements();
      }
    });
  }

  deleteMovement(m: MoneyMovement): void {
    if (!this.notify.confirmDelete(`movement of $${m.amount.toFixed(2)}`)) return;
    this.movementService.delete(m.id).subscribe({
      next: () => {
        this.notify.success('Movement deleted');
        this.loadMovements();
      },
      error: () => this.notify.error('Failed to delete movement')
    });
  }

  private toIso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  private daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return this.toIso(d);
  }

  private monthStart(offset: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + offset, 1);
    return this.toIso(d);
  }

  private monthEnd(offset: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + offset + 1, 0);
    return this.toIso(d);
  }

  private yearStart(): string {
    return `${new Date().getFullYear()}-01-01`;
  }
}
