import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCodeEditorModule } from 'ng-zorro-antd/code-editor';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { ApplyTemplateCommand, CreateBaseTemplateCommand, UpdateBaseTemplateCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { InvoiceFacadeService } from '../../core/services/invoice-facade.service';
import { BaseTemplateVm, TemplateFacadeService } from '../../core/services/template-facade.service';
import { renderHandlebars } from './handlebars-mini';

interface SampleInvoiceData {
  symbol: string;
  invoice_number: string;
  issue_date: string;
  status: string;
  seller: {
    name: string; tax_code: string; address: string; phone: string; email: string;
  };
  buyer: {
    name: string; tax_code: string; email: string; phone: string;
  };
  items: { name: string; unit: string; quantity: string; price: string; tax_rate: string; amount: string }[];
  sub_total: string;
  tax_total: string;
  total_amount: string;
}

const SAMPLE_DATA: SampleInvoiceData = {
  symbol: '1C26TAA',
  invoice_number: 'INV-2026-001',
  issue_date: '01/05/2026',
  status: 'Draft',
  seller: {
    name: 'Công ty TNHH Zenvoyce',
    tax_code: '0101234567',
    address: 'Số 1 Đại Cồ Việt, Hà Nội',
    phone: '024 3869 1234',
    email: 'support@zenvoyce.vn'
  },
  buyer: {
    name: 'Công ty CP Acme',
    tax_code: '0109876543',
    email: 'finance@acme.vn',
    phone: '028 1234 5678'
  },
  items: [
    { name: 'Dịch vụ Phát triển Phần mềm', unit: 'Giờ', quantity: '40', price: '500.000', tax_rate: '10', amount: '20.000.000' },
    { name: 'Gói Lưu trữ Cloud Hàng năm', unit: 'Năm', quantity: '1', price: '12.000.000', tax_rate: '10', amount: '12.000.000' }
  ],
  sub_total: '32.000.000',
  tax_total: '3.200.000',
  total_amount: '35.200.000'
};

/** Nội dung tối thiểu để qua validation (HTML >= 10 ký tự), gần như trống khi xem trước. */
const DEFAULT_BLANK_HTML = '<div></motion.div>';
const DEFAULT_BLANK_CSS = '';

function buildDefaultNewTemplateMeta(): { tenmau: string; kyhieu: string } {
  const suffix = String(Date.now()).slice(0, 4);
  return {
    tenmau: `Mẫu hóa đơn mới ${suffix}`,
    kyhieu: `MAU-${suffix}`
  };
}

@Component({
  selector: 'app-templates-setup-page',
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzCodeEditorModule,
    NzDividerModule,
    NzToolTipModule,
    NzTagModule,
    NzSpinModule,
    NzEmptyModule,
    NzSegmentedModule,
    NzPopconfirmModule,
    NzDropDownModule,
    NzInputModule,
    NzMenuModule
  ],
  template: `
    <div class="setup-layout">
      <!-- ==================== LEFT: TEMPLATE LIST ==================== -->
      <div class="config-panel">
        <div class="config-header">
          <div>
            <h2 class="config-title">Mẫu hoá đơn</h2>
            <p class="config-subtitle">Chọn mẫu nền HTML để áp dụng cho công ty.</p>
          </div>
          <button nz-button nzType="default" (click)="reload()" [nzLoading]="loading">
            <nz-icon nzType="reload" nzTheme="outline"></nz-icon>
            Làm mới
          </button>
        </div>

        <div class="config-body">
          <nz-spin [nzSpinning]="loading" nzTip="Đang tải...">
            <nz-empty *ngIf="!loading && templates.length === 0" nzNotFoundContent="Chưa có mẫu hoá đơn nào trong hệ thống"></nz-empty>

            <div class="template-list">
              <div
                *ngFor="let t of templates; let i = index"
                class="template-row"
                [class.selected]="selectedId === t.id"
                (click)="selectTemplate(t)"
                role="button"
                tabindex="0"
                (keydown.enter)="selectTemplate(t)"
                (keydown.space)="selectTemplate(t); $event.preventDefault()"
              >
                <div class="template-icon">
                  <nz-icon nzType="file-text" nzTheme="outline"></nz-icon>
                </div>
                <div class="template-info" *ngIf="editingId !== t.id">
                  <div class="template-name">{{ t.tenmau }}</div>
                  <div class="template-meta">
                    <span class="template-kyhieu mono">{{ t.kyhieu }}</span>
                    <nz-tag nzColor="blue">{{ t.loaihoadon || 'GTGT' }}</nz-tag>
                    <nz-tag nzColor="default" *ngIf="t.version">v{{ t.version }}</nz-tag>
                  </div>
                </div>
                
                <div class="template-info editing" *ngIf="editingId === t.id" (click)="$event.stopPropagation()">
                  <input nz-input nzSize="small" [(ngModel)]="editForm.tenmau" placeholder="Tên mẫu" style="margin-bottom: 4px;" />
                  <input nz-input nzSize="small" [(ngModel)]="editForm.kyhieu" placeholder="Ký hiệu" />
                </div>

                <div class="template-actions" *ngIf="editingId !== t.id">
                  <button nz-button nzType="text" nz-dropdown nzTrigger="click" [nzDropdownMenu]="menu" (click)="$event.stopPropagation()">
                    <nz-icon nzType="ellipsis" nzTheme="outline"></nz-icon>
                  </button>
                  <nz-dropdown-menu #menu="nzDropdownMenu">
                    <ul nz-menu>
                      <li nz-menu-item (click)="startEdit(t); $event.stopPropagation()">
                        <nz-icon nzType="edit" nzTheme="outline"></nz-icon> Sửa
                      </li>
                      <li nz-menu-item nzDanger nz-popconfirm nzPopconfirmTitle="Bạn có chắc muốn xóa mẫu này?" nzPopconfirmPlacement="left" (nzOnConfirm)="deleteTemplate(t)">
                        <nz-icon nzType="delete" nzTheme="outline"></nz-icon> Xóa
                      </li>
                    </ul>
                  </nz-dropdown-menu>

                  <nz-icon
                    *ngIf="selectedId === t.id"
                    nzType="check-circle"
                    nzTheme="fill"
                    class="check-icon"
                  ></nz-icon>
                </div>

                <div class="template-actions" *ngIf="editingId === t.id" (click)="$event.stopPropagation()">
                   <button nz-button nzType="text" nzSize="small" class="template-action" (click)="saveEdit(t)" [nzLoading]="savingEdit">
                     <nz-icon nzType="check" nzTheme="outline" style="color: #52c41a;"></nz-icon>
                   </button>
                   <button nz-button nzType="text" nzSize="small" class="template-action" (click)="cancelEdit()">
                     <nz-icon nzType="close" nzTheme="outline" style="color: #ff4d4f;"></nz-icon>
                   </button>
                </div>
              </div>
            </div>
            
            <button nz-button nzType="dashed" class="full-width" style="margin-top: 12px;" (click)="addNewBlankTemplate()" [nzLoading]="addingBlank">
              <nz-icon nzType="plus" nzTheme="outline"></nz-icon> Thêm mẫu mới
            </button>
          </nz-spin>

          <nz-divider></nz-divider>

          <div class="apply-section" *ngIf="selectedTemplate">
            <h3 class="section-title">Áp dụng cho công ty</h3>
            <p class="field-label">Lưu mẫu này làm mẫu mặc định cho công ty đầu tiên (hoặc công ty hiện tại).</p>
            <button
              nz-button nzType="primary" nzSize="large" class="full-width"
              [nzLoading]="saving"
              [disabled]="!companyId || hasDraftChanges"
              (click)="applyTemplate()"
            >
              <nz-icon nzType="check-circle" nzTheme="outline"></nz-icon>
              Lưu và Áp dụng cho công ty
            </button>
            <p *ngIf="hasDraftChanges" class="warning-text">
              <nz-icon nzType="warning" nzTheme="outline"></nz-icon>
              Có thay đổi HTML/CSS chưa lưu. Vui lòng lưu mẫu mới trước khi áp dụng.
            </p>
            <p *ngIf="!companyId" class="warning-text">
              <nz-icon nzType="warning" nzTheme="outline"></nz-icon>
              Chưa có công ty. Khai báo công ty trước khi áp dụng mẫu.
            </p>
          </div>
        </div>
      </div>

      <!-- ==================== RIGHT: HTML PREVIEW ==================== -->
      <div class="preview-panel">
        <div class="preview-toolbar">
          <span class="preview-label">XEM TRƯỚC MẪU</span>
          <div class="preview-actions">
            <nz-tag *ngIf="hasDraftChanges" nzColor="orange">Chưa lưu</nz-tag>
            <button
              nz-button
              nzType="primary"
              [disabled]="!canSaveTemplate"
              [nzLoading]="savingTemplate"
              (click)="saveAsNewTemplate()"
            >
              <nz-icon nzType="save" nzTheme="outline"></nz-icon>
              Lưu mẫu mới
            </button>
            <nz-segmented
              [nzOptions]="viewModeOptions"
              [(ngModel)]="viewMode"
              (ngModelChange)="onViewModeChange()"
            ></nz-segmented>
          </div>
        </div>

        <div class="paper-container" *ngIf="selectedTemplate" [class.code-mode]="viewMode !== 'preview'">
          <ng-container *ngIf="viewMode === 'preview'">
            <iframe
              *ngIf="previewSafeUrl"
              [src]="previewSafeUrl"
              class="preview-frame"
              sandbox="allow-same-origin"
              title="Template preview"
            ></iframe>
          </ng-container>

          <ng-container *ngIf="viewMode === 'html'">
            <nz-code-editor
              class="code-editor"
              [(ngModel)]="draftHtml"
              [nzEditorOption]="htmlEditorOption"
            ></nz-code-editor>
          </ng-container>

          <ng-container *ngIf="viewMode === 'css'">
            <nz-code-editor
              class="code-editor"
              [(ngModel)]="draftCss"
              [nzEditorOption]="cssEditorOption"
            ></nz-code-editor>
          </ng-container>
        </div>

        <div class="paper-container" *ngIf="!selectedTemplate && !loading">
          <nz-empty nzNotFoundContent="Chọn một mẫu để xem trước"></nz-empty>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .setup-layout {
      display: flex;
      height: calc(100vh - 64px);
      overflow: hidden;
      margin: -20px;
    }

    .config-panel {
      width: 38%;
      min-width: 360px;
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
      flex-shrink: 0;
    }
    .config-title { margin: 0; font-size: 20px; font-weight: 600; color: #262626; }
    .config-subtitle { margin: 2px 0 0; font-size: 13px; color: #8c8c8c; }
    .config-body {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px 32px;
    }

    .template-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .template-row {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px 14px;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .template-row:focus {
      border-color: var(--app-primary, #1677ff);
      box-shadow: 0 0 0 2px rgba(22,119,255,0.15);
      outline: none;
    }
    .template-row:hover {
      border-color: var(--app-primary, #1677ff);
    }
    .template-row.selected {
      border-color: var(--app-primary, #1677ff);
      box-shadow: 0 0 0 2px rgba(22,119,255,0.15);
      background: #f6f9ff;
    }
    .template-icon {
      width: 38px;
      height: 38px;
      border-radius: 6px;
      background: #f0f5ff;
      color: var(--app-primary, #1677ff);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .template-info { flex: 1; min-width: 0; }
    .template-name { font-size: 14px; font-weight: 600; color: #262626; }
    .template-meta {
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .template-kyhieu { font-size: 12px; color: #8c8c8c; }
    .template-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
    .template-action { display: inline-flex; align-items: center; justify-content: center; }
    .template-action-danger { color: #ff4d4f; }
    .check-icon { color: var(--app-primary, #1677ff); font-size: 18px; flex-shrink: 0; }

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: #262626;
      margin: 0 0 8px;
    }
    .field-label { font-size: 12px; color: #595959; margin: 0 0 12px; }
    .full-width { width: 100%; }
    .warning-text {
      margin-top: 8px;
      font-size: 12px;
      color: #faad14;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mono { font-family: 'SFMono-Regular', Consolas, monospace; }

    /* Preview panel */
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
      flex-wrap: wrap;
      gap: 12px;
      padding: 10px 20px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
      flex-shrink: 0;
    }
    .preview-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .preview-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #8c8c8c;
      text-transform: uppercase;
    }
    .paper-container {
      flex: 1;
      overflow: auto;
      padding: 24px;
      display: flex;
      justify-content: center;
    }
    .paper-container.code-mode {
      justify-content: stretch;
      align-items: stretch;
    }
    .preview-frame {
      width: 100%;
      max-width: 900px;
      min-height: 100%;
      border: 1px solid #e8e8e8;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      border-radius: 4px;
    }
    .code-editor {
      width: 100%;
      height: 100%;
      min-height: 520px;
      border: 1px solid #e8e8e8;
      border-radius: 4px;
      overflow: hidden;
      background: #1e1e1e;
    }

    :host-context(html.dark-mode) .config-panel { background: #1f1f1f; border-right-color: rgba(255,255,255,0.1); }
    :host-context(html.dark-mode) .config-header { border-bottom-color: rgba(255,255,255,0.1); }
    :host-context(html.dark-mode) .config-title { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .template-row {
      background: #262626;
      border-color: rgba(255,255,255,0.1);
    }
    :host-context(html.dark-mode) .template-row.selected { background: rgba(22,119,255,0.12); }
    :host-context(html.dark-mode) .template-name { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .preview-panel { background: #0f0f0f; }
    :host-context(html.dark-mode) .preview-toolbar { background: #1f1f1f; border-bottom-color: rgba(255,255,255,0.1); }
    :host-context(html.dark-mode) .code-editor { border-color: rgba(255,255,255,0.1); }
  `]
})
export class TemplatesSetupPageComponent implements OnInit {
  templates: BaseTemplateVm[] = [];
  selectedId = '';
  selectedTemplate: BaseTemplateVm | null = null;

