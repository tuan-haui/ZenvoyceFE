import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard } from './core/guards/permission.guard';

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
    canActivate: [authGuard, permissionGuard],
    data: { breadcrumb: 'Quản trị' },
    loadComponent: () => import('./layouts/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () => import('./pages/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent)
      },
      {
        path: 'users',
        data: { breadcrumb: 'Quản lý người dùng' },
        loadComponent: () => import('./pages/system/users-page.component').then((m) => m.UsersPageComponent)
      },
      {
        path: 'roles',
        data: { breadcrumb: 'Phân quyền' },
        loadComponent: () => import('./pages/system/roles-page.component').then((m) => m.RolesPageComponent)
      },
      {
        path: 'system/logs',
        data: { breadcrumb: 'Nhật ký hệ thống' },
        loadComponent: () => import('./pages/system/system-logs-page.component').then((m) => m.SystemLogsPageComponent)
      },
      {
        path: 'companies',
        data: { breadcrumb: 'Quản lý công ty' },
        loadComponent: () => import('./pages/catalog/companies-page.component').then((m) => m.CompaniesPageComponent)
      },
      {
        path: 'customers',
        data: { breadcrumb: 'Quản lý khách hàng' },
        loadComponent: () => import('./pages/catalog/customers-page.component').then((m) => m.CustomersPageComponent)
      },
      {
        path: 'products',
        data: { breadcrumb: 'Quản lý hàng hóa' },
        loadComponent: () => import('./pages/catalog/products-page.component').then((m) => m.ProductsPageComponent)
      },
      {
        path: 'templates/setup',
        data: { breadcrumb: 'Thiết lập mẫu hóa đơn' },
        loadComponent: () => import('./pages/templates/templates-setup-page.component').then((m) => m.TemplatesSetupPageComponent)
      },
      {
        path: 'templates/warehouse',
        data: { breadcrumb: 'Mẫu hóa đơn kho hàng' },
        loadComponent: () => import('./pages/templates/templates-warehouse-page.component').then((m) => m.TemplatesWarehousePageComponent)
      },
      {
        path: 'invoices',
        data: { breadcrumb: 'Quản lý hóa đơn' },
        loadComponent: () => import('./pages/invoices/invoices-page.component').then((m) => m.InvoicesPageComponent)
      },
      {
        path: 'reports/sales',
        data: { breadcrumb: 'Báo cáo doanh thu' },
        loadComponent: () => import('./pages/invoices/reports-sales-page.component').then((m) => m.ReportsSalesPageComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/auth/login' }
];
