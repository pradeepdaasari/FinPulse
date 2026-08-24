import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'setup',
    loadComponent: () => import('./features/setup/setup-wizard.component').then(m => m.SetupWizardComponent),
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
  }
];
