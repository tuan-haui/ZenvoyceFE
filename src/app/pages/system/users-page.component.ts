import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CompanyDto, CreateUserCommand, UpdateUserCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CatalogFacadeService } from '../../core/services/catalog-facade.service';
import { UserApiDto, UserRoleFacadeService } from '../../core/services/user-role-facade.service';

// Validator riêng cho mật khẩu, khớp với regex phía backend:
//   ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$
// Yêu cầu: tối thiểu 8 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
function passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '') as string;
  if (!value) return null;

  const checks = {
    minLength: value.length >= 8,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    digit: /\d/.test(value),
    special: /[^\w\s]/.test(value)
  };

  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  if (failed.length === 0) return null;
  return { passwordComplexity: { failed: failed.map(([k]) => k) } };
}

interface UserRow {
  id: string;
  username: string;
  hoten?: string;
  email?: string;
  phone: string;
  madonvi: string;
  status: number;
}

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
    NzPopconfirmModule,
    NzSelectModule,
    NzIconModule,
    NzToolTipModule
  ],
  template: `
    <div class="page-header">
      <h2>Quản lý người dùng</h2>
      <button nz-button nzType="primary" (click)="openCreate()">
        <nz-icon nzType="user-add" nzTheme="outline"></nz-icon>
        Thêm người dùng
      </button>
    </div>

    <nz-table [nzData]="users" [nzLoading]="loading" [nzFrontPagination]="false">
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Tên đăng nhập</th>
          <th>Email</th>
          <th>Điện thoại</th>
          <th>Đơn vị</th>
          <th>Trạng thái</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let user of users">
          <td>{{ user.hoten || '—' }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.email || '—' }}</td>
          <td>{{ user.phone || '—' }}</td>
          <td>{{ companyName(user.madonvi) }}</td>
          <td>
            <nz-tag [nzColor]="user.status === 1 ? 'green' : 'red'">
              {{ user.status === 1 ? 'Hoạt động' : 'Khóa' }}
            </nz-tag>
          </td>
          <td class="ops-cell">
            <button nz-button nzType="text" nz-tooltip nzTooltipTitle="Sửa" (click)="openEdit(user)">
              <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
            </button>
            <button
              nz-button
              nzType="text"
              nz-tooltip
              nzTooltipTitle="Khóa người dùng"
              nz-popconfirm
              nzPopconfirmTitle="Khóa người dùng?"
              (nzOnConfirm)="deleteUser(user)"
            >
              <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
            </button>
            <button nz-button nzType="text" nz-tooltip nzTooltipTitle="Đổi mật khẩu" (click)="changePassword(user)">
              <nz-icon nzType="key" nzTheme="outline"></nz-icon>
            </button>
          </td>
        </tr>
      </tbody>
    </nz-table>

    <nz-modal
      [(nzVisible)]="pwdVisible"
      nzTitle="Đổi mật khẩu"
      (nzOnCancel)="pwdVisible = false"
      (nzOnOk)="submitPwd()"
      [nzOkLoading]="pwdSaving"
    >
      <div *nzModalContent class="pwd-modal">
        <input nz-input type="password" [(ngModel)]="pwdOld" placeholder="Mật khẩu cũ" />
        <input nz-input type="password" [(ngModel)]="pwdNew" placeholder="Mật khẩu mới" />
      </div>
    </nz-modal>

    <nz-modal
      [(nzVisible)]="formVisible"
      [nzTitle]="editingUser ? 'Cập nhật người dùng' : 'Thêm người dùng'"
      [nzOkText]="editingUser ? 'Cập nhật' : 'Thêm mới'"
      nzCancelText="Hủy"
      [nzOkLoading]="saving"
      [nzWidth]="640"
      (nzOnCancel)="closeForm()"
      (nzOnOk)="save()"
    >
      <form nz-form [formGroup]="form" nzLayout="vertical" *nzModalContent>
        <div class="form-grid">
          <!-- Họ và tên -->
          <nz-form-item class="col-span-2">
            <nz-form-label nzRequired>Họ và tên</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng nhập họ và tên">
              <input nz-input formControlName="hoten" placeholder="VD: Nguyễn Văn A" />
            </nz-form-control>
          </nz-form-item>

          <!-- Tên đăng nhập -->
          <nz-form-item>
            <nz-form-label nzRequired>
              Tên đăng nhập
              <span nz-tooltip nzTooltipTitle="Tối thiểu 5 ký tự, không có khoảng trắng" class="hint-icon">
                <nz-icon nzType="info-circle" nzTheme="outline"></nz-icon>
              </span>
            </nz-form-label>
            <nz-form-control [nzErrorTip]="usernameErrorTpl">
              <input nz-input formControlName="username" placeholder="VD: nguyenvana" autocomplete="off" />
              <ng-template #usernameErrorTpl let-control>
                <ng-container *ngIf="control.hasError('required')">Vui lòng nhập tên đăng nhập</ng-container>
                <ng-container *ngIf="control.hasError('minlength')">Tên đăng nhập tối thiểu 5 ký tự</ng-container>
                <ng-container *ngIf="control.hasError('pattern')">Tên đăng nhập không được chứa khoảng trắng</ng-container>
              </ng-template>
            </nz-form-control>
          </nz-form-item>

          <!-- Email -->
          <nz-form-item>
            <nz-form-label>Email</nz-form-label>
            <nz-form-control nzErrorTip="Email không hợp lệ">
              <input nz-input formControlName="email" type="email" placeholder="VD: nguyenvana@company.vn" />
            </nz-form-control>
          </nz-form-item>

          <!-- Đơn vị -->
          <nz-form-item>
            <nz-form-label>Đơn vị</nz-form-label>
            <nz-form-control>
              <nz-select
                formControlName="madonvi"
                nzPlaceHolder="Chọn đơn vị"
                nzAllowClear
                nzShowSearch
                [nzLoading]="loadingCompanies"
                [nzOptionHeightPx]="40"
              >
                <nz-option
                  *ngFor="let c of companies"
                  [nzValue]="c.id"
                  [nzLabel]="c.tendonvi || (c.masothue || '—')"
                ></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <!-- Số điện thoại -->
          <nz-form-item>
            <nz-form-label>Số điện thoại</nz-form-label>
            <nz-form-control nzErrorTip="Số điện thoại chỉ chứa số (9-15 ký tự)">
              <input nz-input formControlName="phone" placeholder="VD: 0901234567" />
            </nz-form-control>
          </nz-form-item>

          <!-- Mật khẩu (chỉ khi tạo mới) -->
          <nz-form-item class="col-span-2" *ngIf="!editingUser">
            <nz-form-label nzRequired>
              Mật khẩu
              <span
                nz-tooltip
                nzTooltipTitle="Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                class="hint-icon"
              >
                <nz-icon nzType="info-circle" nzTheme="outline"></nz-icon>
              </span>
            </nz-form-label>
            <nz-form-control [nzErrorTip]="passwordErrorTpl">
              <input nz-input type="password" formControlName="password" placeholder="Nhập mật khẩu" autocomplete="new-password" />
              <ng-template #passwordErrorTpl let-control>
                <ng-container *ngIf="control.hasError('required')">Vui lòng nhập mật khẩu</ng-container>
                <ng-container *ngIf="control.hasError('passwordComplexity')">
                  Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt
                </ng-container>
              </ng-template>
              <p class="field-hint">Ví dụ hợp lệ: <code>Zenvoyce@2026</code></p>
            </nz-form-control>
          </nz-form-item>

          <!-- Trạng thái -->
          <nz-form-item class="col-span-2 status-row">
            <nz-form-label>Trạng thái</nz-form-label>
            <nz-form-control>
              <nz-switch
                formControlName="active"
                nzCheckedChildren="Hoạt động"
                nzUnCheckedChildren="Khóa"
              ></nz-switch>
            </nz-form-control>
          </nz-form-item>
        </div>
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
      .ops-cell {
        display: flex;
      }
      .pwd-modal input {
        display: block;
        margin-bottom: 8px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 24px;
      }
      .col-span-2 {
        grid-column: 1 / -1;
      }
      .status-row nz-switch {
        margin-top: 4px;
      }
      .hint-icon {
        margin-left: 6px;
        color: #8c8c8c;
        cursor: help;
      }
      .field-hint {
        margin: 4px 0 0;
        color: #8c8c8c;
        font-size: 12px;
      }
      .field-hint code {
        background: #f5f5f5;
        padding: 0 4px;
        border-radius: 2px;
      }
    `
  ]
})
export class UsersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  users: UserRow[] = [];
  companies: CompanyDto[] = [];
  loading = false;
  loadingCompanies = false;

  formVisible = false;
  saving = false;
  editingUser: UserRow | null = null;

  pwdVisible = false;
  pwdSaving = false;
  pwdUser: UserRow | null = null;
  pwdOld = '';
  pwdNew = '';

  // Form chính: dùng nonNullable để giá trị không bao giờ là null,
  // các validators được khớp với ràng buộc của backend
  // (xem CreateUserCommandValidator / UpdateUserCommandValidator).
  form = this.fb.nonNullable.group({
    hoten: ['', [Validators.required, Validators.maxLength(255)]],
    username: ['', [Validators.required, Validators.minLength(5), Validators.pattern(/^\S+$/)]],
    email: ['', [Validators.email]],
    madonvi: [''],
    phone: ['', [Validators.pattern(/^[0-9+\-\s()]{9,15}$/)]],
    password: ['', [Validators.required, passwordComplexityValidator]],
    active: [true]
  });

  constructor(
    private readonly facade: UserRoleFacadeService,
    private readonly catalog: CatalogFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) { }

  ngOnInit(): void {
    this.loadAll();
  }

  /** Tải đồng thời danh sách người dùng và đơn vị để hiển thị tên đơn vị trong bảng. */
  private loadAll(): void {
    this.loading = true;
    this.loadingCompanies = true;
    forkJoin({
      users: this.facade.getUsers(1, 100),
      companies: this.catalog.getCompanies().pipe(catchError(() => of([] as CompanyDto[])))
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.loadingCompanies = false;
        })
      )
      .subscribe({
        next: ({ users, companies }) => {
          this.companies = companies ?? [];
          const items = users.items ?? [];
          this.users = items.map((u) => this.mapUser(u));
        },
        error: (e) => this.apiError.show(e)
      });
  }

  /** Chỉ tải lại danh sách người dùng (dùng sau khi tạo / cập nhật / khóa). */
  private reloadUsers(): void {
    this.loading = true;
    this.facade
      .getUsers(1, 100)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const items = res.items ?? [];
          this.users = items.map((u) => this.mapUser(u));
        },
        error: (e) => this.apiError.show(e)
      });
  }

  private mapUser(u: UserApiDto): UserRow {
    return {
      id: u.id ?? '',
      username: u.tendangnhap ?? '',
      hoten: u.hoten ?? undefined,
      email: u.email ?? undefined,
      phone: u.dienthoai ?? '',
      madonvi: u.madonvi ?? '',
      status: typeof u.trangthai === 'number' ? u.trangthai : 1
    };
  }

  /** Lấy tên đơn vị từ id để hiển thị trong bảng. */
  companyName(id: string): string {
    if (!id) return '—';
    const found = this.companies.find((c) => c.id === id);
    return found?.tendonvi || '—';
  }

  // ------ Tạo mới / cập nhật ------

  openCreate(): void {
    this.editingUser = null;
    this.form.reset({
      hoten: '',
      username: '',
      email: '',
      madonvi: this.companies[0]?.id ?? '',
      phone: '',
      password: '',
      active: true
    });
    // Khi tạo mới: bật lại các control có thể đã bị disable trước đó
    this.form.get('username')!.enable();
    this.form.get('password')!.enable();
    this.form.get('password')!.setValidators([Validators.required, passwordComplexityValidator]);
    this.form.get('password')!.updateValueAndValidity();
    this.formVisible = true;
  }

  openEdit(user: UserRow): void {
    this.editingUser = user;
    this.form.reset({
      hoten: user.hoten ?? '',
      username: user.username,
      email: user.email ?? '',
      madonvi: user.madonvi ?? '',
      phone: user.phone ?? '',
      password: '',
      active: user.status === 1
    });
    // Khi cập nhật: không cho sửa tên đăng nhập, không yêu cầu mật khẩu
    this.form.get('username')!.disable();
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.updateValueAndValidity();
    this.formVisible = true;
  }

  closeForm(): void {
    this.formVisible = false;
    this.editingUser = null;
    this.saving = false;
  }

  save(): void {
    // Đánh dấu toàn bộ control là dirty/touched để hiển thị lỗi
    Object.values(this.form.controls).forEach((c) => {
      c.markAsDirty();
      c.markAsTouched();
      c.updateValueAndValidity({ onlySelf: true });
    });

    if (this.form.invalid) {
      this.message.warning('Vui lòng kiểm tra lại các trường còn thiếu hoặc không hợp lệ');
      return;
    }

    const data = this.form.getRawValue();
    const status = data.active ? 1 : 0;
    // madonvi là Guid? trên backend → bỏ qua khi không chọn
    const madonviGuid = data.madonvi?.trim() ? data.madonvi.trim() : undefined;
    const hoten = data.hoten.trim();
    const email = data.email?.trim() || undefined;
    const phone = data.phone?.trim() || undefined;

    this.saving = true;

    if (this.editingUser) {
      const cmd = new UpdateUserCommand({
        id: this.editingUser.id,
        madonvi: madonviGuid,
        hoten,
        email,
        dienthoai: phone,
        trangthai: status
      });
      this.facade
        .updateUser(this.editingUser.id, cmd)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: () => {
            this.message.success('Cập nhật người dùng thành công');
            this.formVisible = false;
            this.editingUser = null;
            this.reloadUsers();
          },
          error: (e) => this.apiError.show(e)
        });
      return;
    }

    const cmd = new CreateUserCommand({
      tendangnhap: data.username.trim(),
      matkhau: data.password,
      madonvi: madonviGuid,
      hoten,
      email,
      dienthoai: phone,
      trangthai: status
    });
    this.facade
      .createUser(cmd)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.message.success('Thêm người dùng thành công');
          this.formVisible = false;
          this.reloadUsers();
        },
        error: (e) => this.apiError.show(e)
      });
  }

  // ------ Khóa người dùng ------

  deleteUser(user: UserRow): void {
    this.facade.deleteUser(user.id).subscribe({
      next: () => {
        this.message.success('Đã xóa người dùng');
        this.reloadUsers();
      },
      error: (e) => this.apiError.show(e)
    });
  }

  // ------ Đổi mật khẩu ------

  changePassword(user: UserRow): void {
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
    this.pwdSaving = true;
    this.facade
      .changePassword(this.pwdUser.id, this.pwdOld, this.pwdNew)
      .pipe(finalize(() => (this.pwdSaving = false)))
      .subscribe({
        next: () => {
          this.message.success('Đổi mật khẩu thành công');
          this.pwdVisible = false;
        },
        error: (e) => this.apiError.show(e)
      });
  }
}
