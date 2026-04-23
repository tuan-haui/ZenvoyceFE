import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

@Component({
  selector: 'app-dashboard-page',
  imports: [NzCardModule, NzGridModule, NzStatisticModule, RouterLink],
  template: `
    <h2>Tổng quan hệ thống</h2>
    <nz-row [nzGutter]="16">
      <nz-col [nzSpan]="8"><nz-card><nz-statistic nzTitle="Người dùng" [nzValue]="24" /></nz-card></nz-col>
      <nz-col [nzSpan]="8"><nz-card><nz-statistic nzTitle="Khách hàng" [nzValue]="128" /></nz-card></nz-col>
      <nz-col [nzSpan]="8"><nz-card><nz-statistic nzTitle="Hàng hóa" [nzValue]="462" /></nz-card></nz-col>
    </nz-row>

    <nz-card class="quick-card" nzTitle="Truy cập nhanh">
      <div class="links">
        <a routerLink="/admin/users">Quản lý người dùng</a>
        <a routerLink="/admin/roles">Phân quyền</a>
        <a routerLink="/admin/companies">Quản lý công ty</a>
        <a routerLink="/admin/customers">Quản lý khách hàng</a>
        <a routerLink="/admin/products">Quản lý hàng hóa</a>
      </div>
    </nz-card>
  `,
  styles: [`
    h2 { margin-bottom: 16px; }
    .quick-card { margin-top: 16px; }
    .links { display: flex; flex-wrap: wrap; gap: 16px; }
    .links a { padding: 8px 12px; border-radius: 8px; background: #f0f5ff; }
  `]
})
export class DashboardPageComponent {}
