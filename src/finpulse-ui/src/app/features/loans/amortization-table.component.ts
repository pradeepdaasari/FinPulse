import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { AmortizationEntry } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-amortization-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, CurrencyPipe, DatePipe],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="entries">
        <ng-container matColumnDef="period">
          <th mat-header-cell *matHeaderCellDef>Period</th>
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
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      <mat-paginator [pageSize]="12" [pageSizeOptions]="[12, 24, 60]" showFirstLastButtons></mat-paginator>
    </div>
  `,
  styles: [`
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
  `]
})
export class AmortizationTableComponent {
  @Input({ required: true }) entries!: AmortizationEntry[];

  displayedColumns = ['period', 'date', 'payment', 'principal', 'interest', 'balance'];
}
