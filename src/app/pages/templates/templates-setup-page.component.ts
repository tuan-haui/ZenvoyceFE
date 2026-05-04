import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { ApplyTemplateCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { InvoiceFacadeService } from '../../core/services/invoice-facade.service';
import { BaseTemplateVm, TemplateFacadeService } from '../../core/services/template-facade.service';

type LogoAlignment = 'left' | 'center' | 'right';

const PRESET_COLORS = ['#005daa', '#1a1a2e', '#16a34a', '#dc2626', '#7c3aed'];

@Component({
  selector: 'app-templates-setup-page',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzSwitchModule,
    NzTagModule,
    NzUploadModule,
    NzDividerModule,
    NzToolTipModule
  ],
  template: `
    <div class="setup-layout">
      <!-- ==================== LEFT: CONFIG PANEL ==================== -->
      <div class="config-panel">
        <!-- Sticky Header -->
        <div class="config-header">
          <div>
            <h2 class="config-title">Thiết lập mẫu hóa đơn</h2>
            <p class="config-subtitle">Cấu hình giao diện hóa đơn cho công ty.</p>
          </div>
          <button nz-button nzType="default" (click)="saveDraft()" [nzLoading]="saving">
            <nz-icon nzType="save" nzTheme="outline"></nz-icon>
            Lưu nháp
          </button>
        </div>

        <div class="config-body">
          <!-- Section: Base Template -->
          <section class="config-section">
            <h3 class="section-title">Mẫu nền</h3>
            <div class="template-grid">
              <label
                *ngFor="let t of baseTemplates"
                class="template-card"
                [class.selected]="selectedBaseId === t.id"
              >
                <input type="radio" name="baseTemplate" [value]="t.id" [(ngModel)]="selectedBaseId" class="sr-only" />
                <div class="template-thumbnail" [ngClass]="'thumb-' + t.thumbnail">
                  <!-- Visual mini-preview -->
                  <div class="thumb-header-bar"></div>
                  <div class="thumb-lines">
                    <div class="thumb-line w-60"></div>
                    <div class="thumb-line w-40"></div>
                    <div class="thumb-line w-80 mt-auto"></div>
                  </div>
                </div>
                <div class="template-card-footer">
                  <span class="template-name">{{ t.tenmau }}</span>
                  <nz-icon *ngIf="selectedBaseId === t.id" nzType="check-circle" nzTheme="fill" class="check-icon"></nz-icon>
                </div>
              </label>
            </div>
          </section>

          <nz-divider></nz-divider>

          <!-- Section: Branding -->
          <section class="config-section">
            <h3 class="section-title">Thương hiệu</h3>

            <p class="field-label">Logo Công ty</p>
            <nz-upload
              nzType="drag"
              [nzMultiple]="false"
              [nzBeforeUpload]="beforeLogoUpload"
              [nzFileList]="logoFileList"
              nzAccept=".png,.jpg,.jpeg,.svg"
              class="logo-drop"
            >
              <div class="logo-drop-content" *ngIf="!logoPreviewUrl">
                <nz-icon nzType="cloud-upload" nzTheme="outline" class="upload-icon"></nz-icon>
                <p class="upload-text"><span class="upload-link">Chọn tệp</span> hoặc kéo thả</p>
                <p class="upload-hint">SVG, PNG, JPG (tối đa 2MB)</p>
              </div>
              <div class="logo-preview-wrap" *ngIf="logoPreviewUrl">
                <img [src]="logoPreviewUrl" alt="Logo preview" class="logo-preview-img" />
                <p class="upload-hint mt-1">Nhấn để thay thế</p>
              </div>
            </nz-upload>

            <!-- Logo Alignment -->
            <div class="two-col mt-3">
              <div>
                <p class="field-label">Căn chỉnh logo</p>
                <div class="align-group">
                  <button
                    nz-button
                    *ngFor="let a of alignments"
                    [nzType]="logoAlignment === a.value ? 'primary' : 'default'"
                    (click)="logoAlignment = a.value"
                    nz-tooltip
                    [nzTooltipTitle]="a.label"
                    class="align-btn"
                  >
                    <nz-icon [nzType]="a.icon" nzTheme="outline"></nz-icon>
                  </button>
                </div>
              </div>
              <div>
                <p class="field-label">Kích thước</p>
                <select class="native-select" [(ngModel)]="logoSize">
                  <option value="100">Nhỏ (100px)</option>
                  <option value="150">Vừa (150px)</option>
                  <option value="200">Lớn (200px)</option>
                </select>
              </div>
            </div>
          </section>

          <nz-divider></nz-divider>

          <!-- Section: Theme Color -->
          <section class="config-section">
            <h3 class="section-title">Màu chủ đạo</h3>
            <p class="field-label">Dùng cho tiêu đề, đường kẻ và tổng tiền.</p>
            <div class="color-palette">
              <button
                *ngFor="let c of presetColors"
                class="color-swatch"
                [style.background]="c"
                [class.selected]="themeColor === c"
                (click)="setColor(c)"
              ></button>
              <label class="color-custom" nz-tooltip nzTooltipTitle="Màu tùy chỉnh">
                <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
                <input type="color" [(ngModel)]="themeColor" (input)="onCustomColor($event)" class="color-input" />
              </label>
            </div>
          </section>

          <nz-divider></nz-divider>

          <!-- Section: Document Settings -->
          <section class="config-section">
            <h3 class="section-title">Cài đặt tài liệu</h3>
            <div class="switch-row">
              <div class="switch-info">
                <p class="switch-label">Hiển thị Watermark (Trạng thái Nháp)</p>
                <p class="field-label">In chìm chữ "NHÁP" lên hóa đơn chưa phát hành</p>
              </div>
              <nz-switch [(ngModel)]="showWatermark"></nz-switch>
            </div>
            <div class="switch-row mt-3">
              <div class="switch-info">
                <p class="switch-label">Hiển thị mã QR thanh toán</p>
                <p class="field-label">Thêm mã QR VietQR vào cuối hóa đơn</p>
              </div>
              <nz-switch [(ngModel)]="showQR"></nz-switch>
            </div>
            <div class="mt-4">
              <p class="field-label mb-1">Ghi chú / Điều khoản cuối hóa đơn</p>
              <textarea
                class="native-textarea"
                rows="3"
                placeholder="VD: Cảm ơn quý khách. Thanh toán trong vòng 30 ngày kể từ ngày xuất hóa đơn."
                [(ngModel)]="footerNote"
              ></textarea>
            </div>
          </section>

          <!-- Apply Button -->
          <div class="apply-btn-wrap">
            <button nz-button nzType="primary" nzSize="large" (click)="applyTemplate()" [nzLoading]="saving" class="full-width">
              <nz-icon nzType="check-circle" nzTheme="outline"></nz-icon>
              Lưu mẫu và Áp dụng cho công ty
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== RIGHT: PDF PREVIEW ==================== -->
      <div class="preview-panel">
        <!-- Preview Toolbar -->
        <div class="preview-toolbar">
          <span class="preview-label">XEM TRƯỚC</span>
          <div class="preview-actions">
            <button nz-button nzType="default" nzSize="small" (click)="zoomIn()" nz-tooltip nzTooltipTitle="Phóng to">
              <nz-icon nzType="zoom-in" nzTheme="outline"></nz-icon>
            </button>
            <button nz-button nzType="default" nzSize="small" (click)="zoomOut()" nz-tooltip nzTooltipTitle="Thu nhỏ">
              <nz-icon nzType="zoom-out" nzTheme="outline"></nz-icon>
            </button>
            <button nz-button nzType="default" nzSize="small" class="ml-2" nz-tooltip nzTooltipTitle="Tải thử PDF">
              <nz-icon nzType="download" nzTheme="outline"></nz-icon>
              PDF thử
            </button>
          </div>
        </div>

        <!-- A4 Paper -->
        <div class="paper-container">
          <div
            class="paper-a4"
            [style.transform]="'scale(' + zoomLevel + ')'"
            [style.transform-origin]="'top center'"
          >
            <!-- Watermark -->
            <div class="watermark" *ngIf="showWatermark">NHÁP</div>

            <!-- Invoice Header -->
            <div class="inv-header" [style.border-color]="themeColor">
              <div class="inv-logo-area" [ngClass]="'align-' + logoAlignment">
                <img *ngIf="logoPreviewUrl" [src]="logoPreviewUrl" [style.height]="logoSize + 'px'" class="inv-logo" />
                <div *ngIf="!logoPreviewUrl" class="inv-logo-placeholder">[ Logo Công ty ]</div>
              </div>
              <div class="inv-title-area">
                <div class="inv-type">HÓA ĐƠN GIÁ TRỊ GIA TĂNG</div>
                <div class="inv-sub">Mẫu số: {{ selectedTemplate?.kyhieu || '1C26TAA' }}</div>
                <div class="inv-num">Số: <strong>INV-2026-001</strong></div>
                <div class="inv-date">Ngày: 01/05/2026</div>
              </div>
            </div>

            <!-- Bill parties -->
            <div class="inv-parties">
              <div class="inv-party">
                <div class="party-label">Đơn vị bán hàng</div>
                <div class="party-name">Công ty TNHH Zenvoyce</div>
                <div class="party-info">MST: 0101234567</div>
                <div class="party-info">Địa chỉ: Số 1 Đại Cồ Việt, Hà Nội</div>
                <div class="party-info">Điện thoại: 024 3869 1234</div>
              </div>
              <div class="inv-party">
                <div class="party-label">Người mua hàng</div>
                <div class="party-name">Công ty CP Acme</div>
                <div class="party-info">MST: 0109876543</div>
                <div class="party-info">Địa chỉ: 123 Nguyễn Huệ, TP.HCM</div>
              </div>
            </div>

            <!-- Line Items -->
            <table class="inv-table">
              <thead>
                <tr [style.background]="themeColor + '18'" [style.color]="themeColor">
                  <th class="col-stt">STT</th>
                  <th class="col-name">Tên hàng hóa / Dịch vụ</th>
                  <th class="col-unit">ĐVT</th>
                  <th class="col-qty">SL</th>
                  <th class="col-price">Đơn giá</th>
                  <th class="col-amount">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="center">1</td>
                  <td>Dịch vụ Phát triển Phần mềm</td>
                  <td class="center">Giờ</td>
                  <td class="right">40</td>
                  <td class="right">500,000</td>
                  <td class="right">20,000,000</td>
                </tr>
                <tr class="row-alt">
                  <td class="center">2</td>
                  <td>Gói Lưu trữ Cloud Hàng năm</td>
                  <td class="center">Năm</td>
                  <td class="right">1</td>
                  <td class="right">12,000,000</td>
                  <td class="right">12,000,000</td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <div class="inv-totals">
              <div class="total-row">
                <span>Cộng tiền hàng:</span>
                <span>32,000,000 ₫</span>
              </div>
              <div class="total-row">
                <span>Thuế GTGT (10%):</span>
                <span>3,200,000 ₫</span>
              </div>
              <div class="total-row grand" [style.color]="themeColor">
                <span>Tổng tiền thanh toán:</span>
                <span>35,200,000 ₫</span>
              </div>
              <div class="total-words">Bằng chữ: <em>Ba mươi lăm triệu hai trăm nghìn đồng chẵn</em></div>
            </div>

            <!-- Footer -->
            <div class="inv-footer">
              <div class="signature-block">
                <div class="sig-title">Người mua hàng</div>
                <div class="sig-line"></div>
              </div>
              <div class="footer-note" *ngIf="footerNote">{{ footerNote }}</div>
              <div class="qr-block" *ngIf="showQR">
                <nz-icon nzType="qrcode" nzTheme="outline" class="qr-icon"></nz-icon>
                <div class="qr-label">Quét QR</div>
              </div>
              <div class="signature-block">
                <div class="sig-title">Người bán hàng</div>
                <div class="sig-line"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ====== LAYOUT ====== */
    .setup-layout {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
      margin: -20px;
    }

    /* ====== CONFIG PANEL ====== */
    .config-panel {
      width: 42%;
      min-width: 400px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #f0f0f0;
      background: #fff;
      overflow: hidden;
    }
    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f0f0f0;
      background: #fff;
      position: sticky;
      top: 0;
      z-index: 10;
      flex-shrink: 0;
    }
    .config-title { margin: 0; font-size: 20px; font-weight: 600; color: #262626; }
    .config-subtitle { margin: 2px 0 0; font-size: 13px; color: #8c8c8c; }
    .config-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px 32px;
    }
    .config-section { margin-bottom: 8px; }
    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #262626;
      margin: 0 0 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    .field-label { font-size: 12px; color: #595959; margin: 0 0 4px; }
    .mt-1 { margin-top: 4px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }
    .mb-1 { margin-bottom: 4px; }
    .ml-2 { margin-left: 8px; }
    .full-width { width: 100%; }

    /* Base Template Cards */
    .template-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .template-card {
      cursor: pointer;
      border: 2px solid #d9d9d9;
      border-radius: 6px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .template-card:hover { border-color: #1677ff; }
    .template-card.selected { border-color: #1677ff; }
    .template-thumbnail {
      height: 72px;
      background: #f5f5f5;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
    }
    .thumb-classic .thumb-header-bar { background: #005daa; height: 8px; border-radius: 2px; }
    .thumb-modern .thumb-header-bar { background: #1a1a2e; height: 6px; border-radius: 1px; align-self: flex-end; width: 40%; }
    .thumb-compact .thumb-header-bar { background: #16a34a; height: 6px; border-radius: 2px; }
    .thumb-lines { display: flex; flex-direction: column; gap: 3px; flex: 1; justify-content: center; }
    .thumb-line { height: 3px; background: #d9d9d9; border-radius: 2px; }
    .w-60 { width: 60%; }
    .w-40 { width: 40%; }
    .w-80 { width: 80%; }
    .mt-auto { margin-top: auto; }
    .template-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
    .template-name { font-size: 11px; font-weight: 500; color: #262626; }
    .check-icon { color: #1677ff; font-size: 14px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

    /* Logo Upload */
    .logo-drop { display: block; }
    :host ::ng-deep .logo-drop .ant-upload-drag {
      padding: 16px;
      border-radius: 6px;
    }
    .logo-drop-content, .logo-preview-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .upload-icon { font-size: 24px; color: #8c8c8c; }
    .upload-text { font-size: 13px; color: #595959; margin: 0; }
    .upload-link { color: #1677ff; cursor: pointer; }
    .upload-hint { font-size: 11px; color: #8c8c8c; margin: 0; }
    .logo-preview-img { max-height: 60px; object-fit: contain; }

    /* Alignment */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .align-group { display: flex; gap: 4px; }
    .align-btn { padding: 4px 10px; }
    .native-select {
      width: 100%;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 13px;
      color: #262626;
      background: #fff;
      outline: none;
    }
    .native-select:focus { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1); }

    /* Colors */
    .color-palette { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
    .color-swatch {
      width: 30px; height: 30px; border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s;
    }
    .color-swatch:hover { transform: scale(1.15); }
    .color-swatch.selected { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,0.3); }
    .color-custom {
      width: 30px; height: 30px; border-radius: 50%;
      border: 2px dashed #d9d9d9;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; position: relative; font-size: 14px; color: #8c8c8c;
    }
    .color-custom:hover { border-color: #1677ff; color: #1677ff; }
    .color-input {
      position: absolute; width: 100%; height: 100%;
      opacity: 0; cursor: pointer; left: 0; top: 0;
    }

    /* Switch rows */
    .switch-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .switch-info { flex: 1; }
    .switch-label { font-size: 14px; color: #262626; margin: 0 0 2px; font-weight: 500; }
    .native-textarea {
      width: 100%; border: 1px solid #d9d9d9; border-radius: 4px;
      padding: 8px 10px; font-size: 13px; color: #262626;
      resize: vertical; font-family: inherit; line-height: 1.5;
      outline: none;
    }
    .native-textarea:focus { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,0.1); }

    .apply-btn-wrap { margin-top: 24px; }

    /* ====== PREVIEW PANEL ====== */
    .preview-panel {
      flex: 1;
      background: #f0f2f5;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .preview-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
      flex-shrink: 0;
    }
    .preview-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #8c8c8c;
      text-transform: uppercase;
    }
    .preview-actions { display: flex; gap: 6px; }
    .paper-container {
      flex: 1;
      overflow: auto;
      display: flex;
      justify-content: center;
      padding: 24px 16px 48px;
    }

    /* A4 Paper */
    .paper-a4 {
      background: #fff;
      width: 210mm;
      min-height: 297mm;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      border: 1px solid #e8e8e8;
      padding: 18mm 16mm;
      position: relative;
      font-size: 12px;
      line-height: 1.5;
      color: #262626;
      transition: transform 0.2s;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 96px;
      font-weight: 900;
      color: #000;
      opacity: 0.04;
      transform: rotate(-45deg);
      pointer-events: none;
      letter-spacing: 8px;
      z-index: 0;
    }

    /* Invoice Header */
    .inv-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #005daa;
      padding-bottom: 12px;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .inv-logo-area { flex: 1; }
    .inv-logo-area.align-left { display: flex; justify-content: flex-start; }
    .inv-logo-area.align-center { display: flex; justify-content: center; }
    .inv-logo-area.align-right { display: flex; justify-content: flex-end; }
    .inv-logo { object-fit: contain; max-width: 120px; }
    .inv-logo-placeholder {
      border: 1px dashed #d9d9d9;
      padding: 8px 12px;
      font-size: 10px;
      color: #8c8c8c;
      border-radius: 4px;
      background: #fafafa;
    }
    .inv-title-area { text-align: right; flex-shrink: 0; }
    .inv-type { font-size: 15px; font-weight: 700; color: #262626; text-transform: uppercase; }
    .inv-sub, .inv-num, .inv-date { font-size: 11px; color: #595959; margin-top: 2px; }
    .inv-num strong { color: #262626; }

    /* Parties */
    .inv-parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #8c8c8c; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; margin-bottom: 6px; }
    .party-name { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .party-info { font-size: 11px; color: #595959; }

    /* Line Items Table */
    .inv-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 11px;
      position: relative;
      z-index: 1;
    }
    .inv-table th {
      padding: 6px 8px;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #d9d9d9;
    }
    .inv-table td { padding: 7px 8px; border-bottom: 1px solid #f0f0f0; }
    .inv-table .row-alt { background: #fafafa; }
    .col-stt { width: 36px; }
    .col-unit, .col-qty { width: 48px; }
    .col-price, .col-amount { width: 90px; }
    .center { text-align: center; }
    .right { text-align: right; font-family: monospace; }

    /* Totals */
    .inv-totals {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      width: 52%;
      padding: 3px 0;
      font-size: 12px;
      color: #595959;
    }
    .total-row.grand {
      font-size: 14px;
      font-weight: 700;
      border-top: 2px solid #d9d9d9;
      padding-top: 6px;
      margin-top: 4px;
    }
    .total-words { font-size: 11px; color: #595959; font-style: italic; margin-top: 4px; text-align: right; }

    /* Footer */
    .inv-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #f0f0f0;
      padding-top: 14px;
      margin-top: 16px;
      position: relative;
      z-index: 1;
    }
    .signature-block { text-align: center; width: 120px; }
    .sig-title { font-size: 11px; font-weight: 600; color: #262626; margin-bottom: 40px; }
    .sig-line { border-top: 1px solid #d9d9d9; }
    .footer-note { font-size: 10px; color: #8c8c8c; max-width: 200px; text-align: center; }
    .qr-block { display: flex; flex-direction: column; align-items: center; color: #8c8c8c; }
    .qr-icon { font-size: 40px; }
    .qr-label { font-size: 9px; }
  `]
})
export class TemplatesSetupPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  baseTemplates: BaseTemplateVm[] = [];
  selectedBaseId = '';
  companyId: string | undefined;
  logoFileList: NzUploadFile[] = [];
  logoPreviewUrl: string | null = null;
  logoAlignment: LogoAlignment = 'left';
  logoSize = 150;
  themeColor = '#005daa';
  showWatermark = true;
  showQR = true;
  footerNote = 'Cảm ơn quý khách. Thanh toán trong vòng 30 ngày kể từ ngày xuất hóa đơn.';
  saving = false;
  zoomLevel = 0.65;

  readonly presetColors = PRESET_COLORS;
  readonly alignments: { value: LogoAlignment; icon: string; label: string }[] = [
    { value: 'left', icon: 'align-left', label: 'Trái' },
    { value: 'center', icon: 'align-center', label: 'Giữa' },
    { value: 'right', icon: 'align-right', label: 'Phải' }
  ];

  get selectedTemplate(): BaseTemplateVm | undefined {
    return this.baseTemplates.find((t) => t.id === this.selectedBaseId);
  }

  constructor(
    private readonly facade: TemplateFacadeService,
    private readonly invoiceFacade: InvoiceFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.invoiceFacade.getCompanies().subscribe({
      next: (list) => {
        this.companyId = list[0]?.id;
      },
      error: (e) => this.apiError.show(e)
    });
    this.facade.getBaseTemplates().subscribe({
      next: (list) => {
        this.baseTemplates = list;
        if (list.length) this.selectedBaseId = list[0].id;
      },
      error: (e) => this.apiError.show(e)
    });
  }

  beforeLogoUpload = (file: NzUploadFile): boolean => {
    const isImage = ['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type ?? '');
    if (!isImage) { this.message.error('Chỉ hỗ trợ PNG, JPG, SVG!'); return false; }
    const isLt2M = (file.size ?? 0) / 1024 / 1024 < 2;
    if (!isLt2M) { this.message.error('File tối đa 2MB!'); return false; }
    this.logoFileList = [file];
    const reader = new FileReader();
    reader.onload = (e) => { this.logoPreviewUrl = e.target?.result as string; };
    reader.readAsDataURL(file as unknown as Blob);
    return false;
  };

  setColor(color: string): void { this.themeColor = color; }

  onCustomColor(event: Event): void {
    this.themeColor = (event.target as HTMLInputElement).value;
  }

  zoomIn(): void { this.zoomLevel = Math.min(1.2, this.zoomLevel + 0.1); }
  zoomOut(): void { this.zoomLevel = Math.max(0.3, this.zoomLevel - 0.1); }

  saveDraft(): void {
    this.message.info('Đã lưu nháp cấu hình mẫu');
  }

  applyTemplate(): void {
    if (!this.companyId) {
      this.message.warning('Chưa có công ty. Vui lòng khai báo công ty trước.');
      return;
    }
    if (!this.selectedBaseId) {
      this.message.warning('Vui lòng chọn mẫu nền trước khi áp dụng');
      return;
    }
    this.saving = true;
    const payload = new ApplyTemplateCommand({
      maugocid: this.selectedBaseId,
      donviid: this.companyId,
      css: `--theme-color:${this.themeColor};`,
      header: JSON.stringify({ logoAlignment: this.logoAlignment, logoSize: this.logoSize }),
      lamaumacdinh: true,
      metadata: []
    });

    this.facade.applyTemplate(payload).subscribe({
      next: () => {
        this.saving = false;
        this.message.success('Đã áp dụng mẫu hóa đơn cho công ty');
        void this.router.navigate(['/admin/templates/warehouse']);
      },
      error: (e) => {
        this.saving = false;
        this.apiError.show(e);
      }
    });
  }
}
