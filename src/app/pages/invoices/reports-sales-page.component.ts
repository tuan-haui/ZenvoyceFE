import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CompanyDto, InvoiceFacadeService } from '../../core/services/invoice-facade.service';

@Component({
  selector: 'app-reports-sales-page',
  imports: [CommonModule, FormsModule, NzTableModule, NzButtonModule, NzDatePickerModule, NzSelectModule],
  template: `
    <h2>Báo cáo doanh thu (hóa đơn đã phát hành)</h2>
    <div class="filters">
      <nz-select
        [(ngModel)]="donviId"
        nzPlaceHolder="Công ty"
        nzAllowClear
        style="width: 240px"
      >
        <nz-option *ngFor="let c of companies" [nzValue]="c.id" [nzLabel]="c.tendonvi || c.id"></nz-option>
      </nz-select>
      <nz-range-picker [(ngModel)]="dateRange" nzFormat="dd/MM/yyyy"></nz-range-picker>
      <button nz-button nzType="primary" (click)="load()" [nzLoading]="loading">Xem báo cáo</button>
    </div>
    <nz-table [nzData]="rows" [nzLoading]="loading" [nzFrontPagination]="false">
      <thead>
        <tr>
          <th>Khách hàng</th>
          <th>Số HĐ</th>
          <th>Tổng tiền hàng</th>
          <th>Tiền thuế</th>
          <th>Tổng thanh toán</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of rows">
          <td>{{ r.tenKhachHang }}</td>
          <td>{{ r.soHoaDon }}</td>
          <td>{{ r.tongTienHang | number: '1.0-0' }}</td>
          <td>{{ r.tienThue | number: '1.0-0' }}</td>
          <td>{{ r.tongThanhToan | number: '1.0-0' }}</td>
        </tr>
      </tbody>
    </nz-table>
  `,
  styles: [
    `
      .filters {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
    `
  ]
})
export class ReportsSalesPageComponent implements OnInit {
  private readonly invoiceFacade = inject(InvoiceFacadeService);
  companies: CompanyDto[] = [];
  donviId: string | undefined;
  dateRange: [Date, Date] | null = null;
  rows: Array<{
    tenKhachHang: string;
    soHoaDon: number;
    tongTienHang: number;
    tienThue: number;
    tongThanhToan: number;
  }> = [];
  loading = false;

  constructor(private readonly apiError: ApiErrorService) {}

  ngOnInit(): void {
    this.invoiceFacade.getCompanies().subscribe({
      next: (c) => {
        this.companies = c;
        this.donviId = c[0]?.id;
        this.load();
      },
      error: (e) => this.apiError.show(e)
    });
  }

  load(): void {
    this.loading = true;
    this.invoiceFacade
      .getSalesReport({
        donviId: this.donviId,
        tuNgay: this.dateRange?.[0],
        denNgay: this.dateRange?.[1]
      })
      .subscribe({
        next: (data) => {
          this.rows = data;
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.apiError.show(e);
        }
      });
  }
}
