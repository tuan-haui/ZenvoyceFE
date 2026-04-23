import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { CreateCompanyCommand, UpdateCompanyCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CatalogFacadeService } from '../../core/services/catalog-facade.service';

interface CompanyVm {
  id: string;
  masothue: string;
  tendonvi: string;
  diachi: string;
  dienthoai: string;
  trangthai: number;
}

@Component({
  selector: 'app-companies-page',
  imports: [ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzTabsModule, NzSwitchModule],
  template: `
    <h2>Quản lý công ty</h2>
    <nz-tabset>
      <nz-tab nzTitle="Thông tin chung">
        <form nz-form [formGroup]="form" class="company-form">
          <input nz-input formControlName="tendonvi" placeholder="Tên công ty" />
          <input nz-input formControlName="masothue" placeholder="Mã số thuế" />
          <input nz-input formControlName="diachi" placeholder="Địa chỉ" />
          <input nz-input formControlName="dienthoai" placeholder="Điện thoại" />
          <label nz-switch formControlName="active"></label>
          <button nz-button nzType="primary" (click)="save()">Lưu thông tin</button>
        </form>
      </nz-tab>
      <nz-tab nzTitle="Cấu hình chữ ký số">
        <p>Upload certificate (.p12/.cer) và cấu hình HSM sẽ được tích hợp tại phase kế tiếp.</p>
      </nz-tab>
    </nz-tabset>
  `,
  styles: [`.company-form{display:grid;gap:12px;max-width:640px;}`]
})
export class CompaniesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  currentId: string | null = null;
  form = this.fb.nonNullable.group({
    tendonvi: ['', Validators.required],
    masothue: ['', Validators.required],
    diachi: [''],
    dienthoai: [''],
    active: [true]
  });

  constructor(
    private readonly facade: CatalogFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.facade.getCompanies().subscribe({
      next: () => {
        this.currentId = 'c-1';
        this.form.patchValue({
          tendonvi: 'Công ty TNHH Zenvoyce',
          masothue: '0101234567',
          diachi: 'Hà Nội',
          dienthoai: '0241234567',
          active: true
        });
      },
      error: (e) => this.apiError.show(e)
    });
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const onDone = () => {
      if (this.currentId) {
        this.facade.changeCompanyStatus(this.currentId, raw.active ? 1 : 0).subscribe();
      }
      this.message.success('Lưu thông tin công ty thành công');
    };

    if (this.currentId) {
      const cmd = new UpdateCompanyCommand({ id: this.currentId, tendonvi: raw.tendonvi, masothue: raw.masothue, diachi: raw.diachi, dienthoai: raw.dienthoai });
      this.facade.updateCompany(this.currentId, cmd).subscribe({ next: onDone, error: (e) => this.apiError.show(e) });
      return;
    }

    const cmd = new CreateCompanyCommand({ tendonvi: raw.tendonvi, masothue: raw.masothue, diachi: raw.diachi, dienthoai: raw.dienthoai });
    this.facade.createCompany(cmd).subscribe({
      next: () => {
        this.currentId = `c-${Date.now()}`;
        onDone();
      },
      error: (e) => this.apiError.show(e)
    });
  }
}
