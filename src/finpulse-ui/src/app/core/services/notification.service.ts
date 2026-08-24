import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

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
}