  editingId: string | null = null;
  savingEdit = false;
  addingBlank = false;
  editForm = { tenmau: '', kyhieu: '' };

  draftHtml = '';
  draftCss = '';
  savingTemplate = false;

  loading = false;
  saving = false;
  companyId: string | undefined;

  viewMode: 'preview' | 'html' | 'css' = 'preview';
  readonly viewModeOptions = [
    { label: 'Xem trước', value: 'preview', icon: 'eye' },
    { label: 'HTML', value: 'html', icon: 'code' },
    { label: 'CSS', value: 'css', icon: 'bg-colors' }
  ];

  readonly htmlEditorOption = {
    language: 'html',
    minimap: { enabled: false },
    automaticLayout: true,
    wordWrap: 'on' as const
  };

  readonly cssEditorOption = {
    language: 'css',
    minimap: { enabled: false },
    automaticLayout: true,
    wordWrap: 'on' as const
  };

  previewSafeUrl: SafeResourceUrl | null = null;
  private previewBlobUrl: string | null = null;

  get hasDraftChanges(): boolean {
    if (!this.selectedTemplate) {
      return false;
    }
    return this.draftHtml !== this.selectedTemplate.htmlContent || this.draftCss !== this.selectedTemplate.cssContent;
  }

  get canSaveTemplate(): boolean {
    return !!this.selectedTemplate && this.hasDraftChanges && this.isHtmlValid() && !this.savingTemplate;
  }

