import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'loans',
    loadComponent: () => import('./features/loans/loan-list.component').then(m => m.LoanListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'loans/:id',
    loadComponent: () => import('./features/loans/loan-detail.component').then(m => m.LoanDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cards',
    loadComponent: () => import('./features/credit-cards/card-list.component').then(m => m.CardListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cards/:id',
    loadComponent: () => import('./features/credit-cards/card-detail.component').then(m => m.CardDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'strategies',
    loadComponent: () => import('./features/strategies/strategy-comparison.component').then(m => m.StrategyComparisonComponent),
    canActivate: [authGuard]
  },
  {
    path: 'simulator',
    loadComponent: () => import('./features/simulator/what-if.component').then(m => m.WhatIfComponent),
    canActivate: [authGuard]
  },
  {
    path: 'budget',
    loadComponent: () => import('./features/budget/budget-page.component').then(m => m.BudgetPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'accounts',
    loadComponent: () => import('./features/bank-accounts/account-list.component').then(m => m.AccountListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'accounts/:id',
    loadComponent: () => import('./features/bank-accounts/account-detail.component').then(m => m.AccountDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/expenses/expenses-page.component').then(m => m.ExpensesPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/category-page.component').then(m => m.CategoryPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'payments',
    loadComponent: () => import('./features/payments/payment-history.component').then(m => m.PaymentHistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'recurring',
    loadComponent: () => import('./features/recurring/recurring-page.component').then(m => m.RecurringPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'goals',
    loadComponent: () => import('./features/goals/goals-page.component').then(m => m.GoalsPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'health',
    loadComponent: () => import('./features/health/health-dashboard.component').then(m => m.HealthDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'health/metrics',
    loadComponent: () => import('./features/health/metrics-log.component').then(m => m.MetricsLogComponent),
    canActivate: [authGuard]
  },
  {
    path: 'health/blood-work',
    loadComponent: () => import('./features/health/blood-work-page.component').then(m => m.BloodWorkPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'health/plans',
    loadComponent: () => import('./features/health/workout-plans.component').then(m => m.WorkoutPlansComponent),
    canActivate: [authGuard]
  },
  {
    path: 'health/workout',
    loadComponent: () => import('./features/health/today-workout.component').then(m => m.TodayWorkoutComponent),
    canActivate: [authGuard]
  },
  {
    path: 'health/progress',
    loadComponent: () => import('./features/health/progress.component').then(m => m.ProgressComponent),
    canActivate: [authGuard]
  },
  // Trading
  {
    path: 'trading',
    loadComponent: () => import('./features/trading/trading-dashboard.component').then(m => m.TradingDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'trading/premarket',
    loadComponent: () => import('./features/trading/premarket.component').then(m => m.PremarketComponent),
    canActivate: [authGuard]
  },
  {
    path: 'trading/setups',
    loadComponent: () => import('./features/trading/setups.component').then(m => m.SetupsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'trading/checklist',
    loadComponent: () => import('./features/trading/checklist.component').then(m => m.ChecklistComponent),
    canActivate: [authGuard]
  },
  {
    path: 'trading/journal',
    loadComponent: () => import('./features/trading/journal.component').then(m => m.JournalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'trading/calendar',
    loadComponent: () => import('./features/trading/trading-calendar.component').then(m => m.TradingCalendarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'trading/review',
    loadComponent: () => import('./features/trading/review.component').then(m => m.ReviewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'trading/playbook',
    loadComponent: () => import('./features/trading/playbook.component').then(m => m.PlaybookComponent),
    canActivate: [authGuard]
  },
  {
    path: 'trading/weekly',
    loadComponent: () => import('./features/trading/weekly-summary.component').then(m => m.WeeklySummaryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard, adminGuard]
  }
];
