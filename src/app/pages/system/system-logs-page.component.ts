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
  private readonly client = inject(Client);
  private readonly apiError = inject(ApiErrorService);

  rows: AuditLogRow[] = [];
  loading = false;
  dateRange: [Date, Date] | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const fromDate = this.dateRange?.[0];
    const toDate = this.dateRange?.[1];
    this.client.logs(fromDate, toDate, undefined, undefined, 1, 50).subscribe({
      next: (env) => {
        this.rows = (env.data?.items ?? []).map((item) => this.mapRow(item));
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
      actionTime: item.actionTime ?? undefined
    };
  }
}
