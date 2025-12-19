import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TransactionsComponent } from './pages/transactions/transactions.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'reports', component: ReportsComponent },

      { path: 'transactions', loadComponent: () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'categories', component: CategoriesComponent },

      { path: 'notifications', loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'insights', loadComponent: () => import('./pages/insights/insights.component').then(m => m.InsightsComponent) },

      { path: 'add', loadComponent: () => import('./pages/add/add').then(m => m.Add) },
      { path: 'budgets', loadComponent: () => import('./pages/budgets/budgets').then(m => m.Budgets) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],

  },

  { path: '**', redirectTo: 'login' },
];
