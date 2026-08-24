import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

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
    MatTooltipModule
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
          <a mat-list-item routerLink="/budget" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>pie_chart</mat-icon>
            <span matListItemTitle>Budget</span>
          </a>
          <a mat-list-item routerLink="/expenses" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>swap_horiz</mat-icon>
            <span matListItemTitle>Transactions</span>
          </a>
          <a mat-list-item routerLink="/categories" routerLinkActive="active-link"
             (click)="onNavClick()">
            <mat-icon matListItemIcon>category</mat-icon>
            <span matListItemTitle>Categories</span>
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
  `,
  styles: [`
    .shell-container {
      height: 100vh;
    }

    .sidenav {
      width: 260px;
      background: var(--gradient-sidebar);
      border-right: none;
    }

    .sidenav-header {
      padding: 24px 20px 16px;
      border-bottom: 1px solid var(--color-sidebar-border);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .brand:hover {
      opacity: 0.85;
    }

    .brand-icon {
      color: var(--color-sidebar-accent);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .brand-name {
      font-family: var(--font-primary);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-sidebar-text-active);
      letter-spacing: -0.02em;
    }

    .nav-list {
      padding: 12px 8px;
    }

    .nav-list a {
      border-radius: 8px !important;
      margin-bottom: 2px;
      font-family: var(--font-primary);
      font-weight: 500;
      color: var(--color-sidebar-text) !important;
      transition: all var(--transition-fast);
    }

    .nav-list a mat-icon {
      color: var(--color-sidebar-text) !important;
    }

    .nav-list a span {
      color: var(--color-sidebar-text) !important;
    }

    .nav-list a:hover {
      background-color: var(--color-sidebar-hover) !important;
      color: var(--color-sidebar-text-active) !important;
    }

    .nav-list a:hover mat-icon,
    .nav-list a:hover span {
      color: var(--color-sidebar-text-active) !important;
    }

    .nav-list a.active-link {
      background-color: var(--color-sidebar-active) !important;
      color: var(--color-sidebar-text-active) !important;
      border-left: 3px solid var(--color-sidebar-accent);
      padding-left: 13px;
    }

    .nav-list a.active-link mat-icon {
      color: var(--color-sidebar-accent) !important;
    }

    .nav-list a.active-link span {
      color: var(--color-sidebar-text-active) !important;
    }

    .app-toolbar {
      background: var(--color-surface) !important;
      color: var(--color-text) !important;
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      height: 64px;
    }

    .toolbar-title {
      font-family: var(--font-primary);
      font-size: 1.125rem;
      font-weight: 600;
      margin-left: 8px;
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
      border-radius: 20px;
      background: var(--color-bg, rgba(0,0,0,0.04));
    }
    .user-avatar {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--color-primary);
    }
    .user-email {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .content-area {
      padding: var(--spacing-xl);
      max-width: 1400px;
      min-height: calc(100vh - 64px);
    }

    @media (max-width: 768px) {
      .content-area {
        padding: var(--spacing-md);
      }

      .toolbar-title {
        font-size: 1rem;
      }

      .user-email {
        display: none;
      }
      .user-info {
        padding: 4px;
        background: none;
      }
    }
  `]
})
export class NavShellComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private authService = inject(AuthService);

  isMobile = signal(false);
  pageTitle = signal('Dashboard');
  userEmail = computed(() => this.authService.currentUser()?.email ?? '');

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
    '/payments': 'Payments',
    '/setup': 'Setup',
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
}
