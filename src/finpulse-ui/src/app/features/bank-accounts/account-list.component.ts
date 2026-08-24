import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { BankAccountService } from '../../core/services/bank-account.service';
import { BankAccount } from '../../core/models/bank-account.model';
import { NotificationService } from '../../core/services/notification.service';
import { AddAccountDialogComponent } from './add-account-dialog.component';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatProgressSpinnerModule, CurrencyPipe],
  template: `
    <div class="header-row">
      <h2>Bank Accounts</h2>
      <button mat-raised-button color="primary" (click)="openAddAccount()">
        <mat-icon>add</mat-icon> Add Account
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (accounts().length === 0) {
      <mat-card class="empty-state">
        <mat-icon>account_balance</mat-icon>
        <p>No bank accounts yet. Add your checking or savings account to start tracking balances.</p>
      </mat-card>
    } @else {
      <mat-card>
        <div class="table-wrapper">
        <table mat-table [dataSource]="accounts()">
          <ng-container matColumnDef="accountName">
            <th mat-header-cell *matHeaderCellDef>Account Name</th>
            <td mat-cell *matCellDef="let a">{{ a.accountName }}</td>
          </ng-container>

          <ng-container matColumnDef="accountType">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let a">
              <mat-chip>{{ a.accountType }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="currentBalance">
            <th mat-header-cell *matHeaderCellDef>Balance</th>
            <td mat-cell *matCellDef="let a" class="balance">{{ a.currentBalance | currency }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let a">
              <button mat-icon-button (click)="editAccount(a)" aria-label="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteAccount(a)" aria-label="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        </div>
      </mat-card>

      <div class="total-row">
        <strong>Total Balance:</strong> {{ totalBalance() | currency }}
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--spacing-lg); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    .header-row h2 { margin: 0; }
    mat-card { overflow: hidden; padding: 0 !important; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 400px; }
    .balance { font-weight: 600; color: var(--color-primary); }
    .total-row {
      margin-top: var(--spacing-md); text-align: right;
      font-size: 1.1rem; padding: var(--spacing-sm) var(--spacing-md);
    }
    .empty-state {
      text-align: center; padding: var(--spacing-xl) !important;
    }
    .empty-state mat-icon { font-size: 56px; height: 56px; width: 56px; color: var(--color-text-muted); }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class AccountListComponent implements OnInit {
  private accountService = inject(BankAccountService);
  private notify = inject(NotificationService);
  private dialog = inject(MatDialog);

  accounts = signal<BankAccount[]>([]);
  loading = signal(true);
  displayedColumns = ['accountName', 'accountType', 'currentBalance', 'actions'];

  totalBalance = signal(0);

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accountService.getAll().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.totalBalance.set(accounts.reduce((sum, a) => sum + a.currentBalance, 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddAccount(): void {
    const dialogRef = this.dialog.open(AddAccountDialogComponent, {
      width: '500px',
      maxWidth: '95vw'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Account added successfully');
        this.loadAccounts();
      }
    });
  }

  editAccount(account: BankAccount): void {
    const dialogRef = this.dialog.open(AddAccountDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: account
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notify.success('Account updated successfully');
        this.loadAccounts();
      }
    });
  }

  deleteAccount(account: BankAccount): void {
    if (!this.notify.confirmDelete(account.accountName)) return;
    this.accountService.delete(account.id).subscribe({
      next: () => {
        this.notify.success('Account deleted successfully');
        this.loadAccounts();
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Failed to delete account');
      }
    });
  }
}
