import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  success(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: 'snack-success',
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      panelClass: 'snack-error',
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
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
