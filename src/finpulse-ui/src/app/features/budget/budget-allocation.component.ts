import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetAllocation } from '../../core/models/budget.model';

@Component({
  selector: 'app-budget-allocation',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatProgressSpinnerModule, MatIconModule, BaseChartDirective, CurrencyPipe],
  template: `
    <h2><mat-icon class="section-icon">pie_chart</mat-icon> Budget Allocation</h2>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (allocation()) {
      <div class="budget-grid">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Income Breakdown (50/30/20)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="income-display">
              <span>Monthly Income: <strong>{{ allocation()!.monthlyIncome | currency }}</strong></span>
            </div>
            <canvas baseChart
              [data]="pieData()"
              [options]="pieOptions"
              type="pie">
            </canvas>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Suggested Debt Allocations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="allocation()!.suggestedAllocations">
              <ng-container matColumnDef="debtName">
                <th mat-header-cell *matHeaderCellDef>Debt</th>
                <td mat-cell *matCellDef="let a">{{ a.debtName }}</td>
              </ng-container>
              <ng-container matColumnDef="minimumPayment">
                <th mat-header-cell *matHeaderCellDef>Min Payment</th>
                <td mat-cell *matCellDef="let a">{{ a.minimumPayment | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="suggestedPayment">
                <th mat-header-cell *matHeaderCellDef>Suggested</th>
                <td mat-cell *matCellDef="let a">{{ a.suggestedPayment | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="extraPayment">
                <th mat-header-cell *matHeaderCellDef>Extra</th>
                <td mat-cell *matCellDef="let a">{{ a.extraPayment | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="reason">
                <th mat-header-cell *matHeaderCellDef>Reason</th>
                <td mat-cell *matCellDef="let a">{{ a.reason }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="allocationColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: allocationColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .budget-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--spacing-lg);
    }
    .chart-card canvas {
      max-height: 250px;
      padding: var(--spacing-sm);
    }
    .income-display {
      margin: var(--spacing-md) 0;
      font-size: 1rem;
      font-weight: 500;
    }
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    table { width: 100%; min-width: 500px; }
    @media (max-width: 768px) {
      .budget-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BudgetAllocationComponent implements OnInit {
  private budgetService = inject(BudgetService);

  allocation = signal<BudgetAllocation | null>(null);
  loading = signal(true);
  allocationColumns = ['debtName', 'minimumPayment', 'suggestedPayment', 'extraPayment', 'reason'];

  pieData = signal<ChartData<'pie'>>({ labels: [], datasets: [] });
  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  ngOnInit(): void {
    this.budgetService.getAllocation().subscribe({
      next: (data) => {
        this.allocation.set(data);
        this.buildPieChart(data);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  private buildPieChart(data: BudgetAllocation): void {
    this.pieData.set({
      labels: ['Needs (50%)', 'Wants (30%)', 'Debt & Savings (20%)'],
      datasets: [{
        data: [data.needs, data.wants, data.debtSavings],
        backgroundColor: ['#1976d2', '#f57c00', '#388e3c']
      }]
    });
  }
}
