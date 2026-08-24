import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoanService } from '../../core/services/loan.service';
import { PersonalLoan } from '../../core/models/personal-loan.model';
import { AmortizationSchedule } from '../../core/models/dashboard.model';
import { PaymentHistory } from '../../core/models/payment-history.model';
import { sumCurrency } from '../../core/utils/currency';
import { AmortizationTableComponent } from './amortization-table.component';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule, CurrencyPipe, DatePipe, AmortizationTableComponent],
  template: `
    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (loan()) {
      <div class="header-row">
        <h2>{{ loan()!.lenderName }}</h2>
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon> Back to Loans
        </button>
      </div>

      <mat-card class="detail-card">
        <mat-card-content>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Original Amount</span>
              <span class="value">{{ loan()!.originalAmount | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Current Balance</span>
              <span class="value">{{ loan()!.currentBalance | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">APR</span>
              <span class="value">{{ loan()!.aprPercent }}%</span>
            </div>
            <div class="detail-item">
              <span class="label">Duration</span>
              <span class="value">{{ loan()!.durationMonths }} months</span>
            </div>
            <div class="detail-item">
              <span class="label">Start Date</span>
              <span class="value">{{ loan()!.startDate | date:'mediumDate' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Monthly Payment</span>
              <span class="value">{{ loan()!.monthlyPayment | currency }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Due Day</span>
              <span class="value">{{ loan()!.dueDay }}</span>
            </div>
            <div class="detail-item">
              <span class="label">Frequency</span>
              <span class="value">{{ loan()!.paymentFrequency }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      @if (paymentHistory().length > 0) {
        <h3>Payment History</h3>
        <mat-card class="history-card">
          <div class="history-summary">
            <span>Total Paid: <strong>{{ totalPaid() | currency }}</strong></span>
            <span class="history-count">{{ paymentHistory().length }} payments</span>
          </div>
          <div class="table-wrapper">
            <table mat-table [dataSource]="paymentHistory()">
              <ng-container matColumnDef="paymentDate">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let p">{{ p.paymentDate | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="amountPaid">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let p" class="amount-cell">{{ p.amountPaid | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="notes">
                <th mat-header-cell *matHeaderCellDef>Notes</th>
                <td mat-cell *matCellDef="let p">{{ p.notes || '—' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: paymentColumns;"></tr>
            </table>
          </div>
        </mat-card>
      }

      @if (amortizationSchedule()) {
        <h3>Amortization Schedule</h3>
        <app-amortization-table [schedule]="amortizationSchedule()!"></app-amortization-table>
      }
    }
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
    .header-row h2 { margin: 0; }
    .detail-card { margin-bottom: var(--spacing-lg); }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--spacing-md);
    }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 500; letter-spacing: 0.05em; }
    .value { font-size: 1rem; font-weight: 600; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 400px; }
    .history-card { margin-bottom: var(--spacing-lg); }
    .history-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      margin-bottom: var(--spacing-sm);
      font-size: 0.875rem;
    }
    .history-count { color: var(--color-text-secondary); }
    .amount-cell { font-weight: 600; color: var(--color-success); }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class LoanDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loanService = inject(LoanService);

  loan = signal<PersonalLoan | null>(null);
  amortizationSchedule = signal<AmortizationSchedule | null>(null);
  paymentHistory = signal<PaymentHistory[]>([]);
  totalPaid = signal(0);
  loading = signal(true);
  paymentColumns = ['paymentDate', 'amountPaid', 'notes'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loanService.getById(id).subscribe({
      next: (loan) => {
        this.loan.set(loan);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
    this.loanService.getAmortization(id).subscribe({
      next: (schedule) => { this.amortizationSchedule.set(schedule); }
    });
    this.loanService.getPayments(id).subscribe({
      next: (payments) => {
        this.paymentHistory.set(payments);
        this.totalPaid.set(sumCurrency(payments.map(p => p.amountPaid)));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/loans']);
  }
}
