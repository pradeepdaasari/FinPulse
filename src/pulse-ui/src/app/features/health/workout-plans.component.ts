import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { SkeletonLoaderComponent } from '../../shared/skeleton-loader.component';
import { PullToRefreshDirective } from '../../shared/pull-to-refresh.directive';
import { WorkoutPlanService } from '../../core/services/workout-plan.service';
import { WorkoutPlanSummary } from '../../core/models/workout-plan.model';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-workout-plans',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, SkeletonLoaderComponent, PullToRefreshDirective],
  template: `
    <div appPullToRefresh (refresh)="loadPlans()">
    <div class="header-row">
      <button mat-raised-button color="primary" (click)="openPlanEditor()">
        <mat-icon>add</mat-icon> New Plan
      </button>
    </div>

    @if (loading()) {
      <app-skeleton type="card"></app-skeleton>
    } @else if (plans().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap purple">
          <mat-icon>fitness_center</mat-icon>
        </div>
        <h3>No workout plans yet</h3>
        <p>Create your first plan to organize your weekly training schedule.</p>
        <button mat-raised-button color="primary" (click)="openPlanEditor()">
          <mat-icon>add</mat-icon> Create Plan
        </button>
      </div>
    } @else {
      <div class="plans-list">
        @for (plan of plans(); track plan.id) {
          <div class="plan-card" (click)="editPlan(plan)">
            <div class="pc-icon" [class.active]="plan.isActive">
              <mat-icon>fitness_center</mat-icon>
            </div>
            <div class="pc-mid">
              <span class="pc-name">{{ plan.name }}</span>
              <span class="pc-meta">{{ plan.dayCount }} days · {{ plan.exerciseCount }} exercises</span>
            </div>
            <div class="pc-actions">
              @if (plan.isActive) {
                <span class="pc-badge active">Active</span>
              } @else {
                <button mat-stroked-button class="pc-activate" (click)="activatePlan(plan, $event)">Activate</button>
              }
              <button mat-icon-button class="pc-delete" (click)="deletePlan(plan, $event)">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    }
    </div>
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }

    .empty-state {
      text-align: center; padding: var(--spacing-xl) var(--spacing-md);
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-md); margin: 0 auto var(--spacing-md);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-icon-wrap.purple { background: var(--color-stat-purple-bg); }
    .empty-icon-wrap.purple mat-icon { color: var(--color-stat-purple); }
    .empty-icon-wrap mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty-state h3 { margin: 0 0 var(--spacing-xs); font-size: var(--text-lg); font-weight: var(--weight-bold); }
    .empty-state p { color: var(--color-text-muted); margin: 0 auto var(--spacing-md); max-width: 360px; font-size: var(--text-sm); }

    .plans-list { display: flex; flex-direction: column; gap: 8px; }
    .plan-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 12px; background: var(--color-surface-solid);
      border-radius: var(--radius-md); box-shadow: var(--shadow-xs);
      border: 1px solid var(--color-border);
      cursor: pointer; transition: box-shadow var(--transition-fast);
    }
    .plan-card:active { box-shadow: var(--shadow-md); }
    .pc-icon {
      width: 40px; height: 40px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
      background: var(--color-stat-purple-bg); flex-shrink: 0;
    }
    .pc-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-stat-purple); }
    .pc-icon.active { background: var(--color-success-bg); }
    .pc-icon.active mat-icon { color: var(--color-success); }
    .pc-mid { flex: 1; min-width: 0; }
    .pc-name { display: block; font-weight: var(--weight-semibold); font-size: var(--text-sm); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pc-meta { display: block; font-size: var(--text-xs); color: var(--color-text-muted); }
    .pc-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .pc-badge {
      display: inline-block; font-size: var(--text-xs); font-weight: var(--weight-semibold);
      padding: 3px 8px; border-radius: var(--radius-full);
    }
    .pc-badge.active { background: var(--color-success-bg); color: var(--color-success); }
    .pc-activate { font-size: var(--text-xs); }
    .pc-delete { color: var(--color-text-muted); }
    .pc-delete mat-icon { font-size: 20px; width: 20px; height: 20px; }

    @media (max-width: 599px) {
      .pc-activate { font-size: var(--text-xs); padding: 0 8px; min-width: auto; }
    }
  `]
})
export class WorkoutPlansComponent implements OnInit {
  private planService = inject(WorkoutPlanService);
  private dialog = inject(MatDialog);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  plans = signal<WorkoutPlanSummary[]>([]);

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.loading.set(true);
    this.planService.getAll().subscribe({
      next: p => { this.plans.set(p); this.loading.set(false); this.cdr.detectChanges(); },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); }
    });
  }

  openPlanEditor(planId?: number) {
    import('./plan-editor-dialog.component').then(m => {
      const ref = this.dialog.open(m.PlanEditorDialogComponent, {
        width: '700px', maxWidth: '95vw', maxHeight: '90vh',
        data: { planId }
      });
      ref.afterClosed().subscribe(result => {
        if (result) this.loadPlans();
      });
    });
  }

  editPlan(plan: WorkoutPlanSummary) {
    this.openPlanEditor(plan.id);
  }

  activatePlan(plan: WorkoutPlanSummary, event: Event) {
    event.stopPropagation();
    this.planService.activate(plan.id).subscribe({
      next: () => { this.notify.success('Plan activated'); this.loadPlans(); },
      error: () => this.notify.error('Failed to activate')
    });
  }

  deletePlan(plan: WorkoutPlanSummary, event: Event) {
    event.stopPropagation();
    this.loading.set(true);
    this.planService.delete(plan.id).subscribe({
      next: () => { this.notify.success('Plan deleted'); this.loadPlans(); },
      error: () => { this.loading.set(false); this.notify.error('Failed to delete'); this.cdr.detectChanges(); }
    });
  }
}
