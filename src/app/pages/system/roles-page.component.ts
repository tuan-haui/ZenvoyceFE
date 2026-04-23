import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ApiErrorService } from '../../core/services/api-error.service';
import { UserRoleFacadeService } from '../../core/services/user-role-facade.service';

interface RoleVm { id: string; name: string; description: string; }

@Component({
  selector: 'app-roles-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzTableModule, NzButtonModule, NzCheckboxModule, NzSelectModule, NzFormModule, NzInputModule],
  template: `
    <h2>Quản lý phân quyền</h2>
    <form nz-form [formGroup]="roleForm" class="role-create">
      <input nz-input formControlName="name" placeholder="Tên vai trò" />
      <input nz-input formControlName="description" placeholder="Mô tả" />
      <button nz-button nzType="primary" (click)="createRole()">+ Thêm vai trò</button>
    </form>

    <div class="matrix-toolbar">
      <nz-select [(ngModel)]="selectedRoleId" [ngModelOptions]="{standalone: true}" nzPlaceHolder="Chọn vai trò">
        <nz-option *ngFor="let r of roles" [nzValue]="r.id" [nzLabel]="r.name"></nz-option>
      </nz-select>
      <button nz-button nzType="primary" (click)="savePermissions()">Lưu cấu hình quyền</button>
    </div>

    <nz-table [nzData]="permissionRows" [nzFrontPagination]="false">
      <thead><tr><th>Menu</th><th>Xem</th><th>Thêm</th><th>Sửa</th><th>Xóa</th></tr></thead>
      <tbody>
        <tr *ngFor="let row of permissionRows">
          <td>{{ row.menu }}</td>
          <td><label nz-checkbox [(ngModel)]="row.view" [ngModelOptions]="{standalone: true}"></label></td>
          <td><label nz-checkbox [(ngModel)]="row.create" [ngModelOptions]="{standalone: true}"></label></td>
          <td><label nz-checkbox [(ngModel)]="row.edit" [ngModelOptions]="{standalone: true}"></label></td>
          <td><label nz-checkbox [(ngModel)]="row.delete" [ngModelOptions]="{standalone: true}"></label></td>
        </tr>
      </tbody>
    </nz-table>
  `,
  styles: [`.role-create{display:grid;grid-template-columns:1fr 1fr auto;gap:12px;margin-bottom:16px;} .matrix-toolbar{display:flex;gap:12px;margin-bottom:12px;}`]
})
export class RolesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  roles: RoleVm[] = [];
  selectedRoleId = '';
  permissionRows = [
    { menu: 'Dashboard', code: 'dashboard', view: true, create: false, edit: false, delete: false },
    { menu: 'Quản lý người dùng', code: 'users', view: true, create: true, edit: true, delete: false },
    { menu: 'Công ty', code: 'companies', view: true, create: true, edit: true, delete: false },
    { menu: 'Khách hàng', code: 'customers', view: true, create: true, edit: true, delete: true },
    { menu: 'Hàng hóa', code: 'products', view: true, create: true, edit: true, delete: true }
  ];

  roleForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['']
  });

  constructor(
    private readonly facade: UserRoleFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.facade.getRoles().subscribe({
      next: () => {
        if (!this.roles.length) {
          this.roles = [
            { id: 'r-admin', name: 'Admin', description: 'Toàn quyền' },
            { id: 'r-accountant', name: 'Kế toán', description: 'Nghiệp vụ hóa đơn' }
          ];
        }
        this.selectedRoleId = this.roles[0]?.id ?? '';
      },
      error: (e) => this.apiError.show(e)
    });
  }

  createRole(): void {
    if (this.roleForm.invalid) return;
    const { name, description } = this.roleForm.getRawValue();
    this.facade.createRole(name, description).subscribe({
      next: () => {
        const role = { id: `r-${Date.now()}`, name, description };
        this.roles = [...this.roles, role];
        this.selectedRoleId = role.id;
        this.roleForm.reset({ name: '', description: '' });
        this.message.success('Thêm vai trò thành công');
      },
      error: (e) => this.apiError.show(e)
    });
  }

  savePermissions(): void {
    if (!this.selectedRoleId) return;
    const menuIds = this.permissionRows.filter((r) => r.view || r.create || r.edit || r.delete).map((r) => r.code);
    this.facade.assignPermissions(this.selectedRoleId, menuIds).subscribe({
      next: () => this.message.success('Lưu phân quyền thành công'),
      error: (e) => this.apiError.show(e)
    });
  }
}
