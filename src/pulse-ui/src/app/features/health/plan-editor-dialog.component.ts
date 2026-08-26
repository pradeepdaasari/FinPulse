import { Component, inject, signal, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutPlan, WorkoutPlanDay, PlannedExercise } from '../../core/models/workout-plan.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-plan-editor-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTabsModule, MatCheckboxModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ isEditing ? 'Edit Plan' : 'Create Plan' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Plan Name</mat-label>
        <input matInput [(ngModel)]="planName" placeholder="e.g. Push/Pull/Legs 6-Day">
      </mat-form-field>

      <mat-checkbox [(ngModel)]="isActive">Set as active plan</mat-checkbox>

      <mat-tab-group class="days-tabs">
        @for (day of days; track day.dayOfWeek; let i = $index) {
          <mat-tab [label]="dayNames[day.dayOfWeek]">
            <div class="day-content">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Focus Area</mat-label>
                <input matInput [(ngModel)]="day.focusArea" placeholder="e.g. Chest & Triceps">
              </mat-form-field>

              @for (ex of day.exercises; track ex.orderIndex; let j = $index) {
                <div class="exercise-row">
                  <mat-form-field appearance="outline" class="ex-name">
                    <mat-label>Exercise</mat-label>
                    <input matInput [(ngModel)]="ex.exerciseName">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ex-sets">
                    <mat-label>Sets</mat-label>
                    <input matInput type="number" [(ngModel)]="ex.targetSets">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ex-reps">
                    <mat-label>Reps</mat-label>
                    <input matInput [(ngModel)]="ex.targetReps" placeholder="8-12">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="ex-weight">
                    <mat-label>Weight</mat-label>
                    <input matInput type="number" [(ngModel)]="ex.targetWeight">
                  </mat-form-field>
                  <button mat-icon-button (click)="removeExercise(i, j)"><mat-icon>close</mat-icon></button>
                </div>
              }
              <button mat-stroked-button (click)="addExercise(i)">
                <mat-icon>add</mat-icon> Add Exercise
              </button>
            </div>
          </mat-tab>
        }
      </mat-tab-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!planName" (click)="save()">Save Plan</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 550px; max-height: 65vh; overflow-y: auto; }
    .full-width { width: 100%; }
    .days-tabs { margin-top: 12px; }
    .day-content { padding: 12px 0; }
    .exercise-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .ex-name { flex: 3; min-width: 140px; }
    .ex-sets { flex: 1; min-width: 55px; }
    .ex-reps { flex: 1; min-width: 60px; }
    .ex-weight { flex: 1; min-width: 65px; }
    .mat-mdc-form-field-subscript-wrapper { display: none; }
    @media (max-width: 599px) {
      mat-dialog-content { min-width: auto; }
      .exercise-row { flex-direction: column; align-items: stretch; gap: 0; }
      .ex-name, .ex-sets, .ex-reps, .ex-weight { min-width: auto; flex: auto; }
    }
  `]
})
export class PlanEditorDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PlanEditorDialogComponent>);
  private planService = inject(WorkoutPlanService);
  private notify = inject(NotificationService);
  private data: { planId?: number } = inject(MAT_DIALOG_DATA);

  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  isEditing = false;
  planName = '';
  isActive = false;
  days: WorkoutPlanDay[] = [];

  ngOnInit() {
    if (this.data?.planId) {
      this.isEditing = true;
      this.planService.getById(this.data.planId).subscribe(plan => {
        this.planName = plan.name;
        this.isActive = plan.isActive;
        this.days = plan.days.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        if (this.days.length === 0) this.initDays();
      });
    } else {
      this.initDays();
    }
  }

  private initDays() {
    this.days = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      focusArea: i === 0 ? 'Rest' : '',
      exercises: []
    }));
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

    const obs = this.isEditing
      ? this.planService.update(this.data.planId!, plan as WorkoutPlan)
      : this.planService.create(plan);

    obs.subscribe({
      next: () => { this.notify.success('Plan saved'); this.dialogRef.close(true); },
      error: () => this.notify.error('Failed to save plan')
    });
  }
}
