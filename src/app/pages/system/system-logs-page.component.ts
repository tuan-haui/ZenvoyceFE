import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { AuditLogDto, Client } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';

interface AuditLogRow {
  id: string;
  userId?: string;
  username?: string;
  invoiceId?: string;
  actionType?: string;
  actionTime?: Date;
  detail?: string;
}

@Component({
  selector: 'app-system-logs-page',
  imports: [CommonModule, FormsModule, NzTableModule, NzButtonModule, NzDatePickerModule],
  template: `
    <h2>Nhật ký hệ thống</h2>
    <div class="filters">
      <nz-range-picker [(ngModel)]="dateRange" nzFormat="dd/MM/yyyy"></nz-range-picker>
      <button nz-button nzType="primary" (click)="search()">Tìm</button>
    </div>
    <div class="pagination-info">
      Hiển thị
      {{ totalCount === 0 ? 0 : pageIndex === 1 ? 1 : (pageIndex - 1) * pageSize + 1 }}
      -
      {{ Math.min(pageIndex * pageSize, totalCount) }}
      / {{ totalCount }} bản ghi
    </div>
    <nz-table
      [nzData]="rows"
      [nzLoading]="loading"
      [nzFrontPagination]="false"
      [nzPageIndex]="pageIndex"
      [nzTotal]="totalCount"
      [nzPageSize]="pageSize"
      [nzShowSizeChanger]="true"
      [nzPageSizeOptions]="[10, 20, 50]"
      (nzPageIndexChange)="onPageIndexChange($event)"
      (nzPageSizeChange)="onPageSizeChange($event)"
    >
      <thead>
        <tr>
          <th>Thời gian</th>
          <th>Người dùng</th>
          <th>Loại</th>
          <th>Chi tiết</th>
          <th>Hóa đơn</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of rows">
          <td>{{ r.actionTime | date: 'short' }}</td>
          <td>{{ r.username || r.userId || '—' }}</td>
          <td>{{ r.actionType || '—' }}</td>
          <td class="detail-cell">{{ r.detail || '—' }}</td>
          <td>{{ r.invoiceId || '—' }}</td>
        </tr>
      </tbody>
    </nz-table>
  `,
  styles: [
    `
      .filters {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
        align-items: center;
      }
      .pagination-info {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.65);
        margin-bottom: 8px;
      }
      .detail-cell {
        max-width: 420px;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 12px;
      }
    `
  ]
})
export class SystemLogsPageComponent implements OnInit {
  private readonly client = inject(Client);
  private readonly apiError = inject(ApiErrorService);

  readonly Math = Math;

  rows: AuditLogRow[] = [];
  loading = false;
  dateRange: [Date, Date] | null = null;
  pageIndex = 1;
  pageSize = 10;
  totalCount = 0;

  ngOnInit(): void {
    this.load();
  }

  search(): void {
    this.pageIndex = 1;
    this.load();
  }

  onPageIndexChange(idx: number): void {
    this.pageIndex = idx;
    this.load();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.load();
  }

  load(): void {
    this.loading = true;
    const fromDate = this.dateRange?.[0];
    const toDate = this.dateRange?.[1];
    this.client.logs(fromDate, toDate, undefined, undefined, this.pageIndex, this.pageSize).subscribe({
      next: (env) => {
        this.rows = (env.data?.items ?? []).map((item) => this.mapRow(item));
        this.totalCount = env.data?.totalCount ?? 0;
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.apiError.show(e);
      }
    });
  }

  private mapRow(item: AuditLogDto): AuditLogRow {
    return {
      id: item.id ?? '',
      userId: item.userId ?? undefined,
      username: item.username ?? undefined,
      invoiceId: item.invoiceId ?? undefined,
      actionType: item.actionType ?? undefined,
      actionTime: item.actionTime ?? undefined,
      detail: item.detail ?? undefined
    };
  }
}
