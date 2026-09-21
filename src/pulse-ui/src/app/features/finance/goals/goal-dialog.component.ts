import { Component, ChangeDetectorRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { toLocalISOString } from '../../../core/utils/date-utils';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BankAccountService } from '../../../core/services/bank-account.service';
import { SavingsGoalService } from '../../../core/services/savings-goal.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BankAccount } from '../../../core/models/bank-account.model';
import { SavingsGoal } from '../../../core/models/savings-goal.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-goal-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule
  ],
  template: `
    <div class="dialog-banner">
      <div class="banner-pattern"></div>
      <div class="banner-content">
        <div class="dialog-header-icon">
          <mat-icon>flag</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Savings Goal</h2>
          <p class="dialog-subtitle">Set and track your goals</p>
        </div>
        <span class="banner-spacer"></span>
        <button mat-icon-button mat-dialog-close class="header-close" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="form-grid" (submit)="$event.preventDefault()">
        <div class="amount-hero full-width">
          <div class="amount-input-row">
            <span class="amount-dollar">$</span>
            <input class="amount-value" type="number" inputmode="decimal" formControlName="targetAmount" placeholder="0.00" min="0.01" step="0.01">
          </div>
          <div class="amount-underline"></div>
          <span class="amount-hint">Target Amount</span>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Goal Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Emergency Fund, Vacation">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Current Amount</mat-label>
          <input matInput type="number" inputmode="decimal" formControlName="currentAmount" min="0" step="0.01">
          <span matPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Icon (emoji)</mat-label>
          <input matInput formControlName="icon" placeholder="🎯">
        </mat-form-field>

        <div class="more-options-toggle full-width" (click)="showMore.set(!showMore())">
          <mat-icon class="more-icon">{{ showMore() ? 'expand_less' : 'expand_more' }}</mat-icon>
          <span>More options (Date, Linked Account)</span>
        </div>

        @if (showMore()) {
          <div class="more-options-section full-width">
            <mat-form-field appearance="outline">
              <mat-label>Target Date (optional)</mat-label>
              <input matInput [matDatepicker]="datePicker" formControlName="targetDate">
              <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
              <mat-datepicker #datePicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Linked Account (optional)</mat-label>
              <mat-select formControlName="linkedAccountId">
                <mat-option [value]="null">None</mat-option>
                @for (account of accounts(); track account.id) {
                  <mat-option [value]="account.id">{{ account.accountName }} ({{ account.currentBalance | currency }})</mat-option>
                }
              </mat-select>
              <mat-hint>If linked, progress auto-tracks from account balance</mat-hint>
            </mat-form-field>
          </div>
        }
      </form>
      }
    </mat-dialog-content>
    <div class="sticky-save-bar">
      <button class="gradient-save-btn" [disabled]="form.invalid || loading() || saving()" (click)="save()">
        <mat-icon>check</mat-icon>
        {{ saving() ? 'Saving...' : (data ? 'Update' : 'Create') }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dialog-banner {
      position: relative; margin: -24px -24px 12px;
      padding: 16px 24px 14px; background: var(--gradient-primary); overflow: hidden;
    }
    .banner-pattern {
      position: absolute; inset: 0;
      background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 40%);
    }
    .banner-content { position: relative; display: flex; align-items: center; gap: 12px; }
    .dialog-header-icon {
      width: 36px; height: 36px; border-radius: 10px;
      background: rgba(255,255,255,0.2); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      border: 1px solid rgba(255,255,255,0.3); flex-shrink: 0;
    }
    .dialog-header-icon mat-icon { font-size: 18px; width: 18px; height: 18px; color: #fff; }
    h2[mat-dialog-title] {
      margin: 0 !important; padding: 0 !important;
      font-size: 1rem !important; font-weight: 700 !important; color: #fff !important;
    }
    .dialog-subtitle { color: rgba(255,255,255,0.75); font-size: 0.72rem; margin: 2px 0 0; }
    .banner-spacer { flex: 1; }
    .header-close {
      color: rgba(255,255,255,0.9) !important;
      width: 40px !important; height: 40px !important; padding: 0 !important;
      display: inline-flex !important; align-items: center !important; justify-content: center !important;
      border-radius: 50% !important;
      background: rgba(255,255,255,0.12) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
    }
    .header-close:hover { background: rgba(255,255,255,0.25) !important; }
    .header-close mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .amount-hero { text-align: center; padding: 8px 0 4px; }
    .amount-input-row { display: flex; align-items: baseline; justify-content: center; gap: 2px; }
    .amount-dollar { font-size: 1.6rem; font-weight: 700; color: var(--color-text-muted); }
    .amount-value {
      font-size: 2.8rem; font-weight: 800; letter-spacing: -0.03em;
      color: var(--color-text-primary); font-variant-numeric: tabular-nums;
      border: none; background: none; text-align: center; width: 180px;
      outline: none; caret-color: var(--color-primary);
    }
    .amount-value::placeholder { color: #ccc; }
    .amount-value::-webkit-outer-spin-button,
    .amount-value::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .amount-value[type=number] { -moz-appearance: textfield; }
    .amount-underline {
      width: 200px; height: 3px; border-radius: 2px;
      background: var(--gradient-primary); margin: 4px auto 0; opacity: 0.4;
    }
    .amount-hint { font-size: 0.7rem; color: var(--color-text-muted); margin-top: 4px; display: inline-block; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 8px 0; }
    .full-width { grid-column: 1 / -1; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }

    .more-options-toggle {
      display: flex; align-items: center; gap: 4px;
      cursor: pointer; color: var(--color-primary);
      font-size: 0.82rem; font-weight: 600; padding: 4px 0;
    }
    .more-icon { font-size: 20px !important; width: 20px !important; height: 20px !important; }
    .more-options-section {
      display: flex; flex-direction: column; gap: 8px;
      padding: 12px; background: rgba(var(--color-primary-rgb, 33,150,243), 0.03);
      border-radius: var(--radius-sm); border: 1px dashed rgba(var(--color-primary-rgb, 33,150,243), 0.15);
    }

    .sticky-save-bar {
      position: sticky; bottom: 0; z-index: 10;
      padding: 12px 24px 16px;
      background: linear-gradient(transparent, var(--color-surface) 30%);
    }
    .gradient-save-btn {
      width: 100%; height: 48px; border: none; border-radius: var(--radius-sm);
      background: var(--gradient-primary); color: #fff;
      font-size: 0.95rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      cursor: pointer; box-shadow: 0 4px 16px rgba(var(--color-primary-rgb, 33,150,243), 0.3);
    }
    .gradient-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .gradient-save-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }

    @media (max-width: 500px) {
      .form-grid { grid-template-columns: 1fr; }
      .dialog-banner { margin: -16px -16px 12px; padding: 14px 16px 12px; }
      .amount-value { font-size: 2rem; width: 140px; }
      .amount-underline { width: 140px; }
      .sticky-save-bar { padding: 10px 16px 14px; }
    }
  `]
})
export class GoalDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(BankAccountService);
  private goalService = inject(SavingsGoalService);
  private notify = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<GoalDialogComponent>);
  data: SavingsGoal | null = inject(MAT_DIALOG_DATA);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  saving = signal(false);
  showMore = signal(false);
  accounts = signal<BankAccount[]>([]);

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    targetAmount: [null, [Validators.required, Validators.min(0.01)]],
    currentAmount: [0, Validators.min(0)],
    targetDate: [null],
    linkedAccountId: [null],
    icon: ['🎯']
  });

  ngOnInit(): void {
    this.accountService.getAll().subscribe(accounts => {
      this.accounts.set(accounts);
      this.loading.set(false);
      this.cdr.detectChanges();
    });

    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        targetAmount: this.data.targetAmount,
        currentAmount: this.data.currentAmount,
        targetDate: this.data.targetDate ? new Date(this.data.targetDate) : null,
        linkedAccountId: this.data.linkedAccountId,
        icon: this.data.icon
      });
      if (this.data.targetDate || this.data.linkedAccountId) {
        this.showMore.set(true);
      }
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.value;
    const payload = {
      name: val.name,
      targetAmount: val.targetAmount,
      currentAmount: val.currentAmount ?? 0,
      targetDate: val.targetDate ? toLocalISOString(new Date(val.targetDate)) : undefined,
      linkedAccountId: val.linkedAccountId || undefined,
      icon: val.icon || undefined
    };
    const op$ = this.data
      ? this.goalService.update(this.data.id, payload)
      : this.goalService.create(payload);
    (op$ as Observable<unknown>).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: any) => {
        this.notify.error(err.error?.message || `Failed to ${this.data ? 'update' : 'create'} goal`);
        this.saving.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}
