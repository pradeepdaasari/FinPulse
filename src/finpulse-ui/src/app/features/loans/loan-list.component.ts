import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
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
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule, MatTooltipModule, CurrencyPipe],
  template: `
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAddLoan()">
        <mat-icon>add</mat-icon> Add Loan
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
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
            <td mat-cell *matCellDef="let loan">{{ loan.lenderName }}</td>
          </ng-container>

          <ng-container matColumnDef="currentBalance">
            <th mat-header-cell *matHeaderCellDef>Balance</th>
            <td mat-cell *matCellDef="let loan">{{ loan.currentBalance | currency }}</td>
          </ng-container>

          <ng-container matColumnDef="aprPercent">
            <th mat-header-cell *matHeaderCellDef>APR</th>
            <td mat-cell *matCellDef="let loan">{{ loan.aprPercent }}%</td>
          </ng-container>

          <ng-container matColumnDef="durationMonths">
            <th mat-header-cell *matHeaderCellDef>Duration</th>
            <td mat-cell *matCellDef="let loan">{{ loan.durationMonths }} mo</td>
          </ng-container>

          <ng-container matColumnDef="monthlyPayment">
            <th mat-header-cell *matHeaderCellDef>Monthly</th>
            <td mat-cell *matCellDef="let loan">{{ loan.monthlyPayment | currency }}</td>
          </ng-container>

          <ng-container matColumnDef="paymentFrequency">
            <th mat-header-cell *matHeaderCellDef>Frequency</th>
            <td mat-cell *matCellDef="let loan">{{ loan.paymentFrequency }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let loan">
              <button mat-icon-button (click)="recordPayment(loan)" aria-label="Record Payment" matTooltip="Record Payment">
                <mat-icon>payments</mat-icon>
              </button>
              <button mat-icon-button (click)="editLoan(loan)" aria-label="Edit" matTooltip="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="viewLoan(loan.id)" aria-label="View History" matTooltip="View History">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteLoan(loan)" aria-label="Delete" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
              </button>
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
              <div class="loan-icon">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="loan-info">
                <span class="loan-name">{{ loan.lenderName }}</span>
                <span class="loan-meta">{{ loan.loanType }} · {{ loan.aprPercent }}% APR</span>
              </div>
              <div class="loan-balance">
                <span class="loan-amount">{{ loan.currentBalance | currency }}</span>
                <span class="loan-monthly">{{ loan.monthlyPayment | currency }}/mo</span>
              </div>
            </div>
            <div class="loan-actions" (click)="$event.stopPropagation()">
              <button mat-icon-button (click)="recordPayment(loan)" aria-label="Record Payment">
                <mat-icon>payments</mat-icon>
              </button>
              <button mat-icon-button (click)="editLoan(loan)" aria-label="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteLoan(loan)" aria-label="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
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
    .mobile-cards { display: none; }
    .loan-card {
      background: var(--color-surface);
      border-radius: var(--radius-sm);
      margin-bottom: 8px;
      padding: 14px 12px 8px;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: box-shadow var(--transition-fast);
    }
    .loan-card:active { box-shadow: var(--shadow-md); }
    .loan-top {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .loan-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--gradient-icon-purple, linear-gradient(135deg, #e8daef 0%, #d2b4de 100%));
    }
    .loan-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .loan-info { flex: 1; min-width: 0; }
    .loan-name { display: block; font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .loan-meta { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .loan-balance { text-align: right; }
    .loan-amount { display: block; font-weight: 700; font-size: 1rem; }
    .loan-monthly { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .loan-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0;
      margin-top: 4px;
    }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
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
