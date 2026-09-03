import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { toLocalISOString } from '../../core/utils/date-utils';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BankAccountService } from '../../core/services/bank-account.service';
import { BankAccount } from '../../core/models/bank-account.model';
import { SavingsGoal } from '../../core/models/savings-goal.model';

@Component({
  selector: 'app-goal-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon green">
        <mat-icon>flag</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>{{ data ? 'Edit' : 'Add' }} Savings Goal</h2>
        <span class="dialog-subtitle">Set and track your goals</span>
      </div>
    </div>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container"><mat-spinner diameter="28"></mat-spinner></div>
      } @else {
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Goal Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Emergency Fund, Vacation">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Target Amount</mat-label>
          <input matInput type="number" formControlName="targetAmount" min="0.01" step="0.01">
          <span matPrefix>$&nbsp;</span>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Current Amount</mat-label>
          <input matInput type="number" formControlName="currentAmount" min="0" step="0.01">
          <span matPrefix>$&nbsp;</span>
        </mat-form-field>

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

        <mat-form-field appearance="outline">
          <mat-label>Icon (emoji)</mat-label>
          <input matInput formControlName="icon" placeholder="🎯">
        </mat-form-field>
      </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading()" (click)="save()">
        {{ data ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 24px 12px;
    }
    .header-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
    }
    .header-icon.green { background: rgba(46,125,50,0.12); }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #2e7d32; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; padding: 8px 0; }
    .full-width { grid-column: 1 / -1; }
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 200px; }
    @media (max-width: 500px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class GoalDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(BankAccountService);
  private dialogRef = inject(MatDialogRef<GoalDialogComponent>);
  data: SavingsGoal | null = inject(MAT_DIALOG_DATA);

  loading = signal(true);
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
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const result = {
      name: val.name,
      targetAmount: val.targetAmount,
      currentAmount: val.currentAmount ?? 0,
      targetDate: val.targetDate ? toLocalISOString(new Date(val.targetDate)) : undefined,
      linkedAccountId: val.linkedAccountId || undefined,
      icon: val.icon || undefined
    };
    this.dialogRef.close(result);
  }
}
