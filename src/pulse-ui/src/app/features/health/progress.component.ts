import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { MatTableModule } from '@angular/material/table';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkoutLogService } from '../../core/services/workout-log.service';
import { PersonalRecord, ExerciseProgress, WorkoutStats } from '../../core/models/workout-log.model';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatTableModule, MatProgressSpinnerModule, DatePipe, DecimalPipe, FormsModule, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else {
      <!-- Stats Cards -->
      @if (stats()) {
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon-wrap blue">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()!.currentStreak }}</span>
              <span class="stat-label">Day Streak</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap green">
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()!.workoutsThisWeek }}</span>
              <span class="stat-label">This Week</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap purple">
              <mat-icon>date_range</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()!.workoutsThisMonth }}</span>
              <span class="stat-label">This Month</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap orange">
              <mat-icon>fitness_center</mat-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()!.monthlyVolume | number:'1.0-0' }}</span>
              <span class="stat-label">Volume (kg)</span>
            </div>
          </div>
        </div>
      }

      <!-- Personal Records -->
      @if (records().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap orange">
            <mat-icon>emoji_events</mat-icon>
          </div>
          <h3>No personal records yet</h3>
          <p>Start logging workouts to track your PRs!</p>
        </div>
      } @else {
        <!-- Desktop Table -->
        <mat-card class="desktop-only">
          <table mat-table [dataSource]="records()" class="records-table">
            <ng-container matColumnDef="exercise">
              <th mat-header-cell *matHeaderCellDef>Exercise</th>
              <td mat-cell *matCellDef="let r">{{ r.exercise }}</td>
            </ng-container>
            <ng-container matColumnDef="weight">
              <th mat-header-cell *matHeaderCellDef>Max Weight</th>
              <td mat-cell *matCellDef="let r">{{ r.maxWeight | number:'1.0-1' }} kg</td>
            </ng-container>
            <ng-container matColumnDef="reps">
              <th mat-header-cell *matHeaderCellDef>Best Set</th>
              <td mat-cell *matCellDef="let r">{{ r.bestSet.weight }}×{{ r.bestSet.reps }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let r">{{ r.bestSet.date | date:'MMM d' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="prColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: prColumns;"></tr>
          </table>
        </mat-card>

        <!-- Mobile Cards -->
        <div class="mobile-cards">
          @for (r of records(); track r.exercise) {
            <div class="pr-card">
              <div class="pr-icon">
                <mat-icon>emoji_events</mat-icon>
              </div>
              <div class="pr-mid">
                <span class="pr-name">{{ r.exercise }}</span>
                <span class="pr-date">{{ r.bestSet.date | date:'MMM d, yyyy' }}</span>
              </div>
              <div class="pr-right">
                <span class="pr-weight">{{ r.maxWeight | number:'1.0-1' }}</span>
                <span class="pr-unit">kg · {{ r.bestSet.weight }}×{{ r.bestSet.reps }}</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Exercise Progress Chart -->
      <div class="progress-controls">
        <mat-form-field appearance="outline" class="exercise-select">
          <mat-label>Exercise</mat-label>
          <mat-select [value]="selectedExercise()" (selectionChange)="selectedExercise.set($event.value); loadProgress()">
            @for (ex of exercises(); track ex) {
              <mat-option [value]="ex">{{ ex }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (progressLoading()) {
        <div class="loading-row"><mat-spinner diameter="24"></mat-spinner></div>
      } @else if (selectedExercise() && progress().length === 0) {
        <p class="no-progress-msg">No progress data for this exercise yet.</p>
      } @else if (progress().length > 0) {
        <div class="progress-chart">
          @for (p of progress(); track p.date) {
            <div class="progress-bar-item">
              <span class="bar-date">{{ p.date | date:'M/d' }}</span>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="getBarWidth(p.maxWeight)"></div>
              </div>
              <span class="bar-value">{{ p.maxWeight }}kg</span>
            </div>
          }
        </div>
      }
    }
    </div>
  `,
  styles: [`
    .stats-row {
      display: flex; gap: 12px; overflow-x: auto;
      margin-bottom: var(--spacing-lg); padding-bottom: 4px;
      scrollbar-width: none;
    }
    .stats-row::-webkit-scrollbar { display: none; }
    .stat-card {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; background: var(--color-surface);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);
      min-width: 0; flex: 1;
    }
    .stat-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap.blue { background: var(--color-stat-blue-bg); }
    .stat-icon-wrap.blue mat-icon { color: var(--color-stat-blue); }
    .stat-icon-wrap.green { background: var(--color-stat-green-bg); }
    .stat-icon-wrap.green mat-icon { color: var(--color-stat-green); }
    .stat-icon-wrap.purple { background: var(--color-stat-purple-bg); }
    .stat-icon-wrap.purple mat-icon { color: var(--color-stat-purple); }
    .stat-icon-wrap.orange { background: var(--color-stat-amber-bg); }
    .stat-icon-wrap.orange mat-icon { color: var(--color-stat-amber); }
    .stat-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .stat-info { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: 1.25rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap; }

    .empty-state {
      text-align: center; padding: var(--spacing-lg) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-md); margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-icon-wrap.orange { background: var(--color-stat-amber-bg); }
    .empty-icon-wrap.orange mat-icon { color: var(--color-stat-amber); }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { margin: 0 0 var(--spacing-xs); font-size: 1.1rem; }
    .empty-state p { color: var(--color-text-muted); margin: 0 auto var(--spacing-md); max-width: 360px; }

    .desktop-only { overflow-x: auto; }
    .records-table { width: 100%; }

    .mobile-cards { display: none; }
    .pr-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 12px; background: var(--color-surface);
      border-radius: var(--radius-sm); margin-bottom: 8px;
      box-shadow: var(--shadow-sm);
    }
    .pr-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-amber-bg);
    }
    .pr-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-stat-amber); }
    .pr-mid { flex: 1; min-width: 0; }
    .pr-name { display: block; font-weight: 600; font-size: 0.9rem; }
    .pr-date { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .pr-right { text-align: right; }
    .pr-weight { display: block; font-weight: 700; font-size: 1rem; color: var(--color-primary); }
    .pr-unit { display: block; font-size: 0.7rem; color: var(--color-text-muted); }

    .progress-controls { margin-bottom: 12px; }
    .exercise-select { width: 280px; }
    .progress-chart { display: flex; flex-direction: column; gap: 6px; }
    .progress-bar-item { display: flex; align-items: center; gap: 8px; }
    .bar-date { font-size: 0.75rem; color: var(--color-text-muted); min-width: 36px; }
    .bar-track {
      flex: 1; height: 20px; background: var(--color-stat-blue-bg);
      border-radius: 4px; overflow: hidden;
    }
    .bar-fill { height: 100%; background: var(--color-primary); border-radius: 4px; transition: width 0.3s; }
    .bar-value { font-size: 0.75rem; font-weight: 600; min-width: 50px; }
    .loading-row { display: flex; justify-content: center; padding: var(--spacing-md); }
    .no-progress-msg { text-align: center; color: var(--color-text-muted); font-size: var(--text-sm); padding: var(--spacing-md); }

    @media (max-width: 1199px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
    }

    @media (max-width: 599px) {
      .stat-card { min-width: 140px; flex: 0 0 auto; }
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
      .exercise-select { width: 100%; }
    }
  `]
})
export class ProgressComponent implements OnInit {
  private logService = inject(WorkoutLogService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  stats = signal<WorkoutStats | null>(null);
  records = signal<PersonalRecord[]>([]);
  exercises = signal<string[]>([]);
  progress = signal<ExerciseProgress[]>([]);
  selectedExercise = signal('');
  progressLoading = signal(false);
  prColumns = ['exercise', 'weight', 'reps', 'date'];
  private maxWeight = 0;

  ngOnInit() {
    this.loadData();
  }

  loadData(): void {
    this.logService.getStats().subscribe({
      next: s => { this.stats.set(s); this.cdr.detectChanges(); },
      error: () => {}
    });
    this.logService.getRecords().subscribe({
      next: r => { this.records.set(r); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
    this.logService.getExercises().subscribe({
      next: e => { this.exercises.set(e); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  loadProgress() {
    if (!this.selectedExercise()) return;
    this.progressLoading.set(true);
    this.logService.getProgress(this.selectedExercise()).subscribe({
      next: p => {
        this.progress.set(p);
        this.maxWeight = Math.max(...p.map(x => x.maxWeight), 1);
        this.progressLoading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.progressLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  getBarWidth(weight: number): number {
    return (weight / this.maxWeight) * 100;
  }
}
