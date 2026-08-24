import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserProfileService } from '../../core/services/user-profile.service';
import { PersonalLoan } from '../../core/models/personal-loan.model';
import { CreditCard } from '../../core/models/credit-card.model';
import { LoanFormComponent } from './loan-form.component';
import { CreditCardFormComponent } from './credit-card-form.component';

@Component({
  selector: 'app-setup-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    LoanFormComponent,
    CreditCardFormComponent
  ],
  template: `
    <h2>Setup Wizard</h2>
    <mat-stepper linear>
      <mat-step [stepControl]="profileForm">
        <ng-template matStepLabel>Profile</ng-template>
        <form [formGroup]="profileForm">
          <div class="form-grid">
            <mat-form-field>
              <mat-label>Monthly Income</mat-label>
              <input matInput type="number" formControlName="monthlyIncome">
              <span matTextPrefix>$&nbsp;</span>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Paycheck Day of Month</mat-label>
              <input matInput type="number" formControlName="paycheckDay" min="1" max="31">
              <mat-hint>Which day do you get paid? (1-31)</mat-hint>
            </mat-form-field>
          </div>
          <div class="step-actions">
            <button mat-raised-button color="primary" matStepperNext
              (click)="saveProfile()" [disabled]="profileForm.invalid">
              Next
            </button>
          </div>
        </form>
      </mat-step>

      <mat-step>
        <ng-template matStepLabel>Loans</ng-template>
        <p>Add your personal loans below. You can add more later.</p>
        <app-loan-form (saved)="onLoanSaved($event)"></app-loan-form>
        @if (savedLoans.length > 0) {
          <h4>Added Loans:</h4>
          <mat-list>
            @for (loan of savedLoans; track loan.id) {
              <mat-list-item>
                <mat-icon matListItemIcon>check_circle</mat-icon>
                <span matListItemTitle>{{ loan.lenderName }} - {{ loan.currentBalance | currency }}</span>
              </mat-list-item>
            }
          </mat-list>
        }
        <div class="step-actions">
          <button mat-button matStepperPrevious>Back</button>
          <button mat-raised-button color="primary" matStepperNext>Next</button>
        </div>
      </mat-step>

      <mat-step>
        <ng-template matStepLabel>Credit Cards</ng-template>
        <p>Add your credit cards below. You can add more later.</p>
        <app-credit-card-form (saved)="onCardSaved($event)"></app-credit-card-form>
        @if (savedCards.length > 0) {
          <h4>Added Cards:</h4>
          <mat-list>
            @for (card of savedCards; track card.id) {
              <mat-list-item>
                <mat-icon matListItemIcon>check_circle</mat-icon>
                <span matListItemTitle>{{ card.cardName }} - {{ card.currentBalance | currency }}</span>
              </mat-list-item>
            }
          </mat-list>
        }
        <div class="step-actions">
          <button mat-button matStepperPrevious>Back</button>
          <button mat-raised-button color="primary" (click)="finish()">Finish</button>
        </div>
      </mat-step>
    </mat-stepper>
  `,
  styles: [`
    .step-actions {
      margin-top: var(--spacing-lg);
      display: flex;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }
    mat-form-field {
      width: 100%;
      max-width: 400px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
    }
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; }
      mat-form-field { max-width: 100%; }
    }
  `]
})
export class SetupWizardComponent {
  private fb = inject(FormBuilder);
  private profileService = inject(UserProfileService);
  private router = inject(Router);

  savedLoans: PersonalLoan[] = [];
  savedCards: CreditCard[] = [];

  profileForm = this.fb.group({
    monthlyIncome: [null as number | null, [Validators.required, Validators.min(1)]],
    paycheckDay: [null as number | null, [Validators.required, Validators.min(1), Validators.max(31)]]
  });

  constructor() {
    const savedDay = this.profileService.getPaycheckDay();
    if (savedDay) {
      this.profileForm.patchValue({ paycheckDay: savedDay });
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const income = this.profileForm.value.monthlyIncome!;
      const paycheckDay = this.profileForm.value.paycheckDay!;
      this.profileService.saveProfile(income).subscribe();
      this.profileService.setPaycheckDay(paycheckDay);
    }
  }

  onLoanSaved(loan: PersonalLoan): void {
    this.savedLoans.push(loan);
  }

  onCardSaved(card: CreditCard): void {
    this.savedCards.push(card);
  }

  finish(): void {
    this.router.navigate(['/dashboard']);
  }
}
