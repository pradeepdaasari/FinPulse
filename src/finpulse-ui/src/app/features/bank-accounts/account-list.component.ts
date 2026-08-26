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
      <button mat-raised-button color="primary" (click)="openAddAccount()">
        <mat-icon>add</mat-icon> Add Account
      </button>
    </div>

    @if (loading()) {
      <mat-spinner></mat-spinner>
    } @else if (accounts().length === 0) {
      <div class="empty-state">
        <div class="empty-icon-wrap blue">
          <mat-icon>account_balance</mat-icon>
        </div>
        <h3>Add your first account</h3>
        <p>Connect your checking or savings accounts to see your full financial picture in one place.</p>
        <button mat-raised-button color="primary" (click)="openAddAccount()">
          <mat-icon>add</mat-icon> Add Account
        </button>
      </div>
    } @else {
      <!-- Desktop table -->
      <mat-card class="desktop-only">
        <div class="table-wrapper">
        <table mat-table [dataSource]="accounts()">
          <ng-container matColumnDef="accountName">
            <th mat-header-cell *matHeaderCellDef>Account Name</th>
            <td mat-cell *matCellDef="let a">{{ a.accountName }}</td>
          </ng-container>

          <ng-container matColumnDef="accountType">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let a">
              <span class="acct-type-badge"
                    [class.acct-checking]="a.accountType === 'Checking'"
                    [class.acct-savings]="a.accountType === 'Savings'"
                    [class.acct-brokerage]="a.accountType === 'Brokerage'">{{ a.accountType }}</span>
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

      <!-- Mobile cards -->
      <div class="mobile-cards">
        @for (a of accounts(); track a.id) {
          <div class="account-card" (click)="editAccount(a)">
            <div class="ac-left">
              <div class="ac-icon">
                <mat-icon>{{ a.accountType === 'Savings' ? 'savings' : 'account_balance' }}</mat-icon>
              </div>
            </div>
            <div class="ac-mid">
              <span class="ac-name">{{ a.accountName }}</span>
              <span class="ac-type">{{ a.accountType }}</span>
            </div>
            <div class="ac-right">
              <span class="ac-balance">{{ a.currentBalance | currency }}</span>
            </div>
          </div>
        }
      </div>

      <div class="total-row">
        <strong>Total Balance:</strong> {{ totalBalance() | currency }}
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }
    mat-card { overflow: hidden; padding: 0 !important; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 400px; }
    .balance { font-weight: 600; color: var(--color-primary); }
    .acct-type-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }
    .acct-checking { background: rgba(21,101,192,0.1); color: #1565c0; }
    .acct-savings { background: rgba(46,125,50,0.1); color: #2e7d32; }
    .acct-brokerage { background: rgba(106,27,154,0.1); color: #6a1b9a; }
    .total-row {
      margin-top: var(--spacing-md); text-align: right;
      font-size: 1.1rem; padding: var(--spacing-sm) var(--spacing-md);
    }
    .mobile-cards { display: none; }
    .account-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 12px;
      background: var(--color-surface);
      border-radius: var(--radius-sm);
      margin-bottom: 8px;
      box-shadow: var(--shadow-sm);
      cursor: pointer;
      transition: box-shadow var(--transition-fast);
    }
    .account-card:active { box-shadow: var(--shadow-md); }
    .ac-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--gradient-icon-blue);
    }
    .ac-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--color-primary); }
    .ac-mid { flex: 1; min-width: 0; }
    .ac-name { display: block; font-weight: 600; font-size: 0.9rem; }
    .ac-type { display: block; font-size: 0.75rem; color: var(--color-text-muted); }
    .ac-balance { font-weight: 700; font-size: 1rem; color: var(--color-primary); }
    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
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