  constructor(
    private readonly facade: TemplateFacadeService,
    private readonly invoiceFacade: InvoiceFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.invoiceFacade.getCompanies().subscribe({
      next: (list) => { this.companyId = list[0]?.id; },
      error: (e) => this.apiError.show(e)
    });
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.facade.getBaseTemplates().subscribe({
      next: (list) => {
        this.templates = list;
        this.loading = false;
        if (list.length && !this.selectedId) {
          this.selectTemplate(list[0]);
        }
      },
      error: (e) => {
        this.loading = false;
        this.apiError.show(e);
      }
    });
  }

  selectTemplate(t: BaseTemplateVm): void {
    this.selectedId = t.id;
    this.selectedTemplate = t;
    this.draftHtml = t.htmlContent ?? '';
    this.draftCss = t.cssContent ?? '';
    this.refreshPreview();
  }

  startEdit(t: BaseTemplateVm): void {
    this.editingId = t.id;
    this.editForm = { tenmau: t.tenmau || '', kyhieu: t.kyhieu || '' };
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(t: BaseTemplateVm): void {
    if (!this.editForm.tenmau || !this.editForm.kyhieu) {
      this.message.warning('Vui lòng nhập tên mẫu và ký hiệu');
      return;
    }
    this.savingEdit = true;
    const payload = new UpdateBaseTemplateCommand({
      id: t.id,
      tenmau: this.editForm.tenmau,
      kyhieu: this.editForm.kyhieu,
      loaihoadon: t.loaihoadon,
      htmlContent: t.htmlContent,
      cssContent: t.cssContent,
      version: t.version
    });
    this.facade.updateBaseTemplate(t.id, payload).subscribe({
      next: (res) => {
        this.savingEdit = false;
        t.tenmau = res.tenmau;
        t.kyhieu = res.kyhieu;
        this.editingId = null;
        this.message.success('Đã cập nhật mẫu');
      },
      error: (e) => {
        this.savingEdit = false;
        this.apiError.show(e);
      }
    });
  }

  addNewBlankTemplate(): void {
    this.addingBlank = true;
    const meta = buildDefaultNewTemplateMeta();
    const payload = new CreateBaseTemplateCommand({
      tenmau: meta.tenmau,
      loaihoadon: 'GTGT',
      kyhieu: meta.kyhieu,
      htmlContent: DEFAULT_BLANK_HTML,
      cssContent: DEFAULT_BLANK_CSS,
      version: '1'
    });
    this.facade.createBaseTemplate(payload).subscribe({
      next: (created) => {
        this.addingBlank = false;
        this.templates = [...this.templates, created];
        this.selectTemplate(created);
        this.startEdit(created);
        this.message.success('Đã thêm mẫu mới');
      },
      error: (e) => {
        this.addingBlank = false;
        this.apiError.show(e);
      }
    });
  }

  onViewModeChange(): void {
    if (this.viewMode === 'preview') {
      this.refreshPreview();
    }
  }

  private refreshPreview(): void {
    if (!this.selectedTemplate) {
      return;
    }
    this.releasePreviewUrl();

    const html = this.draftHtml;
    const css = this.draftCss;
    const renderedBody = renderHandlebars(html, SAMPLE_DATA as unknown as Record<string, unknown>);
    const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Preview</title>
  <style>${css}</style>
</head>
<body>${renderedBody}</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    this.previewBlobUrl = URL.createObjectURL(blob);
    this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewBlobUrl);
  }

