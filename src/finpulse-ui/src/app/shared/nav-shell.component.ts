import { Component, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
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
    MatButtonModule
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
          <div class="brand">
            <mat-icon class="brand-icon">account_balance_wallet</mat-icon>
            <span class="brand-name">FinPulse</span>
          </div>
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
          <button mat-icon-button (click)="logout()" aria-label="Logout">
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
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
    }

    .sidenav-header {
      padding: 24px 20px 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      color: var(--color-primary);
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .brand-name {
      font-family: var(--font-primary);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
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
      color: var(--color-text-secondary);
      transition: all 0.15s ease;
    }

    .nav-list a:hover {
      background-color: var(--color-surface-hover) !important;
      color: var(--color-text);
    }

    .nav-list a.active-link {
      background-color: #e3f2fd !important;
      color: var(--color-primary) !important;
    }

    .nav-list a.active-link mat-icon {
      color: var(--color-primary);
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

  private pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/loans': 'My Loans',
    '/cards': 'My Cards',
    '/strategies': 'Payoff Strategies',
    '/simulator': 'What-If Simulator',
    '/budget': 'Budget',
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
