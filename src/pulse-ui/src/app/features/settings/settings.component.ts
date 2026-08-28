import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

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
  imports: [CommonModule, FormsModule, MatCardModule, MatSelectModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="settings-container">
      <div class="page-header">
        <mat-icon class="page-icon">settings</mat-icon>
        <h2>Settings</h2>
      </div>

      <mat-card class="settings-card">
        <div class="card-header">
          <mat-icon>schedule</mat-icon>
          <h3>Display Timezone</h3>
        </div>
        <p class="card-description">
          Choose your preferred timezone for displaying dates and times throughout the app.
          All data is stored in UTC — this setting only affects how times are shown to you.
        </p>

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
          <button mat-raised-button color="primary" (click)="save()" [disabled]="saving() || selectedTimezone === currentTimezone()">
            @if (saving()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
              Save
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

    .settings-card { padding: 24px !important; }
    .card-header {
      display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
    }
    .card-header mat-icon { color: var(--color-primary); }
    .card-header h3 { margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--color-text); }
    .card-description {
      color: var(--color-text-muted); font-size: 0.875rem; line-height: 1.5;
      margin-bottom: 20px;
    }

    .tz-select { width: 100%; }

    .card-actions {
      display: flex; align-items: center; gap: 12px; margin-top: 8px;
    }
    .card-actions button { min-width: 100px; }
    .card-actions button mat-icon { margin-right: 4px; }
    .card-actions mat-spinner { margin: 0 auto; }
    .unsaved-hint { font-size: 0.8rem; color: var(--color-warning); font-style: italic; }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private notify = inject(NotificationService);

  groups = ['US', 'Europe', 'Asia', 'Australia', 'Other'];
  selectedTimezone = 'UTC';
  currentTimezone = signal('UTC');
  saving = signal(false);

  ngOnInit(): void {
    const tz = this.authService.currentUser()?.timezone || localStorage.getItem('pulse_timezone') || 'UTC';
    this.selectedTimezone = tz;
    this.currentTimezone.set(tz);
  }

  getByGroup(group: string): TimezoneOption[] {
    return TIMEZONES.filter(t => t.group === group);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    try {
      await this.authService.updateTimezone(this.selectedTimezone);
      this.notify.success('Timezone updated — reloading...');
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      this.saving.set(false);
      this.notify.error(err?.error?.error || 'Failed to update timezone');
    }
  }
}
