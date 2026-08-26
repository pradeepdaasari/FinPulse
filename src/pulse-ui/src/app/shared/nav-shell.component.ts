import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd, ChildrenOutletContexts } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { DailyExpenseService } from '../core/services/daily-expense.service';
import { NotificationService } from '../core/services/notification.service';
import { ThemeService } from '../core/services/theme.service';
import { HealthMetricService } from '../core/services/health-metric.service';
import { CommandPaletteComponent } from './command-palette.component';
import { routeFadeAnimation } from './route-animations';

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
  animations: [routeFadeAnimation],
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
            <mat-icon class="brand-icon">monitor_heart</mat-icon>
            <span class="brand-name">Pulse</span>
          </a>
        </div>

        <mat-nav-list class="nav-list">
          <!-- Finance Section -->
          <div class="nav-section-header" [class.expanded]="expandedSections().includes('finance')" (click)="toggleSection('finance')">
            <span class="section-label">Finance</span>
            <mat-icon class="section-chevron">expand_more</mat-icon>
          </div>
          @if (expandedSections().includes('finance')) {
            <div class="nav-section-items">
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
            </div>
          }

          <!-- Trading Section -->
          <div class="nav-section-header" [class.expanded]="expandedSections().includes('trading')" (click)="toggleSection('trading')">
            <span class="section-label">Trading</span>
            <mat-icon class="section-chevron">expand_more</mat-icon>
          </div>
          @if (expandedSections().includes('trading')) {
            <div class="nav-section-items">
              <a mat-list-item routerLink="/trading" routerLinkActive="active-link"
                 [routerLinkActiveOptions]="{exact: true}" (click)="onNavClick()">
                <mat-icon matListItemIcon>candlestick_chart</mat-icon>
                <span matListItemTitle>Trading Hub</span>
              </a>
              <a mat-list-item routerLink="/trading/premarket" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>wb_twilight</mat-icon>
                <span matListItemTitle>Pre-Market</span>
              </a>
              <a mat-list-item routerLink="/trading/checklist" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>checklist</mat-icon>
                <span matListItemTitle>Trade Checklist</span>
              </a>
              <a mat-list-item routerLink="/trading/journal" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>auto_stories</mat-icon>
                <span matListItemTitle>Trade Journal</span>
              </a>
              <a mat-list-item routerLink="/trading/review" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>grading</mat-icon>
                <span matListItemTitle>Daily Review</span>
              </a>
              <a mat-list-item routerLink="/trading/setups" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>tune</mat-icon>
                <span matListItemTitle>My Setups</span>
              </a>
              <a mat-list-item routerLink="/trading/playbook" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>menu_book</mat-icon>
                <span matListItemTitle>Playbook & Rules</span>
              </a>
              <a mat-list-item routerLink="/trading/weekly" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>analytics</mat-icon>
                <span matListItemTitle>Weekly Summary</span>
              </a>
            </div>
          }

          <!-- Health Section -->
          <div class="nav-section-header" [class.expanded]="expandedSections().includes('health')" (click)="toggleSection('health')">
            <span class="section-label">Health & Fitness</span>
            <mat-icon class="section-chevron">expand_more</mat-icon>
          </div>
          @if (expandedSections().includes('health')) {
            <div class="nav-section-items">
              <a mat-list-item routerLink="/health" routerLinkActive="active-link"
                 [routerLinkActiveOptions]="{exact: true}" (click)="onNavClick()">
                <mat-icon matListItemIcon>monitoring</mat-icon>
                <span matListItemTitle>Health Dashboard</span>
              </a>
              <a mat-list-item routerLink="/health/metrics" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>straighten</mat-icon>
                <span matListItemTitle>Vitals & Metrics</span>
              </a>
              <a mat-list-item routerLink="/health/blood-work" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>bloodtype</mat-icon>
                <span matListItemTitle>Blood Work</span>
              </a>
              <a mat-list-item routerLink="/health/plans" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>fitness_center</mat-icon>
                <span matListItemTitle>Workout Plans</span>
              </a>
              <a mat-list-item routerLink="/health/workout" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>exercise</mat-icon>
                <span matListItemTitle>Today's Workout</span>
              </a>
              <a mat-list-item routerLink="/health/progress" routerLinkActive="active-link"
                 (click)="onNavClick()">
                <mat-icon matListItemIcon>emoji_events</mat-icon>
                <span matListItemTitle>Progress & PRs</span>
              </a>
            </div>
          }

          @if (isAdmin()) {
            <div class="nav-section-header" [class.expanded]="expandedSections().includes('admin')" (click)="toggleSection('admin')">
              <span class="section-label">Admin</span>
              <mat-icon class="section-chevron">expand_more</mat-icon>
            </div>
            @if (expandedSections().includes('admin')) {
              <div class="nav-section-items">
                <a mat-list-item routerLink="/admin/users" routerLinkActive="active-link"
                   (click)="onNavClick()">
                  <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
                  <span matListItemTitle>User Management</span>
                </a>
              </div>
            }
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="app-toolbar">
          @if (isMobile() && !isPhone()) {
            <button mat-icon-button (click)="sidenav.toggle()" aria-label="Toggle menu">
              <mat-icon>menu</mat-icon>
            </button>
          }
          @if (isPhone()) {
            <a class="mobile-brand" routerLink="/dashboard">
              <mat-icon class="mobile-brand-icon">monitor_heart</mat-icon>
            </a>
          }
          <span class="toolbar-title">{{ pageTitle() }}</span>
          <span class="toolbar-spacer"></span>
          <button mat-icon-button class="theme-toggle" (click)="toggleTheme()" [attr.aria-label]="'Switch theme'" matTooltip="Toggle theme">
            <mat-icon>{{ themeIcon() }}</mat-icon>
          </button>
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
        <div class="content-area" [@routeAnimation]="getRouteAnimationData()">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
    <button mat-fab class="global-fab" (click)="openQuickExpense()" aria-label="Log expense">
      <mat-icon>add</mat-icon>
    </button>

    @if (isPhone()) {
      <nav class="bottom-tabs" role="navigation" aria-label="Main navigation">
        <a class="tab-item" routerLink="/dashboard" routerLinkActive="tab-active" [routerLinkActiveOptions]="{exact: true}">
          <mat-icon>dashboard</mat-icon>
          <span>Home</span>
        </a>
        <a class="tab-item" routerLink="/expenses" routerLinkActive="tab-active">
          <mat-icon>swap_horiz</mat-icon>
          <span>Transactions</span>
        </a>
        <a class="tab-item" routerLink="/trading" routerLinkActive="tab-active">
          <mat-icon>candlestick_chart</mat-icon>
          <span>Trading</span>
        </a>
        <a class="tab-item" routerLink="/health" routerLinkActive="tab-active">
          <mat-icon>monitoring</mat-icon>
          <span>Health</span>
        </a>
        <button class="tab-item" (click)="sidenav.toggle()" aria-label="More navigation">
          <mat-icon>more_horiz</mat-icon>
          <span>More</span>
        </button>
      </nav>
    }

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

    .nav-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-sidebar-text);
      opacity: 0.6;
      padding: 16px 16px 8px;
      user-select: none;
      cursor: pointer;
      transition: opacity 0.15s;
      min-height: 40px;
    }

    .nav-section-header:hover {
      opacity: 0.9;
    }

    .nav-section-header:first-child {
      padding-top: 6px;
    }

    .section-label { flex: 1; }

    .section-chevron {
      font-size: 18px;
      width: 18px;
      height: 18px;
      transition: transform 0.2s ease;
      transform: rotate(-90deg);
      opacity: 0.7;
    }

    .nav-section-header.expanded .section-chevron {
      transform: rotate(0deg);
    }

    .nav-section-items {
      animation: slideDown 0.15s ease-out;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
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
      position: sticky;
      top: 0;
      z-index: 10;
    }

    :host-context(.dark) .app-toolbar {
      background: rgba(28, 28, 30, 0.82) !important;
    }

    :host-context(.dark) .bottom-tabs {
      background: rgba(28, 28, 30, 0.88);
      border-top-color: rgba(255, 255, 255, 0.06);
    }

    .theme-toggle {
      margin-right: 4px;
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
      position: relative;
      padding: 24px 32px;
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
      .search-trigger .search-hint,
      .search-trigger .search-kbd {
        display: none;
      }
      .search-trigger {
        min-width: 36px !important;
        padding: 4px 8px !important;
        margin-right: 4px;
      }
    }

    .mobile-brand {
      display: none;
    }

    @media (max-width: 599px) {
      .mobile-brand {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(0,122,255,0.15) 0%, rgba(88,86,214,0.15) 100%);
        margin-right: 10px;
        text-decoration: none;
        -webkit-tap-highlight-color: transparent;
      }
      .mobile-brand-icon {
        font-size: 22px !important;
        width: 22px !important;
        height: 22px !important;
        color: var(--color-primary);
      }
      .content-area {
        padding: 20px 16px;
        padding-bottom: 100px;
      }
      .app-toolbar {
        height: 56px;
        padding: 0 14px !important;
      }
      .app-toolbar button[mat-icon-button] {
        width: 44px;
        height: 44px;
      }
      .app-toolbar button[mat-icon-button] mat-icon {
        font-size: 24px !important;
        width: 24px !important;
        height: 24px !important;
      }
      .toolbar-title {
        font-size: 1.2rem !important;
        font-weight: 700 !important;
      }
    }

    .global-fab {
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 100;
      width: 56px !important;
      height: 56px !important;
      background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%) !important;
      color: #fff !important;
      box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4), var(--shadow-lg) !important;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .global-fab mat-icon {
      font-size: 28px !important;
      width: 28px !important;
      height: 28px !important;
    }
    .global-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 8px 28px rgba(0, 122, 255, 0.5), var(--shadow-xl) !important;
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

    .bottom-tabs {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 72px;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px) saturate(180%);
      border-top: 0.5px solid var(--color-border);
    }

    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      flex: 1;
      padding: 8px 0;
      text-decoration: none;
      color: var(--color-text-muted);
      border: none;
      background: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: color var(--transition-fast);
    }

    .tab-item mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .tab-item span {
      font-family: var(--font-primary);
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.01em;
    }

    .tab-item.tab-active {
      color: var(--color-primary);
    }

    @media (max-width: 599px) {
      .global-fab {
        bottom: calc(72px + env(safe-area-inset-bottom, 0px) + 16px);
        right: 20px;
        width: 56px !important;
        height: 56px !important;
      }
      .global-fab mat-icon {
        font-size: 26px !important;
        width: 26px !important;
        height: 26px !important;
      }
      .content-area {
        padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px) + 20px) !important;
      }
      .nav-list {
        padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px) + 20px);
      }
    }
  `]
})
export class NavShellComponent {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(CommandPaletteComponent) commandPalette!: CommandPaletteComponent;

  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private contexts = inject(ChildrenOutletContexts);
  private authService = inject(AuthService);
  private expenseService = inject(DailyExpenseService);
  private notify = inject(NotificationService);
  private themeService = inject(ThemeService);
  private dialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  private healthMetricService = inject(HealthMetricService);

  isMobile = signal(false);
  isPhone = signal(false);
  pageTitle = signal('Dashboard');
  expandedSections = signal<string[]>(['finance', 'trading', 'health']);
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
    '/health': 'Health Dashboard',
    '/health/metrics': 'Vitals & Metrics',
    '/health/blood-work': 'Blood Work',
    '/health/plans': 'Workout Plans',
    '/health/workout': "Today's Workout",
    '/health/progress': 'Progress & PRs',
    '/trading': 'Trading Hub',
    '/trading/premarket': 'Pre-Market Plan',
    '/trading/checklist': 'Trade Checklist',
    '/trading/journal': 'Trade Journal',
    '/trading/review': 'Daily Review',
    '/trading/setups': 'My Setups',
    '/trading/playbook': 'Playbook & Rules',
    '/trading/weekly': 'Weekly Summary',
    '/admin': 'User Management',
    '/admin/users': 'User Management',
  };

  constructor() {
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe(result => {
      this.isMobile.set(result.matches);
    });

    this.breakpointObserver.observe(['(max-width: 599px)']).subscribe(result => {
      this.isPhone.set(result.matches);
    });

    const initialUrl = this.router.url;
    this.pageTitle.set(this.pageTitles[initialUrl] ?? this.pageTitles['/' + initialUrl.split('/')[1]] ?? 'Pulse');

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(event => {
      const url = event.urlAfterRedirects;
      const path = '/' + url.split('/')[1];
      this.pageTitle.set(this.pageTitles[url] ?? this.pageTitles[path] ?? 'Pulse');
      this.expandSectionForRoute(url);
      if (this.isMobile() && this.sidenav) {
        this.sidenav.close();
      }
    });
  }

  onNavClick(): void {
    if (this.isMobile()) {
      this.sidenav.close();
    }
  }

  toggleSection(section: string): void {
    const current = this.expandedSections();
    if (current.includes(section)) {
      this.expandedSections.set(current.filter(s => s !== section));
    } else {
      this.expandedSections.set([...current, section]);
    }
  }

  private expandSectionForRoute(url: string): void {
    let section = 'finance';
    if (url.startsWith('/trading')) section = 'trading';
    else if (url.startsWith('/health')) section = 'health';
    else if (url.startsWith('/admin')) section = 'admin';

    const current = this.expandedSections();
    if (!current.includes(section)) {
      this.expandedSections.set([...current, section]);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  openQuickExpense(): void {
    if (this.isMobile()) {
      import('./txn-type-sheet.component').then(m => {
        const sheetRef = this.bottomSheet.open(m.TxnTypeSheetComponent);
        sheetRef.afterDismissed().subscribe((type: string | undefined) => {
          if (type === 'LogMetric') {
            this.openMetricDialog();
          } else if (type) {
            this.openExpenseDialog(type);
          }
        });
      });
    } else {
      this.openExpenseDialog();
    }
  }

  private openExpenseDialog(preselectedType?: string): void {
    import('../features/expenses/add-expense-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddExpenseDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: { expense: null, preselectedType }
      });
      ref.afterClosed().subscribe((result: any) => {
        if (!result) return;
        if (result.splits) {
          this.expenseService.createSplit(result.splits).subscribe({
            next: () => this.notify.success('Transaction saved'),
            error: (err) => this.notify.error(err.error?.message || 'Failed to save transaction')
          });
        } else {
          this.expenseService.create(result).subscribe({
            next: () => this.notify.success('Transaction saved'),
            error: (err) => this.notify.error(err.error?.message || 'Failed to save transaction')
          });
        }
      });
    });
  }

  private openMetricDialog(): void {
    import('../features/health/add-metric-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddMetricDialogComponent, {
        width: '420px',
        maxWidth: '95vw'
      });
      ref.afterClosed().subscribe((result: any) => {
        if (result) {
          this.healthMetricService.create(result).subscribe({
            next: () => this.notify.success('Metric logged'),
            error: () => this.notify.error('Failed to save metric')
          });
        }
      });
    });
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  themeIcon = computed(() => {
    const mode = this.themeService.theme();
    if (mode === 'dark') return 'dark_mode';
    if (mode === 'light') return 'light_mode';
    return 'brightness_auto';
  });

  openPalette(): void {
    this.commandPalette.open();
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.url.toString() ?? '';
  }
}
