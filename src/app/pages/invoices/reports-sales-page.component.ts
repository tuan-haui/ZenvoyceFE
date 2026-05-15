import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
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
      <button nz-button (click)="exportExcel()" [nzLoading]="exporting">Xuất Excel</button>
    </div>
    <nz-table [nzData]="rows" [nzLoading]="loading" [nzFrontPagination]="false">
      <thead>
        <tr>
          <th>Khách hàng</th>
          <th>Số HĐ</th>
          <th>Tổng tiền hàng (VNĐ)</th>
          <th>Tiền thuế (VNĐ)</th>
          <th>Tổng thanh toán (VNĐ)</th>
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
        <tr class="total-row" *ngIf="rows.length > 0">
          <td><strong>Tổng cộng</strong></td>
          <td><strong>{{ totals.soHoaDon }}</strong></td>
          <td><strong>{{ totals.tongTienHang | number: '1.0-0' }}</strong></td>
          <td><strong>{{ totals.tienThue | number: '1.0-0' }}</strong></td>
          <td><strong>{{ totals.tongThanhToan | number: '1.0-0' }}</strong></td>
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

      .total-row td {
        background: #fafafa;
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
  totals = {
    soHoaDon: 0,
    tongTienHang: 0,
    tienThue: 0,
    tongThanhToan: 0
  };
  loading = false;
  exporting = false;

  constructor(
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

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
          this.calculateTotals();
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.apiError.show(e);
        }
      });
  }

  exportExcel(): void {
    this.exporting = true;
    this.invoiceFacade
      .exportSalesReportExcel({
        donviId: this.donviId,
        tuNgay: this.dateRange?.[0],
        denNgay: this.dateRange?.[1]
      })
      .subscribe({
        next: (blob) => {
          const fileName = `bao-cao-doanh-thu-${new Date().toISOString().slice(0, 10)}.xlsx`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
          this.exporting = false;
          this.message.success('Xuất Excel thành công.');
        },
        error: (e) => {
          this.exporting = false;
          this.apiError.show(e);
        }
      });
  }

  private calculateTotals(): void {
    this.totals = this.rows.reduce(
      (acc, row) => {
        acc.soHoaDon += row.soHoaDon;
        acc.tongTienHang += row.tongTienHang;
        acc.tienThue += row.tienThue;
        acc.tongThanhToan += row.tongThanhToan;
        return acc;
      },
      {
        soHoaDon: 0,
        tongTienHang: 0,
        tienThue: 0,
        tongThanhToan: 0
      }
    );
  }
}
