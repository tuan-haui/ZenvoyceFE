import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzUploadChangeParam, NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { VietQrBankDto } from '../../core/models/vietqr-bank.models';
import { CreateCompanyCommand, UpdateCompanyCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CatalogFacadeService } from '../../core/services/catalog-facade.service';
import { VietQrBankService } from '../../core/services/vietqr-bank.service';

@Component({
  selector: 'app-companies-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzTabsModule,
    NzSwitchModule,
    NzSelectModule,
    NzUploadModule,
    NzTagModule,
    NzIconModule,
    NzCardModule,
    NzDividerModule,
    NzSpaceModule,
    NzToolTipModule,
    NzTypographyModule
  ],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="company-title-row">
          <h2 class="page-title">{{ form.value.tendonvi || 'Công ty của bạn' }}</h2>
          <nz-tag [nzColor]="isActive ? 'success' : 'error'" class="status-tag">
            {{ isActive ? 'Đang hoạt động' : 'Vô hiệu hóa' }}
          </nz-tag>
        </div>
        <p class="page-subtitle" *ngIf="form.value.masothue">
          MST: <span class="mst-value">{{ form.value.masothue }}</span>
        </p>
      </div>
      <div class="page-header-actions">
        <button nz-button nzType="default" (click)="resetForm()">Hủy bỏ</button>
        <button nz-button nzType="primary" (click)="save()" [nzLoading]="saving">
          <nz-icon nzType="save" nzTheme="outline"></nz-icon>
          Lưu thay đổi
        </button>
      </div>
    </div>

    <!-- Content Card -->
    <nz-card [nzBordered]="true" [nzBodyStyle]="{ padding: 0 }">
      <nz-tabset nzType="line" class="company-tabs">
        <!-- Tab 1: Thông tin chung -->
        <nz-tab nzTitle="Thông tin chung">
          <div class="tab-content-split">
            <!-- Left: Form Fields -->
            <div class="form-area">
              <form nz-form [formGroup]="form" nzLayout="vertical">
                <div class="form-grid-2col">
                  <!-- Tên công ty - full width -->
                  <nz-form-item class="col-span-2">
                    <nz-form-label nzRequired>Tên công ty</nz-form-label>
                    <nz-form-control nzErrorTip="Vui lòng nhập tên công ty">
                      <input nz-input formControlName="tendonvi" placeholder="VD: Công ty Cổ phần Công nghệ ABC" />
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Mã số thuế -->
                  <nz-form-item>
                    <nz-form-label nzRequired>
                      Mã số thuế
                      <span
                        *ngIf="hasInvoices"
                        nz-tooltip
                        nzTooltipTitle="MST không thể thay đổi sau khi đã phát hành hóa đơn"
                        class="mst-lock-icon"
                      >
                        <nz-icon nzType="lock" nzTheme="outline"></nz-icon>
                      </span>
                    </nz-form-label>
                    <nz-form-control [nzErrorTip]="mstErrorTpl">
                      <input
                        nz-input
                        formControlName="masothue"
                        placeholder="VD: 0101234567"
                        [nzStatus]="hasInvoices ? '' : ''"
                      />
                      <ng-template #mstErrorTpl let-control>
                        <ng-container *ngIf="control.hasError('required')">Vui lòng nhập mã số thuế</ng-container>
                        <ng-container *ngIf="control.hasError('minlength') || control.hasError('maxlength')">MST phải có 10-14 ký tự</ng-container>
                        <ng-container *ngIf="control.hasError('pattern')">MST chỉ chứa số hoặc dấu gạch ngang</ng-container>
                      </ng-template>
                    </nz-form-control>
                    <p class="field-hint" *ngIf="hasInvoices">MST không thể thay đổi sau khi khởi tạo.</p>
                  </nz-form-item>

                  <!-- Người đại diện -->
                  <nz-form-item>
                    <nz-form-label nzRequired>Người đại diện pháp luật</nz-form-label>
                    <nz-form-control nzErrorTip="Vui lòng nhập tên người đại diện">
                      <input nz-input formControlName="nguoidaidien" placeholder="VD: Nguyễn Văn A" />
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Địa chỉ - full width -->
                  <nz-form-item class="col-span-2">
                    <nz-form-label nzRequired>Địa chỉ trụ sở chính</nz-form-label>
                    <nz-form-control nzErrorTip="Vui lòng nhập địa chỉ công ty">
                      <textarea
                        nz-input
                        formControlName="diachi"
                        placeholder="VD: Số 1 Đại Cồ Việt, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội"
                        [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                      ></textarea>
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Điện thoại -->
                  <nz-form-item>
                    <nz-form-label>Số điện thoại liên hệ</nz-form-label>
                    <nz-form-control>
                      <input nz-input formControlName="dienthoai" placeholder="VD: 02438691234" />
                    </nz-form-control>
                  </nz-form-item>

                  <!-- Email -->
                  <nz-form-item>
                    <nz-form-label nzRequired>Email liên hệ</nz-form-label>
                    <nz-form-control nzErrorTip="Vui lòng nhập email hợp lệ">
                      <input nz-input formControlName="email" type="email" placeholder="VD: contact@company.vn" />
                    </nz-form-control>
                  </nz-form-item>
                </div>

                <!-- Bank Info Group -->
                <nz-divider nzOrientation="left" nzText="Thông tin Ngân hàng Mặc định"></nz-divider>
                <div class="form-grid-2col bank-group">
                  <nz-form-item>
                    <nz-form-label>Số tài khoản</nz-form-label>
                    <nz-form-control>
                      <input nz-input formControlName="sotaikhoan" placeholder="VD: 1903123456789" />
                    </nz-form-control>
                  </nz-form-item>

                  <nz-form-item>
                    <nz-form-label>Ngân hàng</nz-form-label>
                    <nz-form-control>
                      <nz-select
                        formControlName="nganhang"
                        nzShowSearch
                        nzAllowClear
                        nzPlaceHolder="Chọn ngân hàng"
                        [nzLoading]="banksLoading"
                      >
                        <nz-option
                          *ngFor="let b of banks"
                          [nzValue]="b.bin"
                          [nzLabel]="bankOptionLabel(b)"
                        ></nz-option>
                      </nz-select>
                    </nz-form-control>
                  </nz-form-item>
                </div>

                <!-- Status Switch -->
                <nz-divider></nz-divider>
                <nz-form-item>
                  <nz-form-label>Trạng thái hoạt động</nz-form-label>
                  <nz-form-control>
                    <nz-switch
                      formControlName="active"
                      nzCheckedChildren="Hoạt động"
                      nzUnCheckedChildren="Khóa"
                    ></nz-switch>
                  </nz-form-control>
                </nz-form-item>
              </form>
            </div>

            <!-- Right: Logo Upload -->
            <div class="logo-area">
              <p class="logo-label">Logo Công ty</p>
              <p class="logo-hint">Logo sẽ hiển thị trên các mẫu hóa đơn phát hành.</p>

              <nz-upload
                nzType="drag"
                [nzMultiple]="false"
                [nzBeforeUpload]="beforeLogoUpload"
                [nzFileList]="logoFileList"
                nzAccept=".png,.jpg,.jpeg,.svg"
                class="logo-upload-area"
              >
                <div class="logo-preview" *ngIf="logoPreviewUrl">
                  <img [src]="logoPreviewUrl" alt="Logo preview" class="logo-img" />
                </div>
                <div class="upload-placeholder" *ngIf="!logoPreviewUrl">
                  <nz-icon nzType="cloud-upload" nzTheme="outline" class="upload-icon"></nz-icon>
                </div>
                <p class="upload-text">Kéo thả hoặc <span class="upload-link">chọn tệp</span></p>
                <p class="upload-hint">Định dạng: PNG, JPG, SVG. Tối đa 2MB.</p>
              </nz-upload>
            </div>
          </div>
        </nz-tab>

        <!-- Tab 2: Chữ ký số -->
        <nz-tab nzTitle="Cấu hình chữ ký số">
          <div class="tab-content-padding">
            <nz-card nzTitle="Upload Certificate" [nzBordered]="false" class="cert-card">
              <p class="cert-desc">
                Tải lên file chứng chỉ số định dạng <strong>.p12</strong> hoặc <strong>.cer</strong> để cấu hình chữ ký số điện tử.
              </p>
              <nz-upload
                nzType="drag"
                [nzMultiple]="false"
                [nzBeforeUpload]="beforeCertUpload"
                [nzFileList]="certFileList"
                nzAccept=".p12,.cer,.pfx"
                class="cert-upload-area"
              >
                <nz-icon nzType="file-protect" nzTheme="outline" class="cert-upload-icon"></nz-icon>
                <p class="upload-text">Kéo thả hoặc <span class="upload-link">chọn file Certificate</span></p>
                <p class="upload-hint">Định dạng: .p12, .cer, .pfx</p>
              </nz-upload>

              <div *ngIf="certFileList.length > 0" class="cert-file-info">
                <nz-icon nzType="file-done" nzTheme="outline"></nz-icon>
                <span>{{ certFileList[0].name }}</span>
                <nz-tag nzColor="processing">Đã tải lên</nz-tag>
              </div>
            </nz-card>

            <nz-card nzTitle="Kết nối HSM (Hardware Security Module)" [nzBordered]="false" class="cert-card">
              <p class="cert-desc">Tích hợp HSM sẽ được triển khai trong phiên bản tiếp theo.</p>
              <nz-tag nzColor="warning">Sắp ra mắt</nz-tag>
            </nz-card>
          </div>
        </nz-tab>
      </nz-tabset>
    </nz-card>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .company-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .page-title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #262626;
    }
    .status-tag {
      font-size: 12px;
    }
    .page-subtitle {
      margin: 4px 0 0;
      color: #8c8c8c;
      font-size: 14px;
    }
    .mst-value {
      font-family: monospace;
      color: #595959;
    }
    .page-header-actions {
      display: flex;
      gap: 10px;
    }
    .company-tabs {
      padding: 0;
    }
    :host ::ng-deep .company-tabs .ant-tabs-nav {
      padding: 0 24px;
      margin-bottom: 0;
    }
    :host ::ng-deep .company-tabs .ant-tabs-content-holder {
      padding: 0;
    }
    .tab-content-split {
      display: flex;
      gap: 32px;
      padding: 24px;
    }
    .form-area {
      flex: 1;
      min-width: 0;
    }
    .form-grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 24px;
    }
    .col-span-2 {
      grid-column: 1 / -1;
    }
    .bank-group {
      margin-top: 4px;
    }
    .field-hint {
      font-size: 11px;
      color: #8c8c8c;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .mst-lock-icon {
      margin-left: 6px;
      color: #faad14;
      cursor: default;
    }
    .logo-area {
      width: 240px;
      flex-shrink: 0;
      border-left: 1px solid #f0f0f0;
      padding-left: 24px;
    }
    .logo-label {
      font-size: 13px;
      font-weight: 500;
      color: #262626;
      margin-bottom: 4px;
    }
    .logo-hint {
      font-size: 12px;
      color: #8c8c8c;
      margin-bottom: 12px;
    }
    .logo-upload-area {
      display: block;
    }
    :host ::ng-deep .logo-upload-area .ant-upload-drag {
      padding: 16px;
      border-radius: 8px;
      min-height: 180px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .logo-preview {
      width: 80px;
      height: 80px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
    }
    .logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .upload-placeholder {
      margin-bottom: 8px;
    }
    .upload-icon {
      font-size: 28px;
      color: #8c8c8c;
    }
    .upload-text {
      font-size: 13px;
      color: #595959;
      margin: 6px 0 4px;
    }
    .upload-link {
      color: var(--app-primary, #1677ff);
      cursor: pointer;
    }
    .upload-hint {
      font-size: 11px;
      color: #8c8c8c;
      margin: 0;
    }
    .tab-content-padding {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cert-card {
      border: 1px solid #f0f0f0;
      border-radius: 8px;
    }
    .cert-desc {
      color: #595959;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .cert-upload-area {
      display: block;
      margin-bottom: 12px;
    }
    :host ::ng-deep .cert-upload-area .ant-upload-drag {
      padding: 24px;
    }
    .cert-upload-icon {
      font-size: 32px;
      color: #8c8c8c;
      margin-bottom: 8px;
    }
    .cert-file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 6px;
      font-size: 13px;
      color: #389e0d;
    }

    /* ── Dark mode ── */
    :host-context(html.dark-mode) .page-title { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .mst-value { color: rgba(255,255,255,0.65); }
    :host-context(html.dark-mode) .logo-area {
      border-left-color: rgba(255,255,255,0.1);
    }
    :host-context(html.dark-mode) .logo-label { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .logo-preview {
      background: #262626;
      border-color: rgba(255,255,255,0.15);
    }
    :host-context(html.dark-mode) .cert-card {
      border-color: rgba(255,255,255,0.1);
    }
    :host-context(html.dark-mode) .cert-desc { color: rgba(255,255,255,0.65); }
    :host-context(html.dark-mode) .cert-file-info {
      background: rgba(82,196,26,0.12);
      border-color: rgba(82,196,26,0.3);
      color: #73d13d;
    }
    :host-context(html.dark-mode) .section-title { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) ::ng-deep .company-tabs .ant-tabs-nav {
      background: transparent;
    }
  `]
})
export class CompaniesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  currentId: string | null = null;
  hasInvoices = false;
  saving = false;
  isActive = true;
  banks: VietQrBankDto[] = [];
  banksLoading = false;
  logoFileList: NzUploadFile[] = [];
  logoPreviewUrl: string | null = null;
  certFileList: NzUploadFile[] = [];
  private originalValue: ReturnType<typeof this.form.getRawValue> | null = null;

  form = this.fb.nonNullable.group({
    tendonvi: ['', Validators.required],
    masothue: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(14), Validators.pattern(/^[\d-]+$/)]],
    nguoidaidien: ['', Validators.required],
    diachi: ['', Validators.required],
    dienthoai: [''],
    email: ['', [Validators.required, Validators.email]],
    sotaikhoan: [''],
    nganhang: [null as string | null],
    active: [true]
  });

  constructor(
    private readonly facade: CatalogFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService,
    private readonly vietQrBanks: VietQrBankService
  ) { }

  ngOnInit(): void {
    this.form.get('active')!.valueChanges.subscribe((val) => {
      this.isActive = val;
    });

    this.banksLoading = true;
    this.vietQrBanks.getBanks().subscribe({
      next: (list) => {
        this.banks = list;
        this.banksLoading = false;
      },
      error: () => {
        this.banksLoading = false;
        this.message.error('Không tải được danh sách ngân hàng (VietQR). Vui lòng thử lại sau.');
      }
    });

    this.facade.getCompanies().subscribe({
      next: (list) => {
        const first = list[0];
        if (!first?.id) {
          this.currentId = null;
          this.hasInvoices = false;
          this.form.reset({
            tendonvi: '',
            masothue: '',
            nguoidaidien: '',
            diachi: '',
            dienthoai: '',
            email: '',
            sotaikhoan: '',
            nganhang: null,
            active: true
          });
          this.form.get('masothue')!.enable();
          this.isActive = true;
          this.originalValue = this.form.getRawValue();
          return;
        }
        this.currentId = first.id;
        this.hasInvoices = false;
        const patchData = {
          tendonvi: first.tendonvi ?? '',
          masothue: first.masothue ?? '',
          nguoidaidien: first.nguoidaidien ?? '',
          diachi: first.diachi ?? '',
          dienthoai: first.dienthoai ?? '',
          email: first.emailcongty ?? '',
          sotaikhoan: first.bankAccount ?? '',
          nganhang: first.bankId != null ? String(first.bankId) : null,
          active: first.trangthai === 1
        };
        this.form.patchValue(patchData);
        this.isActive = patchData.active;
        this.form.get('masothue')!.enable();
        this.originalValue = this.form.getRawValue();
      },
      error: (e) => this.apiError.show(e)
    });
  }

  resetForm(): void {
    if (this.originalValue) {
      this.form.patchValue(this.originalValue);
    } else {
      this.form.reset();
    }
  }

  /** Nhãn hiển thị; giá trị lưu trong form là `bin`. */
  bankOptionLabel(b: VietQrBankDto): string {
    const short = (b.shortName || b.short_name || b.code).trim();
    return `${short} — ${b.name}`;
  }

  beforeLogoUpload = (file: NzUploadFile): boolean => {
    const isImage = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/svg+xml';
    if (!isImage) {
      this.message.error('Chỉ hỗ trợ file PNG, JPG, SVG!');
      return false;
    }
    const isLt2M = (file.size ?? 0) / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.message.error('File không được vượt quá 2MB!');
      return false;
    }
    this.logoFileList = [file];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file as unknown as Blob);
    return false;
  };

  beforeCertUpload = (file: NzUploadFile): boolean => {
    const name = file.name?.toLowerCase() ?? '';
    const valid = name.endsWith('.p12') || name.endsWith('.cer') || name.endsWith('.pfx');
    if (!valid) {
      this.message.error('Chỉ hỗ trợ file .p12, .cer, .pfx!');
      return false;
    }
    this.certFileList = [file];
    return false;
  };

  handleLogoChange(info: NzUploadChangeParam): void {
    this.logoFileList = info.fileList;
  }

  save(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }
    this.saving = true;
    const raw = this.form.getRawValue();
    const onDone = () => {
      this.saving = false;
      this.isActive = raw.active;
      if (this.currentId) {
        this.facade.changeCompanyStatus(this.currentId, raw.active ? 1 : 0).subscribe();
      }
      this.originalValue = this.form.getRawValue();
      this.message.success('Lưu thông tin công ty thành công');
    };
    const onError = (e: unknown) => {
      this.saving = false;
      this.apiError.show(e);
    };

    if (this.currentId) {
      const bin = raw.nganhang?.trim();
      const parsedBankId = bin ? parseInt(bin, 10) : NaN;
      const bankId = bin && !Number.isNaN(parsedBankId) ? parsedBankId : undefined;
      const cmd = new UpdateCompanyCommand({
        id: this.currentId,
        tendonvi: raw.tendonvi,
        masothue: raw.masothue,
        diachi: raw.diachi,
        dienthoai: raw.dienthoai,
        bankAccount: raw.sotaikhoan || undefined,
        bankId,
        nguoidaidien: raw.nguoidaidien,
        emailcongty: raw.email || undefined
      });
      this.facade.updateCompany(this.currentId, cmd).subscribe({
        next: () => onDone(),
        error: onError
      });
      return;
    }

    const cmd = new CreateCompanyCommand({ tendonvi: raw.tendonvi, masothue: raw.masothue, diachi: raw.diachi, dienthoai: raw.dienthoai });
    this.facade.createCompany(cmd).subscribe({
      next: (created) => {
        this.currentId = created.id ?? null;
        onDone();
      },
      error: onError
    });
  }
}
