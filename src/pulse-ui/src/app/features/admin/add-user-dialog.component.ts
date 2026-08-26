import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <div class="header-icon amber">
        <mat-icon>person_add</mat-icon>
      </div>
      <div class="header-text">
        <h2 mat-dialog-title>Add New User</h2>
        <span class="dialog-subtitle">Create a new account</span>
      </div>
    </div>
    <mat-dialog-content>
      <form class="dialog-form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label>Username</mat-label>
          <input matInput [(ngModel)]="username" name="username" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="email" name="email" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" [(ngModel)]="password" name="password" required>
        </mat-form-field>
        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="loading()">
        {{ loading() ? 'Creating...' : 'Create User' }}
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
    .header-icon.amber { background: rgba(230,81,0,0.12); }
    .header-icon mat-icon { font-size: 22px; width: 22px; height: 22px; color: #e65100; }
    .header-text h2 { margin: 0 !important; padding: 0 !important; font-size: 1.1rem !important; font-weight: 700 !important; }
    .dialog-subtitle { font-size: 0.75rem; color: var(--color-text-secondary); }
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 320px;
      padding-top: 8px;
    }
    .error-msg {
      color: var(--color-danger);
      font-size: 13px;
      margin: 0;
    }
  `]
})
export class AddUserDialogComponent {
  private adminService = inject(AdminService);
  private dialogRef = inject(MatDialogRef<AddUserDialogComponent>);

  username = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    if (!this.username || !this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    this.adminService.createUser(this.username, this.email, this.password).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.dialogRef.close(user);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.errors?.join(', ') || 'Failed to create user');
      }
    });
  }
}
