import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { CommandPaletteComponent } from './command-palette.component';

@Component({
  selector: 'app-nav-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CommandPaletteComponent
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="sidenav"
        [fixedInViewport]="isMobile()"
        fixedTopGap="0">

        <div class="sidenav-header">
          <a class="brand" routerLink="/dashboard">
            <mat-icon class="brand-icon">account_balance_wallet</mat-icon>
            <span class="brand-name">FinPulse</span>
          </a>
        </div>

        <mat-nav-list class="nav-list">
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/loans" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>account_balance</mat-icon>
            <span matListItemTitle>My Loans</span>
          </a>
          <a mat-list-item routerLink="/cards" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>credit_card</mat-icon>
            <span matListItemTitle>My Cards</span>
          </a>
          <a mat-list-item routerLink="/accounts" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>savings</mat-icon>
            <span matListItemTitle>Bank Accounts</span>
          </a>

          <div class="nav-divider"></div>

          <a mat-list-item routerLink="/expenses" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>swap_horiz</mat-icon>
            <span matListItemTitle>Transactions</span>
          </a>
          <a mat-list-item routerLink="/budget" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>pie_chart</mat-icon>
            <span matListItemTitle>Budget</span>
          </a>
          <a mat-list-item routerLink="/recurring" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>repeat</mat-icon>
            <span matListItemTitle>Recurring</span>
          </a>
          <a mat-list-item routerLink="/goals" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>flag</mat-icon>
            <span matListItemTitle>Goals</span>
          </a>
          <a mat-list-item routerLink="/categories" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>category</mat-icon>
            <span matListItemTitle>Categories</span>
          </a>

          <div class="nav-divider"></div>

          <a mat-list-item routerLink="/strategies" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>trending_down</mat-icon>
            <span matListItemTitle>Payoff Strategies</span>
          </a>
          <a mat-list-item routerLink="/simulator" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>science</mat-icon>
            <span matListItemTitle>What-If Simulator</span>
          </a>
          <a mat-list-item routerLink="/payments" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Payments</span>
          </a>
          <a mat-list-item routerLink="/setup" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Setup</span>
          </a>

          @if (isAdmin()) {
            <div class="nav-divider"></div>
            <a mat-list-item routerLink="/admin/users" routerLinkActive="active-link"
               (click)="onNavClick()">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>User Management</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="app-toolbar">
          @if (isMobile()) {
            <button mat-icon-button (click)="sidenav.toggle()" aria-label="Toggle menu">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="toolbar-title">{{ pageTitle() }}</span>
          <span class="toolbar-spacer"></span>
          <button mat-button class="search-trigger" (click)="openPalette()" aria-label="Search">
            <mat-icon>search</mat-icon>
            <span class="search-hint">Search</span>
            <span class="search-kbd">&#8984;K</span>
          </button>
          <div class="user-info">
            <mat-icon class="user-avatar">account_circle</mat-icon>
            <span class="user-email">{{ userEmail() }}</span>
          </div>
          <button mat-icon-button (click)="logout()" aria-label="Logout" matTooltip="Logout">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
    <button mat-fab class="global-fab" (click)="openQuickExpense()" aria-label="Log expense">
      <mat-icon>add</mat-icon>
    </button>
    <app-command-palette></app-command-palette>
  `,
  styles: [`
    .shell-container {
      height: 100vh;
    }

    .sidenav {
      width: 240px;
      background: var(--gradient-sidebar);
      backdrop-filter: blur(20px) saturate(180%);
      border-right: none;
    }

    .sidenav-header {
      padding: 20px 16px 12px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    .brand:hover { opacity: 0.8; }

    .brand-icon {
      color: var(--color-sidebar-accent);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .brand-name {
      font-family: var(--font-primary);
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-sidebar-text-active);
      letter-spacing: -0.03em;
    }

    .nav-divider {
      height: 1px;
      background: var(--color-sidebar-border);
      margin: 8px 16px;
    }

    .nav-list {
      padding: 8px 10px;
    }

    .nav-list a {
      border-radius: var(--radius-sm) !important;
      margin-bottom: 1px;
      font-family: var(--font-primary);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-sidebar-text) !important;
      transition: all var(--transition-fast);
      height: 36px !important;
    }

    .nav-list a mat-icon {
      color: var(--color-sidebar-text) !important;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .nav-list a span {
      color: var(--color-sidebar-text) !important;
    }

    .nav-list a:hover {
      background-color: var(--color-sidebar-hover) !important;
    }

    .nav-list a:hover mat-icon,
    .nav-list a:hover span {
      color: var(--color-sidebar-text-active) !important;
    }

    .nav-list a.active-link {
      background-color: var(--color-sidebar-active) !important;
    }

    .nav-list a.active-link mat-icon {
      color: var(--color-sidebar-accent) !important;
    }

    .nav-list a.active-link span {
      color: var(--color-sidebar-text-active) !important;
    }

    .app-toolbar {
      background: rgba(255, 255, 255, 0.72) !important;
      backdrop-filter: blur(20px) saturate(180%);
      color: var(--color-text) !important;
      border-bottom: none;
      box-shadow: none;
      height: 56px;
    }

    .toolbar-title {
      font-family: var(--font-primary);
      font-size: var(--text-lg);
      font-weight: 600;
      margin-left: 8px;
      letter-spacing: var(--tracking-tight);
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-right: 8px;
      padding: 4px 12px 4px 8px;
      border-radius: var(--radius-full);
      background: var(--color-surface-secondary);
    }
    .user-avatar {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: var(--color-primary);
    }
    .user-email {
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--color-text-secondary);
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .content-area {
      padding: 24px 28px;
      max-width: 1200px;
      min-height: calc(100vh - 56px);
    }

    @media (max-width: 768px) {
      .content-area {
        padding: var(--spacing-md);
      }
      .toolbar-title {
        font-size: var(--text-base);
      }
      .user-email {
        display: none;
      }
      .user-info {
        padding: 4px;
        background: none;
      }
    }

    .global-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
      background: var(--color-primary) !important;
      color: #fff !important;
      box-shadow: var(--shadow-lg) !important;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .global-fab:hover {
      transform: scale(1.08);
      box-shadow: var(--shadow-xl) !important;
    }
    @media (max-width: 768px) {
      .global-fab {
        bottom: 80px;
      }
    }

    .search-trigger {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px !important;
      border-radius: var(--radius-full) !important;
      background: var(--color-surface-secondary) !important;
      color: var(--color-text-secondary) !important;
      font-size: var(--text-xs) !important;
      min-height: 32px !important;
      margin-right: 8px;
    }
    .search-trigger mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .search-hint { font-weight: 500; }
    .search-kbd {
      font-size: 0.65rem;
      padding: 1px 5px;
      border-radius: 3px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }
  `]
})
export class NavShellComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(CommandPaletteComponent) commandPalette!: CommandPaletteComponent;

  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  isMobile = signal(false);
  pageTitle = signal('Dashboard');
  userEmail = computed(() => this.authService.currentUser()?.email ?? '');
  isAdmin = computed(() => this.authService.isAdmin());

  private pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/loans': 'My Loans',
    '/cards': 'My Cards',
    '/accounts': 'Bank Accounts',
    '/strategies': 'Payoff Strategies',
    '/simulator': 'What-If Simulator',
    '/budget': 'Budget',
    '/expenses': 'Transactions',
    '/categories': 'Categories',
    '/recurring': 'Recurring',
    '/goals': 'Goals',
    '/payments': 'Payments',
    '/setup': 'Setup',
    '/admin': 'User Management',
  };

  constructor() {
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      this.isMobile.set(result.matches);
    });

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(event => {
      const path = '/' + event.urlAfterRedirects.split('/')[1];
      this.pageTitle.set(this.pageTitles[path] ?? 'FinPulse');
    });
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.sidenav.close();
    }
  }

  logout(): void {
    this.authService.logout();
  }

  openQuickExpense(): void {
    import('../features/expenses/add-expense-dialog.component').then(m => {
      this.dialog.open(m.AddExpenseDialogComponent, {
        width: '480px',
        data: { expense: null }
      });
    });
  }

  openPalette(): void {
    this.commandPalette.open();
  }
}
