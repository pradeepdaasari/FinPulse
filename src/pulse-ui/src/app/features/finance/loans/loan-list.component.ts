import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { LoanService } from '../../../core/services/loan.service';
import { PersonalLoan } from '../../../core/models/personal-loan.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AddLoanDialogComponent } from './add-loan-dialog.component';
import { EditLoanDialogComponent } from './edit-loan-dialog.component';
import { RecordPaymentDialogComponent } from '../../../shared/record-payment-dialog.component';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../../shared/pull-to-refresh.directive';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule, CurrencyPipe, DatePipe, DecimalPipe, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadLoans()">
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAddLoan()">
        <mat-icon>add</mat-icon> Add Loan
      </button>
    </div>

    @if (loading()) {
      <app-skeleton type="table"></app-skeleton>
    } @else if (loans().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap purple">
          <mat-icon>account_balance</mat-icon>
        </div>
        <h3>Track your loans</h3>
        <p>Add your loans to visualize payoff timelines and discover the fastest path to being debt-free.</p>
        <button mat-raised-button color="primary" (click)="openAddLoan()">
          <mat-icon>add</mat-icon> Add Loan
        </button>
      </div>
    } @else {
      <!-- Summary Stats -->
      <div class="stats-row">
        <div class="stat-card stat-blue">
          <mat-icon>account_balance</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ totalBalance() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="stat-label">Total Balance</span>
          </div>
        </div>
        <div class="stat-card stat-green">
          <mat-icon>calendar_month</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ totalMonthly() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="stat-label">Monthly Payments</span>
          </div>
        </div>
        <div class="stat-card stat-purple">
          <mat-icon>percent</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ avgApr() }}%</span>
            <span class="stat-label">Avg APR</span>
          </div>
        </div>
        <div class="stat-card stat-amber">
          <mat-icon>receipt_long</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-label">Active Loans</span>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <mat-card class="desktop-only">
        <div class="table-wrapper">
        <table mat-table [dataSource]="loans()">
          <ng-container matColumnDef="loanType">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let loan">
              <span class="loan-type-badge" [style.background]="getLoanTypeBg(loan.loanType)" [style.color]="getLoanTypeColor(loan.loanType)">
                {{ loan.loanType }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="lenderName">
            <th mat-header-cell *matHeaderCellDef>Lender</th>
            <td mat-cell *matCellDef="let loan">
              <span class="lender-name">{{ loan.lenderName }}</span>
              @if (loan.isAutopay) {
                <mat-icon class="autopay-icon" matTooltip="Autopay enabled">autorenew</mat-icon>
              }
              @if (loan.rateType === 'Variable') {
                <span class="variable-badge">Variable</span>
              }
              @if (isDeferred(loan)) {
                <span class="deferred-chip">Paused until {{ loan.nextPaymentDate | date:'MMM yyyy' }}</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="currentBalance">
            <th mat-header-cell *matHeaderCellDef>Balance</th>
            <td mat-cell *matCellDef="let loan">
              <span class="value-balance">{{ loan.currentBalance | currency }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="aprPercent">
            <th mat-header-cell *matHeaderCellDef>APR</th>
            <td mat-cell *matCellDef="let loan">
              <span class="apr-badge" [class.apr-high]="loan.aprPercent >= 20" [class.apr-mid]="loan.aprPercent >= 10 && loan.aprPercent < 20" [class.apr-low]="loan.aprPercent < 10">
                {{ loan.aprPercent }}%
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="durationMonths">
            <th mat-header-cell *matHeaderCellDef>Duration</th>
            <td mat-cell *matCellDef="let loan">{{ loan.durationMonths }} mo</td>
          </ng-container>

          <ng-container matColumnDef="monthlyPayment">
            <th mat-header-cell *matHeaderCellDef>Monthly</th>
            <td mat-cell *matCellDef="let loan">
              <span class="value-monthly">{{ (loan.monthlyEquivalentPayment || loan.monthlyPayment) | currency }}</span>
              @if (loan.paymentFrequency !== 'Monthly') {
                <span class="freq-note">{{ loan.monthlyPayment | currency }}/{{ loan.paymentFrequency === 'Biweekly' ? 'bw' : 'wk' }}</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="paymentFrequency">
            <th mat-header-cell *matHeaderCellDef>Frequency</th>
            <td mat-cell *matCellDef="let loan">{{ loan.paymentFrequency }}</td>
          </ng-container>

          <ng-container matColumnDef="progress">
            <th mat-header-cell *matHeaderCellDef>Progress</th>
            <td mat-cell *matCellDef="let loan">
              <div class="progress-mini">
                <div class="progress-bar-mini">
                  <div class="progress-fill" [style.width.%]="getProgress(loan)"></div>
                </div>
                <span class="progress-text">{{ getProgress(loan) | number:'1.0-0' }}%</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let loan">
              <div class="action-group">
                <button mat-icon-button class="action-btn action-pay" (click)="$event.stopPropagation(); recordPayment(loan)" matTooltip="Record Payment">
                  <mat-icon>payments</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-edit" (click)="$event.stopPropagation(); editLoan(loan)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-view" (click)="$event.stopPropagation(); viewLoan(loan.id)" matTooltip="View Details">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-delete" (click)="$event.stopPropagation(); deleteLoan(loan)" matTooltip="Delete">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="viewLoan(row.id)" class="clickable-row"></tr>
        </table>
        </div>
      </mat-card>

      <!-- Mobile cards -->
      <div class="mobile-cards">
        @for (loan of loans(); track loan.id) {
          <div class="loan-card" (click)="viewLoan(loan.id)">
            <div class="loan-top">
              <div class="loan-icon" [style.background]="getLoanTypeBg(loan.loanType)">
                <mat-icon [style.color]="getLoanTypeColor(loan.loanType)">account_balance</mat-icon>
              </div>
              <div class="loan-info">
                <span class="loan-name">{{ loan.lenderName }}</span>
                <div class="loan-pills">
                  <span class="loan-type-pill" [style.background]="getLoanTypeBg(loan.loanType)" [style.color]="getLoanTypeColor(loan.loanType)">{{ loan.loanType }}</span>
                  @if (loan.isAutopay) {
                    <mat-icon class="autopay-icon" matTooltip="Autopay enabled">autorenew</mat-icon>
                  }
                  @if (loan.rateType === 'Variable') {
                    <span class="variable-badge">Variable</span>
                  }
                  @if (isDeferred(loan)) {
                    <span class="deferred-chip">Paused until {{ loan.nextPaymentDate | date:'MMM yyyy' }}</span>
                  }
                </div>
              </div>
              <div class="loan-balance">
                <span class="loan-amount">{{ loan.currentBalance | currency }}</span>
                <span class="loan-monthly">{{ (loan.monthlyEquivalentPayment || loan.monthlyPayment) | currency }}/mo</span>
              </div>
            </div>
            <div class="loan-detail-row">
              <span class="loan-detail-item">
                <span class="detail-label">APR</span>
                <span class="apr-badge" [class.apr-high]="loan.aprPercent >= 20" [class.apr-mid]="loan.aprPercent >= 10 && loan.aprPercent < 20" [class.apr-low]="loan.aprPercent < 10">{{ loan.aprPercent }}%</span>
              </span>
              <span class="loan-detail-item">
                <span class="detail-label">Duration</span>
                <span class="detail-value">{{ loan.durationMonths }} mo</span>
              </span>
              <span class="loan-detail-item">
                <span class="detail-label">Frequency</span>
                <span class="detail-value">{{ loan.paymentFrequency }}</span>
              </span>
            </div>
            <div class="progress-mini mobile-progress">
              <div class="progress-bar-mini">
                <div class="progress-fill" [style.width.%]="getProgress(loan)"></div>
              </div>
              <span class="progress-text">{{ getProgress(loan) | number:'1.0-0' }}% paid</span>
            </div>
            <div class="loan-actions" (click)="$event.stopPropagation()">
              <button mat-icon-button class="action-btn action-pay" (click)="recordPayment(loan)">
                <mat-icon>payments</mat-icon>
              </button>
              <button mat-icon-button class="action-btn action-edit" (click)="editLoan(loan)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button class="action-btn action-delete" (click)="deleteLoan(loan)">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
    <button class="mobile-add-fab" (click)="openAddLoan()"><mat-icon>add</mat-icon></button>
    </div>
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    /* Summary Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: var(--radius-md);
      background: var(--color-surface-solid);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xs);
      transition: box-shadow var(--transition-base);
    }
    .stat-card mat-icon {
      font-size: 26px; width: 26px; height: 26px;
      padding: 10px;
      border-radius: var(--radius-sm);
      box-sizing: content-box;
      overflow: visible;
      flex-shrink: 0;
    }
    .stat-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-purple mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .stat-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-content { display: flex; flex-direction: column; min-width: 0; }
    .stat-value {
      font-size: 1.25rem; font-weight: var(--weight-bold); color: var(--color-text);
      letter-spacing: -0.02em; line-height: var(--leading-tight);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .stat-label {
      font-size: var(--text-xs); font-weight: var(--weight-semibold);
      color: var(--color-text-muted); margin-top: 2px;
      text-transform: uppercase; letter-spacing: var(--tracking-wide);
    }

    /* Table */
    .clickable-row { cursor: pointer; transition: background var(--transition-fast); }
    .clickable-row:hover { background: var(--color-surface-hover); }
    mat-card {
      overflow: hidden;
      padding: 0 !important;
    }
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table { width: 100%; min-width: 600px; }
    .loan-type-badge {
      display: inline-block;
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      padding: 3px 10px;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }
    .lender-name { font-weight: var(--weight-medium); }
    .deferred-chip {
      display: inline-block; font-size: var(--text-xs); font-weight: var(--weight-semibold);
      padding: 2px 8px; border-radius: var(--radius-full);
      background: var(--color-warning-bg); color: var(--color-warning-text);
      margin-left: 6px; white-space: nowrap;
    }
    .loan-pills { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .value-balance { font-weight: var(--weight-bold); color: var(--color-text); }
    .value-monthly { font-weight: var(--weight-semibold); color: var(--color-primary); }
    .freq-note { display: block; font-size: 0.65rem; color: var(--color-text-muted); }

    /* APR Badge */
    .apr-badge {
      display: inline-block;
      font-size: var(--text-xs);
      font-weight: var(--weight-bold);
      padding: 3px 10px;
      border-radius: var(--radius-full);
    }
    .apr-low { background: var(--color-apr-low-bg); color: var(--color-apr-low); }
    .apr-mid { background: var(--color-apr-mid-bg); color: var(--color-apr-mid); }
    .apr-high { background: var(--color-apr-high-bg); color: var(--color-apr-high); }

    /* Action Buttons */
    .action-group { display: flex; gap: 2px; }
    .action-btn {
      width: 34px; height: 34px; border-radius: var(--radius-xs) !important;
      transition: background var(--transition-fast) !important;
    }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-pay { color: var(--color-action-pay) !important; }
    .action-pay:hover { background: var(--color-action-pay-bg) !important; }
    .action-edit { color: var(--color-action-edit) !important; }
    .action-edit:hover { background: var(--color-action-edit-bg) !important; }
    .action-view { color: var(--color-action-view) !important; }
    .action-view:hover { background: var(--color-action-view-bg) !important; }
    .action-delete { color: var(--color-action-delete) !important; }
    .action-delete:hover { background: var(--color-action-delete-bg) !important; }

    /* Mobile Cards */
    .mobile-cards { display: none; }
    .loan-card {
      background: var(--color-surface-solid);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      margin-bottom: 10px;
      padding: 16px;
      box-shadow: var(--shadow-xs);
      cursor: pointer;
      transition: box-shadow var(--transition-fast), transform 0.1s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .loan-card:active { box-shadow: var(--shadow-sm); transform: scale(0.98); }
    .loan-top {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .loan-icon {
      width: 42px; height: 42px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .loan-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .loan-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .loan-name {
      font-weight: var(--weight-semibold); font-size: var(--text-sm);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .loan-type-pill {
      display: inline-block;
      font-size: var(--text-xs);
      font-weight: var(--weight-semibold);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      width: fit-content;
    }
    .loan-balance { text-align: right; flex-shrink: 0; }
    .loan-amount {
      display: block; font-weight: var(--weight-bold); font-size: 1.05rem;
      letter-spacing: -0.02em;
    }
    .loan-monthly {
      display: block; font-size: var(--text-xs); color: var(--color-primary);
      font-weight: var(--weight-medium); margin-top: 2px;
    }
    .loan-detail-row {
      display: flex;
      justify-content: space-around;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--color-border);
    }
    .loan-detail-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .detail-label {
      font-size: 0.625rem; color: var(--color-text-muted);
      text-transform: uppercase; letter-spacing: var(--tracking-wide);
      font-weight: var(--weight-semibold);
    }
    .detail-value { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--color-text); }
    .loan-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0;
      margin-top: 8px;
    }
    .autopay-icon { font-size: 16px; width: 16px; height: 16px; color: var(--color-primary); vertical-align: middle; margin-left: 4px; }
    .variable-badge {
      display: inline-block; font-size: 0.625rem; font-weight: 600; padding: 1px 6px;
      border-radius: var(--radius-full); background: rgba(255,152,0,0.15); color: #e65100;
      margin-left: 4px; vertical-align: middle;
    }
    .progress-mini { display: flex; align-items: center; gap: 6px; }
    .progress-bar-mini {
      flex: 1; height: 6px; background: var(--color-border); border-radius: 3px;
      overflow: hidden; min-width: 50px;
    }
    .progress-fill { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.3s ease; }
    .progress-text { font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted); white-space: nowrap; }
    .mobile-progress { margin-top: 8px; }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl) var(--spacing-lg);
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .empty-icon-wrap.purple { background: var(--color-stat-purple-bg); }
    .empty-icon-wrap.purple mat-icon { color: var(--color-stat-purple); font-size: 32px; width: 32px; height: 32px; }

    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 1199px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
    }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px 10px; gap: 8px; }
      .stat-card mat-icon { font-size: 22px; width: 22px; height: 22px; padding: 8px; border-radius: var(--radius-sm); box-sizing: content-box; overflow: visible; }
      .stat-value { font-size: 1rem; }
      table { min-width: 0; }
      .mat-column-aprPercent,
      .mat-column-durationMonths,
      .mat-column-paymentFrequency { display: none; }
      .header-row button { display: none; }
      .action-btn { min-width: 44px; min-height: 44px; }
    }
    .mobile-add-fab {
      display: flex; position: fixed;
      bottom: 32px; right: 32px;
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--gradient-primary); color: #fff; border: none;
      align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 122, 255, 0.30); z-index: 100;
      cursor: pointer;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .mobile-add-fab:active { transform: scale(0.92); }
    .mobile-add-fab mat-icon { font-size: 26px; width: 26px; height: 26px; }
    @media (max-width: 599px) {
      .mobile-add-fab {
        bottom: calc(env(safe-area-inset-bottom, 0px) + 76px); right: 16px;
        width: 56px; height: 56px;
      }
      .mobile-add-fab mat-icon { font-size: 28px; width: 28px; height: 28px; }
    }
  `]
})
export class LoanListComponent implements OnInit {
  private loanService = inject(LoanService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  loans = signal<PersonalLoan[]>([]);
  loading = signal(true);
  displayedColumns = ['loanType', 'lenderName', 'currentBalance', 'aprPercent', 'durationMonths', 'monthlyPayment', 'paymentFrequency', 'progress', 'actions'];

  totalBalance = computed(() => this.loans().reduce((sum, l) => sum + l.currentBalance, 0));
  totalMonthly = computed(() => this.loans().reduce((sum, l) => sum + (l.monthlyEquivalentPayment || l.monthlyPayment), 0));
  activeCount = computed(() => this.loans().filter(l => l.currentBalance > 0).length);
  avgApr = computed(() => {
    const loans = this.loans().filter(l => l.currentBalance > 0);
    if (!loans.length) return '0.0';
    const totalBalance = loans.reduce((sum, l) => sum + l.currentBalance, 0);
    if (totalBalance <= 0) return '0.0';
    const weighted = loans.reduce((sum, l) => sum + l.aprPercent * l.currentBalance, 0);
    return (weighted / totalBalance).toFixed(1);
  });

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loanService.getAll().subscribe({
      next: (loans) => {
        this.loans.set(loans);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.notify.error('Failed to load loans'); this.cdr.detectChanges(); }
    });
  }

  recordPayment(loan: PersonalLoan): void {
    const dialogRef = this.dialog.open(RecordPaymentDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {
        debtId: loan.id,
        debtName: loan.lenderName,
        debtType: 'PersonalLoan',
        currentBalance: loan.currentBalance,
        minimumPayment: loan.monthlyPayment,
        aprPercent: loan.aprPercent,
        paymentFrequency: loan.paymentFrequency,
        fundedBankAccountId: loan.fundedBankAccountId
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Payment recorded successfully');
        this.loadLoans();
      }
    });
  }

  editLoan(loan: PersonalLoan): void {
    const dialogRef = this.dialog.open(EditLoanDialogComponent, {
      panelClass: 'responsive-dialog-panel',
      data: loan
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Loan updated successfully');
        this.loadLoans();
      }
    });
  }

  viewLoan(id: number | string): void {
    this.router.navigate(['/loans', id]);
  }

  deleteLoan(loan: PersonalLoan): void {
    import('../../../shared/confirm-dialog.component').then(m => {
      const dialogRef = this.dialog.open(m.ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Delete Loan?',
          message: `Are you sure you want to delete "${loan.lenderName}"? All payment history will be permanently removed.`,
          confirmText: 'Delete',
          color: 'warn'
        }
      });
      dialogRef.afterClosed().subscribe(confirmed => {
        if (!confirmed) return;
        this.loading.set(true);
        this.loanService.delete(loan.id).subscribe({
          next: () => {
            this.notify.success('Loan deleted successfully');
            this.loadLoans();
          },
          error: () => { this.loading.set(false); this.notify.error('Failed to delete loan'); this.cdr.detectChanges(); }
        });
      });
    });
  }

  openAddLoan(): void {
    const dialogRef = this.dialog.open(AddLoanDialogComponent, {
      panelClass: 'responsive-dialog-panel'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Loan added successfully');
        this.loadLoans();
      }
    });
  }

  getLoanTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'Personal': '#1565c0', 'Vehicle': '#2e7d32', 'Mortgage': '#6a1b9a',
      'Student': '#e65100', 'Home Equity': '#00695c', 'Business': '#4527a0', 'Other': '#455a64'
    };
    return colors[type] || '#455a64';
  }

  isDeferred(loan: PersonalLoan): boolean {
    return !!loan.nextPaymentDate && new Date(loan.nextPaymentDate) > new Date();
  }

  getProgress(loan: PersonalLoan): number {
    if (!loan.originalAmount || loan.originalAmount <= 0) return 0;
    return Math.max(0, Math.min(100, (1 - loan.currentBalance / loan.originalAmount) * 100));
  }

  getLoanTypeBg(type: string): string {
    const colors: Record<string, string> = {
      'Personal': 'rgba(21,101,192,0.1)', 'Vehicle': 'rgba(46,125,50,0.1)', 'Mortgage': 'rgba(106,27,154,0.1)',
      'Student': 'rgba(230,81,0,0.1)', 'Home Equity': 'rgba(0,105,92,0.1)', 'Business': 'rgba(69,39,160,0.1)', 'Other': 'rgba(69,90,100,0.1)'
    };
    return colors[type] || 'rgba(69,90,100,0.1)';
  }
}