  applyTemplate(): void {
    if (this.hasDraftChanges) {
      this.message.warning('Vui lòng lưu thay đổi HTML/CSS trước khi áp dụng.');
      return;
    }
    if (!this.companyId) {
      this.message.warning('Chưa có công ty. Vui lòng khai báo công ty trước.');
      return;
    }
    if (!this.selectedTemplate) {
      this.message.warning('Vui lòng chọn mẫu nền trước khi áp dụng.');
      return;
    }
    this.saving = true;
    const payload = new ApplyTemplateCommand({
      maugocid: this.selectedTemplate.id,
      donviid: this.companyId,
      css: this.selectedTemplate.cssContent ?? '',
      header: '',
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

  deleteTemplate(t: BaseTemplateVm): void {
    this.facade.deleteBaseTemplate(t.id).subscribe({
      next: () => {
        const remaining = this.templates.filter((x) => x.id !== t.id);
        this.templates = remaining;
        if (this.selectedId === t.id) {
          if (remaining.length > 0) {
            this.selectTemplate(remaining[0]);
          } else {
            this.clearSelection();
          }
        }
        this.message.success('Đã xóa mẫu hóa đơn');
      },
      error: (e) => this.apiError.show(e)
    });
  }

  saveAsNewTemplate(): void {
    if (!this.selectedTemplate) {
      return;
    }
    if (!this.isHtmlValid()) {
      this.message.warning('HTML phải có ít nhất 10 ký tự.');
      return;
    }
    if (!this.hasDraftChanges) {
      this.message.info('Chưa có thay đổi để lưu.');
      return;
    }

    const identity = this.buildNextTemplateIdentity();
    const payload = new CreateBaseTemplateCommand({
      tenmau: identity.name,
      loaihoadon: this.selectedTemplate.loaihoadon || 'GTGT',
      kyhieu: identity.code,
      htmlContent: this.draftHtml,
      cssContent: this.draftCss,
      version: identity.version
    });

    this.savingTemplate = true;
    this.facade.createBaseTemplate(payload).subscribe({
      next: (created) => {
        this.savingTemplate = false;
        this.templates = [created, ...this.templates];
        this.selectTemplate(created);
        this.message.success('Đã lưu mẫu mới');
      },
      error: (e) => {
        this.savingTemplate = false;
        this.apiError.show(e);
      }
    });
  }

  private isHtmlValid(): boolean {
    return this.draftHtml.trim().length >= 10;
  }

  private buildNextTemplateIdentity(): { name: string; code: string; version: string } {
    const nameBase = this.stripNameVersion(this.selectedTemplate?.tenmau ?? 'Mẫu');
    const codeBase = this.stripCodeVersion(this.selectedTemplate?.kyhieu ?? 'MAU');
    const nextVersion = this.getNextVersionNumber(nameBase, codeBase);
    const name = this.buildVersionedName(nameBase, nextVersion);
    const code = this.buildVersionedCode(codeBase, nextVersion);
    return { name, code, version: String(nextVersion) };
  }

  private getNextVersionNumber(nameBase: string, codeBase: string): number {
    const nameRegex = new RegExp(`^${this.escapeRegExp(nameBase)}\\s+v(\\d+)$`, 'i');
    const codeRegex = new RegExp(`^${this.escapeRegExp(codeBase)}-v(\\d+)$`, 'i');
    let maxVersion = 1;

    for (const t of this.templates) {
      if (t.tenmau) {
        if (t.tenmau.toLowerCase() === nameBase.toLowerCase()) {
          maxVersion = Math.max(maxVersion, 1);
        }
        const match = t.tenmau.match(nameRegex);
        if (match) {
          const parsed = Number.parseInt(match[1], 10);
          if (!Number.isNaN(parsed)) {
            maxVersion = Math.max(maxVersion, parsed);
          }
        }
      }

      if (t.kyhieu) {
        if (t.kyhieu.toLowerCase() === codeBase.toLowerCase()) {
          maxVersion = Math.max(maxVersion, 1);
        }
        const match = t.kyhieu.match(codeRegex);
        if (match) {
          const parsed = Number.parseInt(match[1], 10);
          if (!Number.isNaN(parsed)) {
            maxVersion = Math.max(maxVersion, parsed);
          }
        }
      }
    }

    return maxVersion + 1;
  }

  private buildVersionedName(base: string, version: number): string {
    const name = `${base} v${version}`.trim();
    return name.length > 255 ? name.slice(0, 255) : name;
  }

  private buildVersionedCode(base: string, version: number): string {
    const suffix = `-V${version}`;
    const maxBaseLength = 50 - suffix.length;
    const trimmed = base.trim();
    const safeBase = trimmed.length > maxBaseLength ? trimmed.slice(0, maxBaseLength) : trimmed;
    return `${safeBase}${suffix}`;
  }

  private stripNameVersion(value: string): string {
    return value.replace(/\s+v\d+$/i, '').trim();
  }

  private stripCodeVersion(value: string): string {
    return value.replace(/-v\d+$/i, '').trim();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private clearSelection(): void {
    this.selectedId = '';
    this.selectedTemplate = null;
    this.draftHtml = '';
    this.draftCss = '';
    this.releasePreviewUrl();
  }

  private releasePreviewUrl(): void {
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = null;
    }
    this.previewSafeUrl = null;
  }
}
