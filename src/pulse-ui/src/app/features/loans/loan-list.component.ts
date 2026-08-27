import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { LoanService } from '../../core/services/loan.service';
import { PersonalLoan } from '../../core/models/personal-loan.model';
import { NotificationService } from '../../core/services/notification.service';
import { AddLoanDialogComponent } from './add-loan-dialog.component';
import { EditLoanDialogComponent } from './edit-loan-dialog.component';
import { RecordPaymentDialogComponent } from '../../shared/record-payment-dialog.component';

@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule, MatProgressSpinnerModule, CurrencyPipe],
  template: `
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAddLoan()">
        <mat-icon>add</mat-icon> Add Loan
      </button>
    </div>

    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
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
            <span class="stat-value">{{ loans().length }}</span>
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
              <span class="value-monthly">{{ loan.monthlyPayment | currency }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="paymentFrequency">
            <th mat-header-cell *matHeaderCellDef>Frequency</th>
            <td mat-cell *matCellDef="let loan">{{ loan.paymentFrequency }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let loan">
              <div class="action-group">
                <button mat-icon-button class="action-btn action-pay" (click)="recordPayment(loan)" matTooltip="Record Payment">
                  <mat-icon>payments</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-edit" (click)="editLoan(loan)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-view" (click)="viewLoan(loan.id)" matTooltip="View Details">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-delete" (click)="deleteLoan(loan)" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
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
                <span class="loan-type-pill" [style.background]="getLoanTypeBg(loan.loanType)" [style.color]="getLoanTypeColor(loan.loanType)">{{ loan.loanType }}</span>
              </div>
              <div class="loan-balance">
                <span class="loan-amount">{{ loan.currentBalance | currency }}</span>
                <span class="loan-monthly">{{ loan.monthlyPayment | currency }}/mo</span>
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
            <div class="loan-actions" (click)="$event.stopPropagation()">
              <button mat-icon-button class="action-btn action-pay" (click)="recordPayment(loan)">
                <mat-icon>payments</mat-icon>
              </button>
              <button mat-icon-button class="action-btn action-edit" (click)="editLoan(loan)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button class="action-btn action-delete" (click)="deleteLoan(loan)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
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
      padding: 16px;
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .stat-card mat-icon {
      font-size: 28px; width: 28px; height: 28px;
      padding: 10px;
      border-radius: 12px;
    }
    .stat-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-purple mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .stat-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.2rem; font-weight: 700; color: var(--color-text); }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }

    /* Table */
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
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }
    .lender-name { font-weight: 500; }
    .value-balance { font-weight: 700; color: var(--color-text); }
    .value-monthly { font-weight: 600; color: var(--color-primary); }

    /* APR Badge */
    .apr-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: var(--radius-full);
    }
    .apr-low { background: var(--color-apr-low-bg); color: var(--color-apr-low); }
    .apr-mid { background: var(--color-apr-mid-bg); color: var(--color-apr-mid); }
    .apr-high { background: var(--color-apr-high-bg); color: var(--color-apr-high); }

    /* Action Buttons */
    .action-group { display: flex; gap: 2px; }
    .action-btn { width: 34px; height: 34px; border-radius: 8px !important; }
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
      background: var(--color-surface);
      border-radius: var(--radius-md);
      margin-bottom: 10px;
      padding: 16px 14px 10px;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: box-shadow var(--transition-fast);
    }
    .loan-card:active { box-shadow: var(--shadow-md); }
    .loan-top {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .loan-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .loan-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .loan-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .loan-name { font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .loan-type-pill {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      width: fit-content;
    }
    .loan-balance { text-align: right; }
    .loan-amount { display: block; font-weight: 700; font-size: 1.05rem; }
    .loan-monthly { display: block; font-size: 0.72rem; color: var(--color-primary); font-weight: 500; }
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
    .detail-label { font-size: 0.65rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-value { font-size: 0.82rem; font-weight: 600; color: var(--color-text); }
    .loan-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0;
      margin-top: 8px;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .empty-icon-wrap.purple { background: var(--color-stat-purple-bg); }
    .empty-icon-wrap.purple mat-icon { color: var(--color-stat-purple); font-size: 32px; width: 32px; height: 32px; }

    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px 10px; gap: 8px; }
      .stat-card mat-icon { font-size: 22px; width: 22px; height: 22px; padding: 8px; border-radius: 10px; }
      .stat-value { font-size: 1rem; }
      table { min-width: 0; }
      .mat-column-aprPercent,
      .mat-column-durationMonths,
      .mat-column-paymentFrequency { display: none; }
    }

  `]
})
export class LoanListComponent implements OnInit {
  private loanService = inject(LoanService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  loans = signal<PersonalLoan[]>([]);
  loading = signal(true);
  displayedColumns = ['loanType', 'lenderName', 'currentBalance', 'aprPercent', 'durationMonths', 'monthlyPayment', 'paymentFrequency', 'actions'];

  totalBalance = computed(() => this.loans().reduce((sum, l) => sum + l.currentBalance, 0));
  totalMonthly = computed(() => this.loans().reduce((sum, l) => sum + l.monthlyPayment, 0));
  avgApr = computed(() => {
    const loans = this.loans();
    if (!loans.length) return '0.0';
    return (loans.reduce((sum, l) => sum + l.aprPercent, 0) / loans.length).toFixed(1);
  });

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loanService.getAll().subscribe({
      next: (loans) => {
        this.loans.set(loans);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
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
        minimumPayment: loan.monthlyPayment
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
      width: '600px',
      maxWidth: '95vw',
      data: loan
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Loan updated successfully');
        this.loadLoans();
      }
    });
  }

  viewLoan(id: string): void {
    this.router.navigate(['/loans', id]);
  }

  deleteLoan(loan: PersonalLoan): void {
    if (!this.notify.confirmDelete(loan.lenderName)) return;
    this.loanService.delete(loan.id).subscribe(() => {
      this.notify.success('Loan deleted successfully');
      this.loadLoans();
    });
  }

  openAddLoan(): void {
    const dialogRef = this.dialog.open(AddLoanDialogComponent, {
      width: '600px',
      maxWidth: '95vw'
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
      'Personal': '#1565c0', 'Auto': '#2e7d32', 'Mortgage': '#6a1b9a',
      'Student': '#e65100', 'Home Equity': '#00695c', 'Business': '#4527a0'
    };
    return colors[type] || '#455a64';
  }

  getLoanTypeBg(type: string): string {
    const colors: Record<string, string> = {
      'Personal': 'rgba(21,101,192,0.1)', 'Auto': 'rgba(46,125,50,0.1)', 'Mortgage': 'rgba(106,27,154,0.1)',
      'Student': 'rgba(230,81,0,0.1)', 'Home Equity': 'rgba(0,105,92,0.1)', 'Business': 'rgba(69,39,160,0.1)'
    };
    return colors[type] || 'rgba(69,90,100,0.1)';
  }
}
