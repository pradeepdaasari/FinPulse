import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { SavingsGoalService } from '../../core/services/savings-goal.service';
import { SavingsGoal } from '../../core/models/savings-goal.model';
import { NotificationService } from '../../core/services/notification.service';
import { GoalDialogComponent } from './goal-dialog.component';

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule, MatProgressSpinnerModule, CurrencyPipe, DatePipe],
  template: `
    <div class="header-row">
      <h2>Savings Goals</h2>
      <button mat-raised-button color="primary" (click)="openAdd()">
        <mat-icon>add</mat-icon> Add Goal
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (goals().length === 0) {
      <mat-card class="empty-state">
        <mat-icon>flag</mat-icon>
        <p>No savings goals yet. Set a target to track your progress toward financial goals!</p>
      </mat-card>
    } @else {
      <div class="goals-grid">
        @for (goal of goals(); track goal.id) {
          <mat-card class="goal-card">
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

            @if (getProgress(goal) >= 100) {
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
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .header-row h2 { margin: 0; }
    .goals-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-xl);
    }
    .goal-card { padding: var(--spacing-xl) !important; }
    .goal-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .goal-icon { font-size: 2rem; line-height: 1; }
    .goal-title { flex: 1; }
    .goal-title h3 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .linked-badge { font-size: 0.75rem; color: var(--color-text-secondary); }
    .goal-actions { display: flex; }
    .goal-amounts { margin-bottom: 8px; }
    .goal-amounts .current { font-size: 1.25rem; font-weight: 700; color: var(--color-primary); }
    .goal-amounts .target { font-size: 0.875rem; color: var(--color-text-secondary); margin-left: 4px; }
    .goal-footer { display: flex; justify-content: space-between; margin-top: 8px; }
    .goal-footer .percent { font-weight: 600; font-size: 0.9rem; }
    .goal-footer .target-date { font-size: 0.8rem; color: var(--color-text-secondary); }
    .empty-state { text-align: center; padding: var(--spacing-xl) !important; }
    .empty-state mat-icon { font-size: 56px; height: 56px; width: 56px; color: var(--color-text-muted); }
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

  deleteGoal(goal: SavingsGoal): void {
    if (!this.notify.confirmDelete(goal.name)) return;
    this.service.delete(goal.id).subscribe({
      next: () => { this.notify.success('Goal deleted'); this.loadData(); },
      error: (err) => this.notify.error(err.error?.message || 'Failed to delete')
    });
  }
}
