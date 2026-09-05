import { Component, ChangeDetectorRef, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetAllocation } from '../../core/models/budget.model';

@Component({
  selector: 'app-budget-allocation',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, SkeletonLoaderComponent, BaseChartDirective, CurrencyPipe],
  template: `
    <h2><mat-icon class="section-icon">pie_chart</mat-icon> Budget Allocation</h2>

    @if (loading()) {
      <app-skeleton type="chart"></app-skeleton>
    } @else if (allocation()) {
      <!-- Income Summary Stats -->
      <div class="income-stats">
        <div class="stat-card">
          <div class="stat-icon blue">
            <mat-icon>account_balance_wallet</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ allocation()!.monthlyIncome | currency }}</span>
            <span class="stat-label">Monthly Income</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">
            <mat-icon>home</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ needsAmount() | currency }}</span>
            <span class="stat-label">Needs (50%)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <mat-icon>shopping_bag</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ wantsAmount() | currency }}</span>
            <span class="stat-label">Wants (30%)</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <mat-icon>savings</mat-icon>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ debtSavingsAmount() | currency }}</span>
            <span class="stat-label">Debt & Savings (20%)</span>
          </div>
        </div>
      </div>

      <div class="budget-grid">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Income Breakdown (50/30/20)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas baseChart
              [data]="pieData()"
              [options]="pieOptions"
              type="pie">
            </canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="allocations-card">
          <mat-card-header>
            <mat-card-title>Suggested Debt Allocations</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <!-- Desktop table -->
            <div class="table-wrapper desktop-only">
              <table mat-table [dataSource]="allocation()!.suggestedAllocations">
                <ng-container matColumnDef="debtName">
                  <th mat-header-cell *matHeaderCellDef>Debt</th>
                  <td mat-cell *matCellDef="let a">
                    <span class="debt-name-cell">
                      <mat-icon class="debt-icon" [class.loan-icon]="isLoan(a.debtName)" [class.card-icon]="!isLoan(a.debtName)">
                        {{ isLoan(a.debtName) ? 'account_balance' : 'credit_card' }}
                      </mat-icon>
                      {{ a.debtName }}
                    </span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="minimumPayment">
                  <th mat-header-cell *matHeaderCellDef>Min Payment</th>
                  <td mat-cell *matCellDef="let a">{{ a.minimumPayment | currency }}</td>
                </ng-container>
                <ng-container matColumnDef="suggestedPayment">
                  <th mat-header-cell *matHeaderCellDef>Suggested</th>
                  <td mat-cell *matCellDef="let a">
                    <span class="suggested-value">{{ a.suggestedPayment | currency }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="extraPayment">
                  <th mat-header-cell *matHeaderCellDef>Extra</th>
                  <td mat-cell *matCellDef="let a">
                    <span class="extra-value" [class.extra-positive]="a.extraPayment > 0">{{ a.extraPayment | currency }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="reason">
                  <th mat-header-cell *matHeaderCellDef>Reason</th>
                  <td mat-cell *matCellDef="let a">
                    <span class="reason-badge" [ngClass]="getReasonClass(a.reason)">{{ a.reason }}</span>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="allocationColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: allocationColumns;"></tr>
              </table>
            </div>

            <!-- Mobile cards -->
            <div class="mobile-cards mobile-only">
              @for (a of allocation()!.suggestedAllocations; track a.debtName) {
                <div class="allocation-mobile-card">
                  <div class="mobile-card-header">
                    <mat-icon class="debt-icon" [class.loan-icon]="isLoan(a.debtName)" [class.card-icon]="!isLoan(a.debtName)">
                      {{ isLoan(a.debtName) ? 'account_balance' : 'credit_card' }}
                    </mat-icon>
                    <span class="mobile-debt-name">{{ a.debtName }}</span>
                    <span class="reason-badge" [ngClass]="getReasonClass(a.reason)">{{ a.reason }}</span>
                  </div>
                  <div class="mobile-card-body">
                    <div class="mobile-stat">
                      <span class="mobile-stat-label">Min Payment</span>
                      <span class="mobile-stat-value">{{ a.minimumPayment | currency }}</span>
                    </div>
                    <div class="mobile-stat">
                      <span class="mobile-stat-label">Suggested</span>
                      <span class="mobile-stat-value suggested-value">{{ a.suggestedPayment | currency }}</span>
                    </div>
                    <div class="mobile-stat">
                      <span class="mobile-stat-label">Extra</span>
                      <span class="mobile-stat-value extra-value" [class.extra-positive]="a.extraPayment > 0">{{ a.extraPayment | currency }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    /* Income Stats Section */
    .income-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-md, 16px);
      margin-bottom: var(--spacing-lg, 24px);
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--color-surface);
      border-radius: var(--radius-md);
      padding: 16px;
      box-shadow: var(--shadow-sm);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      padding: 10px;
      flex-shrink: 0;
    }

    .stat-icon mat-icon {
      color: #fff;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .stat-icon.blue { background: var(--color-stat-blue); }
    .stat-icon.orange { background: var(--color-stat-amber); }
    .stat-icon.purple { background: var(--color-stat-purple); }
    .stat-icon.green { background: var(--color-stat-green); }

    .stat-content {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stat-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    /* Budget Grid */
    .budget-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--spacing-lg, 24px);
    }

    .chart-card canvas {
      max-height: 280px;
      padding: var(--spacing-sm, 8px);
    }

    /* Table Styling */
    .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    table {
      width: 100%;
      min-width: 500px;
    }

    .debt-name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .debt-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .debt-icon.loan-icon {
      color: var(--color-primary);
    }

    .debt-icon.card-icon {
      color: var(--color-stat-purple);
    }

    .suggested-value {
      font-weight: 700;
      color: var(--color-primary);
    }

    .extra-value {
      font-weight: 700;
      color: var(--color-text-secondary);
    }

    .extra-value.extra-positive {
      color: var(--color-success);
    }

    .reason-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .reason-badge.reason-apr {
      background: var(--color-stat-amber-bg);
      color: var(--color-stat-amber);
    }

    .reason-badge.reason-balance {
      background: var(--color-stat-blue-bg);
      color: var(--color-stat-blue);
    }

    .reason-badge.reason-priority {
      background: var(--color-stat-red-bg);
      color: var(--color-stat-red);
    }

    .reason-badge.reason-default {
      background: var(--color-border);
      color: var(--color-text-muted);
    }

    /* Mobile cards */
    .mobile-only { display: none; }
    .desktop-only { display: block; }

    .mobile-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .allocation-mobile-card {
      background: var(--color-surface-secondary);
      border-radius: var(--radius-md);
      padding: 14px;
      box-shadow: var(--shadow-sm);
    }

    .mobile-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .mobile-debt-name {
      font-weight: 600;
      font-size: 0.95rem;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .mobile-card-body {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .mobile-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mobile-stat-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .mobile-stat-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--color-text);
    }

    /* Responsive */
    @media (max-width: 599px) {
      .income-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .stat-card {
        padding: 12px;
        gap: 10px;
      }

      .stat-icon {
        width: 38px;
        height: 38px;
      }

      .stat-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .stat-value {
        font-size: 1.05rem;
      }

      .budget-grid {
        grid-template-columns: 1fr;
      }

      .mobile-only { display: block; }
      .desktop-only { display: none; }
    }

    @media (max-width: 768px) and (min-width: 600px) {
      .income-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .budget-grid {
        grid-template-columns: 1fr;
      }
    }

  `]
})
export class BudgetAllocationComponent implements OnInit {
  private budgetService = inject(BudgetService);
  private cdr = inject(ChangeDetectorRef);

