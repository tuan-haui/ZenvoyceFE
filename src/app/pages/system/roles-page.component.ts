import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { ApiErrorService } from '../../core/services/api-error.service';
import { MenuApiDto, RoleApiDto, UserApiDto, UserRoleFacadeService } from '../../core/services/user-role-facade.service';

interface PermRow {
  menuId: string;
  label: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

@Component({
  selector: 'app-roles-page',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzCheckboxModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule
  ],
  template: `
    <h2>Quản lý phân quyền</h2>
    <form nz-form [formGroup]="roleForm" class="role-create">
      <input nz-input formControlName="name" placeholder="Tên vai trò" />
      <input nz-input formControlName="description" placeholder="Mô tả" />
      <button nz-button nzType="primary" (click)="createRole()">+ Thêm vai trò</button>
    </form>

    <div class="matrix-toolbar">
      <nz-select
        [(ngModel)]="selectedRoleId"
        [ngModelOptions]="{ standalone: true }"
        nzPlaceHolder="Chọn vai trò (nhóm quyền)"
        (ngModelChange)="onRoleOrUserChange()"
        style="min-width: 200px"
      >
        <nz-option *ngFor="let r of roles" [nzValue]="r.id ?? ''" [nzLabel]="r.tenquyen ?? ''"></nz-option>
      </nz-select>
      <nz-select
        [(ngModel)]="selectedUserId"
        [ngModelOptions]="{ standalone: true }"
        nzPlaceHolder="Chọn người dùng"
        (ngModelChange)="onRoleOrUserChange()"
        style="min-width: 220px"
        nzShowSearch
      >
        <nz-option *ngFor="let u of users" [nzValue]="u.id ?? ''" [nzLabel]="(u.tendangnhap ?? '') + (u.hoten ? ' — ' + u.hoten : '')"></nz-option>
      </nz-select>
      <button nz-button nzType="primary" [nzLoading]="saving" (click)="savePermissions()">Lưu cấu hình quyền</button>
    </div>

    <nz-table [nzData]="permissionRows" [nzLoading]="loadingMatrix" [nzFrontPagination]="false">
      <thead>
        <tr>
          <th>Menu</th>
          <th>Xem</th>
          <th>Thêm</th>
          <th>Sửa</th>
          <th>Xóa</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let row of permissionRows">
          <td>{{ row.label }}</td>
          <td><label nz-checkbox [(ngModel)]="row.view" [ngModelOptions]="{ standalone: true }"></label></td>
          <td><label nz-checkbox [(ngModel)]="row.create" [ngModelOptions]="{ standalone: true }"></label></td>
          <td><label nz-checkbox [(ngModel)]="row.edit" [ngModelOptions]="{ standalone: true }"></label></td>
          <td><label nz-checkbox [(ngModel)]="row.delete" [ngModelOptions]="{ standalone: true }"></label></td>
        </tr>
      </tbody>
    </nz-table>
    <p class="hint">
      Một menu được gán nếu ít nhất một quyền được chọn. Backend lưu danh sách Menu ID (Guid) theo cặp
      (người dùng, vai trò).
    </p>
  `,
  styles: [
    `
      .role-create {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 12px;
        margin-bottom: 16px;
      }
      .matrix-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 12px;
        align-items: center;
      }
      .hint {
        font-size: 12px;
        color: #64748b;
        margin-top: 8px;
      }
    `
  ]
})
export class RolesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  roles: RoleApiDto[] = [];
  users: UserApiDto[] = [];
  selectedRoleId = '';
  selectedUserId = '';
  permissionRows: PermRow[] = [];
  loadingMatrix = false;
  saving = false;

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
      next: (r) => {
        this.roles = r;
        this.selectedRoleId = r[0]?.id ?? '';
      },
      error: (e) => this.apiError.show(e)
    });
    this.facade.getUsers(1, 500).subscribe({
      next: (p) => {
        this.users = p.items ?? [];
        this.selectedUserId = this.users[0]?.id ?? '';
        this.onRoleOrUserChange();
      },
      error: (e) => this.apiError.show(e)
    });
  }

  createRole(): void {
    if (this.roleForm.invalid) return;
    const { name, description } = this.roleForm.getRawValue();
    this.facade.createRole(name, description).subscribe({
      next: () => {
        this.roleForm.reset({ name: '', description: '' });
        this.message.success('Thêm vai trò thành công');
        this.facade.getRoles().subscribe({
          next: (r) => {
            this.roles = r;
            this.selectedRoleId = r[r.length - 1]?.id ?? '';
            this.onRoleOrUserChange();
          },
          error: (e) => this.apiError.show(e)
        });
      },
      error: (e) => this.apiError.show(e)
    });
  }

  onRoleOrUserChange(): void {
    if (!this.selectedRoleId || !this.selectedUserId) {
      this.permissionRows = [];
      return;
    }
    this.loadingMatrix = true;
    forkJoin({
      menus: this.facade.getMenusForRole(this.selectedRoleId).pipe(catchError(() => of([] as MenuApiDto[]))),
      assigned: this.facade.getAssignedMenuIds(this.selectedRoleId, this.selectedUserId).pipe(catchError(() => of([] as string[])))
    }).subscribe({
      next: ({ menus, assigned }) => {
        const set = new Set(assigned.map((x) => x.toLowerCase()));
        this.permissionRows = menus.map((m) => {
          const id = (m.id ?? '').toString();
          const key = id.toLowerCase();
          return {
            menuId: id,
            label: (m.tenmenu ?? '') + (m.duongdan ? ` (${m.duongdan})` : ''),
            view: set.has(key),
            create: set.has(key),
            edit: set.has(key),
            delete: set.has(key)
          };
        });
        this.loadingMatrix = false;
      },
      error: (e) => {
        this.loadingMatrix = false;
        this.apiError.show(e);
      }
    });
  }

  savePermissions(): void {
    if (!this.selectedRoleId || !this.selectedUserId) {
      this.message.warning('Chọn vai trò và người dùng');
      return;
    }
    const menuIds = this.permissionRows
      .filter((r) => r.view || r.create || r.edit || r.delete)
      .map((r) => r.menuId);
    this.saving = true;
    this.facade
      .assignPermissions(this.selectedRoleId, this.selectedUserId, menuIds)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => this.message.success('Lưu phân quyền thành công'),
        error: (e) => this.apiError.show(e)
      });
  }
}
