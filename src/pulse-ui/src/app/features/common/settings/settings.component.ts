import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserProfileService, UserProfile } from '../../../core/services/user-profile.service';
import { PayFrequency } from '../../../core/models/budget.model';
import { SkeletonLoaderComponent } from '../../../shared/skeleton-loader.component';

interface TimezoneOption {
  id: string;
  label: string;
  group: string;
}

const TIMEZONES: TimezoneOption[] = [
  { id: 'America/New_York', label: 'Eastern Time (ET)', group: 'US' },
  { id: 'America/Chicago', label: 'Central Time (CT)', group: 'US' },
  { id: 'America/Denver', label: 'Mountain Time (MT)', group: 'US' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (PT)', group: 'US' },
  { id: 'America/Anchorage', label: 'Alaska Time (AKT)', group: 'US' },
  { id: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', group: 'US' },
  { id: 'UTC', label: 'UTC', group: 'Other' },
  { id: 'Europe/London', label: 'London (GMT/BST)', group: 'Europe' },
  { id: 'Europe/Paris', label: 'Paris (CET/CEST)', group: 'Europe' },
  { id: 'Europe/Berlin', label: 'Berlin (CET/CEST)', group: 'Europe' },
  { id: 'Asia/Kolkata', label: 'India (IST)', group: 'Asia' },
  { id: 'Asia/Tokyo', label: 'Tokyo (JST)', group: 'Asia' },
  { id: 'Asia/Shanghai', label: 'China (CST)', group: 'Asia' },
  { id: 'Asia/Singapore', label: 'Singapore (SGT)', group: 'Asia' },
  { id: 'Asia/Dubai', label: 'Dubai (GST)', group: 'Asia' },
  { id: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', group: 'Australia' },
  { id: 'Australia/Perth', label: 'Perth (AWST)', group: 'Australia' },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CurrencyPipe, MatCardModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, SkeletonLoaderComponent
  ],
  template: `
    <div class="settings-container">
      <div class="page-header">
        <mat-icon class="page-icon">settings</mat-icon>
        <h2>Settings</h2>
      </div>

      <!-- Pay Profile -->
      <mat-card class="settings-card">
        <div class="card-header">
          <div class="card-icon-wrap pay-icon"><mat-icon>account_balance_wallet</mat-icon></div>
          <div class="card-header-text">
            <h3>Pay Profile</h3>
            <p class="card-subtitle">Your income and paycheck details power budget calculations, paycheck breakdowns, and debt payoff strategies.</p>
          </div>
        </div>

        @if (profileLoading()) {
          <app-skeleton type="list" [count]="2"></app-skeleton>
        } @else {
          <!-- Current values summary -->
          @if (!profileEditing()) {
            <div class="profile-summary">
              <div class="summary-row">
                <span class="summary-label">Monthly Income</span>
                <span class="summary-value">{{ profileIncome | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Pay Frequency</span>
                <span class="summary-value">{{ profilePayFrequency }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Net Pay Per Check</span>
                <span class="summary-value">{{ profileNetPay | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Next Pay Date</span>
                <span class="summary-value">{{ profileNextPayDate || 'Not set' }}</span>
              </div>
            </div>
            <div class="card-actions">
              <button mat-raised-button color="primary" (click)="profileEditing.set(true)">
                <mat-icon>edit</mat-icon> Edit Profile
              </button>
            </div>
          } @else {
            <div class="profile-form">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Monthly Income</mat-label>
                  <span matPrefix>$&nbsp;</span>
                  <input matInput type="number" inputmode="decimal" [(ngModel)]="profileIncome" min="0" step="100">
                  <mat-hint>Gross monthly income</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Pay Frequency</mat-label>
                  <mat-select [(ngModel)]="profilePayFrequency">
                    <mat-option value="Biweekly">Biweekly (every 2 weeks)</mat-option>
                    <mat-option value="Weekly">Weekly</mat-option>
                    <mat-option value="Monthly">Monthly</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Net Pay Per Check</mat-label>
                  <span matPrefix>$&nbsp;</span>
                  <input matInput type="number" inputmode="decimal" [(ngModel)]="profileNetPay" min="0" step="50">
                  <mat-hint>Take-home amount per paycheck</mat-hint>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Next Pay Date</mat-label>
                  <input matInput type="date" [(ngModel)]="profileNextPayDate">
                  <mat-hint>Anchor date — all paycheck dates are calculated from this</mat-hint>
                </mat-form-field>
              </div>
              <div class="card-actions">
                <button mat-raised-button color="primary" (click)="saveProfile()" [disabled]="savingProfile()">
                  @if (savingProfile()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    <mat-icon>save</mat-icon> Save
                  }
                </button>
                <button mat-button (click)="cancelProfileEdit()">Cancel</button>
              </div>
            </div>
          }
        }
      </mat-card>

      <!-- Timezone -->
      <mat-card class="settings-card">
        <div class="card-header">
          <div class="card-icon-wrap tz-icon"><mat-icon>schedule</mat-icon></div>
          <div class="card-header-text">
            <h3>Display Timezone</h3>
            <p class="card-subtitle">
              Choose your preferred timezone for displaying dates and times.
              All data is stored in UTC — this only affects display.
            </p>
          </div>
        </div>

        <mat-form-field appearance="outline" class="tz-select">
          <mat-label>Timezone</mat-label>
          <mat-select [(value)]="selectedTimezone">
            @for (group of groups; track group) {
              <mat-optgroup [label]="group">
                @for (tz of getByGroup(group); track tz.id) {
                  <mat-option [value]="tz.id">{{ tz.label }}</mat-option>
                }
              </mat-optgroup>
            }
          </mat-select>
        </mat-form-field>

        <div class="card-actions">
          <button mat-raised-button color="primary" (click)="saveTimezone()" [disabled]="savingTz() || selectedTimezone === currentTimezone()">
            @if (savingTz()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon> Save
            }
          </button>
          @if (selectedTimezone !== currentTimezone()) {
            <span class="unsaved-hint">Unsaved changes</span>
          }
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { max-width: 640px; margin: 0 auto; }
    .page-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: var(--spacing-md);
    }
    .page-header mat-icon.page-icon {
      font-size: 28px; width: 28px; height: 28px; color: var(--color-primary);
    }
    .page-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; color: var(--color-text); }

    .settings-card { padding: 24px !important; margin-bottom: var(--spacing-md); }

    .card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .card-icon-wrap {
      width: 42px; height: 42px; min-width: 42px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .card-icon-wrap mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .pay-icon { background: rgba(33,150,243,0.1); color: #1976d2; }
    .tz-icon { background: rgba(156,39,176,0.1); color: #7b1fa2; }
    .card-header-text { flex: 1; }
    .card-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--color-text); }
    .card-subtitle {
      color: var(--color-text-muted); font-size: 0.82rem; line-height: 1.5;
      margin: 4px 0 0;
    }

    /* Profile summary (read mode) */
    .profile-summary {
      background: var(--color-surface-secondary, #f8fafc);
      border-radius: var(--radius-sm, 8px); padding: 4px 0;
      margin-bottom: 16px;
    }
    .summary-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-bottom: 1px solid var(--color-border);
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-label { font-size: 0.88rem; color: var(--color-text-muted); font-weight: 500; }
    .summary-value { font-size: 0.92rem; font-weight: 700; color: var(--color-text); }

    /* Profile form (edit mode) */
    .form-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 12px; margin-bottom: 12px;
    }
    .form-grid mat-form-field { width: 100%; }

    .tz-select { width: 100%; margin-bottom: 8px; }

    .card-actions {
      display: flex; align-items: center; gap: 12px;
    }
    .card-actions button mat-icon { margin-right: 4px; }
    .card-actions mat-spinner { margin: 0 auto; }
    .unsaved-hint { font-size: 0.8rem; color: var(--color-warning); font-style: italic; }

    @media (max-width: 599px) {
      .settings-card { padding: 16px !important; }
      .form-grid { grid-template-columns: 1fr; gap: 8px; }
      .card-header { gap: 10px; }
      .card-icon-wrap { width: 36px; height: 36px; min-width: 36px; }
      .card-icon-wrap mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private profileService = inject(UserProfileService);
  private snackBar = inject(MatSnackBar);

  // Timezone
  groups = ['US', 'Europe', 'Asia', 'Australia', 'Other'];
  selectedTimezone = 'UTC';
  currentTimezone = signal('UTC');
  savingTz = signal(false);

  // Profile
  profileLoading = signal(true);
  profileEditing = signal(false);
  savingProfile = signal(false);
  profileIncome = 0;
  profilePayFrequency: PayFrequency = 'Biweekly';
  profileNetPay = 0;
  profileNextPayDate = '';

  private originalProfile: UserProfile | null = null;

  ngOnInit(): void {
    const tz = this.authService.currentUser()?.timezone || localStorage.getItem('pulse_timezone') || 'UTC';
    this.selectedTimezone = tz;
    this.currentTimezone.set(tz);
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.setProfileFields(profile);
        this.originalProfile = profile;
        this.profileLoading.set(false);
      },
      error: () => {
        this.profileLoading.set(false);
      }
    });
  }

  private setProfileFields(profile: UserProfile): void {
    this.profileIncome = profile.monthlyIncome || 0;
    this.profilePayFrequency = profile.payFrequency || 'Biweekly';
    this.profileNetPay = profile.netPayPerCheck || 0;
    this.profileNextPayDate = profile.nextPayDate ? profile.nextPayDate.split('T')[0] : '';
  }

  cancelProfileEdit(): void {
    if (this.originalProfile) this.setProfileFields(this.originalProfile);
    this.profileEditing.set(false);
  }

  saveProfile(): void {
    this.savingProfile.set(true);
    const payload: Partial<UserProfile> = {
      monthlyIncome: this.profileIncome,
      payFrequency: this.profilePayFrequency,
      netPayPerCheck: this.profileNetPay,
      nextPayDate: this.profileNextPayDate || null,
    };
    this.profileService.saveProfile(payload).subscribe({
      next: (saved) => {
        this.setProfileFields(saved);
        this.originalProfile = saved;
        this.savingProfile.set(false);
        this.profileEditing.set(false);
        this.snackBar.open('Pay profile updated', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.snackBar.open(err?.error?.message || 'Failed to save profile', 'Dismiss', { duration: 5000 });
      }
    });
  }

  getByGroup(group: string): TimezoneOption[] {
    return TIMEZONES.filter(t => t.group === group);
  }

  async saveTimezone(): Promise<void> {
    this.savingTz.set(true);
    try {
      await this.authService.updateTimezone(this.selectedTimezone);
      this.notify.success('Timezone updated — reloading...');
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      this.savingTz.set(false);
      this.notify.error(err?.error?.error || 'Failed to update timezone');
    }
  }
}
