import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/auth/login' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./layouts/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./pages/auth/login-page.component').then((m) => m.LoginPageComponent) }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent) },
      { path: 'users', loadComponent: () => import('./pages/system/users-page.component').then((m) => m.UsersPageComponent) },
      { path: 'roles', loadComponent: () => import('./pages/system/roles-page.component').then((m) => m.RolesPageComponent) },
      { path: 'companies', loadComponent: () => import('./pages/catalog/companies-page.component').then((m) => m.CompaniesPageComponent) },
      { path: 'customers', loadComponent: () => import('./pages/catalog/customers-page.component').then((m) => m.CustomersPageComponent) },
      { path: 'products', loadComponent: () => import('./pages/catalog/products-page.component').then((m) => m.ProductsPageComponent) },
      { path: 'templates/setup', loadComponent: () => import('./pages/templates/templates-setup-page.component').then((m) => m.TemplatesSetupPageComponent) },
      { path: 'templates/warehouse', loadComponent: () => import('./pages/templates/templates-warehouse-page.component').then((m) => m.TemplatesWarehousePageComponent) }
    ]
  },
  { path: '**', redirectTo: '/auth/login' }
];
