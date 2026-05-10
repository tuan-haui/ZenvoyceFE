import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ApiErrorService } from '../../core/services/api-error.service';
import {
  CompanyDto,
  CustomerDto,
  InvoiceFilters,
  InvoiceHistoryItemDto,
  InvoiceListItemDto,
  InvoiceFacadeService,
  ProductDto,
  TemplateDto
} from '../../core/services/invoice-facade.service';

type InvoiceStatus = 'Draft' | 'PendingSign' | 'Signed' | 'Issued' | 'Adjusted' | 'Replaced' | 'Cancelled';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  Draft: { label: 'Nháp', color: 'default' },
  PendingSign: { label: 'Chờ ký', color: 'processing' },
  Signed: { label: 'Đã ký', color: 'blue' },
  Issued: { label: 'Đã phát hành', color: 'success' },
  Adjusted: { label: 'Đã điều chỉnh', color: 'warning' },
  Replaced: { label: 'Thay thế', color: 'purple' },
  Cancelled: { label: 'Đã hủy', color: 'error' }
};

interface LineItemVm {
  hanghoaId: string;
  tenhanghoa: string;
  soluong: number;
  dongia: number;
  thueSuat: number;
  thanhtien: number;
}

@Component({
  selector: 'app-invoices-page',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzDrawerModule,
    NzModalModule,
    NzTagModule,
    NzIconModule,
    NzSpaceModule,
    NzSpinModule,
    NzPopconfirmModule,
    NzToolTipModule,
    NzDividerModule,
    NzDescriptionsModule,
    NzTimelineModule
  ],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Quản lý Hóa đơn</h2>
        <p class="page-subtitle">Tạo, ký số, phát hành và theo dõi toàn bộ vòng đời hóa đơn điện tử.</p>
      </div>
      <button nz-button nzType="primary" (click)="openCreateDrawer()">
        <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
        Tạo hóa đơn mới
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <nz-select
        [(ngModel)]="filters.trangthai"
        nzPlaceHolder="Tất cả trạng thái"
        nzAllowClear
        style="width: 200px"
        (ngModelChange)="loadInvoices()"
      >
        <nz-option *ngFor="let s of statusOptions" [nzValue]="s.value" [nzLabel]="s.label"></nz-option>
      </nz-select>

      <nz-range-picker
        [(ngModel)]="dateRange"
        nzFormat="dd/MM/yyyy"
        (ngModelChange)="onDateRangeChange($event)"
        style="width: 260px"
      ></nz-range-picker>

      <button nz-button (click)="resetFilters()">
        <nz-icon nzType="reload" nzTheme="outline"></nz-icon>
        Làm mới
      </button>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <nz-table
        #table
        [nzData]="invoices"
        [nzLoading]="loading"
        nzSize="middle"
        [nzScroll]="{ x: '1100px' }"
        [nzFrontPagination]="true"
        [nzPageSize]="15"
        [nzTemplateMode]="true"
      >
        <thead>
          <tr>
            <th nzWidth="130px">Số hóa đơn</th>
            <th nzWidth="120px">Ngày lập</th>
            <th>Khách hàng</th>
            <th nzWidth="140px" nzAlign="right">Tổng tiền hàng</th>
            <th nzWidth="120px" nzAlign="right">Tiền thuế</th>
            <th nzWidth="150px" nzAlign="right">Tổng thanh toán</th>
            <th nzWidth="140px" nzAlign="center">Trạng thái</th>
            <th nzWidth="210px" nzAlign="center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let inv of table.data" class="data-row">
            <td>
              <span class="invoice-number mono-text">{{ inv.sohoadon || '—' }}</span>
              <div class="invoice-kyhieu" *ngIf="inv.kyhieu">{{ inv.kyhieu }}</div>
            </td>
            <td class="mono-text">{{ inv.ngaylap | date:'dd/MM/yyyy' }}</td>
            <td>
              <span class="customer-name">{{ inv.tenKhachhang || getCustomerName(inv.khachhangId) }}</span>
            </td>
            <td nzAlign="right" class="amount-cell">{{ inv.tongtien | number:'1.0-0' }} đ</td>
            <td nzAlign="right" class="amount-cell tax-cell">{{ inv.tienthue | number:'1.0-0' }} đ</td>
            <td nzAlign="right" class="amount-cell total-cell"><strong>{{ inv.tongthanhtoan | number:'1.0-0' }} đ</strong></td>
            <td nzAlign="center">
              <nz-tag [nzColor]="getStatusColor(inv.trangthai)">{{ getStatusLabel(inv.trangthai) }}</nz-tag>
            </td>
            <td nzAlign="center">
              <div class="row-actions">
                <!-- Draft → Gửi chờ ký -->
                <button *ngIf="inv.trangthai === 'Draft'"
                  nz-button nzType="default" nzSize="small"
                  nz-tooltip nzTooltipTitle="Gửi chờ ký"
                  nz-popconfirm
                  nzPopconfirmTitle="Bạn có chắc chắn muốn gửi chờ ký hóa đơn này?"
                  nzPopconfirmPlacement="top"
                  (nzOnConfirm)="forward(inv)"
                  [nzLoading]="actionLoading === inv.id + '_forward'">
                  <nz-icon nzType="send" nzTheme="outline"></nz-icon>
                </button>

                <!-- Draft / PendingSign → Ký số -->
                <button *ngIf="inv.trangthai === 'Draft' || inv.trangthai === 'PendingSign'"
                  nz-button nzType="primary" nzSize="small"
                  nz-tooltip nzTooltipTitle="Ký số hóa đơn"
                  nz-popconfirm
                  nzPopconfirmTitle="Bạn có chắc chắn muốn ký số hóa đơn này?"
                  nzPopconfirmPlacement="top"
                  (nzOnConfirm)="sign(inv)"
                  [nzLoading]="actionLoading === inv.id + '_sign'">
                  <nz-icon nzType="audit" nzTheme="outline"></nz-icon>
                </button>

                <!-- Signed → Phát hành -->
                <button *ngIf="inv.trangthai === 'Signed'"
                  nz-button nzType="primary" nzSize="small"
                  nz-tooltip nzTooltipTitle="Phát hành hóa đơn"
                  nz-popconfirm
                  nzPopconfirmTitle="Bạn có chắc chắn muốn phát hành hóa đơn này?"
                  nzPopconfirmPlacement="top"
                  (nzOnConfirm)="publish(inv)"
                  [nzLoading]="actionLoading === inv.id + '_publish'">
                  <nz-icon nzType="cloud-upload" nzTheme="outline"></nz-icon>
                </button>

                <!-- Signed / Issued → Hủy -->
                <button *ngIf="inv.trangthai === 'Signed' || inv.trangthai === 'Issued'"
                  nz-button nzType="default" nzSize="small" nzDanger
                  nz-tooltip nzTooltipTitle="Hủy hóa đơn"
                  (click)="openCancelModal(inv)">
                  <nz-icon nzType="stop" nzTheme="outline"></nz-icon>
                </button>

                <!-- Issued → Gửi email -->
                <button *ngIf="inv.trangthai === 'Issued'"
                  nz-button nzType="default" nzSize="small"
                  nz-tooltip nzTooltipTitle="Gửi email cho khách"
                  nz-popconfirm
                  nzPopconfirmTitle="Bạn có chắc chắn muốn gửi email hóa đơn này cho khách?"
                  nzPopconfirmPlacement="top"
                  (nzOnConfirm)="sendEmail(inv)"
                  [nzLoading]="actionLoading === inv.id + '_email'">
                  <nz-icon nzType="mail" nzTheme="outline"></nz-icon>
                </button>

                <!-- Issued → Lập điều chỉnh -->
                <button *ngIf="inv.trangthai === 'Issued'"
                  nz-button nzType="link" nzSize="small"
                  nz-tooltip nzTooltipTitle="Lập hóa đơn điều chỉnh"
                  (click)="startAdjustment(inv)">
                  <nz-icon nzType="diff" nzTheme="outline"></nz-icon>
                </button>

                <!-- Xem trước PDF -->
                <button
                  nz-button nzType="text" nzSize="small"
                  nz-tooltip nzTooltipTitle="Xem trước PDF"
                  [nzLoading]="actionLoading === inv.id + '_preview'"
                  (click)="openPreviewModal(inv)">
                  <nz-icon nzType="file-pdf" nzTheme="outline"></nz-icon>
                </button>

                <!-- Lịch sử -->
                <button
                  nz-button nzType="text" nzSize="small"
                  nz-tooltip nzTooltipTitle="Xem lịch sử"
                  (click)="openHistoryModal(inv)">
                  <nz-icon nzType="history" nzTheme="outline"></nz-icon>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="invoices.length === 0 && !loading">
            <td colspan="8" class="empty-cell">
              <div class="empty-state">
                <nz-icon nzType="file-text" nzTheme="outline" class="empty-icon"></nz-icon>
                <p>Chưa có hóa đơn nào</p>
                <button nz-button nzType="primary" (click)="openCreateDrawer()">Tạo hóa đơn đầu tiên</button>
              </div>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </div>

    <!-- ===== DRAWER: Tạo hóa đơn mới ===== -->
    <nz-drawer
      [nzVisible]="createDrawerVisible"
      [nzTitle]="adjustSourceId ? 'Lập hóa đơn điều chỉnh (nháp)' : 'Tạo hóa đơn mới'"
      nzWidth="760px"
      [nzClosable]="true"
      (nzOnClose)="closeCreateDrawer()"
      [nzFooter]="createFooter"
    >
      <ng-container *nzDrawerContent>
        <nz-spin [nzSpinning]="loadingLookup">
          <form nz-form [formGroup]="createForm" nzLayout="vertical">
            <div class="form-row">
              <nz-form-item class="form-col">
                <nz-form-label nzRequired>Đơn vị</nz-form-label>
                <nz-form-control nzErrorTip="Vui lòng chọn đơn vị">
                  <nz-select
                    formControlName="donviId"
                    nzPlaceHolder="Chọn đơn vị"
                    (ngModelChange)="onCompanyChange($event)"
                  >
                    <nz-option *ngFor="let c of companies" [nzValue]="c.id" [nzLabel]="c.tendonvi || c.id"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item class="form-col">
                <nz-form-label nzRequired>Ngày lập</nz-form-label>
                <nz-form-control nzErrorTip="Vui lòng chọn ngày lập">
                  <nz-date-picker formControlName="ngaylap" nzFormat="dd/MM/yyyy" style="width:100%"></nz-date-picker>
                </nz-form-control>
              </nz-form-item>
            </div>

            <div class="form-row">
              <nz-form-item class="form-col">
                <nz-form-label nzRequired>Khách hàng</nz-form-label>
                <nz-form-control nzErrorTip="Vui lòng chọn khách hàng">
                  <nz-select
                    formControlName="khachhangId"
                    nzPlaceHolder="Chọn khách hàng"
                    nzShowSearch
                  >
                    <nz-option *ngFor="let kh of customers" [nzValue]="kh.id" [nzLabel]="kh.tenkhachhang || kh.id"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>

              <nz-form-item class="form-col">
                <nz-form-label nzRequired>Mẫu hóa đơn</nz-form-label>
                <nz-form-control nzErrorTip="Vui lòng chọn mẫu hóa đơn">
                  <nz-select formControlName="mauctyId" nzPlaceHolder="Chọn mẫu">
                    <nz-option *ngFor="let t of templates" [nzValue]="t.id" [nzLabel]="(t.kyhieuMau || '') + ' - ' + (t.loaiHoadon || '')"></nz-option>
                  </nz-select>
                </nz-form-control>
              </nz-form-item>
            </div>


            <nz-divider nzText="Danh sách hàng hóa / dịch vụ"></nz-divider>

            <!-- Line items -->
            <div formArrayName="hanghoas">
              <div *ngFor="let line of hanghoasArray.controls; let i = index" [formGroupName]="i" class="line-item">
                <nz-form-item style="flex:2; margin-bottom:0">
                  <nz-form-control>
                    <nz-select
                      formControlName="hanghoaId"
                      nzPlaceHolder="Chọn hàng hóa"
                      nzShowSearch
                      (ngModelChange)="onProductChange(i, $event)"
                    >
                      <nz-option *ngFor="let p of products" [nzValue]="p.id" [nzLabel]="p.tenhanghoa || p.id"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item style="width:90px; margin-bottom:0">
                  <nz-form-control>
                    <nz-input-number
                      formControlName="soluong"
                      [nzMin]="0.01"
                      [nzStep]="1"
                      nzPlaceHolder="SL"
                      style="width:100%"
                      (ngModelChange)="recalcLine(i)"
                    ></nz-input-number>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item style="width:130px; margin-bottom:0">
                  <nz-form-control>
                    <nz-input-number
                      formControlName="dongia"
                      [nzMin]="0"
                      [nzStep]="1000"
                      [nzFormatter]="formatCurrency"
                      nzPlaceHolder="Đơn giá"
                      style="width:100%"
                      (ngModelChange)="recalcLine(i)"
                    ></nz-input-number>
                  </nz-form-control>
                </nz-form-item>

                <nz-form-item style="width:80px; margin-bottom:0">
                  <nz-form-control>
                    <nz-select formControlName="thueSuat" (ngModelChange)="recalcLine(i)">
                      <nz-option [nzValue]="0" nzLabel="0%"></nz-option>
                      <nz-option [nzValue]="5" nzLabel="5%"></nz-option>
                      <nz-option [nzValue]="8" nzLabel="8%"></nz-option>
                      <nz-option [nzValue]="10" nzLabel="10%"></nz-option>
                    </nz-select>
                  </nz-form-control>
                </nz-form-item>

                <div class="line-amount">{{ getLineTotal(i) | number:'1.0-0' }} đ</div>

                <button nz-button nzType="text" nzDanger nzSize="small" (click)="removeLine(i)" [disabled]="hanghoasArray.length === 1">
                  <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                </button>
              </div>
            </div>

            <button nz-button nzType="dashed" style="width:100%;margin-top:8px" (click)="addLine()">
              <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
              Thêm dòng hàng hóa
            </button>

            <!-- Totals summary -->
            <div class="totals-section">
              <div class="total-row">
                <span>Tổng tiền hàng:</span>
                <strong>{{ totalTongtien | number:'1.0-0' }} đ</strong>
              </div>
              <div class="total-row">
                <span>Tổng tiền thuế:</span>
                <strong class="tax-color">{{ totalTienthue | number:'1.0-0' }} đ</strong>
              </div>
              <nz-divider style="margin:8px 0"></nz-divider>
              <div class="total-row grand-total">
                <span>Tổng thanh toán:</span>
                <strong class="grand-color">{{ totalTongthanhtoan | number:'1.0-0' }} đ</strong>
              </div>
            </div>
          </form>
        </nz-spin>
      </ng-container>

      <ng-template #createFooter>
        <div class="drawer-footer">
          <button nz-button nzType="default" (click)="closeCreateDrawer()">Hủy</button>
          <button nz-button nzType="default" (click)="previewBeforeCreate()" [nzLoading]="previewLoading && createDrawerVisible">
            <nz-icon nzType="eye" nzTheme="outline"></nz-icon>
            Xem trước
          </button>
          <button nz-button nzType="primary" (click)="submitCreate()" [nzLoading]="saving">
            Tạo hóa đơn
          </button>
        </div>
      </ng-template>
    </nz-drawer>

    <!-- ===== MODAL: Hủy hóa đơn ===== -->
    <nz-modal
      [(nzVisible)]="cancelModalVisible"
      nzTitle="Hủy hóa đơn"
      (nzOnCancel)="closeCancelModal()"
      (nzOnOk)="submitCancel()"
      [nzOkLoading]="cancelLoading"
      nzOkDanger
      nzOkText="Xác nhận hủy"
    >
      <ng-container *nzModalContent>
        <p>Hóa đơn số <strong>{{ cancelTarget?.sohoadon || '—' }}</strong> sẽ bị hủy. Hành động này không thể hoàn tác.</p>
        <nz-form-item>
          <nz-form-label nzRequired>Lý do hủy</nz-form-label>
          <nz-form-control>
            <textarea
              nz-input
              [(ngModel)]="cancelReason"
              placeholder="Nhập lý do hủy hóa đơn..."
              [nzAutosize]="{ minRows: 3, maxRows: 5 }"
            ></textarea>
          </nz-form-control>
        </nz-form-item>
      </ng-container>
    </nz-modal>

    <!-- ===== MODAL: Xem trước PDF ===== -->
    <nz-modal
      [(nzVisible)]="previewModalVisible"
      [nzTitle]="previewTitle"
      [nzFooter]="previewFooter"
      nzWidth="1000px"
      [nzBodyStyle]="{ padding: '0' }"
      (nzOnCancel)="closePreviewModal()"
    >
      <ng-container *nzModalContent>
        <nz-spin [nzSpinning]="previewLoading" nzTip="Đang render PDF...">
          <iframe
            *ngIf="previewSafeUrl"
            [src]="previewSafeUrl"
            class="pdf-preview-frame"
            title="Invoice PDF preview"
          ></iframe>
          <div *ngIf="!previewSafeUrl && !previewLoading" class="empty-state" style="padding: 60px">
            <nz-icon nzType="file-pdf" nzTheme="outline" class="empty-icon"></nz-icon>
            <p>Chưa có dữ liệu xem trước</p>
          </div>
        </nz-spin>
      </ng-container>
      <ng-template #previewFooter>
        <button nz-button (click)="closePreviewModal()">Đóng</button>
        <button nz-button nzType="primary" [disabled]="!previewBlob" (click)="downloadPreview()">
          <nz-icon nzType="download" nzTheme="outline"></nz-icon>
          Tải về PDF
        </button>
      </ng-template>
    </nz-modal>

    <!-- ===== MODAL: Lịch sử hóa đơn ===== -->
    <nz-modal
      [(nzVisible)]="historyModalVisible"
      nzTitle="Lịch sử hóa đơn"
      [nzFooter]="null"
      nzWidth="600px"
      (nzOnCancel)="historyModalVisible = false"
    >
      <ng-container *nzModalContent>
        <nz-spin [nzSpinning]="historyLoading">
          <nz-timeline *ngIf="historyItems.length > 0">
            <nz-timeline-item *ngFor="let h of historyItems" [nzColor]="getHistoryColor(h.trangthaimoi)">
              <p class="history-action"><strong>{{ h.hanhdong }}</strong></p>
              <p class="history-meta">
                <nz-tag *ngIf="h.trangthaicu" nzColor="default">{{ getStatusLabel(h.trangthaicu) }}</nz-tag>
                <span *ngIf="h.trangthaicu && h.trangthaimoi"> → </span>
                <nz-tag *ngIf="h.trangthaimoi" [nzColor]="getStatusColor(h.trangthaimoi)">{{ getStatusLabel(h.trangthaimoi) }}</nz-tag>
              </p>
              <p class="history-time">{{ h.thoigian | date:'dd/MM/yyyy HH:mm:ss' }}</p>
            </nz-timeline-item>
          </nz-timeline>
          <div *ngIf="historyItems.length === 0 && !historyLoading" class="empty-state" style="padding: 20px">
            <p>Chưa có lịch sử</p>
          </div>
        </nz-spin>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .page-title { margin: 0; font-size: 22px; font-weight: 600; color: #262626; }
    .page-subtitle { margin: 4px 0 0; color: #8c8c8c; font-size: 14px; }

    .filter-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
      padding: 14px 16px;
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
    }

    .table-card {
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .mono-text { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; }
    .invoice-number { font-weight: 600; color: var(--app-primary, #1677ff); }
    .invoice-kyhieu { font-size: 11px; color: #8c8c8c; margin-top: 2px; }
    .customer-name { font-weight: 500; color: #262626; }
    .amount-cell { font-size: 13px; color: #434343; }
    .tax-cell { color: #8c8c8c; }
    .total-cell { color: #262626; }

    .row-actions {
      display: flex;
      justify-content: center;
      gap: 4px;
    }

    .empty-cell { text-align: center; padding: 48px !important; }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      color: #bfbfbf; gap: 12px;
    }
    .empty-icon { font-size: 48px; }

    .pdf-preview-frame {
      width: 100%;
      height: 75vh;
      border: 0;
      display: block;
      background: #525659;
    }

    .form-row { display: flex; gap: 16px; }
    .form-col { flex: 1; }

    .line-item {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-bottom: 8px;
      padding: 10px 12px;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
    }
    .line-amount {
      width: 130px;
      text-align: right;
      font-weight: 600;
      color: #262626;
      font-size: 13px;
      padding-top: 6px;
      flex-shrink: 0;
    }

    .totals-section {
      margin-top: 16px;
      padding: 14px 16px;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 14px;
    }
    .grand-total { font-size: 16px; }
    .tax-color { color: #fa8c16; }
    .grand-color { color: #52c41a; font-size: 18px; }

    .drawer-footer { display: flex; justify-content: flex-end; gap: 10px; }

    .history-action { margin: 0; font-size: 14px; color: #262626; }
    .history-meta { margin: 4px 0; }
    .history-time { margin: 0; font-size: 12px; color: #8c8c8c; }

    /* ── Dark mode ── */
    :host-context(html.dark-mode) .page-title { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .filter-bar {
      background: #262626;
      border-color: rgba(255,255,255,0.1);
    }
    :host-context(html.dark-mode) .table-card {
      background: #1f1f1f;
      border-color: rgba(255,255,255,0.1);
    }
    :host-context(html.dark-mode) .customer-name { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .invoice-kyhieu { color: rgba(255,255,255,0.4); }
    :host-context(html.dark-mode) .amount-cell { color: rgba(255,255,255,0.75); }
    :host-context(html.dark-mode) .total-cell { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .empty-state { color: rgba(255,255,255,0.25); }
    :host-context(html.dark-mode) .line-item {
      background: #262626;
      border-color: rgba(255,255,255,0.1);
    }
    :host-context(html.dark-mode) .line-amount { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .totals-section {
      background: rgba(82,196,26,0.1);
      border-color: rgba(82,196,26,0.25);
    }
    :host-context(html.dark-mode) .history-action { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .history-time { color: rgba(255,255,255,0.45); }
  `]
})
export class InvoicesPageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  // List state
  invoices: InvoiceListItemDto[] = [];
  loading = false;
  actionLoading: string | null = null;

  // Filters
  filters: InvoiceFilters = {};
  dateRange: [Date, Date] | null = null;

  // Lookup data
  companies: CompanyDto[] = [];
  customers: CustomerDto[] = [];
  products: ProductDto[] = [];
  templates: TemplateDto[] = [];
  customerMap = new Map<string, string>();
  loadingLookup = false;

  // Create drawer
  createDrawerVisible = false;
  saving = false;
  /** Hóa đơn gốc khi lập điều chỉnh */
  adjustSourceId: string | null = null;

  createForm = this.fb.group({
    donviId: ['', Validators.required],
    khachhangId: ['', Validators.required],
    mauctyId: ['', Validators.required],
    ngaylap: [new Date(), Validators.required],
    hanghoas: this.fb.array([this.buildLineGroup()])
  });

  // Cancel modal
  cancelModalVisible = false;
  cancelTarget: InvoiceListItemDto | null = null;
  cancelReason = '';
  cancelLoading = false;

  // History modal
  historyModalVisible = false;
  historyItems: InvoiceHistoryItemDto[] = [];
  historyLoading = false;

  // Preview PDF modal
  previewModalVisible = false;
  previewLoading = false;
  previewBlob: Blob | null = null;
  previewBlobUrl: string | null = null;
  previewSafeUrl: SafeResourceUrl | null = null;
  previewTitle = 'Xem trước hóa đơn (PDF)';
  previewFilename = 'invoice.pdf';

  readonly statusOptions = Object.entries(STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }));
  readonly formatCurrency = (val: number) => `${val?.toLocaleString('vi-VN') ?? 0}`;

  constructor(
    private readonly facade: InvoiceFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService,
    private readonly sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadInvoices();
  }

  // ---- Totals ----

  get hanghoasArray(): FormArray { return this.createForm.get('hanghoas') as FormArray; }

  get totalTongtien(): number {
    return this.hanghoasArray.controls.reduce((sum, g) => {
      return sum + this.getLineTotal(this.hanghoasArray.controls.indexOf(g));
    }, 0);
  }

  get totalTienthue(): number {
    return this.hanghoasArray.controls.reduce((sum, g, i) => {
      const line = g.value;
      return sum + (this.getLineTotal(i) * (line.thueSuat || 0) / 100);
    }, 0);
  }

  get totalTongthanhtoan(): number { return this.totalTongtien + this.totalTienthue; }

  getLineTotal(i: number): number {
    const line = this.hanghoasArray.at(i).value;
    return (line.soluong || 0) * (line.dongia || 0);
  }

  // ---- Data loading ----

  loadInvoices(): void {
    this.loading = true;
    this.facade.getInvoices(this.filters).subscribe({
      next: (data) => {
        this.invoices = data;
        this.loading = false;
      },
      error: (e) => { this.apiError.show(e); this.loading = false; }
    });
  }

  loadCompanies(): void {
    this.facade.getCompanies().subscribe({
      next: (data) => { this.companies = data; },
      error: () => { }
    });
  }

  onCompanyChange(donviId: string): void {
    if (!donviId) return;
    this.loadingLookup = true;
    this.customers = [];
    this.products = [];
    this.templates = [];
    this.createForm.patchValue({ khachhangId: '', mauctyId: '' });

    this.facade.getCustomers(donviId).subscribe({ next: (d) => { this.customers = d; this.buildCustomerMap(); } });
    this.facade.getProducts(donviId).subscribe({ next: (d) => { this.products = d; } });
    this.facade.getTemplates(donviId).subscribe({
      next: (d) => {
        this.templates = d.filter(t => t.trangthaiPhatHanh === 2);
        this.loadingLookup = false;
      },
      error: () => { this.loadingLookup = false; }
    });
  }

  buildCustomerMap(): void {
    this.customerMap.clear();
    this.customers.forEach(c => this.customerMap.set(c.id, c.tenkhachhang || c.id));
    this.invoices.forEach(inv => {
      if (!this.customerMap.has(inv.khachhangId)) {
        this.customerMap.set(inv.khachhangId, inv.khachhangId.slice(0, 8) + '...');
      }
    });
  }

  getCustomerName(id: string): string {
    return this.customerMap.get(id) || id.slice(0, 8) + '...';
  }

  // ---- Filters ----

  onDateRangeChange(range: [Date, Date] | null): void {
    if (range) {
      this.filters.tuNgay = range[0];
      this.filters.denNgay = range[1];
    } else {
      delete this.filters.tuNgay;
      delete this.filters.denNgay;
    }
    this.loadInvoices();
  }

  resetFilters(): void {
    this.filters = {};
    this.dateRange = null;
    this.loadInvoices();
  }

  // ---- Status helpers ----

  getStatusLabel(status?: string | null): string {
    return STATUS_CONFIG[status ?? '']?.label ?? status ?? '—';
  }

  getStatusColor(status?: string | null): string {
    return STATUS_CONFIG[status ?? '']?.color ?? 'default';
  }

  getHistoryColor(status?: string | null): string {
    const map: Record<string, string> = {
      Draft: 'gray', PendingSign: 'blue', Signed: 'blue',
      Issued: 'green', Cancelled: 'red'
    };
    return map[status ?? ''] ?? 'gray';
  }

  // ---- Create drawer ----

  openCreateDrawer(): void {
    this.adjustSourceId = null;
    this.createForm.reset({
      donviId: '', khachhangId: '', mauctyId: '',
      ngaylap: new Date()
    });
    while (this.hanghoasArray.length > 1) this.hanghoasArray.removeAt(this.hanghoasArray.length - 1);
    this.hanghoasArray.at(0).reset({ hanghoaId: '', soluong: 1, dongia: 0, thueSuat: 10 });
    this.customers = [];
    this.products = [];
    this.templates = [];
    this.loadCompanies();
    this.createDrawerVisible = true;
  }

  closeCreateDrawer(): void {
    this.createDrawerVisible = false;
    this.adjustSourceId = null;
  }

  startAdjustment(inv: InvoiceListItemDto): void {
    this.adjustSourceId = inv.id;
    this.createForm.reset({
      donviId: inv.donviId,
      khachhangId: inv.khachhangId,
      mauctyId: inv.mauctyId,
      ngaylap: new Date()
    });
    while (this.hanghoasArray.length > 1) this.hanghoasArray.removeAt(this.hanghoasArray.length - 1);
    this.hanghoasArray.at(0).reset({ hanghoaId: '', soluong: 1, dongia: 0, thueSuat: 10 });
    this.loadCompanies();
    this.onCompanyChange(inv.donviId);
    this.createDrawerVisible = true;
  }

  buildLineGroup() {
    return this.fb.group({
      hanghoaId: ['', Validators.required],
      soluong: [1, [Validators.required, Validators.min(0.01)]],
      dongia: [0, [Validators.required, Validators.min(0)]],
      thueSuat: [10]
    });
  }

  addLine(): void { this.hanghoasArray.push(this.buildLineGroup()); }

  removeLine(i: number): void {
    if (this.hanghoasArray.length > 1) this.hanghoasArray.removeAt(i);
  }

  onProductChange(lineIndex: number, productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      this.hanghoasArray.at(lineIndex).patchValue({
        dongia: product.dongia,
        thueSuat: product.thuesuat ?? 10
      });
    }
  }

  recalcLine(_i: number): void { /* auto-computed via getLineTotal */ }

  previewBeforeCreate(): void {
    if (this.createForm.invalid) {
      Object.values(this.createForm.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      this.hanghoasArray.controls.forEach(g => {
        Object.values((g as any).controls).forEach((c: any) => {
          c.markAsDirty();
          c.updateValueAndValidity({ onlySelf: true });
        });
      });
      this.message.warning('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const raw = this.createForm.getRawValue();
    const payload = {
      donviId: raw.donviId!,
      khachhangId: raw.khachhangId!,
      mauctyId: raw.mauctyId!,
      ngaylap: (raw.ngaylap as Date).toISOString(),
      hanghoas: (raw.hanghoas as any[]).map(l => ({
        hanghoaId: l.hanghoaId,
        soluong: l.soluong,
        dongia: l.dongia,
        thueSuat: l.thueSuat ?? 0
      }))
    };

    this.previewTitle = 'Xem trước hóa đơn dự kiến (PDF)';
    this.previewModalVisible = true;
    this.previewLoading = true;
    this.releasePreviewBlob();

    this.facade.previewInvoicePdfFromData(payload).subscribe({
      next: (blob) => {
        this.previewBlob = blob;
        this.previewBlobUrl = URL.createObjectURL(blob);
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewBlobUrl);
        this.previewFilename = `hoadon-preview.pdf`;
        this.previewLoading = false;
      },
      error: (e) => {
        this.previewLoading = false;
        this.apiError.show(e);
      }
    });
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      Object.values(this.createForm.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      this.hanghoasArray.controls.forEach(g => {
        Object.values((g as any).controls).forEach((c: any) => {
          c.markAsDirty();
          c.updateValueAndValidity({ onlySelf: true });
        });
      });
      this.message.warning('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const raw = this.createForm.getRawValue();
    const payload = {
      donviId: raw.donviId!,
      khachhangId: raw.khachhangId!,
      mauctyId: raw.mauctyId!,
      ngaylap: (raw.ngaylap as Date).toISOString(),
      hanghoas: (raw.hanghoas as any[]).map(l => ({
        hanghoaId: l.hanghoaId,
        soluong: l.soluong,
        dongia: l.dongia,
        thueSuat: l.thueSuat ?? 0
      }))
    };

    this.saving = true;
    const req$ =
      this.adjustSourceId != null
        ? this.facade.createAdjustmentInvoice(this.adjustSourceId, payload)
        : this.facade.createInvoice(payload);
    req$.subscribe({
      next: (result) => {
        this.saving = false;
        this.closeCreateDrawer();
        this.message.success(this.adjustSourceId ? 'Đã tạo hóa đơn điều chỉnh (nháp).' : 'Tạo hóa đơn thành công!');
        this.loadInvoices();
        if (result?.id) {
          this.openPreviewModalById(result.id, 'Xem trước hóa đơn vừa tạo (PDF)');
        }
      },
      error: (e) => {
        this.saving = false;
        this.apiError.show(e);
      }
    });
  }

  // ---- Preview PDF ----

  openPreviewModal(inv: InvoiceListItemDto): void {
    const title = inv.sohoadon
      ? `Xem trước hóa đơn ${inv.sohoadon} (PDF)`
      : 'Xem trước hóa đơn (PDF)';
    this.openPreviewModalById(inv.id, title);
  }

  private openPreviewModalById(invoiceId: string, title: string): void {
    this.previewTitle = title;
    this.previewModalVisible = true;
    this.previewLoading = true;
    this.releasePreviewBlob();
    this.actionLoading = invoiceId + '_preview';

    this.facade.previewInvoicePdf(invoiceId).subscribe({
      next: (blob) => {
        this.previewBlob = blob;
        this.previewBlobUrl = URL.createObjectURL(blob);
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewBlobUrl);
        this.previewFilename = `hoadon-${invoiceId}.pdf`;
        this.previewLoading = false;
        this.actionLoading = null;
      },
      error: (e) => {
        this.previewLoading = false;
        this.actionLoading = null;
        this.apiError.show(e);
      }
    });
  }

  closePreviewModal(): void {
    this.previewModalVisible = false;
    this.releasePreviewBlob();
  }

  downloadPreview(): void {
    if (!this.previewBlob || !this.previewBlobUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = this.previewBlobUrl;
    link.download = this.previewFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private releasePreviewBlob(): void {
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
    }
    this.previewBlob = null;
    this.previewBlobUrl = null;
    this.previewSafeUrl = null;
  }

  ngOnDestroy(): void {
    this.releasePreviewBlob();
  }

  // ---- Actions ----

  forward(inv: InvoiceListItemDto): void {
    this.actionLoading = inv.id + '_forward';
    this.facade.forwardInvoice(inv.id).subscribe({
      next: () => {
        inv.trangthai = 'PendingSign';
        this.actionLoading = null;
        this.message.success('Đã gửi hóa đơn chờ ký.');
      },
      error: (e) => { this.actionLoading = null; this.apiError.show(e); }
    });
  }

  sign(inv: InvoiceListItemDto): void {
    this.actionLoading = inv.id + '_sign';
    this.facade.signInvoice(inv.id).subscribe({
      next: () => {
        inv.trangthai = 'Signed';
        this.actionLoading = null;
        this.message.success('Ký số hóa đơn thành công.');
      },
      error: (e) => { this.actionLoading = null; this.apiError.show(e); }
    });
  }

  publish(inv: InvoiceListItemDto): void {
    this.actionLoading = inv.id + '_publish';
    this.facade.publishInvoice(inv.id).subscribe({
      next: (result) => {
        inv.trangthai = 'Issued';
        inv.sohoadon = result.soHoadon;
        this.actionLoading = null;
        this.message.success(`Phát hành thành công! Số hóa đơn: ${result.soHoadon}`);
      },
      error: (e) => {
        this.actionLoading = null;
        this.apiError.show(e);
      }
    });
  }

  sendEmail(inv: InvoiceListItemDto): void {
    this.actionLoading = inv.id + '_email';
    this.facade.sendInvoiceEmail(inv.id).subscribe({
      next: (r) => {
        this.actionLoading = null;
        this.message.success(r.message ?? 'Đã gửi email.');
      },
      error: (e) => {
        this.actionLoading = null;
        this.apiError.show(e);
      }
    });
  }

  // ---- Cancel ----

  openCancelModal(inv: InvoiceListItemDto): void {
    this.cancelTarget = inv;
    this.cancelReason = '';
    this.cancelModalVisible = true;
  }

  closeCancelModal(): void {
    this.cancelModalVisible = false;
    this.cancelTarget = null;
  }

  submitCancel(): void {
    if (!this.cancelReason.trim()) {
      this.message.warning('Vui lòng nhập lý do hủy.');
      return;
    }
    this.cancelLoading = true;
    this.facade.cancelInvoice(this.cancelTarget!.id, this.cancelReason).subscribe({
      next: () => {
        this.cancelTarget!.trangthai = 'Cancelled';
        this.cancelLoading = false;
        this.cancelModalVisible = false;
        this.message.success('Hóa đơn đã được hủy.');
      },
      error: (e) => { this.cancelLoading = false; this.apiError.show(e); }
    });
  }

  // ---- History ----

  openHistoryModal(inv: InvoiceListItemDto): void {
    this.historyItems = [];
    this.historyModalVisible = true;
    this.historyLoading = true;
    this.facade.getInvoiceHistory(inv.id).subscribe({
      next: (data) => { this.historyItems = data; this.historyLoading = false; },
      error: (e) => { this.historyLoading = false; this.apiError.show(e); }
    });
  }
}
