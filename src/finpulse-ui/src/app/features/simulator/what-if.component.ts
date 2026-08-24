import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Subject, debounceTime } from 'rxjs';
import { DebtService } from '../../core/services/debt.service';
import { SimulatorService } from '../../core/services/simulator.service';
import { WhatIfResult, ExtraPaymentEntry } from '../../core/models/simulator.model';
import { DebtItem } from '../../core/models/debt-item.model';

interface DebtSlider {
  key: string;
  debtId: string;
  debtName: string;
  type: string;
  balance: number;
  extraAmount: number;
}

@Component({
  selector: 'app-what-if',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatSliderModule, MatProgressSpinnerModule, MatTableModule, CurrencyPipe, DatePipe],
  template: `
    <h2><mat-icon class="section-icon">science</mat-icon> What-If Simulator</h2>
    <p>Use the sliders below to see how extra payments affect your payoff timeline.</p>

    @if (loadingDebts()) {
      <mat-spinner></mat-spinner>
    } @else {
      <div class="sliders-container">
        @for (debt of debts(); track debt.key) {
          <mat-card class="slider-card">
            <mat-card-content>
              <div class="slider-header">
                <span class="debt-name">{{ debt.debtName }}</span>
                <span class="debt-balance">{{ debt.balance | currency }}</span>
              </div>
              <div class="slider-row">
                <mat-slider min="0" max="500" step="25" [discrete]="true">
                  <input matSliderThumb [value]="debt.extraAmount"
                    (valueChange)="onSliderChange(debt, $event)">
                </mat-slider>
                <span class="extra-amount">+{{ debt.extraAmount | currency }}/mo</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      @if (simulating()) {
        <mat-spinner diameter="32"></mat-spinner>
      }

      @if (result()) {
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title>Simulation Results</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="results-summary">
              <div class="result-stat">
                <span class="label">Total Months Saved</span>
                <span class="value highlight">{{ result()!.totalMonthsSaved }}</span>
              </div>
              <div class="result-stat">
                <span class="label">Total Interest Saved</span>
                <span class="value highlight">{{ result()!.totalInterestSaved | currency }}</span>
              </div>
              <div class="result-stat">
                <span class="label">New Debt-Free Date</span>
                <span class="value">{{ result()!.newDebtFreeDate | date:'mediumDate' }}</span>
              </div>
            </div>

            <table mat-table [dataSource]="result()!.projections" class="projection-table">
              <ng-container matColumnDef="debtName">
                <th mat-header-cell *matHeaderCellDef>Debt</th>
                <td mat-cell *matCellDef="let p">{{ p.debtName }}</td>
              </ng-container>
              <ng-container matColumnDef="monthsSaved">
                <th mat-header-cell *matHeaderCellDef>Months Saved</th>
                <td mat-cell *matCellDef="let p">{{ p.monthsSaved }}</td>
              </ng-container>
              <ng-container matColumnDef="interestSaved">
                <th mat-header-cell *matHeaderCellDef>Interest Saved</th>
                <td mat-cell *matCellDef="let p">{{ p.interestSaved | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="newPayoffDate">
                <th mat-header-cell *matHeaderCellDef>New Payoff Date</th>
                <td mat-cell *matCellDef="let p">{{ p.newPayoffDate | date:'mediumDate' }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="projectionColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: projectionColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      }
    }
  `,
  styles: [`
    .sliders-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }
    .slider-card { padding: var(--spacing-sm); }
    .slider-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--spacing-sm);
    }
    .debt-name { font-weight: 600; }
    .debt-balance { color: var(--color-text-secondary); font-size: 0.875rem; }
    .slider-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }
    .slider-row mat-slider { flex: 1; }
    .extra-amount { min-width: 90px; font-weight: 600; color: var(--color-primary); }
    .results-card { margin-top: var(--spacing-lg); }
    .results-summary {
      display: flex;
      gap: var(--spacing-xl);
      margin: var(--spacing-md) 0 var(--spacing-lg);
      flex-wrap: wrap;
    }
    .result-stat { display: flex; flex-direction: column; gap: 2px; }
    .label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 500; letter-spacing: 0.05em; }
    .value { font-size: 1.25rem; font-weight: 700; }
    .highlight { color: var(--color-success); }
    .projection-table { width: 100%; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    @media (max-width: 768px) {
      .sliders-container { grid-template-columns: 1fr; }
      .results-summary { gap: var(--spacing-md); }
    }
  `]
})
export class WhatIfComponent implements OnInit {
  private debtService = inject(DebtService);
  private simulatorService = inject(SimulatorService);

  debts = signal<DebtSlider[]>([]);
  result = signal<WhatIfResult | null>(null);
  loadingDebts = signal(true);
  simulating = signal(false);
  projectionColumns = ['debtName', 'monthsSaved', 'interestSaved', 'newPayoffDate'];

  private changeSubject = new Subject<void>();

  ngOnInit(): void {
    this.changeSubject.pipe(debounceTime(500)).subscribe(() => this.runSimulation());

    this.debtService.getAll().subscribe({
      next: (debts) => {
        const items = debts.map(d => ({
          key: d.key, debtId: String(d.id), debtName: d.name,
          type: d.type, balance: d.currentBalance, extraAmount: 0
        }));
        this.debts.set(items);
        this.loadingDebts.set(false);
      },
      error: () => { this.loadingDebts.set(false); }
    });
  }

  onSliderChange(debt: DebtSlider, value: number): void {
    const updated = this.debts().map(d =>
      d.key === debt.key ? { ...d, extraAmount: value } : d
    );
    this.debts.set(updated);
    this.changeSubject.next();
  }

  private runSimulation(): void {
    const entries: ExtraPaymentEntry[] = this.debts()
      .filter(d => d.extraAmount > 0)
      .map(d => ({ debtId: d.debtId, debtName: d.debtName, extraAmount: d.extraAmount }));

    if (entries.length === 0) {
      this.result.set(null);
      return;
    }

    this.simulating.set(true);
    this.simulatorService.runWhatIf({ extraPayments: entries }).subscribe({
      next: (result) => {
        this.result.set(result);
        this.simulating.set(false);
      },
      error: () => { this.simulating.set(false); }
    });
  }
}
