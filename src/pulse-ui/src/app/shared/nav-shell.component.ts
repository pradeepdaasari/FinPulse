import { Component, computed, inject, signal, ViewChild, OnInit, OnDestroy, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, ChildrenOutletContexts } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { filter } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { DailyExpenseService } from '../core/services/daily-expense.service';
import { NotificationService } from '../core/services/notification.service';
import { ThemeService } from '../core/services/theme.service';
import { HealthMetricService } from '../core/services/health-metric.service';
import { TradingService } from '../core/services/trading.service';
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
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    CommandPaletteComponent
  ],
  animations: [routeFadeAnimation],
  template: `
    <mat-sidenav-container class="shell-container" [hasBackdrop]="isMobile()" (backdropClick)="sidenav.close()">
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

        <div class="ios-nav-scroll">
          <!-- Finance Section -->
          <div class="ios-section">
            <button class="ios-section-header" [class.expanded]="expandedSections().includes('finance')" (click)="toggleSection('finance')">
              <span class="section-label">Finance</span>
              <mat-icon class="section-chevron">expand_more</mat-icon>
            </button>
            @if (expandedSections().includes('finance')) {
              <div class="ios-section-group">
                <a class="ios-nav-item" routerLink="/dashboard" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-blue"><mat-icon>dashboard</mat-icon></span>
                  <span class="ios-nav-label">Dashboard</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/loans" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-indigo"><mat-icon>account_balance</mat-icon></span>
                  <span class="ios-nav-label">My Loans</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/cards" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-orange"><mat-icon>credit_card</mat-icon></span>
                  <span class="ios-nav-label">My Cards</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/accounts" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-green"><mat-icon>savings</mat-icon></span>
                  <span class="ios-nav-label">Bank Accounts</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/expenses" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-teal"><mat-icon>swap_horiz</mat-icon></span>
                  <span class="ios-nav-label">Transactions</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/budget" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-purple"><mat-icon>pie_chart</mat-icon></span>
                  <span class="ios-nav-label">Budget</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/recurring" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-amber"><mat-icon>repeat</mat-icon></span>
                  <span class="ios-nav-label">Recurring</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/goals" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-red"><mat-icon>flag</mat-icon></span>
                  <span class="ios-nav-label">Goals</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/categories" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-pink"><mat-icon>category</mat-icon></span>
                  <span class="ios-nav-label">Categories</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/strategies" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-green"><mat-icon>trending_down</mat-icon></span>
                  <span class="ios-nav-label">Payoff Strategies</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/simulator" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-cyan"><mat-icon>science</mat-icon></span>
                  <span class="ios-nav-label">What-If Simulator</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item last" routerLink="/money-movements" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-cyan"><mat-icon>sync_alt</mat-icon></span>
                  <span class="ios-nav-label">Money Flow</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
              </div>
            }
          </div>

          <!-- Trading Section -->
          <div class="ios-section">
            <button class="ios-section-header" [class.expanded]="expandedSections().includes('trading')" (click)="toggleSection('trading')">
              <span class="section-label">Trading</span>
              <mat-icon class="section-chevron">expand_more</mat-icon>
            </button>
            @if (expandedSections().includes('trading')) {
              <div class="ios-section-group">
                <a class="ios-nav-item" routerLink="/trading" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-purple"><mat-icon>candlestick_chart</mat-icon></span>
                  <span class="ios-nav-label">Dashboard</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/analytics" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-teal"><mat-icon>insights</mat-icon></span>
                  <span class="ios-nav-label">Analytics</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/goals" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-green"><mat-icon>flag</mat-icon></span>
                  <span class="ios-nav-label">Goals</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/premarket" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-amber"><mat-icon>wb_twilight</mat-icon></span>
                  <span class="ios-nav-label">Pre-Market</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/premarket/template" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-amber"><mat-icon>auto_fix_high</mat-icon></span>
                  <span class="ios-nav-label">Pre-Market Template</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/checklist" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-green"><mat-icon>checklist</mat-icon></span>
                  <span class="ios-nav-label">Trade Checklist</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/journal" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-blue"><mat-icon>auto_stories</mat-icon></span>
                  <span class="ios-nav-label">Trade Journal</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/calendar" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-red"><mat-icon>calendar_month</mat-icon></span>
                  <span class="ios-nav-label">Calendar</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/review" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-orange"><mat-icon>grading</mat-icon></span>
                  <span class="ios-nav-label">Daily Review</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/setups" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-teal"><mat-icon>tune</mat-icon></span>
                  <span class="ios-nav-label">My Setups</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/trading/playbook" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-indigo"><mat-icon>menu_book</mat-icon></span>
                  <span class="ios-nav-label">Playbook & Rules</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item last" routerLink="/trading/weekly" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-cyan"><mat-icon>analytics</mat-icon></span>
                  <span class="ios-nav-label">Weekly Summary</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
              </div>
            }
          </div>

          <!-- Health Section -->
          <div class="ios-section">
            <button class="ios-section-header" [class.expanded]="expandedSections().includes('health')" (click)="toggleSection('health')">
              <span class="section-label">Health & Fitness</span>
              <mat-icon class="section-chevron">expand_more</mat-icon>
            </button>
            @if (expandedSections().includes('health')) {
              <div class="ios-section-group">
                <a class="ios-nav-item" routerLink="/health" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-red"><mat-icon>monitoring</mat-icon></span>
                  <span class="ios-nav-label">Health Dashboard</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/health/metrics" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-green"><mat-icon>straighten</mat-icon></span>
                  <span class="ios-nav-label">Vitals & Metrics</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/health/blood-work" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-pink"><mat-icon>bloodtype</mat-icon></span>
                  <span class="ios-nav-label">Blood Work</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/health/plans" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-orange"><mat-icon>fitness_center</mat-icon></span>
                  <span class="ios-nav-label">Workout Plans</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item" routerLink="/health/workout" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-blue"><mat-icon>exercise</mat-icon></span>
                  <span class="ios-nav-label">Today's Workout</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
                <a class="ios-nav-item last" routerLink="/health/progress" routerLinkActive="active-link" (click)="onNavClick()">
                  <span class="ios-icon-pill ic-amber"><mat-icon>emoji_events</mat-icon></span>
                  <span class="ios-nav-label">Progress & PRs</span>
                  <mat-icon class="ios-chevron">chevron_right</mat-icon>
                </a>
              </div>
            }
          </div>

          @if (isAdmin()) {
            <div class="ios-section">
              <button class="ios-section-header" [class.expanded]="expandedSections().includes('admin')" (click)="toggleSection('admin')">
                <span class="section-label">Admin</span>
                <mat-icon class="section-chevron">expand_more</mat-icon>
              </button>
              @if (expandedSections().includes('admin')) {
                <div class="ios-section-group">
                  <a class="ios-nav-item last" routerLink="/admin/users" routerLinkActive="active-link" (click)="onNavClick()">
                    <span class="ios-icon-pill ic-orange"><mat-icon>admin_panel_settings</mat-icon></span>
                    <span class="ios-nav-label">User Management</span>
                    <mat-icon class="ios-chevron">chevron_right</mat-icon>
                  </a>
                </div>
              }
            </div>
          }
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        @if (routeLoading()) {
          <div class="route-progress-bar"><div class="route-progress-fill"></div></div>
        }
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
          <button mat-button class="search-trigger" (click)="openPalette()" aria-label="Search">
            <mat-icon>search</mat-icon>
            <span class="search-hint">Search</span>
            <span class="search-kbd">&#8984;K</span>
          </button>
          <a class="user-info" routerLink="/settings" matTooltip="Settings & Profile">
            <mat-icon class="user-avatar">account_circle</mat-icon>
            <span class="user-email">{{ userEmail() }}</span>
          </a>
          <button mat-icon-button (click)="logout()" aria-label="Logout" matTooltip="Logout">
            <mat-icon>logout</mat-icon>
          </button>
        </mat-toolbar>
        <div class="content-area" [@routeAnimation]="getRouteAnimationData()">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
    <button mat-fab class="global-fab" [class.kb-hidden]="keyboardOpen()" [class.fab-hidden]="hideGlobalFab()"
      [matMenuTriggerFor]="isPhone() ? null : fabMenu"
      (click)="isPhone() && openQuickExpense()"
      aria-label="Quick actions">
      <mat-icon>add</mat-icon>
    </button>
    <mat-menu #fabMenu="matMenu" class="fab-menu" yPosition="above" xPosition="before">
      <button mat-menu-item (click)="openExpenseDialog('Expense')">
        <mat-icon class="menu-icon expense">remove_circle_outline</mat-icon>
        <span>Expense</span>
      </button>
      <button mat-menu-item (click)="openExpenseDialog('Income')">
        <mat-icon class="menu-icon income">add_circle_outline</mat-icon>
        <span>Income</span>
      </button>
      <button mat-menu-item (click)="openExpenseDialog('Transfer')">
        <mat-icon class="menu-icon transfer">swap_horiz</mat-icon>
        <span>Transfer</span>
      </button>
      <button mat-menu-item (click)="openExpenseDialog('CardPayment')">
        <mat-icon class="menu-icon card">credit_card</mat-icon>
        <span>Card Payment</span>
      </button>
      <button mat-menu-item (click)="openExpenseDialog('LoanPayment')">
        <mat-icon class="menu-icon loan">account_balance</mat-icon>
        <span>Loan Payment</span>
      </button>
      <button mat-menu-item (click)="openExpenseDialog('Refund')">
        <mat-icon class="menu-icon refund">undo</mat-icon>
        <span>Refund</span>
      </button>
      <div class="fab-menu-divider"></div>
      <button mat-menu-item (click)="openTradeDialog()">
        <mat-icon class="menu-icon trade">candlestick_chart</mat-icon>
        <span>Log Trade</span>
      </button>
      <button mat-menu-item (click)="openMetricDialog()">
        <mat-icon class="menu-icon metric">monitor_heart</mat-icon>
        <span>Log Metric</span>
      </button>
    </mat-menu>

    @if (isPhone()) {
      <nav class="bottom-tabs" [class.kb-hidden]="keyboardOpen()" role="navigation" aria-label="Main navigation">
        <a class="tab-item" [class.tab-active]="activeModule() === 'finance' && !isExpensesRoute()" routerLink="/dashboard">
          <mat-icon class="tab-ic-blue">dashboard</mat-icon>
          <span>Home</span>
        </a>
        <a class="tab-item" [class.tab-active]="isExpensesRoute()" routerLink="/expenses">
          <mat-icon class="tab-ic-teal">swap_horiz</mat-icon>
          <span>Transactions</span>
        </a>
        <a class="tab-item" [class.tab-active]="activeModule() === 'trading'" routerLink="/trading">
          <mat-icon class="tab-ic-purple">candlestick_chart</mat-icon>
          <span>Trading</span>
        </a>
        <a class="tab-item" [class.tab-active]="activeModule() === 'health'" routerLink="/health">
          <mat-icon class="tab-ic-red">monitoring</mat-icon>
          <span>Health</span>
        </a>
        <button class="tab-item" (click)="sidenav.toggle()" aria-label="More navigation">
          <mat-icon class="tab-ic-gray">more_horiz</mat-icon>
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
      width: 280px;
      background: var(--color-bg);
      border-right: none;
    }

    .sidenav-header {
      padding: 20px 20px 12px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      cursor: pointer;
      transition: opacity var(--transition-fast);
    }
    @media (hover: hover) { .brand:hover { opacity: 0.8; } }

    .brand-icon {
      color: var(--color-primary);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .brand-name {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', var(--font-primary), sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
      letter-spacing: -0.03em;
    }

    /* ─── iOS Settings-style nav ─── */
    .ios-nav-scroll {
      padding: 0 16px 20px;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      height: calc(100vh - 60px);
    }

    .ios-section {
      margin-bottom: 4px;
    }

    .ios-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 14px 4px 6px;
      border: none;
      background: transparent;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-primary), sans-serif;
    }

    .ios-section-header .section-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .ios-section-header .section-chevron {
      font-size: 16px;
      width: 16px;
      height: 16px;
      transition: transform 0.25s ease;
      transform: rotate(-90deg);
      color: var(--color-text-muted);
    }

    .ios-section-header.expanded .section-chevron {
      transform: rotate(0deg);
    }

    .ios-section-group {
      background: var(--color-surface);
      border-radius: 12px;
      overflow: hidden;
      animation: iosSlideDown 0.2s ease-out;
    }

    @keyframes iosSlideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .ios-nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      text-decoration: none;
      color: var(--color-text);
      transition: background 0.12s ease;
      -webkit-tap-highlight-color: transparent;
      position: relative;
      min-height: 44px;
      box-sizing: border-box;
      cursor: pointer;
    }

    .ios-nav-item:not(.last)::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 46px;
      right: 0;
      height: 0.5px;
      background: var(--color-border);
    }

    .ios-nav-item:active {
      background: var(--color-surface-secondary);
    }

    @media (hover: hover) {
      .ios-nav-item:hover {
        background: var(--color-surface-secondary);
      }
    }

    .ios-nav-item.active-link {
      background: rgba(0, 122, 255, 0.08);
    }

    .ios-nav-item.active-link .ios-nav-label {
      color: var(--color-primary);
      font-weight: 600;
    }

    .ios-nav-item.active-link .ios-chevron {
      color: var(--color-primary);
    }

    .ios-icon-pill {
      width: 30px;
      height: 30px;
      min-width: 30px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ios-icon-pill mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #fff;
    }

    .ios-icon-pill.ic-blue { background: #007AFF; }
    .ios-icon-pill.ic-indigo { background: #5856D6; }
    .ios-icon-pill.ic-purple { background: #AF52DE; }
    .ios-icon-pill.ic-pink { background: #FF2D55; }
    .ios-icon-pill.ic-red { background: #FF3B30; }
    .ios-icon-pill.ic-orange { background: #FF9500; }
    .ios-icon-pill.ic-amber { background: #FFCC00; }
    .ios-icon-pill.ic-amber mat-icon { color: #1D1D1F; }
    .ios-icon-pill.ic-green { background: #34C759; }
    .ios-icon-pill.ic-teal { background: #5AC8FA; }
    .ios-icon-pill.ic-cyan { background: #32ADE6; }

    .ios-nav-label {
      flex: 1;
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', var(--font-primary), sans-serif;
      font-size: 0.9375rem;
      font-weight: 400;
      color: var(--color-text);
      letter-spacing: -0.01em;
    }

    .ios-chevron {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--color-text-muted);
      opacity: 0.5;
    }

    .route-progress-bar {
      position: fixed; top: 0; left: 0; right: 0; height: 3px;
      z-index: 1100; background: transparent; overflow: hidden;
    }
    .route-progress-fill {
      height: 100%; width: 30%;
      background: linear-gradient(90deg, #007AFF, #5AC8FA);
      border-radius: 0 2px 2px 0;
      animation: routeProgress 1.5s ease-in-out infinite;
    }
    @keyframes routeProgress {
      0% { transform: translateX(-100%); width: 30%; }
      50% { transform: translateX(100%); width: 60%; }
      100% { transform: translateX(300%); width: 30%; }
    }
    .app-toolbar {
      background: var(--color-surface) !important;
      color: var(--color-text) !important;
      border-bottom: 0.5px solid var(--color-border);
      box-shadow: none;
      height: 52px;
      position: sticky;
      top: 0;
      z-index: 10;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
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
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s;
    }
    .user-info:hover { background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-secondary)); }
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

    :host ::ng-deep .mat-sidenav-content {
      scrollbar-gutter: stable;
      overscroll-behavior-y: contain;
    }

    .content-area {
      position: relative;
      padding: 24px 32px;
      min-height: calc(100vh - 52px);
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
      .shell-container, :host ::ng-deep .mat-sidenav-content {
        overflow-x: hidden;
      }
      .sidenav {
        width: 300px;
        background: var(--color-bg);
        border-right: none;
        box-shadow: 0 0 40px rgba(0,0,0,0.2);
        z-index: 1002 !important;
      }
      .mobile-brand {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: linear-gradient(135deg, rgba(0,122,255,0.12) 0%, rgba(88,86,214,0.12) 100%);
        margin-right: 8px;
        text-decoration: none;
        -webkit-tap-highlight-color: transparent;
      }
      .mobile-brand-icon {
        font-size: 20px !important;
        width: 20px !important;
        height: 20px !important;
        color: var(--color-primary);
      }
      .content-area {
        padding: 14px 14px;
        padding-bottom: 100px;
      }
      .app-toolbar {
        height: 48px;
        padding: 0 12px !important;
        background: var(--color-surface) !important;
        backdrop-filter: none;
      }
      .app-toolbar button[mat-icon-button] {
        width: 40px;
        height: 40px;
      }
      .app-toolbar button[mat-icon-button] mat-icon {
        font-size: 22px !important;
        width: 22px !important;
        height: 22px !important;
      }
      .toolbar-title {
        font-size: 1.1rem !important;
        font-weight: 700 !important;
        letter-spacing: -0.02em;
      }
    }

    .global-fab {
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 100;
      width: 52px !important;
      height: 52px !important;
      background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%) !important;
      color: #fff !important;
      box-shadow: 0 4px 16px rgba(0, 122, 255, 0.35) !important;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .global-fab mat-icon {
      font-size: 26px !important;
      width: 26px !important;
      height: 26px !important;
    }
    @media (hover: hover) {
      .global-fab:hover {
        transform: scale(1.06);
        box-shadow: 0 6px 24px rgba(0, 122, 255, 0.45) !important;
      }
    }
    .global-fab:active {
      transform: scale(0.92);
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25) !important;
    }
    .global-fab.fab-hidden { display: none !important; }
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

    .fab-menu-divider { height: 1px; background: var(--color-border); margin: 4px 16px; }
    .menu-icon.expense { color: var(--color-danger); }
    .menu-icon.income { color: var(--color-success); }
    .menu-icon.transfer { color: var(--color-primary); }
    .menu-icon.card { color: #5856D6; }
    .menu-icon.loan { color: #007AFF; }
    .menu-icon.refund { color: var(--color-warning); }
    .menu-icon.trade { color: #5856D6; }
    .menu-icon.metric { color: #d32f2f; }

    .kb-hidden {
      transform: translateY(100%);
      pointer-events: none;
      opacity: 0;
      transition: transform 0.2s ease, opacity 0.15s ease;
    }

    .bottom-tabs {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      display: flex;
      align-items: flex-start;
      justify-content: space-around;
      height: calc(52px + env(safe-area-inset-bottom, 0px));
      padding-top: 6px;
      padding-bottom: env(safe-area-inset-bottom, 0px);
      box-sizing: border-box;
      background: var(--color-surface);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border-top: 0.5px solid var(--color-border);
    }

    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      flex: 1;
      padding: 4px 0;
      text-decoration: none;
      color: #8E8E93;
      border: none;
      background: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: color var(--transition-fast), transform 0.08s ease;
      position: relative;

      &:active {
        transform: scale(0.88);
      }
    }

    .tab-item mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .tab-item span {
      font-family: var(--font-primary);
      font-size: 0.65rem;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .tab-item .tab-ic-blue { color: #007AFF; }
    .tab-item .tab-ic-teal { color: #5AC8FA; }
    .tab-item .tab-ic-purple { color: #AF52DE; }
    .tab-item .tab-ic-red { color: #FF3B30; }
    .tab-item .tab-ic-gray { color: #8E8E93; }

    .tab-item.tab-active {
      color: var(--color-primary);
    }
    .tab-item.tab-active mat-icon {
      color: var(--color-primary) !important;
    }
    .tab-item.tab-active span {
      font-weight: 700;
      color: var(--color-primary);
    }
    .tab-item.tab-active::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48px;
      height: 30px;
      background: rgba(0, 122, 255, 0.12);
      border-radius: 14px;
    }

    @media (max-width: 599px) {
      .global-fab {
        bottom: calc(52px + env(safe-area-inset-bottom, 0px) + 16px);
        right: 20px;
        width: 52px !important;
        height: 52px !important;
      }
      .global-fab mat-icon {
        font-size: 24px !important;
        width: 24px !important;
        height: 24px !important;
      }
      .content-area {
        padding-bottom: calc(52px + env(safe-area-inset-bottom, 0px) + 20px) !important;
      }
      .ios-nav-scroll {
        padding-bottom: calc(52px + env(safe-area-inset-bottom, 0px) + 20px);
      }
    }
  `]
})
export class NavShellComponent implements OnInit, OnDestroy {
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
  private tradingService = inject(TradingService);

