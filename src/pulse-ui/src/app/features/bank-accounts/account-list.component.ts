import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
      <!-- Summary Stats -->
      <div class="stats-row">
        <div class="stat-card stat-green">
          <mat-icon>account_balance_wallet</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ totalBalance() | currency:'USD':'symbol':'1.0-0' }}</span>
            <span class="stat-label">Total Balance</span>
          </div>
        </div>
        <div class="stat-card stat-blue">
          <mat-icon>account_balance</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ checkingCount() }}</span>
            <span class="stat-label">Checking</span>
          </div>
        </div>
        <div class="stat-card stat-purple">
          <mat-icon>savings</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ savingsCount() }}</span>
            <span class="stat-label">Savings</span>
          </div>
        </div>
        <div class="stat-card stat-amber">
          <mat-icon>trending_up</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ brokerageCount() }}</span>
            <span class="stat-label">Brokerage</span>
          </div>
        </div>
      </div>

      <!-- Desktop table -->
      <mat-card class="desktop-only">
        <div class="table-wrapper">
        <table mat-table [dataSource]="accounts()">
          <ng-container matColumnDef="accountName">
            <th mat-header-cell *matHeaderCellDef>Account Name</th>
            <td mat-cell *matCellDef="let a">
              <div class="acct-name-cell">
                <mat-icon class="acct-icon" [class.icon-checking]="a.accountType === 'Checking'" [class.icon-savings]="a.accountType === 'Savings'" [class.icon-brokerage]="a.accountType === 'Brokerage'">{{ getAccountIcon(a.accountType) }}</mat-icon>
                <span class="acct-name-text">{{ a.accountName }}</span>
              </div>
            </td>
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
              <div class="action-group">
                <button mat-icon-button class="action-btn action-edit" (click)="editAccount(a)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button class="action-btn action-delete" (click)="deleteAccount(a)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
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
              <div class="ac-icon" [class.icon-checking]="a.accountType === 'Checking'" [class.icon-savings]="a.accountType === 'Savings'" [class.icon-brokerage]="a.accountType === 'Brokerage'">
                <mat-icon>{{ getAccountIcon(a.accountType) }}</mat-icon>
              </div>
            </div>
            <div class="ac-mid">
              <span class="ac-name">{{ a.accountName }}</span>
              <span class="ac-type-pill" [class.acct-checking]="a.accountType === 'Checking'" [class.acct-savings]="a.accountType === 'Savings'" [class.acct-brokerage]="a.accountType === 'Brokerage'">{{ a.accountType }}</span>
            </div>
            <div class="ac-right">
              <span class="ac-balance">{{ a.currentBalance | currency }}</span>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .header-row {
      display: flex; justify-content: flex-end; align-items: center;
      margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);
    }

    /* Summary Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
    }
    .stat-card {
      display: flex; align-items: center; gap: 12px; padding: 16px;
      border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-sm);
    }
    .stat-card mat-icon {
      font-size: 28px; width: 28px; height: 28px; padding: 10px; border-radius: 12px;
    }
    .stat-green mat-icon { color: var(--color-stat-green); background: var(--color-stat-green-bg); }
    .stat-blue mat-icon { color: var(--color-stat-blue); background: var(--color-stat-blue-bg); }
    .stat-purple mat-icon { color: var(--color-stat-purple); background: var(--color-stat-purple-bg); }
    .stat-amber mat-icon { color: var(--color-stat-amber); background: var(--color-stat-amber-bg); }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.2rem; font-weight: 700; color: var(--color-text); }
    .stat-label { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px; }

    mat-card { overflow: hidden; padding: 0 !important; }
    .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    table { width: 100%; min-width: 400px; }
    .balance { font-weight: 700; color: var(--color-success); }
    .acct-name-cell { display: flex; align-items: center; gap: 10px; }
    .acct-icon { font-size: 20px; width: 20px; height: 20px; }
    .icon-checking { color: var(--color-stat-blue); }
    .icon-savings { color: var(--color-stat-green); }
    .icon-brokerage { color: var(--color-stat-purple); }
    .acct-name-text { font-weight: 500; }
    .acct-type-badge {
      display: inline-block; font-size: 0.7rem; font-weight: 600;
      padding: 3px 10px; border-radius: var(--radius-full); white-space: nowrap;
    }
    .acct-checking { background: var(--color-stat-blue-bg); color: var(--color-stat-blue); }
    .acct-savings { background: var(--color-stat-green-bg); color: var(--color-stat-green); }
    .acct-brokerage { background: var(--color-stat-purple-bg); color: var(--color-stat-purple); }

    /* Action Buttons */
    .action-group { display: flex; gap: 2px; }
    .action-btn { width: 34px; height: 34px; border-radius: 8px !important; }
    .action-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .action-edit { color: var(--color-action-edit) !important; }
    .action-edit:hover { background: var(--color-action-edit-bg) !important; }
    .action-delete { color: var(--color-action-delete) !important; }
    .action-delete:hover { background: var(--color-action-delete-bg) !important; }

    .mobile-cards { display: none; }
    .account-card {
      display: flex; align-items: center; gap: 12px; padding: 14px 12px;
      background: var(--color-surface); border-radius: var(--radius-md);
      margin-bottom: 10px; box-shadow: var(--shadow-sm);
      cursor: pointer; transition: box-shadow var(--transition-fast);
    }
    .account-card:active { box-shadow: var(--shadow-md); }
    .ac-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .ac-icon.icon-checking { background: var(--color-stat-blue-bg); }
    .ac-icon.icon-checking mat-icon { color: var(--color-stat-blue); }
    .ac-icon.icon-savings { background: var(--color-stat-green-bg); }
    .ac-icon.icon-savings mat-icon { color: var(--color-stat-green); }
    .ac-icon.icon-brokerage { background: var(--color-stat-purple-bg); }
    .ac-icon.icon-brokerage mat-icon { color: var(--color-stat-purple); }
    .ac-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .ac-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .ac-name { font-weight: 600; font-size: 0.9rem; }
    .ac-type-pill {
      display: inline-block; font-size: 0.65rem; font-weight: 600;
      padding: 2px 8px; border-radius: var(--radius-full); width: fit-content;
    }
    .ac-balance { font-weight: 700; font-size: 1.05rem; color: var(--color-success); }

    /* Empty State */
    .empty-state { text-align: center; padding: 48px 24px; }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-icon-wrap.blue { background: var(--color-stat-blue-bg); }
    .empty-icon-wrap.blue mat-icon { color: var(--color-stat-blue); font-size: 32px; width: 32px; height: 32px; }

    @media (max-width: 768px) {
      .header-row { flex-direction: column; align-items: flex-start; }
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 599px) {
      .desktop-only { display: none !important; }
      .mobile-cards { display: block; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .stat-card { padding: 12px 10px; gap: 8px; }
      .stat-card mat-icon { font-size: 22px; width: 22px; height: 22px; padding: 8px; border-radius: 10px; }
      .stat-value { font-size: 1rem; }
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
  checkingCount = computed(() => this.accounts().filter(a => a.accountType === 'Checking').length);
  savingsCount = computed(() => this.accounts().filter(a => a.accountType === 'Savings').length);
  brokerageCount = computed(() => this.accounts().filter(a => a.accountType === 'Brokerage').length);

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

  getAccountIcon(type: string): string {
    switch (type) {
      case 'Savings': return 'savings';
      case 'Brokerage': return 'trending_up';
      default: return 'account_balance';
    }
  }
}
