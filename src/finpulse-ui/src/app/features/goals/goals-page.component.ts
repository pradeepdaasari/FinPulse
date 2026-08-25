import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { SavingsGoal } from '../../core/models/savings-goal.model';
import { NotificationService } from '../../core/services/notification.service';
import { GoalDialogComponent } from './goal-dialog.component';

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatDialogModule, CurrencyPipe, DatePipe],
  template: `
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openAdd()">
        <mat-icon>add</mat-icon> Add Goal
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (goals().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap green">
          <mat-icon>flag</mat-icon>
        </div>
        <h3>Set your first savings goal</h3>
        <p>Every big achievement starts with a clear target. What are you saving for? A vacation, emergency fund, or new car?</p>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Create Goal
        </button>
      </div>
    } @else {
      <div class="goals-grid">
        @for (goal of goals(); track goal.id) {
          <mat-card class="goal-card" [class.near-complete]="getProgress(goal) >= 80 && getProgress(goal) < 100" [class.complete]="getProgress(goal) >= 100">
            <div class="goal-header">
              <span class="goal-icon">{{ goal.icon || '🎯' }}</span>
              <div class="goal-title">
                <h3>{{ goal.name }}</h3>
                @if (goal.linkedAccountName) {
                  <span class="linked-badge">🔗 {{ goal.linkedAccountName }}</span>
                }
              </div>
              <div class="goal-actions">
                <button mat-icon-button (click)="edit(goal)" aria-label="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteGoal(goal)" aria-label="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>

            <div class="goal-amounts">
              <span class="current">{{ goal.currentAmount | currency }}</span>
              <span class="target">of {{ goal.targetAmount | currency }}</span>
            </div>

            <mat-progress-bar
              mode="determinate"
              [value]="getProgress(goal)"
              [color]="getProgress(goal) >= 100 ? 'accent' : 'primary'">
            </mat-progress-bar>

            <div class="goal-footer">
              <span class="percent">{{ getProgress(goal) | number:'1.0-0' }}%</span>
              @if (goal.targetDate) {
                <span class="target-date">Target: {{ goal.targetDate | date:'mediumDate' }}</span>
              }
            </div>

            @if (getProgress(goal) < 100) {
              <button mat-stroked-button class="contribute-btn" (click)="quickContribute(goal)">
                <mat-icon>add_circle</mat-icon> Add Money
              </button>
            } @else {
              <div class="goal-complete-badge">
                <mat-icon>celebration</mat-icon> Goal Achieved!
              </div>
            }
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .goals-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-md);
    }
    .goal-card { padding: var(--spacing-md) !important; transition: border-color 0.2s, background 0.2s; }
    .goal-card.near-complete {
      background: linear-gradient(135deg, rgba(48, 209, 88, 0.04) 0%, rgba(48, 209, 88, 0.08) 100%) !important;
      border: 1px solid rgba(48, 209, 88, 0.15);
    }
    .goal-card.complete {
      border: 2px solid var(--color-success);
    }
    .goal-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .goal-icon { font-size: 2rem; line-height: 1; }
    .goal-title { flex: 1; }
    .goal-title h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .linked-badge { font-size: 0.75rem; color: var(--color-text-secondary); }
    .goal-actions { display: flex; }
    .goal-amounts { margin-bottom: 8px; }
    .goal-amounts .current { font-size: 1.1rem; font-weight: 700; color: var(--color-primary); }
    .goal-amounts .target { font-size: 0.875rem; color: var(--color-text-secondary); margin-left: 4px; }
    .goal-footer { display: flex; justify-content: space-between; margin-top: 8px; }
    .goal-footer .percent { font-weight: 600; font-size: 0.9rem; }
    .goal-footer .target-date { font-size: 0.8rem; color: var(--color-text-secondary); }
    .goal-complete-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      background: var(--color-success-bg);
      color: var(--color-success);
      font-size: var(--text-xs);
      font-weight: 600;
      margin-top: 8px;
    }
    .goal-complete-badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .contribute-btn {
      width: 100%;
      margin-top: 10px;
      border-color: var(--color-success) !important;
      color: var(--color-success) !important;
      font-weight: 500;
    }
    .contribute-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 4px;
    }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
      .goals-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class GoalsPageComponent implements OnInit {
  private service = inject(SavingsGoalService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  goals = signal<SavingsGoal[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.service.getAll().subscribe({
      next: (goals) => { this.goals.set(goals); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  getProgress(goal: SavingsGoal): number {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
  }

  openAdd(): void {
    const dialogRef = this.dialog.open(GoalDialogComponent, {
      width: '600px', maxWidth: '95vw', data: null
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.create(result).subscribe({
          next: () => { this.notify.success('Goal created'); this.loadData(); },
          error: (err) => this.notify.error(err.error?.message || 'Failed to create')
        });
      }
    });
  }

  edit(goal: SavingsGoal): void {
    const dialogRef = this.dialog.open(GoalDialogComponent, {
      width: '600px', maxWidth: '95vw', data: goal
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.update(goal.id, result).subscribe({
          next: () => { this.notify.success('Goal updated'); this.loadData(); },
          error: (err) => this.notify.error(err.error?.message || 'Failed to update')
        });
      }
    });
  }

  quickContribute(goal: SavingsGoal): void {
    import('../../shared/amount-input-dialog.component').then(m => {
      this.dialog.open(m.AmountInputDialogComponent, {
        width: '360px',
        data: { title: `Add to "${goal.name}"`, message: `Current: $${goal.currentAmount.toFixed(2)} of $${goal.targetAmount.toFixed(2)}`, defaultValue: 50, icon: 'savings' }
      }).afterClosed().subscribe(amount => {
        if (!amount) return;
        const updated = {
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount + amount,
          targetDate: goal.targetDate || undefined,
          linkedAccountId: goal.linkedAccountId || undefined,
          icon: goal.icon || undefined
        };
        this.service.update(goal.id, updated as any).subscribe({
          next: () => { this.notify.success(`Added $${amount} to ${goal.name}`); this.loadData(); },
          error: () => this.notify.error('Failed to update goal')
        });
      });
    });
  }

  deleteGoal(goal: SavingsGoal): void {
    this.notify.confirmDeleteAsync(goal.name).subscribe(confirmed => {
      if (!confirmed) return;
      this.service.delete(goal.id).subscribe({
        next: () => { this.notify.success('Goal deleted'); this.loadData(); },
        error: (err) => this.notify.error(err.error?.message || 'Failed to delete')
      });
    });
  }
}
