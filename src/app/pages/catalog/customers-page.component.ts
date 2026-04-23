import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { CreateCustomerCommand, UpdateCustomerCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CatalogFacadeService } from '../../core/services/catalog-facade.service';

interface CustomerVm {
  id: string;
  tenkhachhang: string;
  masothue: string;
  email: string;
  dienthoai: string;
}

@Component({
  selector: 'app-customers-page',
  imports: [CommonModule, ReactiveFormsModule, NzTableModule, NzButtonModule, NzFormModule, NzInputModule, NzModalModule, NzPopconfirmModule],
  template: `
    <div class="page-header"><h2>Quản lý khách hàng</h2><button nz-button nzType="primary" (click)="openCreate()">+ Thêm khách hàng</button></div>
    <nz-table [nzData]="customers" [nzFrontPagination]="false">
      <thead><tr><th>Tên khách hàng</th><th>MST</th><th>Email</th><th>Điện thoại</th><th>Thao tác</th></tr></thead>
      <tbody>
        <tr *ngFor="let c of customers">
          <td>{{ c.tenkhachhang }}</td><td>{{ c.masothue }}</td><td>{{ c.email }}</td><td>{{ c.dienthoai }}</td>
          <td><a (click)="openEdit(c)">Sửa</a><a nz-popconfirm nzPopconfirmTitle="Xóa khách hàng?" (nzOnConfirm)="delete(c)">Xóa</a></td>
        </tr>
      </tbody>
    </nz-table>
    <nz-modal [(nzVisible)]="visible" [nzTitle]="editing ? 'Sửa khách hàng' : 'Thêm khách hàng'" (nzOnCancel)="visible = false" (nzOnOk)="save()">
      <form nz-form [formGroup]="form">
        <input nz-input formControlName="tenkhachhang" placeholder="Tên khách hàng" />
        <input nz-input formControlName="masothue" placeholder="Mã số thuế" />
        <input nz-input formControlName="email" placeholder="Email nhận hóa đơn" />
        <input nz-input formControlName="dienthoai" placeholder="Số điện thoại" />
      </form>
    </nz-modal>
  `,
  styles: [`.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;} td a{margin-right:8px;}`]
})
export class CustomersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  companyId = 'c-1';
  customers: CustomerVm[] = [];
  visible = false;
  editing: CustomerVm | null = null;
  form = this.fb.nonNullable.group({
    tenkhachhang: ['', Validators.required],
    masothue: [''],
    email: ['', Validators.required],
    dienthoai: ['']
  });

  constructor(
    private readonly facade: CatalogFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.facade.getCustomers(this.companyId).subscribe({
      next: () => {
        this.customers = [
          { id: 'kh-1', tenkhachhang: 'Công ty A', masothue: '010100001', email: 'a@company.vn', dienthoai: '0901000001' }
        ];
      },
      error: (e) => this.apiError.show(e)
    });
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({ tenkhachhang: '', masothue: '', email: '', dienthoai: '' });
    this.visible = true;
  }

  openEdit(c: CustomerVm): void {
    this.editing = c;
    this.form.patchValue(c);
    this.visible = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (this.editing) {
      this.facade.updateCustomer(this.editing.id, new UpdateCustomerCommand({ id: this.editing.id, ...raw })).subscribe({
        next: () => {
          Object.assign(this.editing!, raw);
          this.visible = false;
          this.message.success('Cập nhật khách hàng thành công');
        },
        error: (e) => this.apiError.show(e)
      });
      return;
    }

    this.facade.createCustomer(new CreateCustomerCommand({ donviid: this.companyId, ...raw })).subscribe({
      next: () => {
        this.customers = [{ id: `kh-${Date.now()}`, ...raw }, ...this.customers];
        this.visible = false;
        this.message.success('Thêm khách hàng thành công');
      },
      error: (e) => this.apiError.show(e)
    });
  }

  delete(c: CustomerVm): void {
    this.facade.deleteCustomer(c.id).subscribe({
      next: () => {
        this.customers = this.customers.filter((x) => x.id !== c.id);
        this.message.success('Xóa khách hàng thành công');
      },
      error: (e) => this.apiError.show(e)
    });
  }
}
