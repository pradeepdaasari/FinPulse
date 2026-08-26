import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog.component';
import { ToastComponent, ToastData } from '../../shared/toast.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  success(message: string): void {
    this.show({ message, type: 'success' }, 3000);
  }

  error(message: string): void {
    this.show({ message, type: 'error' }, 5000);
  }

  warning(message: string): void {
    this.show({ message, type: 'warning' }, 4000);
  }

  info(message: string): void {
    this.show({ message, type: 'info' }, 3000);
  }

  private show(data: ToastData, duration: number): void {
    this.snackBar.openFromComponent(ToastComponent, {
      data,
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'toast-panel'
    });
  }

  confirmDelete(itemName: string): boolean {
    return confirm(`Are you sure you want to delete "${itemName}"? This cannot be undone.`);
  }

  confirmDeleteAsync(itemName: string): Observable<boolean> {
    const data: ConfirmDialogData = {
      title: 'Delete ' + itemName + '?',
      message: 'This action cannot be undone. All associated data will be permanently removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      color: 'warn'
    };
    return this.dialog.open(ConfirmDialogComponent, { width: '400px', data })
      .afterClosed().pipe(map(result => !!result));
  }
}
