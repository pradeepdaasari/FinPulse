import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { LocalDatePipe } from '../../shared/local-date.pipe';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Subject, debounceTime } from 'rxjs';
import { DebtService } from '../../core/services/debt.service';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
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
  imports: [CommonModule, MatCardModule, MatIconModule, MatSliderModule, MatProgressSpinnerModule, MatTableModule, SkeletonLoaderComponent, CurrencyPipe, DatePipe, LocalDatePipe],
  template: `
    <p class="page-subtitle">Use the sliders below to see how extra payments affect your payoff timeline.</p>

    @if (loadingDebts()) {
      <app-skeleton type="card" [count]="4"></app-skeleton>
    } @else {
      <div class="sliders-container">
        @for (debt of debts(); track debt.key) {
          <mat-card class="slider-card" [class.slider-card--active]="debt.extraAmount > 0">
            <mat-card-content>
              <div class="slider-header">
                <div class="debt-identity">
                  <span class="icon-pill" [class.icon-pill--blue]="debt.type === 'PersonalLoan'" [class.icon-pill--amber]="debt.type === 'CreditCard'">
                    <mat-icon>{{ debt.type === 'CreditCard' ? 'credit_card' : 'account_balance' }}</mat-icon>
                  </span>
                  <span class="debt-name">{{ debt.debtName }}</span>
                </div>
                <span class="debt-balance">{{ debt.balance | currency }}</span>
              </div>
              <div class="slider-row">
                <mat-slider min="0" max="500" step="25" [discrete]="true">
                  <input matSliderThumb [value]="debt.extraAmount"
                    (valueChange)="onSliderChange(debt, $event)">
                </mat-slider>
                <span class="extra-amount" [class.extra-amount--active]="debt.extraAmount > 0">+{{ debt.extraAmount | currency }}/mo</span>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>

      @if (simulating()) {
        <div class="spinner-wrapper">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      }

      @if (result()) {
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title>Simulation Results</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="results-summary">
              <div class="stat-card stat-card--blue">
                <span class="stat-icon-pill stat-icon-pill--blue">
                  <mat-icon>schedule</mat-icon>
                </span>
                <span class="stat-value">{{ result()!.totalMonthsSaved }}</span>
                <span class="stat-label">Months Saved</span>
              </div>
              <div class="stat-card stat-card--green">
                <span class="stat-icon-pill stat-icon-pill--green">
                  <mat-icon>savings</mat-icon>
                </span>
                <span class="stat-value">{{ result()!.totalInterestSaved | currency }}</span>
                <span class="stat-label">Interest Saved</span>
              </div>
              <div class="stat-card stat-card--purple">
                <span class="stat-icon-pill stat-icon-pill--purple">
                  <mat-icon>event_available</mat-icon>
                </span>
                <span class="stat-value">{{ result()!.newDebtFreeDate | localDate:'mediumDate' }}</span>
                <span class="stat-label">New Debt-Free Date</span>
              </div>
            </div>

            <div class="table-wrapper">
              <table mat-table [dataSource]="result()!.projections" class="projection-table">
                <ng-container matColumnDef="debtName">
                  <th mat-header-cell *matHeaderCellDef>Debt</th>
                  <td mat-cell *matCellDef="let p">{{ p.debtName }}</td>
                </ng-container>
                <ng-container matColumnDef="monthsSaved">
                  <th mat-header-cell *matHeaderCellDef>Months Saved</th>
                  <td mat-cell *matCellDef="let p" [class.cell-green]="p.monthsSaved > 0">{{ p.monthsSaved }}</td>
                </ng-container>
                <ng-container matColumnDef="interestSaved">
                  <th mat-header-cell *matHeaderCellDef>Interest Saved</th>
                  <td mat-cell *matCellDef="let p" class="cell-interest">{{ p.interestSaved | currency }}</td>
                </ng-container>
                <ng-container matColumnDef="newPayoffDate">
                  <th mat-header-cell *matHeaderCellDef>New Payoff Date</th>
                  <td mat-cell *matCellDef="let p">{{ p.newPayoffDate | localDate:'mediumDate' }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="projectionColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: projectionColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      }
    }
  `,
  styles: [`
    .page-subtitle { margin: 0 0 var(--spacing-sm); font-size: 0.9rem; color: var(--color-text-muted); }

    /* Sliders grid */
    .sliders-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .slider-card {
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .slider-card--active {
      border-color: var(--color-success);
      box-shadow: 0 0 0 1px var(--color-success-bg), 0 2px 8px var(--color-success-bg);
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-sm);
    }

    .debt-identity {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .icon-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 12px;
      background: var(--color-border);
    }
    .icon-pill mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    .icon-pill--blue { background: var(--color-stat-blue); }
    .icon-pill--amber { background: var(--color-stat-amber); }

    .debt-name { font-weight: 600; color: var(--color-text); }
    .debt-balance { color: var(--color-text-muted); font-size: 0.875rem; font-weight: 500; }

    .slider-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }
    .slider-row mat-slider { flex: 1; }

    .extra-amount {
      min-width: 100px;
      font-weight: 600;
      color: var(--color-text-muted);
      font-size: 0.9rem;
      text-align: right;
      transition: color 0.2s ease;
    }
    .extra-amount--active {
      color: var(--color-success);
      font-weight: 700;
    }

    /* Spinner */
    .spinner-wrapper {
      display: flex;
      justify-content: center;
      padding: var(--spacing-md) 0;
    }

    /* Results card */
    .results-card {
      margin-top: var(--spacing-md);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      box-shadow: var(--shadow-sm);
    }

    .results-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-md);
      margin: var(--spacing-sm) 0 var(--spacing-md);
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: var(--spacing-md);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      text-align: center;
    }

    .stat-icon-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
    }
    .stat-icon-pill mat-icon { font-size: 22px; width: 22px; height: 22px; color: #fff; }
    .stat-icon-pill--blue { background: var(--color-stat-blue); }
    .stat-icon-pill--green { background: var(--color-stat-green); }
    .stat-icon-pill--purple { background: var(--color-stat-purple); }

    .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--color-text); }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500; letter-spacing: 0.03em; text-transform: uppercase; }

    /* Projection table */
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; margin-top: var(--spacing-sm); }
    .projection-table { width: 100%; }
    .projection-table tr.mat-mdc-row:hover { background: var(--color-stat-blue-bg); }
    .cell-green { color: var(--color-success); font-weight: 600; }
    .cell-interest { color: var(--color-success); font-weight: 700; }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .sliders-container { grid-template-columns: 1fr; }
      .results-summary { grid-template-columns: 1fr; }
      .stat-card { flex-direction: row; justify-content: flex-start; gap: 12px; text-align: left; }
    }
    @media (max-width: 599px) {
      table { font-size: 0.8rem; }
    }

  `]
})
export class WhatIfComponent implements OnInit {
  private debtService = inject(DebtService);
  private simulatorService = inject(SimulatorService);
  private cdr = inject(ChangeDetectorRef);

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
        this.cdr.detectChanges();
      },
      error: () => { this.loadingDebts.set(false); this.cdr.detectChanges(); }
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
        this.cdr.detectChanges();
      },
      error: () => { this.simulating.set(false); this.cdr.detectChanges(); }
    });
  }
}
