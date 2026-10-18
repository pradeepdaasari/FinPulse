import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalDatePipe } from '../../../shared/local-date.pipe';
import { MatCardModule } from '@angular/material/card';

import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MoneyMovementService } from '../../../core/services/money-movement.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MoneyMovement, MovementType } from '../../../core/models/money-movement.model';
import { AddMovementDialogComponent } from '../../../shared/add-movement-dialog.component';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';
import { toLocalDateString } from '../../../core/utils/date-utils';

@Component({
  selector: 'app-money-movements-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, MatMenuModule, CurrencyPipe, DatePipe, LocalDatePipe, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadMovements()">
      <div class="header-row">
        <div>
          <h2 class="page-title">Money Flow</h2>
          <p class="page-subtitle">Track where your money moves</p>
        </div>
        <button mat-raised-button color="primary" class="add-btn" (click)="addMovement()">
          <mat-icon>add</mat-icon> Add Movement
        </button>
      </div>

      <div class="mm-fb">
        <div class="mm-fb-primary">
          <div class="mm-fb-search" [class.mm-fb-search-active]="searchFocused">
            <mat-icon class="mm-fb-search-icon">search</mat-icon>
            <input class="mm-fb-search-input" [(ngModel)]="searchTerm"
                   placeholder="Search movements..."
                   (focus)="searchFocused = true"
                   (blur)="searchFocused = false">
            @if (searchTerm) {
              <button class="mm-fb-search-clear" (click)="searchTerm = ''; allMovements.set(allMovements())">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>

          <div class="mm-fb-controls">
            <button class="mm-fb-dropdown" [class.mm-fb-dropdown-active]="activeFilter() !== 'all'"
                    [matMenuTriggerFor]="typeMenu">
              <mat-icon class="mm-fb-dd-icon">{{ activeFilter() !== 'all' ? typeIcon(activeFilter()) : 'filter_list' }}</mat-icon>
              <span>{{ activeFilter() !== 'all' ? typeLabel(activeFilter()) : 'Type' }}</span>
              <mat-icon class="mm-fb-dd-arrow">expand_more</mat-icon>
            </button>

            <button class="mm-fb-more-toggle" [class.mm-fb-more-active]="showDateRange"
                    (click)="showDateRange = !showDateRange">
              <mat-icon>{{ showDateRange ? 'expand_less' : 'date_range' }}</mat-icon>
              @if ((dateFrom() || dateTo()) && !showDateRange) {
                <span class="mm-fb-badge">1</span>
              }
            </button>
          </div>
        </div>

        <div class="mm-fb-periods">
          @for (p of datePresets; track p.label) {
            <button class="mm-fb-period" [class.mm-fb-period-active]="activePreset() === p.label"
                    (click)="applyPreset(p)">
              {{ p.label }}
            </button>
          }
        </div>

        @if (showDateRange) {
          <div class="mm-fb-dates">
            <div class="mm-fb-pill-input">
              <mat-icon class="mm-fb-pill-icon">event</mat-icon>
              <input type="date" [ngModel]="dateFrom()" (ngModelChange)="setDateFrom($event)" placeholder="From">
            </div>
            <span class="mm-fb-date-sep">–</span>
            <div class="mm-fb-pill-input">
              <mat-icon class="mm-fb-pill-icon">event</mat-icon>
              <input type="date" [ngModel]="dateTo()" (ngModelChange)="setDateTo($event)" placeholder="To">
            </div>
            @if (dateFrom() || dateTo()) {
              <button class="mm-fb-date-clear" (click)="clearDates()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
        }

        @if (activeFilter() !== 'all' || dateFrom() || dateTo() || searchTerm) {
          <div class="mm-fb-active">
            @if (activeFilter() !== 'all') {
              <span class="mm-fb-chip mm-fb-chip-type">
                <mat-icon class="mm-fb-chip-icon">{{ typeIcon(activeFilter()) }}</mat-icon>
                {{ typeLabel(activeFilter()) }}
                <button class="mm-fb-chip-x" (click)="filterByType('all')"><mat-icon>close</mat-icon></button>
              </span>
            }
            @if (dateFrom() || dateTo()) {
              <span class="mm-fb-chip mm-fb-chip-date">
                <mat-icon class="mm-fb-chip-icon">date_range</mat-icon>
                {{ dateFrom() || '...' }} – {{ dateTo() || '...' }}
                <button class="mm-fb-chip-x" (click)="clearDates()"><mat-icon>close</mat-icon></button>
              </span>
            }
            @if (searchTerm) {
              <span class="mm-fb-chip">
                <mat-icon class="mm-fb-chip-icon">search</mat-icon>
                "{{ searchTerm }}"
                <button class="mm-fb-chip-x" (click)="searchTerm = ''"><mat-icon>close</mat-icon></button>
              </span>
            }
            <button class="mm-fb-clear-all" (click)="clearAllFilters()">Clear all</button>
          </div>
        }
      </div>

      <mat-menu #typeMenu="matMenu" class="mm-fb-menu">
        <button mat-menu-item (click)="filterByType('all')">
          <mat-icon>list</mat-icon> All Types
        </button>
        <button mat-menu-item (click)="filterByType('LoanFunding')">
          <mat-icon>account_balance</mat-icon> Loan Funding
        </button>
        <button mat-menu-item (click)="filterByType('LoanPayment')">
          <mat-icon>payments</mat-icon> Loan Payments
        </button>
        <button mat-menu-item (click)="filterByType('CardPayment')">
          <mat-icon>credit_card</mat-icon> Card Payments
        </button>
        <button mat-menu-item (click)="filterByType('Transfer')">
          <mat-icon>sync_alt</mat-icon> Transfers
        </button>
        <button mat-menu-item (click)="filterByType('Deposit')">
          <mat-icon>arrow_downward</mat-icon> Deposits
        </button>
        <button mat-menu-item (click)="filterByType('Withdrawal')">
          <mat-icon>arrow_upward</mat-icon> Withdrawals
        </button>
        <button mat-menu-item (click)="filterByType('TradePnl')">
          <mat-icon>candlestick_chart</mat-icon> Trade P&amp;L
        </button>
        <button mat-menu-item (click)="filterByType('TradeFee')">
          <mat-icon>receipt_long</mat-icon> Trade Fees
        </button>
      </mat-menu>

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
            <button mat-raised-button color="primary" (click)="addMovement()">
              <mat-icon>add</mat-icon> Add First Movement
            </button>
          </div>
        } @else {
          <!-- Desktop table -->
          <mat-card class="desktop-table">
            <div class="table-wrapper">
              <table class="activity-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th class="col-amount">Amount</th>
                    <th>Note</th>
                    <th class="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of filteredMovements(); track m.id) {
                    <tr>
                      <td>{{ m.movementDate | localDate:'mediumDate' }}</td>
                      <td>
                        <span class="type-badge" [class]="'type-' + m.movementType">
                          {{ typeLabel(m.movementType) }}
                        </span>
                      </td>
                      <td>
                        <span class="entity-name">
                          <mat-icon class="entity-icon">{{ entityIcon(m.sourceType) }}</mat-icon>
                          {{ m.sourceName }}
                        </span>
                      </td>
                      <td>
                        <span class="entity-name">
                          <mat-icon class="entity-icon">{{ entityIcon(m.destinationType) }}</mat-icon>
                          {{ m.destinationName }}
                        </span>
                      </td>
                      <td class="col-amount amount-cell">{{ m.amount | currency }}</td>
                      <td class="note-cell">
                        {{ m.note || '—' }}
                        @if (m.isAutoGenerated) {
                          <mat-icon class="auto-badge" matTooltip="Auto-tracked">auto_awesome</mat-icon>
                        }
                      </td>
                      <td class="col-actions">
                        <button mat-icon-button class="action-btn action-delete" (click)="deleteMovement(m)" aria-label="Delete">
                          <mat-icon>delete_outline</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
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
                  <button mat-icon-button class="action-btn action-delete" (click)="deleteMovement(m)" aria-label="Delete">
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
      font-weight: var(--weight-bold);
      margin: 0;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
      margin: 2px 0 0;
    }
    .add-btn {
      border-radius: var(--radius-sm) !important;
      font-weight: var(--weight-semibold) !important;
    }

    /* --- Filter bar (pill style) --- */
    .mm-fb {
      display: flex; flex-direction: column; gap: 10px;
      padding: 14px 18px;
      background: white;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      margin-bottom: var(--spacing-md);
    }
    .mm-fb-primary {
      display: flex; gap: 10px; align-items: center;
    }
    .mm-fb-search {
      flex: 1; display: flex; align-items: center; gap: 8px;
      padding: 0 12px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: #f8f9fb;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .mm-fb-search-active {
      border-color: var(--color-primary);
      background: white;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
    }
    .mm-fb-search-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }
    .mm-fb-search-input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 0.85rem; color: var(--color-text);
    }
    .mm-fb-search-input::placeholder { color: var(--color-text-muted); }
    .mm-fb-search-clear {
      display: flex; align-items: center; padding: 0; border: none;
      background: none; cursor: pointer; color: var(--color-text-muted);
      border-radius: 50%; transition: var(--transition-fast);
    }
    .mm-fb-search-clear mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .mm-fb-search-clear:hover { color: var(--color-text); background: var(--color-border); }

    .mm-fb-controls { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }

    .mm-fb-dropdown {
      display: flex; align-items: center; gap: 5px;
      padding: 0 12px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: white;
      color: var(--color-text-secondary);
      font-size: 0.82rem; font-weight: 500;
      cursor: pointer; white-space: nowrap;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .mm-fb-dropdown:hover {
      border-color: color-mix(in srgb, var(--color-primary) 50%, var(--color-border));
      color: var(--color-text);
    }
    .mm-fb-dropdown-active {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: var(--color-primary);
      color: var(--color-primary);
      font-weight: 600;
    }
    .mm-fb-dd-icon { font-size: 18px; width: 18px; height: 18px; }
    .mm-fb-dd-arrow { font-size: 16px; width: 16px; height: 16px; opacity: 0.5; margin-left: -2px; }

    .mm-fb-more-toggle {
      display: flex; align-items: center; justify-content: center;
      width: 38px; height: 38px;
      border: 1px solid var(--color-border);
      border-radius: 50%;
      background: white;
      color: var(--color-text-muted);
      cursor: pointer; position: relative;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .mm-fb-more-toggle:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .mm-fb-more-active {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .mm-fb-more-toggle mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .mm-fb-badge {
      position: absolute; top: -4px; right: -4px;
      background: var(--color-primary); color: white;
      font-size: 0.6rem; font-weight: 700;
      width: 16px; height: 16px;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
    }

    /* Period pills */
    .mm-fb-periods {
      display: flex; flex-wrap: wrap; gap: 6px;
    }
    .mm-fb-period {
      padding: 5px 14px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      background: white;
      color: var(--color-text-secondary);
      font-size: 0.78rem; font-weight: 500;
      cursor: pointer; white-space: nowrap;
      transition: all 0.15s ease;
    }
    .mm-fb-period:hover {
      border-color: var(--color-primary); color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 4%, white);
    }
    .mm-fb-period-active {
      background: var(--color-primary) !important;
      color: white !important;
      border-color: var(--color-primary) !important;
      font-weight: 600;
      box-shadow: 0 1px 4px color-mix(in srgb, var(--color-primary) 30%, transparent);
    }

    /* Custom date row */
    .mm-fb-dates {
      display: flex; align-items: center; gap: 8px;
    }
    .mm-fb-pill-input {
      display: flex; align-items: center; gap: 6px;
      padding: 0 12px; height: 38px; flex: 1;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: #f8f9fb;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .mm-fb-pill-input:focus-within {
      border-color: var(--color-primary); background: white;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
    }
    .mm-fb-pill-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); flex-shrink: 0; }
    .mm-fb-pill-input input {
      flex: 1; border: none; outline: none; background: transparent;
      font-size: 0.85rem; color: var(--color-text); font-family: inherit;
      -webkit-appearance: none; min-width: 0;
    }
    .mm-fb-date-sep { color: var(--color-text-muted); font-weight: 500; font-size: 0.85rem; }
    .mm-fb-date-clear {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; min-width: 36px;
      border-radius: 50%; border: none;
      background: var(--color-surface-secondary);
      color: var(--color-text-muted);
      cursor: pointer; transition: background 0.15s, color 0.15s;
    }
    .mm-fb-date-clear:hover { color: var(--color-text); background: var(--color-border); }
    .mm-fb-date-clear mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Active filter chips */
    .mm-fb-active {
      display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
      padding-top: 8px;
      border-top: 1px dashed color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
    }
    .mm-fb-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 6px 3px 8px;
      font-size: 0.76rem; font-weight: 500;
      border-radius: var(--radius-full);
      background: #f1f3f5; color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .mm-fb-chip-type {
      background: color-mix(in srgb, var(--color-primary) 8%, white);
      border-color: color-mix(in srgb, var(--color-primary) 25%, transparent);
      color: var(--color-primary);
    }
    .mm-fb-chip-date {
      background: color-mix(in srgb, #059669 8%, white);
      border-color: color-mix(in srgb, #059669 25%, transparent);
      color: #059669;
    }
    .mm-fb-chip-icon { font-size: 14px; width: 14px; height: 14px; }
    .mm-fb-chip-x {
      display: flex; align-items: center; padding: 0;
      border: none; background: none; cursor: pointer;
      color: inherit; opacity: 0.5; border-radius: 50%;
      transition: var(--transition-fast);
    }
    .mm-fb-chip-x mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .mm-fb-chip-x:hover { opacity: 1; background: color-mix(in srgb, currentColor 10%, transparent); }
    .mm-fb-clear-all {
      border: none; background: none; cursor: pointer;
      color: var(--color-text-muted); font-size: 0.74rem; font-weight: 500;
      padding: 2px 8px; border-radius: var(--radius-sm);
      transition: var(--transition-fast);
    }
    .mm-fb-clear-all:hover { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, white); }

    /* --- Summary cards (iOS grouped style) --- */
    .summary-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
      margin-bottom: var(--spacing-md);
    }
    .summary-card {
      padding: 14px 16px;
      background: var(--color-surface-solid);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xs);
      border: 1px solid var(--color-border);
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
      border-radius: var(--radius-sm);
    }
    .stat-icon-pill mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .green-pill { background: var(--color-stat-green-bg); color: var(--color-stat-green); }
    .blue-pill { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .purple-pill { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }
    .amber-pill { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }
    .stat-content { display: flex; flex-direction: column; gap: 2px; }
    .summary-label { font-size: var(--text-xs); color: var(--color-text-muted); font-weight: var(--weight-semibold); letter-spacing: var(--tracking-wide); text-transform: uppercase; }
    .summary-value { font-size: 1.25rem; font-weight: var(--weight-bold); font-variant-numeric: tabular-nums; letter-spacing: -0.02em; line-height: var(--leading-tight); }
    .stat-total .summary-value { color: var(--color-value-green); }
    .stat-count .summary-value { color: var(--color-value-blue); }
    .stat-auto .summary-value { color: var(--color-value-purple); }
    .stat-manual .summary-value { color: var(--color-value-amber); }

    /* --- Desktop table --- */
    .table-wrapper { overflow-x: auto; scrollbar-width: none; }
    .table-wrapper::-webkit-scrollbar { display: none; }
    .activity-table { width: 100%; border-collapse: collapse; }
    .activity-table th { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--color-primary); padding: 10px 12px; border-bottom: 2px solid var(--color-primary); text-align: left; }
    .activity-table td { font-size: 0.85rem; padding: 10px 12px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
    .activity-table tbody tr:hover { background: var(--color-surface-hover); }
    .col-amount { text-align: right; }
    .col-actions { width: 52px; text-align: center; }
    .amount-cell { font-weight: var(--weight-semibold); color: var(--color-success); font-variant-numeric: tabular-nums; }
    .note-cell { color: var(--color-text-secondary); font-size: var(--text-sm); }
    .entity-name { display: flex; align-items: center; gap: 6px; font-size: var(--text-sm); }
    .entity-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); }
    .auto-badge {
      font-size: 14px; width: 14px; height: 14px;
      color: var(--color-stat-purple);
      vertical-align: middle;
      margin-left: 4px;
    }

    .type-badge {
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      white-space: nowrap;
    }
    .type-LoanFunding { background: var(--color-primary-subtle); color: var(--color-primary); }
    .type-LoanPayment { background: var(--color-success-bg); color: var(--color-success-text); }
    .type-CardPayment { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }
    .type-Transfer { background: var(--color-stat-green-bg); color: var(--color-stat-green); }
    .type-Deposit { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }
    .type-Withdrawal { background: var(--color-danger-bg); color: var(--color-danger-text); }
    .type-TradePnl { background: var(--color-primary-subtle); color: var(--color-primary); }
    .type-TradeFee { background: var(--color-warning-bg); color: var(--color-warning-text); }

    .action-btn {
      width: 34px; height: 34px;
      border-radius: var(--radius-xs) !important;
      transition: background var(--transition-fast) !important;
    }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-delete { color: var(--color-action-delete) !important; }
    .action-delete:hover { background: var(--color-action-delete-bg) !important; }

    /* --- Mobile cards (iOS native feel) --- */
    .mobile-cards { display: none; }
    @media (max-width: 1199px) {
      .desktop-table { display: none !important; }
      .mobile-cards { display: block; }
    }
    @media (max-width: 599px) {
      .desktop-table { display: none !important; }
      .mobile-cards { display: block; }
      .summary-row { grid-template-columns: 1fr 1fr; gap: 8px; }
      .summary-card { padding: 12px 14px; }
      .stat-icon-pill { padding: 8px; }
      .stat-icon-pill mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .summary-value { font-size: 1rem; }
      .action-btn { min-width: 44px; min-height: 44px; }
      .mm-fb-primary { flex-wrap: wrap; }
      .mm-fb-search { min-width: 100%; }
      .mm-fb-controls { flex-wrap: wrap; }
      .mm-fb-dates { flex-wrap: wrap; }
    }

    .movement-card {
      background: var(--color-surface-solid);
      border-radius: var(--radius-md);
      margin-bottom: 10px;
      padding: 14px 16px;
      box-shadow: var(--shadow-xs);
      border: 1px solid var(--color-border);
      transition: opacity 0.15s ease;
    }
    .movement-card:active {
      opacity: 0.7;
    }
    .movement-card-top { display: flex; align-items: center; gap: 12px; }
    .movement-card-icon {
      width: 42px; height: 42px; min-width: 42px;
      border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
    }
    .movement-card-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .card-icon-LoanFunding { background: var(--color-primary-subtle); color: var(--color-primary); }
    .card-icon-LoanPayment { background: var(--color-success-bg); color: var(--color-success-text); }
    .card-icon-CardPayment { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }
    .card-icon-Transfer { background: var(--color-stat-green-bg); color: var(--color-stat-green); }
    .card-icon-Deposit { background: var(--color-stat-amber-bg); color: var(--color-stat-amber); }
    .card-icon-Withdrawal { background: var(--color-danger-bg); color: var(--color-danger-text); }
    .card-icon-TradePnl { background: var(--color-primary-subtle); color: var(--color-primary); }
    .card-icon-TradeFee { background: var(--color-warning-bg); color: var(--color-warning-text); }
    .movement-card-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .movement-card-type { display: flex; align-items: center; gap: 6px; }
    .auto-badge-sm { font-size: 14px; width: 14px; height: 14px; color: var(--color-stat-purple); }
    .movement-card-flow {
      font-size: var(--text-sm); color: var(--color-text-secondary);
      display: flex; align-items: center; gap: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .flow-arrow { font-size: 14px; width: 14px; height: 14px; color: var(--color-text-muted); flex-shrink: 0; }
    .movement-card-date { font-size: var(--text-xs); color: var(--color-text-muted); }
    .movement-card-amount { font-weight: var(--weight-bold); font-size: var(--text-base); color: var(--color-success); white-space: nowrap; font-variant-numeric: tabular-nums; }
    .movement-card-note {
      font-size: var(--text-sm); color: var(--color-text-secondary);
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
  searchTerm = '';
  searchFocused = false;
  showDateRange = false;
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
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      movements = movements.filter(m =>
        m.sourceName?.toLowerCase().includes(q) ||
        m.destinationName?.toLowerCase().includes(q) ||
        m.note?.toLowerCase().includes(q)
      );
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

  clearAllFilters(): void {
    this.activeFilter.set('all');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.activePreset.set('');
    this.searchTerm = '';
    this.showDateRange = false;
  }

  typeLabel(type: MovementType | string): string {
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

  typeIcon(type: MovementType | string): string {
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
    return toLocalDateString(d);
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
