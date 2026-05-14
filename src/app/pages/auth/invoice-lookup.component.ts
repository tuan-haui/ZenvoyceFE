import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzUploadModule, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { Subscription } from 'rxjs';
import { ApiErrorService } from '../../core/services/api-error.service';
import { InvoiceFacadeService, InvoiceListItemDto, VerifyInvoiceXmlSignatureResultDto } from '../../core/services/invoice-facade.service';

@Component({
  selector: 'app-invoice-lookup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzCardModule,
    NzTabsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzTableModule,
    NzTagModule,
    NzIconModule,
    NzModalModule,
    NzSpinModule,
    NzUploadModule,
    NzAlertModule,
    NzResultModule,
    NzDescriptionsModule,
    NzDividerModule
  ],
  template: `
    <div class="lookup-page">
      <!-- Animated background -->
      <div class="bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <!-- Header -->
      <div class="page-header">
        <a class="brand" routerLink="/">
          <span class="brand-name">Phần mềm quản lý hoá đơn Zenvoyce</span>
        </a>
        <h1 class="page-title">Tra cứu & kiểm tra hóa đơn</h1>
        <p class="page-subtitle">Tra cứu thông tin hóa đơn điện tử và kiểm tra tính hợp lệ của chữ ký số.</p>
      </div>

      <!-- Main card -->
      <nz-card class="main-card" [nzBordered]="false">
        <nz-tabset nzCentered nzSize="large">

          <!-- TAB 1: TRA CỨU -->
          <nz-tab nzTitle="Tra cứu hóa đơn">
            <ng-template nz-tab>
              <div class="tab-content">
                <form nz-form [formGroup]="searchForm" (ngSubmit)="onSearch()" nzLayout="vertical" class="search-form">
                  <div class="form-row">
                    <div>
                      <label class="field-label">Số hóa đơn</label>
                      <input nz-input formControlName="soHoadon" placeholder="Ví dụ: HD01-14052026" />
                    </div>
                    <div>
                      <label class="field-label">Mã số thuế bên bán</label>
                      <input nz-input formControlName="maSoThue" placeholder="Mã số thuế doanh nghiệp" />
                    </div>
                  </div>

                  <button nz-button nzType="primary" nzBlock class="search-btn" [nzLoading]="searching" [disabled]="searchForm.invalid">
                    <nz-icon nzType="search" nzTheme="outline"></nz-icon>
                    Tìm kiếm hóa đơn
                  </button>
                  <p class="form-hint" *ngIf="searchForm.invalid && (searchForm.get('soHoadon')?.dirty || searchForm.get('maSoThue')?.dirty)">
                    * Vui lòng nhập ít nhất số hóa đơn hoặc mã số thuế.
                  </p>
                </form>

                <div class="results-section" *ngIf="hasSearched">
                  <nz-divider></nz-divider>
                  <nz-table #basicTable [nzData]="results" [nzLoading]="searching" nzSize="middle" [nzFrontPagination]="true" [nzShowPagination]="results.length > 10">
                    <thead>
                      <tr>
                        <th>Số hóa đơn</th>
                        <th>Ngày lập</th>
                        <th>Tổng thanh toán</th>
                        <th>Trạng thái</th>
                        <th nzAlign="center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let data of basicTable.data">
                        <td><span class="mono">{{ data.sohoadon }}</span></td>
                        <td>{{ data.ngaylap | date:'dd/MM/yyyy' }}</td>
                        <td><span class="amount">{{ data.tongthanhtoan | number:'1.0-0' }} đ</span></td>
                        <td>
                          <nz-tag [nzColor]="getStatusColor(data.trangthai)">{{ getStatusLabel(data.trangthai) }}</nz-tag>
                        </td>
                         <td nzAlign="center">
                           <div class="action-btns">
                             <button nz-button nzType="link" class="view-pdf-btn" (click)="viewPdf(data)">
                               <nz-icon nzType="file-pdf" nzTheme="outline"></nz-icon>
                               Xem PDF
                             </button>
                             <button nz-button nzType="link" class="download-xml-btn" (click)="downloadXml(data)" [nzLoading]="xmlDownloading[data.id]">
                               <nz-icon nzType="file-zip" nzTheme="outline"></nz-icon>
                               Tải về XML
                             </button>
                           </div>
                         </td>
                      </tr>
                    </tbody>
                  </nz-table>
                  <div *ngIf="results.length === 0 && !searching" class="no-results">
                    <nz-result nzStatus="404" nzTitle="Không tìm thấy hóa đơn" nzSubTitle="Vui lòng kiểm tra lại thông tin tìm kiếm.">
                    </nz-result>
                  </div>
                </div>
              </div>
            </ng-template>
          </nz-tab>

          <!-- TAB 2: KIỂM TRA CHỮ KÝ -->
          <nz-tab nzTitle="Kiểm tra chữ ký số">
            <ng-template nz-tab>
              <div class="tab-content">
                <div class="verify-section">
                  <div class="verify-icon">
                    <nz-icon nzType="safety-certificate" nzTheme="outline"></nz-icon>
                  </div>
                  <h3 class="verify-title">Xác thực chữ ký số hóa đơn</h3>
                  <p class="verify-hint">Tải lên tệp hóa đơn định dạng <strong>.xml</strong> để kiểm tra tính hợp lệ của chữ ký số và chứng thư số.</p>

                  <div class="upload-zone">
                    <nz-upload
                      nzType="drag"
                      [nzMultiple]="false"
                      [nzBeforeUpload]="beforeUpload"
                      [nzCustomRequest]="handleUpload"
                      [nzShowUploadList]="false"
                    >
                      <p class="ant-upload-drag-icon">
                        <nz-icon nzType="cloud-upload" nzTheme="outline"></nz-icon>
                      </p>
                      <p class="ant-upload-text">Nhấp hoặc kéo tệp XML vào đây</p>
                      <p class="ant-upload-hint">Chỉ chấp nhận tệp .xml hóa đơn điện tử</p>
                    </nz-upload>
                  </div>

                  <div class="spin-center" *ngIf="verifying">
                    <nz-spin nzTip="Đang xác thực chữ ký số..."></nz-spin>
                  </div>

                  <div class="verify-result" *ngIf="verifyResult">
                    <nz-alert
                      [nzType]="verifyResult.isValid ? 'success' : 'error'"
                      [nzMessage]="verifyResult.isValid ? 'Chữ ký số Hợp lệ' : 'Chữ ký số Không hợp lệ'"
                      [nzDescription]="verifyResult.message || ''"
                      nzShowIcon
                    ></nz-alert>

                    <nz-descriptions nzTitle="Thông tin chứng thư số" [nzColumn]="1" nzBordered class="verify-details" *ngIf="verifyResult.signerSubject">
                      <nz-descriptions-item nzTitle="Đơn vị ký">{{ verifyResult.signerSubject }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="Số hiệu chứng thư">{{ verifyResult.certificateSerialNumber }}</nz-descriptions-item>
                      <nz-descriptions-item nzTitle="Thời gian ký">{{ verifyResult.signedAtUtc | date:'dd/MM/yyyy HH:mm:ss' }}</nz-descriptions-item>
                    </nz-descriptions>

                    <div class="error-list" *ngIf="verifyResult.errors && verifyResult.errors.length > 0">
                      <h4>Chi tiết lỗi:</h4>
                      <ul>
                        <li *ngFor="let err of verifyResult.errors">{{ err }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </ng-template>
          </nz-tab>

        </nz-tabset>

        <div class="tab-content page-footer">
          <button nz-button nzType="link" class="back-btn" routerLink="/auth/login">
            <nz-icon nzType="arrow-left" nzTheme="outline"></nz-icon>
            Quay lại trang đăng nhập
          </button>
        </div>
      </nz-card>
    </div>

    <!-- PDF PREVIEW MODAL -->
    <nz-modal
      [(nzVisible)]="pdfVisible"
      [nzTitle]="pdfTitle"
      [nzFooter]="pdfFooter"
      nzWidth="1000px"
      (nzOnCancel)="closePdf()"
      [nzBodyStyle]="{ padding: '0' }"
    >
      <ng-container *nzModalContent>
        <nz-spin [nzSpinning]="pdfLoading">
          <iframe *ngIf="pdfUrl" [src]="pdfUrl" class="pdf-frame"></iframe>
        </nz-spin>
      </ng-container>
      <ng-template #pdfFooter>
        <button nz-button (click)="closePdf()">Đóng</button>
        <button nz-button nzType="primary" (click)="downloadPdf()" [disabled]="!pdfBlob">
          <nz-icon nzType="download" nzTheme="outline"></nz-icon>
          Tải về PDF
        </button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :host { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; display: block; }

    .lookup-page {
      min-height: 100vh;
      background: linear-gradient(145deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .bg-orbs {
      position: absolute; inset: 0; pointer-events: none; z-index: 0;
    }
    .orb {
      position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.18;
      animation: float 8s ease-in-out infinite;
    }
    .orb-1 { width: 450px; height: 450px; background: #2563eb; top: -120px; left: -100px; animation-delay: 0s; }
    .orb-2 { width: 380px; height: 380px; background: #7c3aed; bottom: -80px; right: -80px; animation-delay: 2s; }
    .orb-3 { width: 280px; height: 280px; background: #06b6d4; top: 40%; left: 60%; animation-delay: 4s; }

    @keyframes float {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-30px) scale(1.05); }
    }

    .page-header {
      position: relative; z-index: 1; text-align: center; padding: 48px 24px 0;
    }
    .brand { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; text-decoration: none; margin-bottom: 20px; }
    .brand-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 800; color: #fff;
      box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
    }
    .brand-name { font-size: 26px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }

    .page-title {
      font-size: 32px; font-weight: 700; margin: 0 0 8px;
      background: linear-gradient(135deg, #1e293b 0%, #2563eb 60%, #7c3aed 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .page-subtitle { color: #64748b; font-size: 15px; margin: 0; max-width: 500px; display: inline-block; }

    .main-card {
      position: relative; z-index: 1; width: 100%; max-width: 880px; margin: 32px 24px 48px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(37, 99, 235, 0.08), 0 2px 12px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    :host ::ng-deep .main-card > .ant-card-body { padding: 0; }

    .tab-content { padding: 32px 36px 36px; }

    :host ::ng-deep .ant-tabs-nav { padding: 0 36px; margin-bottom: 0; background: #f8faff; }
    :host ::ng-deep .ant-tabs-nav::before { border-color: #e2e8f0 !important; }
    :host ::ng-deep .ant-tabs-tab { color: #64748b !important; font-weight: 500; font-size: 15px; padding: 16px 4px !important; }
    :host ::ng-deep .ant-tabs-tab-active .ant-tabs-tab-btn { color: #2563eb !important; font-weight: 600; }
    :host ::ng-deep .ant-tabs-ink-bar { background: linear-gradient(90deg, #2563eb, #7c3aed) !important; height: 3px !important; border-radius: 3px; }

    .search-form { margin: 0; padding: 0; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

    .field-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

    :host ::ng-deep .search-form .ant-input {
      background: #f8faff !important; border: 1.5px solid #e2e8f0 !important;
      border-radius: 10px !important; color: #1e293b !important; padding: 10px 14px !important; height: auto !important;
      font-size: 14px; transition: all 0.25s;
    }
    :host ::ng-deep .search-form .ant-input::placeholder { color: #94a3b8 !important; }
    :host ::ng-deep .search-form .ant-input:focus, :host ::ng-deep .search-form .ant-input:hover {
      border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important;
      background: #fff !important;
    }
    :host ::ng-deep .search-form .ant-form-item { margin-bottom: 0; }
    :host ::ng-deep .search-form .ant-form-item-label > label { color: #475569 !important; }

    .search-btn {
      height: 46px !important; border-radius: 12px !important; font-size: 15px !important; font-weight: 600 !important;
      background: linear-gradient(135deg, #2563eb, #7c3aed) !important; border: none !important;
      box-shadow: 0 4px 20px rgba(37,99,235,0.3) !important; transition: all 0.3s !important;
      letter-spacing: 0.3px; color: #fff !important;
    }
    .search-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(37,99,235,0.45) !important; }
    .search-btn:active { transform: translateY(0); }

    .form-hint { font-size: 12px; color: #ef4444; margin-top: 10px; text-align: center; }

    .results-section { margin-top: 28px; }

    :host ::ng-deep .results-section .ant-divider { border-color: #e2e8f0; }

    :host ::ng-deep .results-section .ant-table {
      background: #fff !important; color: #334155 !important;
    }
    :host ::ng-deep .results-section .ant-table-thead > tr > th {
      background: #f8faff !important; color: #64748b !important;
      border-bottom: 1.5px solid #e2e8f0 !important;
      font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    :host ::ng-deep .results-section .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f1f5f9 !important;
      color: #334155 !important; transition: background 0.2s;
    }
    :host ::ng-deep .results-section .ant-table-tbody > tr:hover > td {
      background: #f0f4ff !important;
    }
    :host ::ng-deep .results-section .ant-table-wrapper { border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    :host ::ng-deep .results-section .ant-pagination-item a { color: #64748b !important; }
    :host ::ng-deep .results-section .ant-pagination-item-active { border-color: #2563eb !important; }
    :host ::ng-deep .results-section .ant-pagination-item-active a { color: #2563eb !important; }
    :host ::ng-deep .results-section .ant-empty-description { color: #94a3b8 !important; }
    :host ::ng-deep .results-section .ant-spin-text { color: #64748b !important; }

    .mono {
      font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
      font-weight: 600; color: #2563eb; font-size: 13px; letter-spacing: 0.3px;
    }
    .amount { font-weight: 700; color: #059669; }

    .action-btns { display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap; }

    .view-pdf-btn { color: #2563eb !important; font-weight: 500; }
    .view-pdf-btn:hover { color: #1d4ed8 !important; }

    .download-xml-btn { color: #7c3aed !important; font-weight: 500; }
    .download-xml-btn:hover { color: #6d28d9 !important; }

    .no-results { padding: 48px 0; }
    :host ::ng-deep .no-results .ant-result-title { color: #334155 !important; }
    :host ::ng-deep .no-results .ant-result-subtitle { color: #64748b !important; }

    .verify-section { padding: 8px 0; text-align: center; }
    .verify-icon { font-size: 48px; color: #7c3aed; margin-bottom: 16px; }
    .verify-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
    .verify-hint { color: #64748b; font-size: 14px; margin-bottom: 28px; line-height: 1.6; }

    :host ::ng-deep .upload-zone .ant-upload-drag {
      background: #f8faff !important; border: 2px dashed #c7d2fe !important;
      border-radius: 16px !important; padding: 40px 20px !important; transition: all 0.3s;
    }
    :host ::ng-deep .upload-zone .ant-upload-drag:hover {
      border-color: #7c3aed !important; background: #f5f3ff !important;
    }
    :host ::ng-deep .upload-zone .ant-upload-drag-icon .anticon { font-size: 48px !important; color: #7c3aed !important; }
    :host ::ng-deep .upload-zone .ant-upload-text { color: #334155 !important; font-weight: 500; font-size: 15px; }
    :host ::ng-deep .upload-zone .ant-upload-hint { color: #94a3b8 !important; font-size: 13px; }

    .verify-result { margin-top: 28px; text-align: left; animation: fadeUp 0.4s ease; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

    :host ::ng-deep .verify-result .ant-alert { border-radius: 12px !important; }
    :host ::ng-deep .verify-details { margin-top: 20px; }
    :host ::ng-deep .verify-details .ant-descriptions-header { color: #1e293b !important; }
    :host ::ng-deep .verify-details .ant-descriptions-title { color: #1e293b !important; font-size: 15px; }
    :host ::ng-deep .verify-details .ant-descriptions-item-label { background: #f8faff !important; color: #64748b !important; border-color: #e2e8f0 !important; font-weight: 600; }
    :host ::ng-deep .verify-details .ant-descriptions-item-content { background: #fff !important; color: #334155 !important; border-color: #e2e8f0 !important; }
    :host ::ng-deep .verify-details .ant-descriptions-view { border-color: #e2e8f0 !important; border-radius: 12px !important; overflow: hidden; }

    .error-list {
      margin-top: 16px; padding: 16px 20px;
      background: #fff5f5; border: 1px solid #fecaca;
      border-radius: 12px;
    }
    .error-list h4 { color: #dc2626; margin-bottom: 8px; font-size: 14px; }
    .error-list ul { margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.8; }

    .page-footer {
      margin-top: 8px; padding-top: 20px; text-align: center;
      border-top: 1px solid #f1f5f9;
    }
    .back-btn { color: #64748b !important; font-weight: 500; font-size: 14px; }
    .back-btn:hover { color: #2563eb !important; }

    .pdf-frame { width: 100%; height: 70vh; border: none; }

    .spin-center { display: flex; justify-content: center; padding: 40px 0; }
    :host ::ng-deep .spin-center .ant-spin-text { color: #64748b; }
  `]
})
export class InvoiceLookupComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(InvoiceFacadeService);
  private readonly apiError = inject(ApiErrorService);
  private readonly message = inject(NzMessageService);
  private readonly sanitizer = inject(DomSanitizer);

  searchForm = this.fb.group({
    soHoadon: [''],
    maSoThue: ['']
  }, {
    validators: (control) => {
      const soHoadon = control.get('soHoadon')?.value;
      const maSoThue = control.get('maSoThue')?.value;
      return (soHoadon?.trim() || maSoThue?.trim()) ? null : { atLeastOne: true };
    }
  });

  searching = false;
  hasSearched = false;
  results: InvoiceListItemDto[] = [];
  xmlDownloading: Record<string, boolean> = {};

  // PDF Preview
  pdfVisible = false;
  pdfLoading = false;
  pdfTitle = '';
  pdfUrl: SafeResourceUrl | null = null;
  pdfBlob: Blob | null = null;
  pdfFilename = '';

  // XML Verification
  verifying = false;
  verifyResult: VerifyInvoiceXmlSignatureResultDto | null = null;

  onSearch(): void {
    if (this.searchForm.invalid) return;

    this.searching = true;
    this.hasSearched = true;
    const { soHoadon, maSoThue } = this.searchForm.getRawValue();

    this.facade.lookupInvoices(soHoadon!, maSoThue!)
      .pipe(finalize(() => this.searching = false))
      .subscribe({
        next: (data) => this.results = data,
        error: (err) => this.apiError.show(err, 'Lỗi tra cứu')
      });
  }

  downloadXml(inv: InvoiceListItemDto): void {
    if (this.xmlDownloading[inv.id]) return;
    this.xmlDownloading[inv.id] = true;
    const filename = `hoadon-${inv.sohoadon || inv.id}.xml`;

    this.facade.downloadSignedXmlBlob(inv)
      .pipe(finalize(() => this.xmlDownloading[inv.id] = false))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          this.message.success('Tải về XML thành công!');
        },
        error: (err) => this.apiError.show(err, 'Lỗi tải XML')
      });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Draft: 'Nháp', PendingSign: 'Chờ ký', Signed: 'Đã ký',
      Issued: 'Đã phát hành', Adjusted: 'Đã điều chỉnh',
      Replaced: 'Thay thế', Cancelled: 'Đã hủy'
    };
    return map[status] || status;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      Draft: 'default', PendingSign: 'processing', Signed: 'blue',
      Issued: 'success', Adjusted: 'warning',
      Replaced: 'purple', Cancelled: 'error'
    };
    return map[status] || 'default';
  }

  viewPdf(inv: InvoiceListItemDto): void {
    this.pdfTitle = `Hóa đơn: ${inv.sohoadon}`;
    this.pdfVisible = true;
    this.pdfLoading = true;
    this.pdfFilename = `hoadon-${inv.sohoadon || inv.id}.pdf`;

    this.facade.previewInvoicePdf(inv.id).subscribe({
      next: (blob) => {
        this.pdfBlob = blob;
        const url = URL.createObjectURL(blob);
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.pdfLoading = false;
      },
      error: (err) => {
        this.pdfLoading = false;
        this.pdfVisible = false;
        this.apiError.show(err, 'Lỗi tải PDF');
      }
    });
  }

  closePdf(): void {
    this.pdfVisible = false;
    if (this.pdfUrl) {
      this.pdfUrl = null;
      this.pdfBlob = null;
    }
  }

  downloadPdf(): void {
    if (!this.pdfBlob) return;
    const url = URL.createObjectURL(this.pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.pdfFilename;
    a.click();
    URL.revokeObjectURL(url);
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const isXml = file.type === 'text/xml' || file.name.endsWith('.xml');
    if (!isXml) {
      this.message.error('Bạn chỉ có thể tải lên tệp XML!');
    }
    return isXml;
  };

  handleUpload = (item: NzUploadXHRArgs): Subscription => {
    const file = item.file as any as File;
    this.verifying = true;
    this.verifyResult = null;

    return this.facade.verifyXmlSignature(file)
      .pipe(finalize(() => this.verifying = false))
      .subscribe({
        next: (result) => {
          this.verifyResult = result;
          if (result.isValid) {
            this.message.success('Xác thực chữ ký số thành công.');
            if (item.onSuccess) item.onSuccess(result, item.file, result);
          } else {
            this.message.error('Chữ ký số không hợp lệ.');
            if (item.onError) item.onError(new Error(result.message), item.file);
          }
        },
        error: (err) => {
          this.apiError.show(err, 'Lỗi xác thực file');
          if (item.onError) item.onError(err, item.file);
        }
      });
  };

  ngOnDestroy(): void {
    this.closePdf();
  }
}