  isMobile = signal(false);
  isPhone = signal(false);
  keyboardOpen = signal(false);
  routeLoading = signal(false);
  private initialViewportHeight = 0;
  private viewportHandler = () => this.checkKeyboard();
  pageTitle = signal('Dashboard');
  expandedSections = signal<string[]>(['finance', 'trading', 'health']);
  activeModule = signal<string>('finance');
  private currentUrl = signal('/dashboard');
  isExpensesRoute = computed(() => this.currentUrl().startsWith('/expenses'));
  hideGlobalFab = computed(() => {
    const url = this.currentUrl();
    return url === '/loans' || url === '/cards' || url === '/accounts';
  });
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
    '/money-movements': 'Money Flow',
    '/health': 'Health Dashboard',
    '/health/metrics': 'Vitals & Metrics',
    '/health/blood-work': 'Blood Work',
    '/health/plans': 'Workout Plans',
    '/health/workout': "Today's Workout",
    '/health/progress': 'Progress & PRs',
    '/trading': 'Dashboard',
    '/trading/analytics': 'Trading Analytics',
    '/trading/goals': 'Trading Goals',
    '/trading/premarket': 'Pre-Market Plan',
    '/trading/premarket/template': 'Pre-Market Template',
    '/trading/checklist': 'Trade Checklist',
    '/trading/journal': 'Trade Journal',
    '/trading/calendar': 'Trading Calendar',
    '/trading/review': 'Daily Review',
    '/trading/setups': 'My Setups',
    '/trading/playbook': 'Playbook & Rules',
    '/trading/weekly': 'Weekly Summary',
    '/settings': 'Settings',
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
    this.expandSectionForRoute(initialUrl);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.routeLoading.set(true);
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.routeLoading.set(false);
      }
    });

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

  private swipeStartX = 0;
  private swipeStartY = 0;
  private swiping = false;
  private touchStartHandler = (e: TouchEvent) => this.onTouchStart(e);
  private touchMoveHandler = (e: TouchEvent) => this.onTouchMove(e);
  private touchEndHandler = () => this.onTouchEnd();

  ngOnInit(): void {
    this.initialViewportHeight = window.visualViewport?.height ?? window.innerHeight;
    window.visualViewport?.addEventListener('resize', this.viewportHandler);
    document.addEventListener('touchstart', this.touchStartHandler, { passive: true });
    document.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
    document.addEventListener('touchend', this.touchEndHandler, { passive: true });
  }

  ngOnDestroy(): void {
    window.visualViewport?.removeEventListener('resize', this.viewportHandler);
    document.removeEventListener('touchstart', this.touchStartHandler);
    document.removeEventListener('touchmove', this.touchMoveHandler);
    document.removeEventListener('touchend', this.touchEndHandler);
  }

  private onTouchStart(e: TouchEvent): void {
    if (!this.isMobile()) return;
    const touch = e.touches[0];
    this.swipeStartX = touch.clientX;
    this.swipeStartY = touch.clientY;
    this.swiping = this.sidenav?.opened ? true : touch.clientX < 30;
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.swiping || !this.isMobile()) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.swipeStartX;
    const dy = Math.abs(touch.clientY - this.swipeStartY);
    if (dy > Math.abs(dx)) {
      this.swiping = false;
      return;
    }
    if (!this.sidenav?.opened && dx > 60) {
      this.swiping = false;
      this.sidenav.open();
    } else if (this.sidenav?.opened && dx < -60) {
      this.swiping = false;
      this.sidenav.close();
    }
  }

  private onTouchEnd(): void {
    this.swiping = false;
  }

  private checkKeyboard(): void {
    if (!window.visualViewport) return;
    const shrink = this.initialViewportHeight - window.visualViewport.height;
    this.keyboardOpen.set(shrink > 150);
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

    this.activeModule.set(section);
    this.currentUrl.set(url);

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
          if (type === 'LogTrade') {
            this.openTradeDialog();
          } else if (type === 'LogMetric') {
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

  openExpenseDialog(preselectedType?: string): void {
    import('../features/finance/expenses/add-expense-dialog.component').then(m => {
      const ref = this.dialog.open(m.AddExpenseDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        data: { expense: null, preselectedType }
      });
      ref.afterClosed().subscribe((result: any) => {
        if (!result) return;
        if (result.loanPayment) {
          this.notify.success(`${result.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} payment recorded for ${result.debtName}`);
          return;
        }
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

  openMetricDialog(): void {
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

  openTradeDialog(): void {
    this.tradingService.getSetups().subscribe({
      next: (setups) => {
        import('../features/trading/trade-entry-dialog.component').then(m => {
          const ref = this.dialog.open(m.TradeEntryDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: { trade: null, setups }
          });
          ref.afterClosed().subscribe((result: any) => {
            if (result) this.notify.success('Trade logged');
          });
        });
      },
      error: () => this.notify.error('Failed to load setups')
    });
  }

  openPalette(): void {
    this.commandPalette.open();
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.url.toString() ?? '';
  }
}
