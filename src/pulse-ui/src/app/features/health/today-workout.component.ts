import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutLogService } from '../../core/services/workout-log.service';
import { ExerciseSet } from '../../core/models/workout-log.model';
import { NotificationService } from '../../core/services/notification.service';
import { toLocalISOString } from '../../core/utils/date-utils';
import { VideoPlayerDialogComponent } from './video-player-dialog.component';

interface ActiveExercise {
  name: string;
  targetSets: number;
  targetReps: string;
  targetWeight?: number;
  notes?: string;
  videoUrl?: string;
  muscleGroup?: string;
  sets: { reps: number; weight: number }[];
}

interface PlanDay {
  id: number;
  dayOfWeek: number;
  focusArea: string;
  exercises: any[];
}

@Component({
  selector: 'app-today-workout',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatChipsModule, MatDialogModule, FormsModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (noPlan()) {
      <div class="empty-state">
        <div class="empty-icon-wrap blue">
          <mat-icon>fitness_center</mat-icon>
        </div>
        <h3>No active workout plan</h3>
        <p>Create a workout plan or activate one to see your daily schedule.</p>
        <button mat-raised-button color="primary" routerLink="/health/plans">
          <mat-icon>add</mat-icon> Go to Plans
        </button>
      </div>
    } @else {
      <!-- Day Navigation -->
      <div class="day-nav">
        <button mat-icon-button (click)="prevDay()" [disabled]="currentDayIndex() === 0">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <div class="day-nav-center">
          <span class="day-nav-label">{{ dayLabel() }}</span>
          <span class="day-nav-focus">{{ currentFocusArea() }}</span>
        </div>
        <button mat-icon-button (click)="nextDay()" [disabled]="currentDayIndex() === allDays().length - 1">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <!-- Day dots -->
      <div class="day-dots">
        @for (day of allDays(); track day.dayOfWeek; let i = $index) {
          <button class="day-dot" [class.active]="i === currentDayIndex()" [class.today]="day.dayOfWeek === todayDow" (click)="goToDay(i)">
            {{ dayShortNames[day.dayOfWeek] }}
          </button>
        }
        <button class="day-dot" [class.active]="currentDayIndex() === -1" [class.rest]="true" (click)="showRest()">
          Sun
        </button>
      </div>

      @if (isRestView()) {
        <div class="empty-state">
          <div class="empty-icon-wrap green">
            <mat-icon>self_improvement</mat-icon>
          </div>
          <h3>Rest Day — Sunday</h3>
          <p>Recovery is part of the plan. Come back stronger!</p>
        </div>
      } @else if (isToday() && alreadyLogged()) {
        <div class="empty-state">
          <div class="empty-icon-wrap green">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h3>Workout Complete!</h3>
          <p>{{ currentFocusArea() }} is done. Great job!</p>
          <button mat-raised-button color="primary" routerLink="/health/progress">
            View Progress
          </button>
        </div>
      } @else {
        <!-- Plan header -->
        <div class="plan-header">
          <div class="day-info">
            <span class="day-badge">Day {{ currentDayIndex() + 1 }} of {{ allDays().length }}</span>
            <span class="focus-badge">{{ currentFocusArea() }}</span>
            @if (isToday()) {
              <span class="today-badge">TODAY</span>
            }
          </div>
          @if (isToday() && !detailMode()) {
            <button mat-raised-button color="primary" class="mark-complete-btn" (click)="markComplete()" [disabled]="saving()">
              <mat-icon>check</mat-icon> Mark Complete
            </button>
          }
        </div>

        <!-- Exercises list -->
        <div class="exercises-list">
          @for (ex of exercises(); track ex.name; let i = $index) {
            <div class="exercise-card" [class.duration-card]="isDurationExercise(ex)">
              <div class="exercise-header">
                <div class="exercise-index">{{ i + 1 }}</div>
                @if (customMode()) {
                  <input class="exercise-name-input" [(ngModel)]="ex.name" placeholder="Exercise name">
                } @else {
                  <div class="exercise-info">
                    <div class="exercise-top-row">
                      @if (ex.videoUrl) {
                        <div class="exercise-thumb" (click)="playVideo(ex)">
                          <img [src]="getThumbnail(ex.videoUrl)" [alt]="ex.name" loading="lazy">
                          <div class="thumb-play"><mat-icon>play_arrow</mat-icon></div>
                        </div>
                      }
                      <div class="exercise-text">
                        <div class="exercise-name-row">
                          <span class="exercise-name">{{ ex.name }}</span>
                        </div>
                        <div class="exercise-detail-row">
                          @if (ex.muscleGroup) {
                            <span class="muscle-badge">{{ ex.muscleGroup }}</span>
                          }
                          <div class="exercise-prescription">
                            @if (isDurationExercise(ex)) {
                              <span class="rx-item"><mat-icon>timer</mat-icon> {{ ex.targetReps }}</span>
                            } @else {
                              <span class="rx-item"><mat-icon>repeat</mat-icon> {{ ex.targetSets }} sets</span>
                              <span class="rx-item"><mat-icon>fitness_center</mat-icon> {{ ex.targetReps }} reps</span>
                            }
                            @if (ex.targetWeight) {
                              <span class="rx-item"><mat-icon>scale</mat-icon> {{ ex.targetWeight }} lbs</span>
                            }
                          </div>
                        </div>
                        @if (ex.notes) {
                          <div class="exercise-notes"><mat-icon>info_outline</mat-icon> {{ ex.notes }}</div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
              @if (detailMode()) {
                <div class="sets-grid">
                  <div class="set-header">
                    <span>Set</span><span>Reps</span><span>Weight (lbs)</span>
                  </div>
                  @for (set of ex.sets; track $index; let j = $index) {
                    <div class="set-row">
                      <span class="set-num">{{ j + 1 }}</span>
                      <input type="number" [(ngModel)]="set.reps" class="set-input" placeholder="0">
                      <input type="number" [(ngModel)]="set.weight" class="set-input" placeholder="0" step="2.5">
                    </div>
                  }
                </div>
                <button mat-stroked-button class="add-set-btn" (click)="addSet(i)">
                  <mat-icon>add</mat-icon> Add Set
                </button>
              }
            </div>
          }
        </div>

        @if (isToday() && !detailMode() && !customMode()) {
          <div class="toggle-detail">
            <button mat-stroked-button (click)="detailMode.set(true)">
              <mat-icon>edit_note</mat-icon> Log with detailed sets & weights
            </button>
          </div>
        }

        @if (customMode()) {
          <button mat-stroked-button class="add-exercise-btn" (click)="addCustomExercise()">
            <mat-icon>add</mat-icon> Add Exercise
          </button>
        }

        @if (detailMode()) {
          <div class="workout-footer">
            <mat-form-field appearance="outline" class="duration-field">
              <mat-label>Duration (min)</mat-label>
              <input matInput type="number" [(ngModel)]="duration">
            </mat-form-field>
            <mat-form-field appearance="outline" class="notes-field">
              <mat-label>Notes</mat-label>
              <input matInput [(ngModel)]="workoutNotes" placeholder="How did it feel?">
            </mat-form-field>
            <button mat-raised-button color="primary" class="finish-btn" (click)="finishWorkout()" [disabled]="saving()">
              <mat-icon>check</mat-icon> Finish Workout
            </button>
          </div>
        }
      }
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    .day-nav {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 8px; padding: 8px 4px;
    }
    .day-nav-center { text-align: center; flex: 1; }
    .day-nav-label {
      display: block; font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em;
    }
    .day-nav-focus {
      display: block; font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500; margin-top: 2px;
    }

    .day-dots {
      display: flex; justify-content: center; gap: 6px; margin-bottom: 20px;
    }
    .day-dot {
      width: 40px; height: 32px; border-radius: var(--radius-sm); border: 1px solid var(--color-border);
      background: var(--color-surface); font-size: 0.7rem; font-weight: 600;
      color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
    }
    .day-dot:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .day-dot.active {
      background: var(--color-primary); color: #fff; border-color: var(--color-primary);
    }
    .day-dot.today:not(.active) {
      border-color: var(--color-primary); color: var(--color-primary);
      box-shadow: 0 0 0 1px var(--color-primary);
    }
    .day-dot.rest { opacity: 0.6; }

    .plan-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .day-info { display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: wrap; }
    .day-badge {
      font-size: 0.75rem; font-weight: 600; padding: 4px 12px;
      border-radius: var(--radius-full); background: var(--color-surface); border: 1px solid var(--color-border);
    }
    .focus-badge {
      font-size: 0.75rem; font-weight: 600; padding: 4px 12px;
      border-radius: var(--radius-full); background: var(--color-primary); color: #fff;
    }
    .today-badge {
      font-size: 0.65rem; font-weight: 700; padding: 3px 8px;
      border-radius: var(--radius-full); background: #2e7d32; color: #fff;
      letter-spacing: 0.05em;
    }
    .mark-complete-btn { height: 40px; }

    .empty-state {
      text-align: center; padding: var(--spacing-xl) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; border-radius: 50%; margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-icon-wrap.green { background: rgba(46,125,50,0.1); }
    .empty-icon-wrap.green mat-icon { color: #2e7d32; }
    .empty-icon-wrap.blue { background: rgba(21,101,192,0.1); }
    .empty-icon-wrap.blue mat-icon { color: #1565c0; }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { margin: 0 0 var(--spacing-xs); font-size: 1.1rem; }
    .empty-state p { color: var(--color-text-muted); margin: 0 auto var(--spacing-md); max-width: 360px; }

    .exercises-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
    .exercise-card {
      padding: 14px 16px; background: var(--color-surface);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);
    }
    .exercise-card.duration-card { border-left: 3px solid var(--color-primary); }
    .exercise-header { display: flex; align-items: flex-start; gap: 12px; }
    .exercise-index {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; color: var(--color-primary);
      background: rgba(var(--color-primary-rgb, 63, 81, 181), 0.08);
      margin-top: 2px;
    }
    .exercise-info { flex: 1; min-width: 0; }
    .exercise-top-row { display: flex; align-items: flex-start; gap: 12px; }
    .exercise-thumb {
      width: 80px; height: 56px; border-radius: 6px; overflow: hidden;
      flex-shrink: 0; position: relative; cursor: pointer;
      background: #000;
    }
    .exercise-thumb img {
      width: 100%; height: 100%; object-fit: cover; opacity: 0.85;
      transition: opacity 0.15s;
    }
    .exercise-thumb:hover img { opacity: 1; }
    .thumb-play {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.25); transition: background 0.15s;
    }
    .thumb-play mat-icon { color: #fff; font-size: 28px; width: 28px; height: 28px; }
    .exercise-thumb:hover .thumb-play { background: rgba(0,0,0,0.4); }
    .exercise-text { flex: 1; min-width: 0; }
    .exercise-name-row { display: flex; align-items: center; gap: 6px; }
    .exercise-name { font-weight: 600; font-size: 0.95rem; }
    .exercise-detail-row {
      display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap;
    }
    .muscle-badge {
      font-size: 0.65rem; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full);
      background: rgba(var(--color-primary-rgb, 63, 81, 181), 0.08); color: var(--color-primary);
      text-transform: uppercase; letter-spacing: 0.03em;
    }
    .exercise-prescription { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .rx-item {
      display: flex; align-items: center; gap: 3px;
      font-size: 0.8rem; font-weight: 500; color: var(--color-text-secondary);
    }
    .rx-item mat-icon { font-size: 14px; width: 14px; height: 14px; opacity: 0.7; }
    .exercise-notes {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: var(--color-text-muted); margin-top: 6px; font-style: italic;
    }
    .exercise-notes mat-icon { font-size: 14px; width: 14px; height: 14px; opacity: 0.6; }
    .exercise-name-input {
      font-weight: 600; font-size: 0.95rem; border: none; border-bottom: 1px solid var(--color-border);
      background: transparent; padding: 4px 0; outline: none; flex: 1; margin-right: 12px;
    }
    .exercise-name-input:focus { border-color: var(--color-primary); }
    .sets-grid { margin: 12px 0 8px; }
    .set-header {
      display: grid; grid-template-columns: 40px 1fr 1fr; gap: 8px;
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
      color: var(--color-text-muted); padding: 4px 0; letter-spacing: 0.03em;
    }
    .set-row {
      display: grid; grid-template-columns: 40px 1fr 1fr; gap: 8px;
      align-items: center; padding: 4px 0;
    }
    .set-num { font-weight: 600; font-size: 0.85rem; color: var(--color-text-muted); }
    .set-input {
      width: 100%; padding: 8px 10px; border: 1px solid var(--color-border);
      border-radius: 6px; font-size: 0.9rem; text-align: center;
      background: var(--color-surface);
    }
    .set-input:focus { outline: none; border-color: var(--color-primary); }
    .add-set-btn { font-size: 0.8rem; }
    .add-exercise-btn { width: 100%; margin-bottom: 16px; }
    .toggle-detail { text-align: center; margin-bottom: 16px; }
    .workout-footer { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .duration-field { width: 120px; }
    .notes-field { flex: 1; min-width: 200px; }
    .finish-btn { height: 56px; }

    @media (max-width: 599px) {
      .plan-header { flex-direction: column; align-items: flex-start; }
      .mark-complete-btn { width: 100%; }
      .workout-footer { flex-direction: column; }
      .duration-field, .notes-field { width: 100%; }
      .finish-btn { width: 100%; }
      .day-dot { width: 36px; height: 28px; font-size: 0.65rem; }
    }
  `]
})
export class TodayWorkoutComponent implements OnInit {
  private planService = inject(WorkoutPlanService);
  private logService = inject(WorkoutLogService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  noPlan = signal(false);
  alreadyLogged = signal(false);
  allDays = signal<PlanDay[]>([]);
  currentDayIndex = signal(0);
  exercises = signal<ActiveExercise[]>([]);
  customMode = signal(false);
  detailMode = signal(false);
  saving = signal(false);
  duration: number | null = null;
  workoutNotes = '';

  dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayFullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  todayDow = new Date().getDay();

  currentFocusArea = computed(() => {
    const days = this.allDays();
    const idx = this.currentDayIndex();
    if (idx < 0 || idx >= days.length) return 'Rest';
    return days[idx].focusArea;
  });

  dayLabel = computed(() => {
    const days = this.allDays();
    const idx = this.currentDayIndex();
    if (idx < 0 || idx >= days.length) return 'Sunday';
    return this.dayFullNames[days[idx].dayOfWeek];
  });

  isToday = computed(() => {
    const days = this.allDays();
    const idx = this.currentDayIndex();
    if (idx < 0 || idx >= days.length) return false;
    return days[idx].dayOfWeek === this.todayDow;
  });

  isRestView = computed(() => this.currentDayIndex() === -1);

  ngOnInit() {
    this.planService.getActive().subscribe({
      next: (plan: any) => {
        const days: PlanDay[] = (plan.days || [])
          .sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek);
        this.allDays.set(days);

        const todayIdx = days.findIndex((d: PlanDay) => d.dayOfWeek === this.todayDow);
        if (todayIdx >= 0) {
          this.currentDayIndex.set(todayIdx);
          this.loadDayExercises(todayIdx);
        } else {
          this.currentDayIndex.set(-1);
        }

        this.checkIfLoggedToday();
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.noPlan.set(true);
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  private checkIfLoggedToday() {
    this.logService.getToday().subscribe({
      next: () => { this.alreadyLogged.set(true); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  private loadDayExercises(index: number) {
    const days = this.allDays();
    if (index < 0 || index >= days.length) {
      this.exercises.set([]);
      return;
    }
    const day = days[index];
    this.exercises.set((day.exercises || []).map((ex: any) => ({
      name: ex.exerciseName,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeight: ex.targetWeight,
      notes: ex.notes,
      videoUrl: ex.videoUrl,
      muscleGroup: ex.muscleGroup,
      sets: Array.from({ length: ex.targetSets }, () => ({
        reps: 0, weight: ex.targetWeight || 0
      }))
    })));
  }

  prevDay() {
    const idx = this.currentDayIndex();
    if (idx > 0) {
      this.currentDayIndex.set(idx - 1);
      this.loadDayExercises(idx - 1);
      this.detailMode.set(false);
    }
  }

  nextDay() {
    const idx = this.currentDayIndex();
    const days = this.allDays();
    if (idx < days.length - 1) {
      this.currentDayIndex.set(idx + 1);
      this.loadDayExercises(idx + 1);
      this.detailMode.set(false);
    }
  }

  goToDay(index: number) {
    this.currentDayIndex.set(index);
    this.loadDayExercises(index);
    this.detailMode.set(false);
  }

  showRest() {
    this.currentDayIndex.set(-1);
    this.exercises.set([]);
  }

  getThumbnail(videoUrl: string): string {
    const match = videoUrl.match(/[?&]v=([^&]+)/) || videoUrl.match(/youtu\.be\/([^?]+)/);
    const videoId = match ? match[1] : '';
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }

  playVideo(ex: ActiveExercise) {
    if (!ex.videoUrl) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const a = document.createElement('a');
      a.href = ex.videoUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      this.dialog.open(VideoPlayerDialogComponent, {
        data: { videoUrl: ex.videoUrl, exerciseName: ex.name },
        width: '720px',
        maxWidth: '90vw',
        panelClass: 'video-dialog'
      });
    }
  }

  isDurationExercise(ex: ActiveExercise): boolean {
    return ex.targetReps.includes(':') || ex.targetReps.toLowerCase().includes('min');
  }

  markComplete() {
    this.saving.set(true);
    const days = this.allDays();
    const idx = this.currentDayIndex();
    const planDayId = idx >= 0 && idx < days.length ? days[idx].id : undefined;

    this.logService.create({
      date: toLocalISOString(new Date()),
      focusArea: this.currentFocusArea() || 'Workout',
      planDayId,
      sets: []
    }).subscribe({
      next: () => {
        this.notify.success('Workout completed!');
        this.alreadyLogged.set(true);
        this.saving.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.notify.error('Failed to save workout'); this.saving.set(false); this.cdr.detectChanges(); }
    });
  }

  startCustomWorkout() {
    this.customMode.set(true);
    this.detailMode.set(true);
    this.exercises.set([{
      name: '', targetSets: 3, targetReps: '8-12', sets: [{ reps: 0, weight: 0 }]
    }]);
  }

  addCustomExercise() {
    this.exercises.update(exs => [...exs, {
      name: '', targetSets: 3, targetReps: '8-12', sets: [{ reps: 0, weight: 0 }]
    }]);
  }

  addSet(exerciseIndex: number) {
    this.exercises.update(exs => {
      const updated = [...exs];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: [...updated[exerciseIndex].sets, { reps: 0, weight: 0 }]
      };
      return updated;
    });
  }

  finishWorkout() {
    this.saving.set(true);
    const sets: ExerciseSet[] = [];
    let orderIndex = 0;

    for (const ex of this.exercises()) {
      if (!ex.name) continue;
      for (let i = 0; i < ex.sets.length; i++) {
        const s = ex.sets[i];
        if (s.reps > 0) {
          sets.push({
            exerciseName: ex.name,
            setNumber: i + 1,
            reps: s.reps,
            weight: s.weight,
            orderIndex: orderIndex
          });
        }
      }
      orderIndex++;
    }

    const days = this.allDays();
    const idx = this.currentDayIndex();
    const planDayId = idx >= 0 && idx < days.length ? days[idx].id : undefined;

    this.logService.create({
      date: toLocalISOString(new Date()),
      focusArea: this.currentFocusArea() || 'Custom',
      durationMinutes: this.duration || undefined,
      notes: this.workoutNotes || undefined,
      planDayId,
      sets
    }).subscribe({
      next: () => {
        this.notify.success('Workout logged!');
        this.alreadyLogged.set(true);
        this.saving.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.notify.error('Failed to save workout'); this.saving.set(false); this.cdr.detectChanges(); }
    });
  }
}
