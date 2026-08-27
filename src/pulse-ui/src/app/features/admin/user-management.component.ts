import { Component, inject, signal, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService, AppUser } from '../../core/services/admin.service';
import { AddUserDialogComponent } from './add-user-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule],
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
  `]
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private dialog = inject(MatDialog);

  loading = signal(true);
  users = signal<AppUser[]>([]);
  displayedColumns = ['username', 'email', 'role', 'status', 'actions'];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe(users => {
      this.users.set(users);
      this.loading.set(false);
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
}
