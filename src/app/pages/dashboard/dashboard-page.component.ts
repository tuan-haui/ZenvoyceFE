import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { API_BASE_URL } from '../../core/services/app.service';
import { InvoiceFacadeService } from '../../core/services/invoice-facade.service';
import { UserRoleFacadeService } from '../../core/services/user-role-facade.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [NzCardModule, NzGridModule, NzStatisticModule, RouterLink, CommonModule],
  template: `
    <h2>Tổng quan hệ thống</h2>
    <nz-row [nzGutter]="16">
      <nz-col [nzSpan]="8">
        <nz-card><nz-statistic nzTitle="Người dùng" [nzValue]="userCount" [nzLoading]="loading"></nz-statistic></nz-card>
      </nz-col>
      <nz-col [nzSpan]="8">
        <nz-card><nz-statistic nzTitle="Công ty" [nzValue]="companyCount" [nzLoading]="loading"></nz-statistic></nz-card>
      </nz-col>
      <nz-col [nzSpan]="8">
        <nz-card><nz-statistic nzTitle="Hóa đơn" [nzValue]="invoiceCount" [nzLoading]="loading"></nz-statistic></nz-card>
      </nz-col>
    </nz-row>

    <nz-card class="quick-card" nzTitle="Truy cập nhanh">
      <div class="links">
        <a routerLink="/admin/users">Quản lý người dùng</a>
        <a routerLink="/admin/roles">Phân quyền</a>
        <a routerLink="/admin/system/logs">Nhật ký hệ thống</a>
        <a routerLink="/admin/companies">Quản lý công ty</a>
        <a routerLink="/admin/customers">Quản lý khách hàng</a>
        <a routerLink="/admin/products">Quản lý hàng hóa</a>
        <a routerLink="/admin/invoices">Quản lý hóa đơn</a>
        <a routerLink="/admin/reports/sales">Báo cáo doanh thu</a>
      </div>
    </nz-card>
  `,
  styles: [
    `
      h2 {
        margin-bottom: 16px;
      }
      .quick-card {
        margin-top: 16px;
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }
      .links a {
        padding: 8px 12px;
        border-radius: 8px;
        background: #f0f5ff;
      }
    `
  ]
})
export class DashboardPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL, { optional: true }) ?? '';
  private readonly usersApi = inject(UserRoleFacadeService);
  private readonly invoicesApi = inject(InvoiceFacadeService);

  loading = true;
  userCount = 0;
  companyCount = 0;
  invoiceCount = 0;

  ngOnInit(): void {
    forkJoin({
      users: this.usersApi.getUsers(1, 1).pipe(catchError(() => of({ totalCount: 0 }))),
      companies: this.http.get<unknown[]>(`${this.base}/api/companies`, { withCredentials: true }).pipe(catchError(() => of([]))),
      invoices: this.invoicesApi.getInvoices().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ users, companies, invoices }) => {
        this.userCount = users.totalCount ?? 0;
        this.companyCount = Array.isArray(companies) ? companies.length : 0;
        this.invoiceCount = invoices.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
