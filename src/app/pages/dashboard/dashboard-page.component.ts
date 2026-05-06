import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CompanyDto, InvoiceFacadeService, InvoiceListItemDto, SalesReportRowDto } from '../../core/services/invoice-facade.service';
import { UserRoleFacadeService } from '../../core/services/user-role-facade.service';

echarts.use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

type SalesChartType = 'bar' | 'line';
type MonthlyChartType = 'bar' | 'line';
type StatusChartType = 'pie' | 'bar';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    NzCardModule,
    NzGridModule,
    NzStatisticModule,
    NzSelectModule,
    NzDatePickerModule,
    FormsModule,
    RouterLink,
    CommonModule,
    NgxEchartsDirective
  ],
  providers: [provideEchartsCore({ echarts })],
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

    <nz-card class="filters-card" nzTitle="Bộ lọc báo cáo">
      <div class="filters">
        <nz-select
          [(ngModel)]="selectedCompanyId"
          nzAllowClear
          nzPlaceHolder="Công ty (cho biểu đồ doanh thu)"
          style="width: 280px"
          (ngModelChange)="loadCharts()"
        >
          <nz-option *ngFor="let c of companies" [nzValue]="c.id" [nzLabel]="c.tendonvi || c.id"></nz-option>
        </nz-select>

        <nz-range-picker [(ngModel)]="dateRange" nzFormat="dd/MM/yyyy" (ngModelChange)="loadCharts()"></nz-range-picker>

        <nz-select [(ngModel)]="salesChartType" style="width: 190px" (ngModelChange)="buildSalesChartOption()">
          <nz-option nzValue="bar" nzLabel="Doanh thu KH: Cột"></nz-option>
          <nz-option nzValue="line" nzLabel="Doanh thu KH: Đường"></nz-option>
        </nz-select>

        <nz-select [(ngModel)]="monthlyChartType" style="width: 190px" (ngModelChange)="buildMonthlyChartOption()">
          <nz-option nzValue="bar" nzLabel="Xu hướng tháng: Cột"></nz-option>
          <nz-option nzValue="line" nzLabel="Xu hướng tháng: Đường"></nz-option>
        </nz-select>

        <nz-select [(ngModel)]="statusChartType" style="width: 170px" (ngModelChange)="buildStatusChartOption()">
          <nz-option nzValue="pie" nzLabel="Trạng thái: Tròn"></nz-option>
          <nz-option nzValue="bar" nzLabel="Trạng thái: Cột"></nz-option>
        </nz-select>
      </div>
    </nz-card>

    <nz-row [nzGutter]="16" class="chart-row">
      <nz-col [nzXs]="24" [nzLg]="12">
        <nz-card nzTitle="Doanh thu theo khách hàng" [nzLoading]="chartsLoading">
          <div echarts [options]="salesChartOption" class="chart-host"></div>
        </nz-card>
      </nz-col>
      <nz-col [nzXs]="24" [nzLg]="12">
        <nz-card nzTitle="Xu hướng theo tháng" [nzLoading]="chartsLoading">
          <div echarts [options]="monthlyChartOption" class="chart-host"></div>
        </nz-card>
      </nz-col>
      <nz-col [nzSpan]="24">
        <nz-card nzTitle="Phân bổ trạng thái hóa đơn" [nzLoading]="chartsLoading">
          <div echarts [options]="statusChartOption" class="chart-host"></div>
        </nz-card>
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
      .filters-card {
        margin-top: 16px;
      }
      .filters {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .chart-row {
        margin-top: 16px;
      }
      .chart-host {
        height: 340px;
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
      :host-context(html.dark-mode) .chart-host {
        filter: saturate(0.9);
      }
    `
  ]
})
export class DashboardPageComponent implements OnInit {
  private readonly usersApi = inject(UserRoleFacadeService);
  private readonly invoicesApi = inject(InvoiceFacadeService);
  private readonly apiError = inject(ApiErrorService);

  loading = true;
  chartsLoading = true;
  userCount = 0;
  companyCount = 0;
  invoiceCount = 0;
  companies: CompanyDto[] = [];
  selectedCompanyId?: string;
  dateRange: [Date, Date] = this.buildDefaultDateRange();

  salesChartType: SalesChartType = 'bar';
  monthlyChartType: MonthlyChartType = 'line';
  statusChartType: StatusChartType = 'pie';

  private salesRows: SalesReportRowDto[] = [];
  private invoicesInRange: InvoiceListItemDto[] = [];

  salesChartOption: Record<string, unknown> = {};
  monthlyChartOption: Record<string, unknown> = {};
  statusChartOption: Record<string, unknown> = {};

  ngOnInit(): void {
    forkJoin({
      users: this.usersApi.getUsers(1, 1).pipe(catchError(() => of({ totalCount: 0 }))),
      companies: this.invoicesApi.getCompanies().pipe(catchError(() => of([]))),
      invoices: this.invoicesApi.getInvoices().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ users, companies, invoices }) => {
        this.userCount = users.totalCount ?? 0;
        this.companyCount = Array.isArray(companies) ? companies.length : 0;
        this.invoiceCount = invoices.length;
        this.companies = companies;
        this.selectedCompanyId = companies[0]?.id;
        this.loading = false;
        this.loadCharts();
      },
      error: () => {
        this.loading = false;
        this.chartsLoading = false;
      }
    });
  }

  loadCharts(): void {
    this.chartsLoading = true;
    const [tuNgay, denNgay] = this.dateRange;

    forkJoin({
      sales: this.invoicesApi.getSalesReport({
        donviId: this.selectedCompanyId,
        tuNgay,
        denNgay
      }),
      invoices: this.invoicesApi.getInvoices({ tuNgay, denNgay })
    }).subscribe({
      next: ({ sales, invoices }) => {
        if (invoices.length === 0 && this.invoiceCount > 0) {
          this.loadChartsFallbackAllTime();
          return;
        }
        this.applyChartData(sales, invoices);
      },
      error: (e) => {
        this.apiError.show(e);
        this.loadChartsFallbackAllTime();
      }
    });
  }

  private loadChartsFallbackAllTime(): void {
    forkJoin({
      sales: this.invoicesApi
        .getSalesReport({
          donviId: this.selectedCompanyId
        })
        .pipe(catchError(() => of([]))),
      invoices: this.invoicesApi.getInvoices().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ sales, invoices }) => {
        this.applyChartData(sales, invoices);
      },
      error: (e) => {
        this.apiError.show(e);
        this.chartsLoading = false;
      }
    });
  }

  private applyChartData(sales: SalesReportRowDto[], invoices: InvoiceListItemDto[]): void {
    this.salesRows = sales;
    this.invoicesInRange = invoices;
    this.buildSalesChartOption();
    this.buildMonthlyChartOption();
    this.buildStatusChartOption();
    this.chartsLoading = false;
  }

  buildSalesChartOption(): void {
    const labels = this.salesRows.map((x) => x.tenKhachHang || 'Không tên');
    const values = this.salesRows.map((x) => x.tongThanhToan);
    this.salesChartOption = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      grid: { left: 24, right: 16, top: 24, bottom: 40, containLabel: true },
      series: [{ name: 'Tổng thanh toán', type: this.salesChartType, data: values, smooth: this.salesChartType === 'line' }]
    };
  }

  buildMonthlyChartOption(): void {
    const monthBuckets = this.buildMonthBuckets(this.dateRange[0], this.dateRange[1], this.invoicesInRange);
    this.monthlyChartOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Số hóa đơn', 'Tổng thanh toán'] },
      xAxis: { type: 'category', data: monthBuckets.map((x) => x.month) },
      yAxis: [{ type: 'value', name: 'Hóa đơn' }, { type: 'value', name: 'VND' }],
      grid: { left: 24, right: 24, top: 40, bottom: 40, containLabel: true },
      series: [
        {
          name: 'Số hóa đơn',
          type: this.monthlyChartType,
          data: monthBuckets.map((x) => x.count),
          yAxisIndex: 0,
          smooth: this.monthlyChartType === 'line'
        },
        {
          name: 'Tổng thanh toán',
          type: this.monthlyChartType,
          data: monthBuckets.map((x) => x.amount),
          yAxisIndex: 1,
          smooth: this.monthlyChartType === 'line'
        }
      ]
    };
  }

  buildStatusChartOption(): void {
    const statusMap = new Map<string, number>();
    for (const item of this.invoicesInRange) {
      const key = item.trangthai || 'Unknown';
      statusMap.set(key, (statusMap.get(key) ?? 0) + 1);
    }
    const statusRows = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

    if (this.statusChartType === 'pie') {
      this.statusChartOption = {
        tooltip: { trigger: 'item' },
        legend: { top: 'top' },
        series: [{ type: 'pie', radius: ['45%', '75%'], data: statusRows }]
      };
      return;
    }

    this.statusChartOption = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: statusRows.map((x) => x.name) },
      yAxis: { type: 'value' },
      grid: { left: 24, right: 16, top: 24, bottom: 40, containLabel: true },
      series: [{ type: 'bar', data: statusRows.map((x) => x.value) }]
    };
  }

  private buildDefaultDateRange(): [Date, Date] {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return [start, end];
  }

  private buildMonthBuckets(fromDate: Date, toDate: Date, invoices: InvoiceListItemDto[]): Array<{ month: string; count: number; amount: number }> {
    const buckets = new Map<string, { count: number; amount: number }>();
    const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const endMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);

    while (cursor <= endMonth) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, { count: 0, amount: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const invoice of invoices) {
      const date = new Date(invoice.ngaylap);
      if (Number.isNaN(date.getTime())) {
        continue;
      }
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.get(key);
      if (!bucket) {
        continue;
      }
      bucket.count += 1;
      bucket.amount += invoice.tongthanhtoan ?? 0;
    }

    return Array.from(buckets.entries()).map(([month, stats]) => ({
      month,
      count: stats.count,
      amount: Math.round(stats.amount)
    }));
  }
}
