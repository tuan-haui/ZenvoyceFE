import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { CreateProductCommand, UpdateProductCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CatalogFacadeService } from '../../core/services/catalog-facade.service';

interface ProductVm {
  id: string;
  tenhanghoa: string;
  donvitinh: string;
  dongia: number;
}

@Component({
  selector: 'app-products-page',
  imports: [CommonModule, ReactiveFormsModule, NzTableModule, NzButtonModule, NzFormModule, NzInputModule, NzInputNumberModule, NzModalModule, NzPopconfirmModule],
  template: `
    <div class="page-header"><h2>Danh mục hàng hóa/dịch vụ</h2><button nz-button nzType="primary" (click)="openCreate()">+ Thêm hàng hóa</button></div>
    <nz-table [nzData]="products" [nzFrontPagination]="false">
      <thead><tr><th>Tên hàng hóa</th><th>Đơn vị tính</th><th>Đơn giá</th><th>Thao tác</th></tr></thead>
      <tbody>
        <tr *ngFor="let p of products">
          <td>{{ p.tenhanghoa }}</td><td>{{ p.donvitinh }}</td><td>{{ p.dongia | number }}</td>
          <td><a (click)="openEdit(p)">Sửa</a><a nz-popconfirm nzPopconfirmTitle="Ngưng sử dụng hàng hóa này?" (nzOnConfirm)="delete(p)">Ngưng sử dụng</a></td>
        </tr>
      </tbody>
    </nz-table>

    <nz-modal [(nzVisible)]="visible" [nzTitle]="editing ? 'Cập nhật hàng hóa' : 'Thêm hàng hóa'" (nzOnCancel)="visible = false" (nzOnOk)="save()">
      <form nz-form [formGroup]="form">
        <input nz-input formControlName="tenhanghoa" placeholder="Tên hàng hóa/dịch vụ" />
        <input nz-input formControlName="donvitinh" placeholder="Đơn vị tính" />
        <nz-input-number formControlName="dongia" [nzMin]="0" [nzStep]="1000"></nz-input-number>
      </form>
    </nz-modal>
  `,
  styles: [`.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;} td a{margin-right:8px;}`]
})
export class ProductsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  companyId = 'c-1';
  products: ProductVm[] = [];
  visible = false;
  editing: ProductVm | null = null;
  form = this.fb.nonNullable.group({
    tenhanghoa: ['', Validators.required],
    donvitinh: [''],
    dongia: [0, Validators.required]
  });

  constructor(
    private readonly facade: CatalogFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.facade.getProducts(this.companyId).subscribe({
      next: () => {
        this.products = [{ id: 'hh-1', tenhanghoa: 'Dịch vụ tư vấn', donvitinh: 'Gói', dongia: 5000000 }];
      },
      error: (e) => this.apiError.show(e)
    });
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({ tenhanghoa: '', donvitinh: '', dongia: 0 });
    this.visible = true;
  }

  openEdit(p: ProductVm): void {
    this.editing = p;
    this.form.patchValue(p);
    this.visible = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (this.editing) {
      this.facade.updateProduct(this.editing.id, new UpdateProductCommand({ id: this.editing.id, ...raw })).subscribe({
        next: () => {
          Object.assign(this.editing!, raw);
          this.visible = false;
          this.message.success('Cập nhật hàng hóa thành công');
        },
        error: (e) => this.apiError.show(e)
      });
      return;
    }

    this.facade.createProduct(new CreateProductCommand({ donviid: this.companyId, ...raw })).subscribe({
      next: () => {
        this.products = [{ id: `hh-${Date.now()}`, ...raw }, ...this.products];
        this.visible = false;
        this.message.success('Thêm hàng hóa thành công');
      },
      error: (e) => this.apiError.show(e)
    });
  }

  delete(p: ProductVm): void {
    this.facade.deleteProduct(p.id).subscribe({
      next: () => {
        this.products = this.products.filter((x) => x.id !== p.id);
        this.message.success('Đã ngưng sử dụng hàng hóa');
      },
      error: (e) => this.apiError.show(e)
    });
  }
}