  allocation = signal<BudgetAllocation | null>(null);
  loading = signal(true);
  allocationColumns = ['debtName', 'minimumPayment', 'suggestedPayment', 'extraPayment', 'reason'];

  pieData = signal<ChartData<'pie'>>({ labels: [], datasets: [] });
  pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  needsAmount = computed(() => this.allocation()?.needs ?? 0);
  wantsAmount = computed(() => this.allocation()?.wants ?? 0);
  debtSavingsAmount = computed(() => this.allocation()?.debtSavings ?? 0);

  ngOnInit(): void {
    this.budgetService.getAllocation().subscribe({
      next: (data) => {
        this.allocation.set(data);
        this.buildPieChart(data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  isLoan(debtName: string): boolean {
    const lower = debtName.toLowerCase();
    return lower.includes('loan') || lower.includes('mortgage') || lower.includes('auto') || lower.includes('student');
  }

  getReasonClass(reason: string): string {
    const lower = reason.toLowerCase();
    if (lower.includes('apr') || lower.includes('interest') || lower.includes('rate')) {
      return 'reason-apr';
    }
    if (lower.includes('balance') || lower.includes('lowest') || lower.includes('small')) {
      return 'reason-balance';
    }
    if (lower.includes('priority') || lower.includes('urgent') || lower.includes('overdue')) {
      return 'reason-priority';
    }
    return 'reason-default';
  }

  private buildPieChart(data: BudgetAllocation): void {
    this.pieData.set({
      labels: ['Needs (50%)', 'Wants (30%)', 'Debt & Savings (20%)'],
      datasets: [{
        data: [data.needs, data.wants, data.debtSavings],
        backgroundColor: ['#007AFF', '#FF9500', '#34C759']
      }]
    });
  }
}
