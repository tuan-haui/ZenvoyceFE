import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CreateUserCommand, UpdateUserCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { UserRoleFacadeService } from '../../core/services/user-role-facade.service';

interface UserVm {
  id: string;
  username: string;
  phone: string;
  madonvi: string;
  status: number;
}

@Component({
  selector: 'app-users-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzModalModule,
    NzTagModule,
    NzSwitchModule,
    NzPopconfirmModule
  ],
  template: `
    <div class="page-header">
      <h2>Quản lý người dùng</h2>
      <button nz-button nzType="primary" (click)="openCreate()">+ Thêm mới</button>
    </div>

    <nz-table [nzData]="users" [nzLoading]="loading" [nzFrontPagination]="false">
      <thead>
        <tr>
          <th>Tên đăng nhập</th><th>Điện thoại</th><th>Mã đơn vị</th><th>Trạng thái</th><th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let user of users">
          <td>{{ user.username }}</td>
          <td>{{ user.phone }}</td>
          <td>{{ user.madonvi }}</td>
          <td><nz-tag [nzColor]="user.status === 1 ? 'green' : 'red'">{{ user.status === 1 ? 'Hoạt động' : 'Khóa' }}</nz-tag></td>
          <td>
            <a (click)="openEdit(user)">Sửa</a>
            <a nz-popconfirm nzPopconfirmTitle="Khóa người dùng?" (nzOnConfirm)="deleteUser(user)">Khóa</a>
            <a (click)="changePassword(user)">Đổi mật khẩu</a>
          </td>
        </tr>
      </tbody>
    </nz-table>

    <nz-modal [(nzVisible)]="formVisible" [nzTitle]="editingUser ? 'Cập nhật người dùng' : 'Thêm người dùng'" (nzOnCancel)="formVisible = false" (nzOnOk)="save()">
      <form nz-form [formGroup]="form">
        <nz-form-item><nz-form-control nzErrorTip="Nhập tên đăng nhập"><input nz-input formControlName="username" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-control><input nz-input formControlName="madonvi" placeholder="Mã đơn vị" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-control><input nz-input formControlName="phone" placeholder="Số điện thoại" /></nz-form-control></nz-form-item>
        <nz-form-item *ngIf="!editingUser"><nz-form-control><input nz-input formControlName="password" type="password" placeholder="Mật khẩu" /></nz-form-control></nz-form-item>
        <label nz-switch formControlName="active"></label>
      </form>
    </nz-modal>
  `,
  styles: [`.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;} td a{margin-right:10px;}`]
})
export class UsersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  users: UserVm[] = [];
  loading = false;
  formVisible = false;
  editingUser: UserVm | null = null;
  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    madonvi: ['DV001'],
    phone: [''],
    password: [''],
    active: [true]
  });

  constructor(
    private readonly facade: UserRoleFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.facade.getUsers().pipe(finalize(() => (this.loading = false))).subscribe({
      next: () => {
        if (!this.users.length) {
          this.users = [
            { id: 'u-1', username: 'admin', phone: '0987000001', madonvi: 'DV001', status: 1 },
            { id: 'u-2', username: 'ketoan01', phone: '0987000002', madonvi: 'DV001', status: 0 }
          ];
        }
      },
      error: (e) => this.apiError.show(e)
    });
  }

  openCreate(): void {
    this.editingUser = null;
    this.form.reset({ username: '', madonvi: 'DV001', phone: '', password: '', active: true });
    this.formVisible = true;
  }

  openEdit(user: UserVm): void {
    this.editingUser = user;
    this.form.patchValue({ username: user.username, phone: user.phone, madonvi: user.madonvi, active: user.status === 1, password: '' });
    this.formVisible = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const data = this.form.getRawValue();
    const status = data.active ? 1 : 0;

    if (this.editingUser) {
      const cmd = new UpdateUserCommand({ id: this.editingUser.id, madonvi: data.madonvi, dienthoai: data.phone, trangthai: status });
      this.facade.updateUser(this.editingUser.id, cmd).subscribe({
        next: () => {
          if (this.editingUser) {
            Object.assign(this.editingUser, { phone: data.phone, madonvi: data.madonvi, status });
          }
          this.message.success('Cập nhật người dùng thành công');
          this.formVisible = false;
        },
        error: (e) => this.apiError.show(e)
      });
      return;
    }

    const cmd = new CreateUserCommand({ tendangnhap: data.username, matkhau: data.password, madonvi: data.madonvi, dienthoai: data.phone, trangthai: status });
    this.facade.createUser(cmd).subscribe({
      next: () => {
        this.users = [{ id: `u-${Date.now()}`, username: data.username, phone: data.phone, madonvi: data.madonvi, status }, ...this.users];
        this.message.success('Thêm người dùng thành công');
        this.formVisible = false;
      },
      error: (e) => this.apiError.show(e)
    });
  }

  deleteUser(user: UserVm): void {
    this.facade.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.message.success('Đã khóa/xóa người dùng');
      },
      error: (e) => this.apiError.show(e)
    });
  }

  changePassword(user: UserVm): void {
    this.facade.changePassword(user.id, 'old-password', 'new-password@123').subscribe({
      next: () => this.message.success(`Đổi mật khẩu tạm cho ${user.username} thành công`),
      error: (e) => this.apiError.show(e)
    });
  }
}
