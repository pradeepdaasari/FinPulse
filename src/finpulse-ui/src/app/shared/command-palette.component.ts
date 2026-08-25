import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AdminService } from '../core/services/admin.service';
import { NotificationService } from '../core/services/notification.service';

interface PaletteItem {
  label: string;
  icon: string;
  route?: string;
  action?: string;
  keywords: string[];
}

const COMMANDS: PaletteItem[] = [
  { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', keywords: ['home', 'overview'] },
  { label: 'My Loans', icon: 'account_balance', route: '/loans', keywords: ['debt', 'personal loan'] },
  { label: 'My Cards', icon: 'credit_card', route: '/cards', keywords: ['credit', 'visa', 'mastercard'] },
  { label: 'Bank Accounts', icon: 'savings', route: '/accounts', keywords: ['checking', 'savings', 'bank'] },
  { label: 'Transactions', icon: 'swap_horiz', route: '/expenses', keywords: ['expense', 'income', 'spending'] },
  { label: 'Budget', icon: 'pie_chart', route: '/budget', keywords: ['budget', 'allocate', 'plan'] },
  { label: 'Recurring', icon: 'repeat', route: '/recurring', keywords: ['subscription', 'bill', 'auto'] },
  { label: 'Goals', icon: 'flag', route: '/goals', keywords: ['savings', 'target', 'goal'] },
  { label: 'Categories', icon: 'category', route: '/categories', keywords: ['tag', 'organize'] },
  { label: 'Payoff Strategies', icon: 'trending_down', route: '/strategies', keywords: ['avalanche', 'snowball', 'payoff'] },
  { label: 'What-If Simulator', icon: 'science', route: '/simulator', keywords: ['simulate', 'extra payment', 'what if'] },
  { label: 'Payments', icon: 'receipt_long', route: '/payments', keywords: ['payment', 'history', 'record'] },
  { label: 'Settings', icon: 'settings', route: '/setup', keywords: ['setup', 'profile', 'income'] },
];

const ACTIONS: PaletteItem[] = [
  { label: 'Log Transaction', icon: 'add_circle', action: 'add-expense', keywords: ['expense', 'log', 'record', 'new'] },
  { label: 'Add Loan', icon: 'add', action: 'add-loan', keywords: ['new loan'] },
  { label: 'Add Credit Card', icon: 'add', action: 'add-card', keywords: ['new card'] },
  { label: 'Add Goal', icon: 'add', action: 'add-goal', keywords: ['new goal'] },
  { label: 'Reset Demo Data', icon: 'restart_alt', action: 'reseed', keywords: ['reset', 'seed', 'demo', 'sample', 'clear'] },
];

const ALL_ITEMS: PaletteItem[] = [...COMMANDS, ...ACTIONS];

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="palette-backdrop" (click)="close()" aria-hidden="true"></div>
      <div class="palette-container" role="dialog" aria-label="Command palette">
        <div class="palette-input-wrap">
          <mat-icon aria-hidden="true">search</mat-icon>
          <input #searchInput
            type="text"
            placeholder="Search pages, actions..."
            aria-label="Search pages and actions"
            [(ngModel)]="query"
            (input)="filter()"
            (keydown)="onKeydown($event)"
            autocomplete="off"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            [attr.aria-activedescendant]="'palette-item-' + selectedIndex()">
          <span class="palette-shortcut" aria-hidden="true">ESC</span>
        </div>
        <div class="palette-results" id="palette-results" role="listbox">
          @for (item of filtered(); track item.label; let i = $index) {
            <div class="palette-item" [class.active]="i === selectedIndex()"
                 [id]="'palette-item-' + i"
                 role="option"
                 [attr.aria-selected]="i === selectedIndex()"
                 (click)="select(item)" (mouseenter)="selectedIndex.set(i)">
              <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
              <span class="palette-item-label">{{ item.label }}</span>
              @if (item.action) {
                <span class="palette-badge">Action</span>
              }
            </div>
          }
          @if (filtered().length === 0) {
            <div class="palette-empty" role="status">No results for "{{ query }}"</div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .palette-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9998;
    }
    .palette-container {
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: 560px;
      max-width: 90vw;
      max-height: 420px;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-float);
      z-index: 9999;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .palette-input-wrap {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      gap: 10px;
      border-bottom: 1px solid var(--color-border);
    }
    .palette-input-wrap mat-icon { color: var(--color-text-secondary); font-size: 22px; width: 22px; height: 22px; }
    .palette-input-wrap input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1rem;
      font-family: var(--font-primary);
      background: transparent;
      color: var(--color-text);
    }
    .palette-shortcut {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--color-surface-secondary);
      color: var(--color-text-secondary);
      font-weight: 500;
    }
    .palette-results {
      overflow-y: auto;
      padding: 8px;
    }
    .palette-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.1s;
    }
    .palette-item:hover, .palette-item.active {
      background: var(--color-surface-hover);
    }
    .palette-item mat-icon { color: var(--color-text-secondary); font-size: 20px; width: 20px; height: 20px; }
    .palette-item.active mat-icon { color: var(--color-primary); }
    .palette-item-label { font-size: var(--text-sm); font-weight: 500; }
    .palette-badge {
      margin-left: auto;
      font-size: 0.65rem;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: rgba(0, 122, 255, 0.1);
      color: var(--color-primary);
      font-weight: 600;
      text-transform: uppercase;
    }
    .palette-empty {
      text-align: center;
      padding: 20px;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  `]
})
export class CommandPaletteComponent {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private dialog = inject(MatDialog);
  private adminService = inject(AdminService);
  private notify = inject(NotificationService);

  isOpen = signal(false);
  query = '';
  filtered = signal<PaletteItem[]>(ALL_ITEMS);
  selectedIndex = signal(0);

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.open();
    }
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  open(): void {
    this.query = '';
    this.filtered.set(ALL_ITEMS);
    this.selectedIndex.set(0);
    this.isOpen.set(true);
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 0);
  }

  close(): void {
    this.isOpen.set(false);
  }

  filter(): void {
    const q = this.query.toLowerCase().trim();
    if (!q) {
      this.filtered.set(ALL_ITEMS);
    } else {
      this.filtered.set(
        ALL_ITEMS.filter(item =>
          item.label.toLowerCase().includes(q) ||
          item.keywords.some(kw => kw.toLowerCase().includes(q))
        )
      );
    }
    this.selectedIndex.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.filtered();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.set((this.selectedIndex() + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.set((this.selectedIndex() - 1 + items.length) % items.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (items.length > 0) {
        this.select(items[this.selectedIndex()]);
      }
    }
  }

  select(item: PaletteItem): void {
    this.close();
    if (item.route) {
      this.router.navigate([item.route]);
    } else if (item.action) {
      this.handleAction(item.action);
    }
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'add-expense':
        import('../features/expenses/add-expense-dialog.component').then(m => {
          this.dialog.open(m.AddExpenseDialogComponent, {
            width: '480px',
            data: { expense: null }
          });
        });
        break;
      case 'add-loan':
        this.router.navigate(['/loans'], { queryParams: { action: 'add' } });
        break;
      case 'add-card':
        this.router.navigate(['/cards'], { queryParams: { action: 'add' } });
        break;
      case 'add-goal':
        this.router.navigate(['/goals'], { queryParams: { action: 'add' } });
        break;
      case 'reseed':
        this.adminService.reseed().subscribe({
          next: () => {
            this.notify.success('Demo data reset successfully. Refreshing...');
            setTimeout(() => window.location.reload(), 1500);
          },
          error: () => this.notify.error('Failed to reset demo data')
        });
        break;
    }
  }
}
