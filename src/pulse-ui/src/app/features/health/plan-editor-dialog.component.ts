import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutPlan, WorkoutPlanDay, PlannedExercise } from '../../core/models/workout-plan.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-plan-editor-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule, FormsModule],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>fitness_center</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>{{ isEditing ? 'Edit Plan' : 'Create Plan' }}</h2>
          <p class="dialog-subtitle">{{ isEditing ? 'Update your workout routine' : 'Design your weekly routine' }}</p>
        </div>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <div class="plan-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Plan Name</mat-label>
          <input matInput [(ngModel)]="planName" placeholder="e.g. Push/Pull/Legs 6-Day">
        </mat-form-field>

        <mat-checkbox [(ngModel)]="isActive" class="active-check">Set as active plan</mat-checkbox>

        <!-- Day Selector -->
        <div class="day-selector">
          <button mat-icon-button (click)="prevDay()" [disabled]="selectedDayIndex === 0">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <div class="day-chips">
            @for (day of days; track day.dayOfWeek; let i = $index) {
              <button class="day-chip" [class.active]="selectedDayIndex === i"
                      [class.has-exercises]="day.exercises.length > 0"
                      (click)="selectedDayIndex = i">
                {{ dayAbbrev[day.dayOfWeek] }}
              </button>
            }
          </div>
          <button mat-icon-button (click)="nextDay()" [disabled]="selectedDayIndex === days.length - 1">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>

        <!-- Day Content -->
        @if (days[selectedDayIndex]; as day) {
          <div class="day-content">
            <div class="day-header">
              <span class="day-label">{{ dayNames[day.dayOfWeek] }}</span>
              <span class="exercise-count">{{ day.exercises.length }} exercises</span>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Focus Area</mat-label>
              <input matInput [(ngModel)]="day.focusArea" placeholder="e.g. Chest & Triceps">
            </mat-form-field>

            <!-- Exercise Cards -->
            <div class="exercise-list">
              @for (ex of day.exercises; track ex.orderIndex; let j = $index) {
                <div class="exercise-card">
                  <div class="ex-card-header">
                    <span class="ex-number">{{ j + 1 }}</span>
                    <mat-form-field appearance="outline" class="ex-name-field">
                      <mat-label>Exercise</mat-label>
                      <input matInput [(ngModel)]="ex.exerciseName">
                    </mat-form-field>
                    <button mat-icon-button class="ex-remove" (click)="removeExercise(selectedDayIndex, j)">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                  <div class="ex-card-details">
                    <mat-form-field appearance="outline" class="ex-field">
                      <mat-label>Sets</mat-label>
                      <input matInput type="number" [(ngModel)]="ex.targetSets">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="ex-field">
                      <mat-label>Reps</mat-label>
                      <input matInput [(ngModel)]="ex.targetReps" placeholder="8-12">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="ex-field">
                      <mat-label>Weight</mat-label>
                      <input matInput type="number" [(ngModel)]="ex.targetWeight" placeholder="lbs">
                    </mat-form-field>
                  </div>
                  <mat-form-field appearance="outline" class="full-width ex-video-field">
                    <mat-label>Video URL</mat-label>
                    <input matInput [(ngModel)]="ex.videoUrl" placeholder="https://youtube.com/...">
                    <mat-icon matPrefix class="video-icon">play_circle</mat-icon>
                  </mat-form-field>
                </div>
              }
            </div>

            <button mat-stroked-button class="add-exercise-btn" (click)="addExercise(selectedDayIndex)">
              <mat-icon>add</mat-icon> Add Exercise
            </button>
          </div>
        }
      </div>
      }
      @if (saving()) {
        <div class="saving-overlay"><mat-spinner diameter="32"></mat-spinner></div>
      }
    </mat-dialog-content>
    <mat-dialog-actions class="dialog-actions">
      <button mat-button mat-dialog-close class="cancel-btn">Cancel</button>
      <button mat-raised-button color="primary" class="save-btn" [disabled]="!planName || loading() || saving()" (click)="save()">
        <mat-icon>check</mat-icon> Save Plan
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
    .dialog-banner {
      position: relative;
      margin: -24px -24px 20px;
      padding: 20px 24px 16px;
      background: linear-gradient(135deg, #1565c0 0%, #5e35b1 100%);
      overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background:
        radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content {
      position: relative;
      display: flex; align-items: center; gap: 12px;
    }
    .dialog-header-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.2);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,0.3);
      flex-shrink: 0;
    }
    .dialog-header-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    h2[mat-dialog-title] {
      margin: 0 !important; padding: 0 !important;
      font-size: 1rem !important; font-weight: 700 !important;
      color: #fff !important;
    }
    .dialog-subtitle { color: rgba(255,255,255,0.75); font-size: 0.72rem; margin: 2px 0 0; }

    .plan-form { display: flex; flex-direction: column; gap: 4px; padding-top: 4px; }
    .full-width { width: 100%; }
    .active-check { margin: -4px 0 8px; }

    /* Day Selector */
    .day-selector {
      display: flex; align-items: center; gap: 4px;
      margin-bottom: 12px;
    }
    .day-chips {
      display: flex; gap: 4px; flex: 1; justify-content: center;
    }
    .day-chip {
      width: 36px; height: 36px; border-radius: 50%;
      border: 2px solid var(--color-border);
      background: var(--color-surface);
      font-size: 0.7rem; font-weight: 700;
      cursor: pointer; transition: all 0.15s ease;
      display: flex; align-items: center; justify-content: center;
      color: var(--color-text-muted);
    }
    .day-chip.has-exercises { border-color: rgba(21,101,192,0.3); color: var(--color-text); }
    .day-chip.active {
      background: var(--color-primary); border-color: var(--color-primary);
      color: #fff;
    }

    /* Day Content */
    .day-content { animation: fadeIn 0.15s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .day-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }
    .day-label { font-weight: 700; font-size: 0.9rem; }
    .exercise-count { font-size: 0.72rem; color: var(--color-text-muted); font-weight: 600; }

    /* Exercise Cards */
    .exercise-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
    .exercise-card {
      background: var(--color-surface-secondary);
      border-radius: var(--radius-sm);
      padding: 12px;
      border: 1px solid var(--color-border);
    }
    .ex-card-header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .ex-number {
      width: 24px; height: 24px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      font-size: 0.7rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .ex-name-field { flex: 1; }
    .ex-remove { flex-shrink: 0; }
    .ex-remove mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .ex-card-details {
      display: flex; gap: 8px;
    }
    .ex-field { flex: 1; }
    .ex-video-field { margin-top: 4px; }
    .video-icon { font-size: 18px; width: 18px; height: 18px; color: var(--color-text-muted); margin-right: 4px; }

    .add-exercise-btn {
      width: 100%;
      border-style: dashed !important;
      font-weight: 600 !important;
    }
    .add-exercise-btn mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    .dialog-actions {
      padding: 12px 24px 16px !important;
      border-top: 1px solid var(--color-border);
      gap: 8px; display: flex; justify-content: flex-end;
    }
    .save-btn {
      border-radius: var(--radius-sm) !important;
      padding: 0 20px !important;
      font-weight: 600 !important;
    }
    .save-btn mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; }

    .mat-mdc-form-field-subscript-wrapper { display: none; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    mat-dialog-content { position: relative; }
    .saving-overlay {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.7); border-radius: inherit; z-index: 10;
    }

    @media (max-width: 599px) {
      .dialog-banner { margin: -16px -16px 16px; }
      .day-chip { width: 40px; height: 40px; font-size: 0.7rem; }
      .ex-card-details { flex-wrap: wrap; }
      .ex-field { min-width: calc(50% - 6px); }
      .ex-card-header button { min-width: 44px; min-height: 44px; }
    }
  `]
})
export class PlanEditorDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PlanEditorDialogComponent>);
  private planService = inject(WorkoutPlanService);
  private notify = inject(NotificationService);
  private data: { planId?: number } = inject(MAT_DIALOG_DATA);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  dayAbbrev = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  isEditing = false;
  planName = '';
  isActive = false;
  days: WorkoutPlanDay[] = [];
  selectedDayIndex = 0;

  ngOnInit() {
    if (this.data?.planId) {
      this.isEditing = true;
      this.planService.getById(this.data.planId).subscribe(plan => {
        this.planName = plan.name;
        this.isActive = plan.isActive;
        this.days = plan.days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        if (this.days.length === 0) this.initDays();
        this.loading.set(false);
        this.cdr.detectChanges();
      });
    } else {
      this.initDays();
      this.loading.set(false);
    }
  }

  private initDays() {
    this.days = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      focusArea: i === 0 ? 'Rest' : '',
      exercises: []
    }));
  }

  prevDay() {
    if (this.selectedDayIndex > 0) this.selectedDayIndex--;
  }

  nextDay() {
    if (this.selectedDayIndex < this.days.length - 1) this.selectedDayIndex++;
  }

  addExercise(dayIndex: number) {
    this.days[dayIndex].exercises = [
      ...this.days[dayIndex].exercises,
      { exerciseName: '', targetSets: 3, targetReps: '8-12', orderIndex: this.days[dayIndex].exercises.length }
    ];
  }

  removeExercise(dayIndex: number, exIndex: number) {
    this.days[dayIndex].exercises = this.days[dayIndex].exercises.filter((_, i) => i !== exIndex);
  }

  save() {
    const plan: Partial<WorkoutPlan> = {
      name: this.planName,
      isActive: this.isActive,
      days: this.days.filter(d => d.focusArea).map(d => ({
        ...d,
        exercises: d.exercises.filter(e => e.exerciseName).map((e, i) => ({ ...e, orderIndex: i }))
      }))
    };

    this.saving.set(true);
    const obs = this.isEditing
      ? this.planService.update(this.data.planId!, plan as WorkoutPlan)
      : this.planService.create(plan);

    obs.subscribe({
      next: () => { this.saving.set(false); this.notify.success('Plan saved'); this.cdr.detectChanges(); this.dialogRef.close(true); },
      error: () => { this.saving.set(false); this.notify.error('Failed to save plan'); this.cdr.detectChanges(); }
    });
  }
}
