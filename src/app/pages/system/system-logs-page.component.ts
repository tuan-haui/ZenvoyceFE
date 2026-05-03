import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ZenvoyceApiEnvelope } from '../../core/http/api-envelope';
import { API_BASE_URL } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';

interface AuditLogRow {
  id: string;
  userId?: string;
  username?: string;
  invoiceId?: string;
  actionType?: string;
  actionTime?: string;
}

interface PagedLogs {
  items?: AuditLogRow[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
}

@Component({
  selector: 'app-system-logs-page',
  imports: [CommonModule, FormsModule, NzTableModule, NzButtonModule, NzDatePickerModule],
  template: `
    <h2>Nhật ký hệ thống</h2>
    <div class="filters">
      <nz-range-picker [(ngModel)]="dateRange" nzFormat="dd/MM/yyyy"></nz-range-picker>
      <button nz-button nzType="primary" (click)="load()">Tìm</button>
    </div>
    <nz-table [nzData]="rows" [nzLoading]="loading" [nzFrontPagination]="false">
      <thead>
        <tr>
          <th>Thời gian</th>
          <th>Người dùng</th>
          <th>Loại</th>
          <th>Hóa đơn</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of rows">
          <td>{{ r.actionTime | date: 'short' }}</td>
          <td>{{ r.username || r.userId || '—' }}</td>
          <td>{{ r.actionType || '—' }}</td>
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
    `
  ]
})
export class SystemLogsPageComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL, { optional: true }) ?? '';
  rows: AuditLogRow[] = [];
  loading = false;
  dateRange: [Date, Date] | null = null;

  constructor(private readonly apiError: ApiErrorService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    let params = new HttpParams().set('pageNumber', '1').set('pageSize', '50');
    if (this.dateRange?.[0]) params = params.set('fromDate', this.dateRange[0].toISOString());
    if (this.dateRange?.[1]) params = params.set('toDate', this.dateRange[1].toISOString());
    this.http
      .get<ZenvoyceApiEnvelope<PagedLogs>>(`${this.base}/api/system/logs`, { params, withCredentials: true })
      .subscribe({
      next: (res) => {
        const page = res.data;
        this.rows = page?.items ?? [];
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.apiError.show(e);
      }
    });
  }
}
