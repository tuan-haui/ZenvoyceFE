import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { AuthFacadeService } from '../../core/services/auth-facade.service';
import { ApiErrorService } from '../../core/services/api-error.service';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzCheckboxModule,
    NzButtonModule,
    NzModalModule
  ],
  template: `
    <nz-card class="login-card">
      <div class="logo">Zenvoyce</div>
      <h2>Đăng nhập hệ thống</h2>

      <form nz-form [formGroup]="form" (ngSubmit)="submit()">
        <nz-form-item>
          <nz-form-control nzErrorTip="Vui lòng nhập tên đăng nhập">
            <input nz-input formControlName="username" placeholder="Tên đăng nhập" />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control nzErrorTip="Vui lòng nhập mật khẩu">
            <input nz-input type="password" formControlName="password" placeholder="Mật khẩu" />
          </nz-form-control>
        </nz-form-item>

        <label nz-checkbox formControlName="remember">Nhớ mật khẩu</label>
        <div class="actions">
          <button nz-button nzType="primary" [nzLoading]="loading" [disabled]="form.invalid">Đăng nhập</button>
          <button nz-button nzType="link" type="button" (click)="openForgotPassword()">Quên mật khẩu?</button>
        </div>
      </form>
    </nz-card>
  `,
  styles: [`
    .login-card { border-radius: 12px; box-shadow: 0 6px 20px rgba(0, 93, 170, 0.08); }
    .logo { font-size: 24px; font-weight: 700; color: #005daa; margin-bottom: 8px; }
    h2 { margin-bottom: 18px; }
    .actions { margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  `]
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  loading = false;

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    remember: [true]
  });

  constructor(
    private readonly authFacade: AuthFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly modal: NzModalService,
    private readonly message: NzMessageService,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { username, password } = this.form.getRawValue();
    this.authFacade.login(username, password)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.message.success('Đăng nhập thành công');
          void this.router.navigate(['/admin/dashboard']);
        },
        error: (error) => this.apiError.show(error, 'Đăng nhập thất bại')
      });
  }

  openForgotPassword(): void {
    this.modal.info({
      nzTitle: 'Quên mật khẩu',
      nzContent: 'Nhập email tại màn hình reset mật khẩu (phase tiếp theo sẽ tích hợp OTP/Link).'
    });
  }
}
