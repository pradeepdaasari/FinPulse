import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { AdminService, AppUser } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AddUserDialogComponent } from './add-user-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule, MatCardModule],
  template: `
    @if (loading()) {
      <div class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
    <div class="page-container">
      <div class="page-header">
        <h2>User Management</h2>
        <button mat-raised-button color="primary" (click)="openAddDialog()">
          <mat-icon>person_add</mat-icon>
          Add User
        </button>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="users()">
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Username</th>
            <td mat-cell *matCellDef="let user">{{ user.username }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip [highlighted]="user.role === 'Admin'">{{ user.role }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip [class.active-chip]="user.isActive" [class.inactive-chip]="!user.isActive">
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              @if (user.role !== 'Admin') {
                @if (user.isActive) {
                  <button mat-icon-button matTooltip="Deactivate" (click)="toggleActive(user)">
                    <mat-icon>block</mat-icon>
                  </button>
                } @else {
                  <button mat-icon-button matTooltip="Activate" (click)="toggleActive(user)">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                }
                <button mat-icon-button matTooltip="Delete" color="warn" (click)="deleteUser(user)">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>

      <!-- Preferences Section -->
      <div class="prefs-section">
        <h3><mat-icon>settings</mat-icon> My Preferences</h3>
        <mat-card class="pref-card">
          <div class="pref-row">
            <div class="pref-label">
              <mat-icon>schedule</mat-icon>
              <div>
                <span class="pref-title">Display Timezone</span>
                <span class="pref-desc">Times are stored in UTC and displayed in your selected timezone</span>
              </div>
            </div>
            <mat-form-field appearance="outline" class="tz-select">
              <mat-select [(value)]="selectedTimezone" (selectionChange)="saveTimezone()">
                @for (group of tzGroups; track group.label) {
                  <mat-optgroup [label]="group.label">
                    @for (tz of group.zones; track tz.id) {
                      <mat-option [value]="tz.id">{{ tz.label }}</mat-option>
                    }
                  </mat-optgroup>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card>
      </div>
    </div>
    }
  `,
  styles: [`
    .loading-container { display: flex; justify-content: center; align-items: center; min-height: 40vh; }
    .page-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-header h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 600;
    }
    .table-container {
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    table {
      width: 100%;
    }
    .active-chip {
      --mdc-chip-label-text-color: #2e7d32;
      --mdc-chip-elevated-container-color: #e8f5e9;
    }
    .inactive-chip {
      --mdc-chip-label-text-color: #c62828;
      --mdc-chip-elevated-container-color: #ffebee;
    }
    .prefs-section { margin-top: 32px; }
    .prefs-section h3 {
      display: flex; align-items: center; gap: 8px;
      font-size: 1.1rem; font-weight: 600; margin-bottom: 12px; color: var(--color-text);
    }
    .prefs-section h3 mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .pref-card { padding: 20px !important; }
    .pref-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .pref-label { display: flex; align-items: center; gap: 12px; }
    .pref-label mat-icon { color: var(--color-text-muted); }
    .pref-label div { display: flex; flex-direction: column; }
    .pref-title { font-weight: 500; font-size: 0.9rem; color: var(--color-text); }
    .pref-desc { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }
    .tz-select { width: 220px; }
    .tz-select .mat-mdc-form-field-subscript-wrapper { display: none; }
  `]
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  users = signal<AppUser[]>([]);
  displayedColumns = ['username', 'email', 'role', 'status', 'actions'];

  selectedTimezone = this.authService.currentUser()?.timezone || localStorage.getItem('pulse_timezone') || 'UTC';
  tzGroups = [
    { label: 'US', zones: [
      { id: 'America/New_York', label: 'Eastern (ET)' },
      { id: 'America/Chicago', label: 'Central (CT)' },
      { id: 'America/Denver', label: 'Mountain (MT)' },
      { id: 'America/Los_Angeles', label: 'Pacific (PT)' },
      { id: 'America/Anchorage', label: 'Alaska (AKT)' },
      { id: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
    ]},
    { label: 'Other', zones: [
      { id: 'UTC', label: 'UTC' },
      { id: 'Europe/London', label: 'London (GMT/BST)' },
      { id: 'Europe/Paris', label: 'Paris (CET)' },
      { id: 'Asia/Kolkata', label: 'India (IST)' },
      { id: 'Asia/Tokyo', label: 'Tokyo (JST)' },
      { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
      { id: 'Australia/Sydney', label: 'Sydney (AEST)' },
    ]},
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe(users => {
      this.users.set(users);
      this.loading.set(false);
      this.cdr.detectChanges();
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(AddUserDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadUsers();
    });
  }

  toggleActive(user: AppUser) {
    const action = user.isActive
      ? this.adminService.deactivateUser(user.id)
      : this.adminService.activateUser(user.id);
    action.subscribe(() => this.loadUsers());
  }

  deleteUser(user: AppUser) {
    if (confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
      this.adminService.deleteUser(user.id).subscribe(() => this.loadUsers());
    }
  }

  async saveTimezone(): Promise<void> {
    try {
      await this.authService.updateTimezone(this.selectedTimezone);
      this.notify.success('Timezone updated — reloading...');
      setTimeout(() => window.location.reload(), 500);
    } catch {
      this.notify.error('Failed to update timezone');
    }
  }
}
