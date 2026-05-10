import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiErrorService } from '../../core/services/api-error.service';
import { InvoiceFacadeService } from '../../core/services/invoice-facade.service';
import { CompanyTemplateVm, TemplateFacadeService } from '../../core/services/template-facade.service';

type TrangthaiLabel = { color: string; text: string; };

const STATUS_MAP: Record<number, TrangthaiLabel> = {
  0: { color: 'default', text: 'Chưa phát hành' },
  1: { color: 'processing', text: 'Đang chờ CQT' },
  2: { color: 'success', text: 'Đã chấp nhận' },
  3: { color: 'error', text: 'Từ chối' },
  4: { color: 'default', text: 'Đã hủy' }
};

@Component({
  selector: 'app-templates-warehouse-page',
  imports: [
    CommonModule,
    FormsModule,
    NzGridModule,
    NzCardModule,
    NzTagModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzIconModule,
    NzModalModule,
    NzStepsModule,
    NzSpinModule,
    NzPaginationModule,
    NzToolTipModule
  ],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Kho mẫu phát hành</h2>
        <p class="page-subtitle">Quản lý mẫu hóa đơn và gửi thông báo lên Tổng cục Thuế.</p>
      </div>
      <button nz-button nzType="primary" (click)="goToSetup()">
        <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
        Tạo mẫu mới
      </button>
    </div>

    <!-- Toolbar Filter -->
    <div class="toolbar">
      <div class="toolbar-left">
        <nz-input-group [nzPrefix]="searchPrefix" class="search-input">
          <input
            nz-input
            placeholder="Tìm theo ký hiệu mẫu..."
            [value]="searchKeyword"
            (input)="onSearch($event)"
          />
        </nz-input-group>
        <ng-template #searchPrefix><nz-icon nzType="search" nzTheme="outline"></nz-icon></ng-template>

        <nz-select
          [(ngModel)]="filterStatus"
          (ngModelChange)="applyFilter(searchKeyword)"
          nzPlaceHolder="Tất cả trạng thái"
          nzAllowClear
          class="status-select"
        >
          <nz-option [nzValue]="0" nzLabel="Chưa phát hành"></nz-option>
          <nz-option [nzValue]="1" nzLabel="Đang chờ CQT"></nz-option>
          <nz-option [nzValue]="2" nzLabel="Đã chấp nhận"></nz-option>
          <nz-option [nzValue]="3" nzLabel="Từ chối"></nz-option>
          <nz-option [nzValue]="4" nzLabel="Đã hủy"></nz-option>
        </nz-select>
      </div>
      <div class="toolbar-right">
        <span class="count-text">{{ filteredTemplates.length }} mẫu</span>
      </div>
    </div>

    <!-- Loading Spin -->
    <nz-spin *ngIf="loading" nzTip="Đang tải..." [nzSpinning]="loading">
      <div style="min-height: 200px;"></div>
    </nz-spin>

    <!-- Empty State -->
    <div *ngIf="!loading && filteredTemplates.length === 0" class="empty-state">
      <nz-icon nzType="inbox" nzTheme="outline" class="empty-icon"></nz-icon>
      <p>Chưa có mẫu hóa đơn nào</p>
      <button nz-button nzType="primary" (click)="goToSetup()">Tạo mẫu đầu tiên</button>
    </div>

    <!-- Template Grid -->
    <div *ngIf="!loading && filteredTemplates.length > 0">
      <div nz-row [nzGutter]="[16, 16]">
        <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="8" [nzXl]="6" *ngFor="let t of displayedTemplates">
          <nz-card class="template-card" [nzBodyStyle]="{ padding: '0' }">
            <!-- Thumbnail -->
            <div class="card-thumbnail" [class.thumb-accepted]="t.trangthaiPhatHanh === 2">
              <!-- Mini A4 Paper -->
              <div class="mini-paper">
                <div class="mini-header"></div>
                <div class="mini-lines">
                  <div class="mini-line w-70"></div>
                  <div class="mini-line w-50"></div>
                  <div class="mini-line w-90 mt-auto"></div>
                </div>
              </div>
              <!-- Default badge -->
              <div class="default-badge" *ngIf="t.lamaumacdinh">
                <nz-icon nzType="star" nzTheme="fill"></nz-icon> Mặc định
              </div>
            </div>

            <!-- Card Info -->
            <div class="card-body">
              <div class="card-top">
                <span class="card-kyhieu">{{ t.kyhieu }}</span>
                <nz-tag [nzColor]="getStatus(t.trangthaiPhatHanh).color" class="status-tag">
                  {{ getStatus(t.trangthaiPhatHanh).text }}
                </nz-tag>
              </div>
              <div class="card-tenmau">{{ t.tenmaugoc }}</div>
              <div class="card-loai">{{ t.loaihoadon }}</div>
              <div class="card-date">Kích hoạt: {{ t.ngaykichhoat }}</div>
            </div>

            <!-- Card Actions -->
            <div class="card-actions">
              <button
                nz-button
                nzType="default"
                nzSize="small"
                (click)="openDetail(t)"
                class="action-btn"
              >
                <nz-icon nzType="eye" nzTheme="outline"></nz-icon>
                Chi tiết
              </button>

              <button
                *ngIf="canNotify(t.trangthaiPhatHanh)"
                nz-button
                [nzType]="t.trangthaiPhatHanh === 3 ? 'default' : 'primary'"
                nzSize="small"
                [nzLoading]="notifyingId === t.id"
                (click)="notifyTax(t)"
                class="action-btn"
                nz-tooltip
                [nzTooltipTitle]="getNotifyTooltip(t.trangthaiPhatHanh)"
              >
                <nz-icon nzType="send" nzTheme="outline"></nz-icon>
                {{ t.trangthaiPhatHanh === 3 ? 'Gửi lại' : 'Phát hành' }}
              </button>
            </div>
          </nz-card>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-bar" *ngIf="filteredTemplates.length > pageSize">
        <nz-pagination
          [nzPageIndex]="pageIndex"
          [nzTotal]="filteredTemplates.length"
          [nzPageSize]="pageSize"
          (nzPageIndexChange)="onPageChange($event)"
        ></nz-pagination>
      </div>
    </div>

    <!-- Detail Modal -->
    <nz-modal
      [(nzVisible)]="detailVisible"
      [nzTitle]="detailTitle"
      (nzOnCancel)="detailVisible = false"
      [nzFooter]="modalFooter"
      nzWidth="600px"
    >
      <ng-container *nzModalContent>
        <ng-container *ngIf="selectedTemplate">
          <!-- Basic Info -->
          <div class="detail-info-grid">
            <div class="detail-item">
              <span class="detail-label">Ký hiệu mẫu</span>
              <span class="detail-value mono">{{ selectedTemplate.kyhieu }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Loại hóa đơn</span>
              <span class="detail-value">{{ selectedTemplate.loaihoadon }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Mẫu gốc</span>
              <span class="detail-value">{{ selectedTemplate.tenmaugoc }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Ngày kích hoạt</span>
              <span class="detail-value">{{ selectedTemplate.ngaykichhoat }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Trạng thái</span>
              <nz-tag [nzColor]="getStatus(selectedTemplate.trangthaiPhatHanh).color">
                {{ getStatus(selectedTemplate.trangthaiPhatHanh).text }}
              </nz-tag>
            </div>
            <div class="detail-item">
              <span class="detail-label">Mẫu mặc định</span>
              <span class="detail-value">{{ selectedTemplate.lamaumacdinh ? 'Có' : 'Không' }}</span>
            </div>
          </div>

          <!-- State History Timeline -->
          <div class="detail-steps-title">Lịch sử trạng thái phát hành</div>
          <nz-steps nzDirection="vertical" nzSize="small" [nzCurrent]="getStepCurrent(selectedTemplate.trangthaiPhatHanh)">
            <nz-step nzTitle="Khởi tạo mẫu" [nzDescription]="'Mẫu đã được áp dụng cho công ty, ' + selectedTemplate.ngaykichhoat"></nz-step>
            <nz-step
              nzTitle="Gửi thông báo CQT"
              [nzDescription]="selectedTemplate.trangthaiPhatHanh >= 1 ? 'Đã gửi lên Tổng cục Thuế, đang chờ phản hồi' : 'Chưa thực hiện'"
              [nzStatus]="selectedTemplate.trangthaiPhatHanh === 0 ? 'wait' : 'finish'"
            ></nz-step>
            <nz-step
              nzTitle="Phản hồi CQT"
              [nzDescription]="getStepFinalDesc(selectedTemplate.trangthaiPhatHanh)"
              [nzStatus]="getStepFinalStatus(selectedTemplate.trangthaiPhatHanh)"
            ></nz-step>
          </nz-steps>
        </ng-container>
      </ng-container>
    </nz-modal>

    <ng-template #modalFooter>
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <button
          *ngIf="selectedTemplate && canCancel(selectedTemplate.trangthaiPhatHanh)"
          nz-button
          nzType="default"
          nzDanger
          [nzLoading]="cancelingId === selectedTemplate.id"
          (click)="cancelTemplate(selectedTemplate)"
        >
          <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
          Hủy mẫu phát hành
        </button>
        <div style="flex: 1;"></div>
        <button nz-button nzType="default" (click)="detailVisible = false">Đóng</button>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .page-title { margin: 0; font-size: 22px; font-weight: 600; color: #262626; }
    .page-subtitle { margin: 4px 0 0; color: #8c8c8c; font-size: 14px; }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
    }
    .toolbar-left { display: flex; gap: 10px; align-items: center; }
    .search-input { width: 260px; }
    .status-select { width: 180px; }
    .count-text { font-size: 13px; color: #8c8c8c; }
    .empty-state {
      text-align: center;
      padding: 64px 20px;
      color: #bfbfbf;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .empty-icon { font-size: 48px; }

    /* Template Card */
    .template-card {
      border-radius: 8px;
      overflow: hidden;
      transition: box-shadow 0.2s;
      border: 1px solid #f0f0f0;
    }
    .template-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

    /* Card Thumbnail */
    .card-thumbnail {
      background: linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%);
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border-bottom: 1px solid #f0f0f0;
    }
    .card-thumbnail.thumb-accepted {
      background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);
    }
    .mini-paper {
      width: 64px;
      height: 90px;
      background: #fff;
      border: 1px solid #d9d9d9;
      border-radius: 2px;
      box-shadow: 2px 2px 8px rgba(0,0,0,0.08);
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .mini-header { height: 8px; background: #005daa; border-radius: 1px; }
    .mini-lines { display: flex; flex-direction: column; gap: 2px; flex: 1; justify-content: center; }
    .mini-line { height: 2px; background: #e8e8e8; border-radius: 1px; }
    .w-70 { width: 70%; }
    .w-50 { width: 50%; }
    .w-90 { width: 90%; }
    .mt-auto { margin-top: auto; }
    .default-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--app-primary, #1677ff);
      color: #fff;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    /* Card Body */
    .card-body { padding: 12px 14px 8px; }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .card-kyhieu { font-family: monospace; font-weight: 700; font-size: 15px; color: #262626; }
    .status-tag { font-size: 11px; }
    .card-tenmau { font-size: 13px; font-weight: 500; color: #262626; margin-bottom: 2px; }
    .card-loai { font-size: 12px; color: #8c8c8c; }
    .card-date { font-size: 11px; color: #bfbfbf; margin-top: 4px; }

    /* Card Actions */
    .card-actions {
      display: flex;
      gap: 8px;
      padding: 8px 14px 12px;
      border-top: 1px solid #f5f5f5;
    }
    .action-btn { flex: 1; }

    /* Pagination */
    .pagination-bar { display: flex; justify-content: center; margin-top: 24px; }

    /* Detail Modal */
    .detail-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      margin-bottom: 20px;
    }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-label { font-size: 11px; color: #8c8c8c; text-transform: uppercase; letter-spacing: 0.04em; }
    .detail-value { font-size: 14px; color: #262626; font-weight: 500; }
    .detail-value.mono { font-family: monospace; font-size: 15px; }
    .detail-steps-title { font-size: 14px; font-weight: 600; color: #262626; margin-bottom: 14px; }

    /* ── Dark mode ── */
    :host-context(html.dark-mode) .page-title { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .toolbar {
      background: #262626;
      border-color: rgba(255,255,255,0.1);
    }
    :host-context(html.dark-mode) .count-text { color: rgba(255,255,255,0.45); }
    :host-context(html.dark-mode) .template-card {
      border-color: rgba(255,255,255,0.12);
    }
    :host-context(html.dark-mode) .template-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }
    :host-context(html.dark-mode) .card-thumbnail {
      background: linear-gradient(135deg, #1f1f1f 0%, #262626 100%);
      border-bottom-color: rgba(255,255,255,0.08);
    }
    :host-context(html.dark-mode) .card-thumbnail.thumb-accepted {
      background: linear-gradient(135deg, rgba(82,196,26,0.15) 0%, rgba(82,196,26,0.08) 100%);
    }
    :host-context(html.dark-mode) .mini-paper {
      background: #2a2a2a;
      border-color: rgba(255,255,255,0.15);
    }
    :host-context(html.dark-mode) .mini-line { background: rgba(255,255,255,0.1); }
    :host-context(html.dark-mode) .card-body { background: #1f1f1f; }
    :host-context(html.dark-mode) .card-top { border-bottom-color: rgba(255,255,255,0.08); }
    :host-context(html.dark-mode) .card-kyhieu { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .card-tenmau { color: rgba(255,255,255,0.75); }
    :host-context(html.dark-mode) .card-loai { color: rgba(255,255,255,0.45); }
    :host-context(html.dark-mode) .card-date { color: rgba(255,255,255,0.25); }
    :host-context(html.dark-mode) .card-actions {
      border-top-color: rgba(255,255,255,0.07);
      background: #1f1f1f;
    }
    :host-context(html.dark-mode) .detail-label { color: rgba(255,255,255,0.45); }
    :host-context(html.dark-mode) .detail-value { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .detail-steps-title { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .empty-state { color: rgba(255,255,255,0.25); }
  `]
})
export class TemplatesWarehousePageComponent implements OnInit {
  companyId: string | undefined;
  templates: CompanyTemplateVm[] = [];
  filteredTemplates: CompanyTemplateVm[] = [];
  displayedTemplates: CompanyTemplateVm[] = [];
  loading = false;
  searchKeyword = '';
  filterStatus: number | null = null;
  pageIndex = 1;
  pageSize = 8;
  notifyingId: string | null = null;
  cancelingId: string | null = null;
  detailVisible = false;
  selectedTemplate: CompanyTemplateVm | null = null;
  private search$ = new Subject<string>();

  get detailTitle(): string {
    return this.selectedTemplate ? `Chi tiết mẫu — ${this.selectedTemplate.kyhieu}` : 'Chi tiết mẫu';
  }

  constructor(
    private readonly facade: TemplateFacadeService,
    private readonly invoiceFacade: InvoiceFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService,
    private readonly modal: NzModalService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((kw) => {
      this.applyFilter(kw);
    });
    this.invoiceFacade.getCompanies().subscribe({
      next: (list) => {
        this.companyId = list[0]?.id;
        this.loadTemplates();
      },
      error: (e) => {
        this.apiError.show(e);
        this.loading = false;
      }
    });
  }

  loadTemplates(): void {
    if (!this.companyId) {
      this.templates = [];
      this.applyFilter(this.searchKeyword);
      this.loading = false;
      return;
    }
    this.loading = true;
    this.facade.getCompanyTemplates(this.companyId).subscribe({
      next: (rows) => {
        this.templates = rows;
        this.applyFilter(this.searchKeyword);
        this.loading = false;
      },
      error: (e) => {
        this.apiError.show(e);
        this.templates = [];
        this.applyFilter(this.searchKeyword);
        this.loading = false;
      }
    });
  }

  applyFilter(keyword: string): void {
    const kw = keyword.trim().toLowerCase();
    let result = this.templates;
    if (kw) result = result.filter((t) => t.kyhieu.toLowerCase().includes(kw) || t.tenmaugoc.toLowerCase().includes(kw));
    if (this.filterStatus !== null) result = result.filter((t) => t.trangthaiPhatHanh === this.filterStatus);
    this.filteredTemplates = result;
    this.pageIndex = 1;
    this.updateDisplayed();
  }

  updateDisplayed(): void {
    const start = (this.pageIndex - 1) * this.pageSize;
    this.displayedTemplates = this.filteredTemplates.slice(start, start + this.pageSize);
  }

  onPageChange(idx: number): void {
    this.pageIndex = idx;
    this.updateDisplayed();
  }

  onSearch(event: Event): void {
    const kw = (event.target as HTMLInputElement).value;
    this.searchKeyword = kw;
    this.search$.next(kw);
  }

  goToSetup(): void {
    void this.router.navigate(['/admin/templates/setup']);
  }

  getStatus(status: number): TrangthaiLabel {
    return STATUS_MAP[status] ?? { color: 'default', text: 'Không xác định' };
  }

  canNotify(status: number): boolean {
    return status === 0 || status === 3;
  }

  canCancel(status: number): boolean {
    return status === 0 || status === 2 || status === 3;
  }

  cancelTemplate(t: CompanyTemplateVm): void {
    if (!this.canCancel(t.trangthaiPhatHanh)) return;
    
    // Add confirmation dialog
    this.modal.confirm({
      nzTitle: 'Xác nhận hủy mẫu',
      nzContent: `Bạn có chắc chắn muốn hủy mẫu <b>${t.kyhieu}</b> không?`,
      nzOkText: 'Hủy mẫu',
      nzOkDanger: true,
      nzOnOk: () => {
        this.cancelingId = t.id;
        this.facade.cancel(t.id).subscribe({
          next: () => {
            t.trangthaiPhatHanh = 4;
            this.cancelingId = null;
            this.message.success(`Đã hủy mẫu ${t.kyhieu}`);
            this.applyFilter(this.searchKeyword);
          },
          error: (e) => {
            this.cancelingId = null;
            this.apiError.show(e);
          }
        });
      },
      nzCancelText: 'Bỏ qua'
    });
  }

  getNotifyTooltip(status: number): string {
    if (status === 1) return 'Đang chờ phản hồi từ CQT';
    if (status === 2) return 'Đã được CQT chấp nhận';
    return 'Gửi thông báo phát hành lên Tổng cục Thuế';
  }

  notifyTax(t: CompanyTemplateVm): void {
    if (!this.canNotify(t.trangthaiPhatHanh)) return;
    this.notifyingId = t.id;
    this.facade.notifyTax(t.id).subscribe({
      next: () => {
        t.trangthaiPhatHanh = 1;
        this.notifyingId = null;
        this.message.success(`Đã gửi thông báo phát hành mẫu ${t.kyhieu} lên CQT`);
      },
      error: (e) => {
        t.trangthaiPhatHanh = 3;
        this.notifyingId = null;
        this.apiError.show(e);
      }
    });
  }

  openDetail(t: CompanyTemplateVm): void {
    this.selectedTemplate = t;
    this.detailVisible = true;
  }

  getStepCurrent(status: number): number {
    if (status === 0) return 0;
    if (status === 1) return 1;
    return 2;
  }

  getStepFinalDesc(status: number): string {
    if (status === 2) return 'CQT đã chấp nhận và cấp phép sử dụng mẫu';
    if (status === 3) return 'CQT từ chối do sai cấu trúc hoặc thiếu chữ ký số';
    return 'Chưa có phản hồi';
  }

  getStepFinalStatus(status: number): 'wait' | 'process' | 'finish' | 'error' {
    if (status === 2) return 'finish';
    if (status === 3) return 'error';
    if (status === 1) return 'process';
    return 'wait';
  }
}
