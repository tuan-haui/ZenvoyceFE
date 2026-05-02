import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { UserApiDto, UserRoleFacadeService } from '../../core/services/user-role-facade.service';

@Component({
  selector: 'app-users-page',
  imports: [
    CommonModule,
    FormsModule,
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
          <th>Họ tên</th>
          <th>Tên đăng nhập</th>
          <th>Email</th>
          <th>Điện thoại</th>
          <th>Mã đơn vị</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let user of users">
          <td>{{ user.hoten || '—' }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.email || '—' }}</td>
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

    <nz-modal
      [(nzVisible)]="pwdVisible"
      nzTitle="Đổi mật khẩu"
      (nzOnCancel)="pwdVisible = false"
      (nzOnOk)="submitPwd()"
    >
      <div *nzModalContent class="pwd-modal">
        <input nz-input type="password" [(ngModel)]="pwdOld" placeholder="Mật khẩu cũ" />
        <input nz-input type="password" [(ngModel)]="pwdNew" placeholder="Mật khẩu mới" />
      </div>
    </nz-modal>

    <nz-modal [(nzVisible)]="formVisible" [nzTitle]="editingUser ? 'Cập nhật người dùng' : 'Thêm người dùng'" (nzOnCancel)="formVisible = false" (nzOnOk)="save()">
      <form nz-form [formGroup]="form" *nzModalContent>
        <nz-form-item><nz-form-control nzErrorTip="Nhập họ tên"><input nz-input formControlName="hoten" placeholder="Họ tên" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-control nzErrorTip="Nhập tên đăng nhập"><input nz-input formControlName="username" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-control><input nz-input formControlName="email" placeholder="Email" type="email" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-control><input nz-input formControlName="madonvi" placeholder="Mã đơn vị (Guid)" /></nz-form-control></nz-form-item>
        <nz-form-item><nz-form-control><input nz-input formControlName="phone" placeholder="Số điện thoại" /></nz-form-control></nz-form-item>
        <nz-form-item *ngIf="!editingUser"><nz-form-control><input nz-input formControlName="password" type="password" placeholder="Mật khẩu" /></nz-form-control></nz-form-item>
        <label nz-switch formControlName="active"></label> Hoạt động
      </form>
    </nz-modal>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      td a {
        margin-right: 10px;
      }
      .pwd-modal input {
        display: block;
        margin-bottom: 8px;
      }
    `
  ]
})
export class UsersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  users: Array<{
    id: string;
    username: string;
    hoten?: string;
    email?: string;
    phone: string;
    madonvi: string;
    status: number;
  }> = [];
  loading = false;
  formVisible = false;
  editingUser: (typeof this.users)[0] | null = null;
  pwdVisible = false;
  pwdUser: (typeof this.users)[0] | null = null;
  pwdOld = '';
  pwdNew = '';

  form = this.fb.nonNullable.group({
    hoten: [''],
    username: ['', Validators.required],
    email: [''],
    madonvi: [''],
    phone: [''],
    password: [''],
    active: [true]
  });

  constructor(
    private readonly facade: UserRoleFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.facade
      .getUsers(1, 100)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const items = res.items ?? [];
          this.users = items.map((u: UserApiDto) => this.mapUser(u));
        },
        error: (e) => this.apiError.show(e)
      });
  }

  private mapUser(u: UserApiDto): (typeof this.users)[0] {
    return {
      id: u.id,
      username: u.tendangnhap ?? '',
      hoten: u.hoten ?? undefined,
      email: u.email ?? undefined,
      phone: u.dienthoai ?? '',
      madonvi: u.madonvi ?? '',
      status: typeof u.trangthai === 'number' ? u.trangthai : 1
    };
  }

  openCreate(): void {
    this.editingUser = null;
    this.form.reset({ hoten: '', username: '', email: '', madonvi: '', phone: '', password: '', active: true });
    this.formVisible = true;
  }

  openEdit(user: (typeof this.users)[0]): void {
    this.editingUser = user;
    this.form.patchValue({
      hoten: user.hoten ?? '',
      username: user.username,
      email: user.email ?? '',
      madonvi: user.madonvi,
      phone: user.phone,
      password: '',
      active: user.status === 1
    });
    this.formVisible = true;
  }

  save(): void {
    if (this.form.invalid) return;
    const data = this.form.getRawValue();
    const status = data.active ? 1 : 0;
    const madonviGuid = data.madonvi?.trim() ? data.madonvi.trim() : undefined;

    if (this.editingUser) {
      const cmd = new UpdateUserCommand({
        id: this.editingUser.id,
        madonvi: madonviGuid,
        hoten: data.hoten?.trim() || undefined,
        email: data.email?.trim() || undefined,
        dienthoai: data.phone?.trim() || undefined,
        trangthai: status
      });
      this.facade.updateUser(this.editingUser.id, cmd).subscribe({
        next: () => {
          this.message.success('Cập nhật người dùng thành công');
          this.formVisible = false;
          this.load();
        },
        error: (e) => this.apiError.show(e)
      });
      return;
    }

    const cmd = new CreateUserCommand({
      tendangnhap: data.username.trim(),
      matkhau: data.password,
      madonvi: madonviGuid,
      hoten: data.hoten?.trim() || undefined,
      email: data.email?.trim() || undefined,
      dienthoai: data.phone?.trim() || undefined,
      trangthai: status
    });
    this.facade.createUser(cmd).subscribe({
      next: () => {
        this.message.success('Thêm người dùng thành công');
        this.formVisible = false;
        this.load();
      },
      error: (e) => this.apiError.show(e)
    });
  }

  deleteUser(user: (typeof this.users)[0]): void {
    this.facade.deleteUser(user.id).subscribe({
      next: () => {
        this.message.success('Đã khóa/xóa người dùng');
        this.load();
      },
      error: (e) => this.apiError.show(e)
    });
  }

  changePassword(user: (typeof this.users)[0]): void {
    this.pwdUser = user;
    this.pwdOld = '';
    this.pwdNew = '';
    this.pwdVisible = true;
  }

  submitPwd(): void {
    if (!this.pwdUser || !this.pwdOld || !this.pwdNew) {
      this.message.warning('Nhập đủ mật khẩu cũ và mới');
      return;
    }
    this.facade.changePassword(this.pwdUser.id, this.pwdOld, this.pwdNew).subscribe({
      next: () => {
        this.message.success('Đổi mật khẩu thành công');
        this.pwdVisible = false;
      },
      error: (e) => this.apiError.show(e)
    });
  }
}
