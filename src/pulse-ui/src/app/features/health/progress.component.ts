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
import { WorkoutLogService } from '../../core/services/workout-log.service';
import { PersonalRecord, ExerciseProgress, WorkoutStats } from '../../core/models/workout-log.model';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatTableModule, DatePipe, DecimalPipe, FormsModule, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadData()">
    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else {
      <!-- Stats Cards -->
      @if (stats()) {
        <div class="stats-grid">
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
              <span class="stat-label">Volume (lbs)</span>
            </div>
          </div>
        </div>
      }

      <!-- Personal Records -->
      <div class="section-label">Personal Records</div>
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
              <td mat-cell *matCellDef="let r">{{ r.maxWeight | number:'1.0-1' }} lbs</td>
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
                <span class="pr-unit">lbs · {{ r.bestSet.weight }}×{{ r.bestSet.reps }}</span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Exercise Progress Chart -->
      <div class="section-label">Exercise Progress</div>
      <div class="progress-controls">
        <mat-form-field appearance="outline" class="exercise-select">
          <mat-label>Exercise</mat-label>
          <mat-select [(value)]="selectedExercise" (selectionChange)="loadProgress()">
            @for (ex of exercises(); track ex) {
              <mat-option [value]="ex">{{ ex }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (progress().length > 0) {
        <div class="progress-chart">
          @for (p of progress(); track p.date) {
            <div class="progress-bar-item">
              <span class="bar-date">{{ p.date | date:'M/d' }}</span>
              <div class="bar-track">
                <div class="bar-fill" [style.width.%]="getBarWidth(p.maxWeight)"></div>
              </div>
              <span class="bar-value">{{ p.maxWeight }}lbs</span>
            </div>
          }
        </div>
      }
    }
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
      margin-bottom: var(--spacing-lg);
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px;
      padding: 16px; background: var(--color-surface);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);
    }
    .stat-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon-wrap.blue { background: rgba(21,101,192,0.1); }
    .stat-icon-wrap.blue mat-icon { color: #1565c0; }
    .stat-icon-wrap.green { background: rgba(46,125,50,0.1); }
    .stat-icon-wrap.green mat-icon { color: #2e7d32; }
    .stat-icon-wrap.purple { background: rgba(106,27,154,0.1); }
    .stat-icon-wrap.purple mat-icon { color: #6a1b9a; }
    .stat-icon-wrap.orange { background: rgba(230,81,0,0.1); }
    .stat-icon-wrap.orange mat-icon { color: #e65100; }
    .stat-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.25rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); }

    .section-label {
      font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em;
      text-transform: uppercase; color: var(--color-text-muted);
      margin: var(--spacing-lg) 0 var(--spacing-sm);
    }

    .empty-state {
      text-align: center; padding: var(--spacing-lg) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-icon-wrap.orange { background: rgba(230,81,0,0.1); }
    .empty-icon-wrap.orange mat-icon { color: #e65100; }
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
      background: rgba(230,81,0,0.1);
    }
    .pr-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: #e65100; }
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
      flex: 1; height: 20px; background: rgba(21,101,192,0.08);
      border-radius: 4px; overflow: hidden;
    }
    .bar-fill { height: 100%; background: var(--color-primary); border-radius: 4px; transition: width 0.3s; }
    .bar-value { font-size: 0.75rem; font-weight: 600; min-width: 50px; }

    @media (max-width: 599px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
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
  selectedExercise = '';
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
    if (!this.selectedExercise) return;
    this.logService.getProgress(this.selectedExercise).subscribe({
      next: p => {
        this.progress.set(p);
        this.maxWeight = Math.max(...p.map(x => x.maxWeight), 1);
        this.cdr.detectChanges();
      }
    });
  }

  getBarWidth(weight: number): number {
    return (weight / this.maxWeight) * 100;
  }
}
