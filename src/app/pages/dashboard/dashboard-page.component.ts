import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { Client } from '../../core/services/app.service';
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
        background: var(--app-lightbg, #f0f5ff);
        color: var(--app-primary, #1677ff);
        text-decoration: none;
        font-size: 13px;
        font-weight: 500;
        transition: background 0.2s, color 0.2s;
      }
      .links a:hover {
        filter: brightness(0.95);
      }

      /* ── Dark mode ── */
      :host-context(html.dark-mode) h2 { color: rgba(255,255,255,0.85); }
      :host-context(html.dark-mode) .links a {
        background: rgba(255,255,255,0.08);
        color: var(--app-primary, #52c41a);
      }
      :host-context(html.dark-mode) .links a:hover {
        background: rgba(255,255,255,0.13);
        filter: none;
      }
    `
  ]
})
export class DashboardPageComponent implements OnInit {
  private readonly client = inject(Client);
  private readonly usersApi = inject(UserRoleFacadeService);
  private readonly invoicesApi = inject(InvoiceFacadeService);

  loading = true;
  userCount = 0;
  companyCount = 0;
  invoiceCount = 0;

  ngOnInit(): void {
    forkJoin({
      users: this.usersApi.getUsers(1, 1).pipe(catchError(() => of({ totalCount: 0 }))),
      companies: this.client
        .companiesGET()
        .pipe(map((e) => e.data ?? []), catchError(() => of([]))),
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
