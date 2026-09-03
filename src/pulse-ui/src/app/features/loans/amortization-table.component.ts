import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AmortizationSchedule } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-amortization-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatCardModule, MatIconModule, CurrencyPipe, DatePipe],
  template: `
    <div class="summary-cards">
      <div class="summary-card paid">
        <mat-icon>check_circle</mat-icon>
        <div class="summary-content">
          <span class="summary-label">Already Paid</span>
          <span class="summary-amount">{{ schedule.paidPrincipal + schedule.paidInterest | currency }}</span>
          <span class="summary-detail">Principal: {{ schedule.paidPrincipal | currency }} &middot; Interest: {{ schedule.paidInterest | currency }}</span>
        </div>
      </div>
      <div class="summary-card pending">
        <mat-icon>schedule</mat-icon>
        <div class="summary-content">
          <span class="summary-label">Remaining</span>
          <span class="summary-amount">{{ schedule.pendingPrincipal + schedule.pendingInterest | currency }}</span>
          <span class="summary-detail">Principal: {{ schedule.pendingPrincipal | currency }} &middot; Interest: {{ schedule.pendingInterest | currency }}</span>
        </div>
      </div>
      <div class="summary-card extra">
        <mat-icon>trending_up</mat-icon>
        <div class="summary-content">
          <span class="summary-label">Total Interest (Extra Paid)</span>
          <span class="summary-amount">{{ schedule.totalInterest | currency }}</span>
          <span class="summary-detail">Loan: {{ schedule.originalAmount | currency }} &middot; Total Cost: {{ schedule.totalCost | currency }}</span>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table mat-table [dataSource]="schedule.entries">
        <ng-container matColumnDef="period">
          <th mat-header-cell *matHeaderCellDef>#</th>
          <td mat-cell *matCellDef="let entry">{{ entry.periodNumber }}</td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let entry">{{ entry.paymentDate | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="payment">
          <th mat-header-cell *matHeaderCellDef>Payment</th>
          <td mat-cell *matCellDef="let entry">{{ entry.paymentAmount | currency }}</td>
        </ng-container>

        <ng-container matColumnDef="principal">
          <th mat-header-cell *matHeaderCellDef>Principal</th>
          <td mat-cell *matCellDef="let entry">{{ entry.principalPortion | currency }}</td>
        </ng-container>

        <ng-container matColumnDef="interest">
          <th mat-header-cell *matHeaderCellDef>Interest</th>
          <td mat-cell *matCellDef="let entry">{{ entry.interestPortion | currency }}</td>
        </ng-container>

        <ng-container matColumnDef="balance">
          <th mat-header-cell *matHeaderCellDef>Balance</th>
          <td mat-cell *matCellDef="let entry">{{ entry.remainingBalance | currency }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"
            [class.row-paid]="row.isPaid"
            [class.row-pending]="!row.isPaid"></tr>
      </table>
      <mat-paginator [pageSize]="12" [pageSizeOptions]="[12, 24, 60]" showFirstLastButtons></mat-paginator>
    </div>
  `,
  styles: [`
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--spacing-md, 16px);
      margin-bottom: var(--spacing-lg, 24px);
    }
    .summary-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--color-border, #e0e0e0);
    }
    .summary-card mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      margin-top: 2px;
    }
    .summary-card.paid { background: rgba(76, 175, 80, 0.08); }
    .summary-card.paid mat-icon { color: #4caf50; }
    .summary-card.pending { background: rgba(255, 152, 0, 0.08); }
    .summary-card.pending mat-icon { color: #ff9800; }
    .summary-card.extra { background: rgba(244, 67, 54, 0.08); }
    .summary-card.extra mat-icon { color: #f44336; }
    .summary-content { display: flex; flex-direction: column; gap: 2px; }
    .summary-label { font-size: 0.75rem; text-transform: uppercase; font-weight: 500; letter-spacing: 0.05em; color: var(--color-text-muted, #666); }
    .summary-amount { font-size: 1.25rem; font-weight: 700; }
    .summary-detail { font-size: 0.75rem; color: var(--color-text-secondary, #888); }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .row-paid {
      background: rgba(76, 175, 80, 0.06);
    }
    .row-paid td { color: var(--color-text-secondary, #888); }
    .row-pending { background: transparent; }
    @media (prefers-color-scheme: dark) {
      .summary-card.paid { background: rgba(76, 175, 80, 0.12); }
      .summary-card.pending { background: rgba(255, 152, 0, 0.12); }
      .summary-card.extra { background: rgba(244, 67, 54, 0.12); }
      .row-paid { background: rgba(76, 175, 80, 0.08); }
    }
    @media (max-width: 599px) {
      .summary-cards { grid-template-columns: 1fr; gap: 8px; }
      .table-container { -webkit-overflow-scrolling: touch; }
      table { font-size: 0.8rem; }
    }
  `]
})
export class AmortizationTableComponent {
  @Input({ required: true }) schedule!: AmortizationSchedule;

  displayedColumns = ['period', 'date', 'payment', 'principal', 'interest', 'balance'];
}
