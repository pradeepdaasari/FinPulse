import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'setup',
    loadComponent: () => import('./features/setup/setup-wizard.component').then(m => m.SetupWizardComponent)
  },
  {
    path: 'loans',
    loadComponent: () => import('./features/loans/loan-list.component').then(m => m.LoanListComponent)
  },
  {
    path: 'loans/:id',
    loadComponent: () => import('./features/loans/loan-detail.component').then(m => m.LoanDetailComponent)
  },
  {
    path: 'cards',
    loadComponent: () => import('./features/credit-cards/card-list.component').then(m => m.CardListComponent)
  },
  {
    path: 'cards/:id',
    loadComponent: () => import('./features/credit-cards/card-detail.component').then(m => m.CardDetailComponent)
  },
  {
    path: 'strategies',
    loadComponent: () => import('./features/strategies/strategy-comparison.component').then(m => m.StrategyComparisonComponent)
  },
  {
    path: 'simulator',
    loadComponent: () => import('./features/simulator/what-if.component').then(m => m.WhatIfComponent)
  },
  {
    path: 'budget',
    loadComponent: () => import('./features/budget/budget-allocation.component').then(m => m.BudgetAllocationComponent)
  },
  {
    path: 'payments',
    loadComponent: () => import('./features/payments/payment-history.component').then(m => m.PaymentHistoryComponent)
  }
];
