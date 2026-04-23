import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthFacadeService } from '../core/services/auth-facade.service';
import { SessionService } from '../core/services/session.service';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzDropDownModule,
    NzButtonModule
  ],
  template: `
    <nz-layout class="admin-layout">
      <nz-sider
        class="menu-sidebar"
        nzCollapsible
        nzWidth="260px"
        [(nzCollapsed)]="isCollapsed"
        [nzTrigger]="null"
      >
        <div class="sidebar-logo">
          <span class="logo-dot"></span>
          <h1>Zenvoyce</h1>
        </div>
        <ul nz-menu nzTheme="dark" nzMode="inline" [nzInlineCollapsed]="isCollapsed">
          <li nz-menu-item routerLink="/admin/dashboard" routerLinkActive="ant-menu-item-selected">Dashboard</li>
          <li nz-submenu nzTitle="Quản trị hệ thống">
            <ul>
              <li nz-menu-item routerLink="/admin/users" routerLinkActive="ant-menu-item-selected">Quản lý người dùng</li>
              <li nz-menu-item routerLink="/admin/roles" routerLinkActive="ant-menu-item-selected">Phân quyền</li>
            </ul>
          </li>
          <li nz-submenu nzTitle="Quản lý danh mục">
            <ul>
              <li nz-menu-item routerLink="/admin/companies" routerLinkActive="ant-menu-item-selected">Công ty</li>
              <li nz-menu-item routerLink="/admin/customers" routerLinkActive="ant-menu-item-selected">Khách hàng</li>
              <li nz-menu-item routerLink="/admin/products" routerLinkActive="ant-menu-item-selected">Hàng hóa/Dịch vụ</li>
            </ul>
          </li>
        </ul>
      </nz-sider>

      <nz-layout>
        <nz-header class="header">
          <button nz-button nzType="text" (click)="isCollapsed = !isCollapsed">
            <nz-icon [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" />
          </button>

          <div nz-dropdown [nzDropdownMenu]="userMenu" class="user-area">
            {{ username }}
          </div>
          <nz-dropdown-menu #userMenu="nzDropdownMenu">
            <ul nz-menu>
              <li nz-menu-item (click)="logout()">Đăng xuất</li>
            </ul>
          </nz-dropdown-menu>
        </nz-header>

        <nz-content class="content">
          <router-outlet />
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .admin-layout { min-height: 100vh; }
    .menu-sidebar { box-shadow: 2px 0 8px rgba(15, 23, 42, 0.14); }
    .sidebar-logo {
      height: 64px; padding: 0 20px; display: flex; align-items: center; gap: 10px;
      background: #001529; color: #fff;
    }
    .logo-dot {
      width: 12px; height: 12px; border-radius: 999px; background: #52c41a;
      display: inline-block;
    }
    .sidebar-logo h1 { color: #fff; margin: 0; font-size: 18px; }
    .header {
      background: #fff; padding: 0 16px; display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    }
    .user-area { cursor: pointer; font-weight: 500; }
    .content { margin: 20px; }
  `]
})
export class AdminLayoutComponent {
  isCollapsed = false;
  get username(): string {
    return this.sessionService.getUsername();
  }

  constructor(
    private readonly authFacade: AuthFacadeService,
    private readonly sessionService: SessionService,
    private readonly message: NzMessageService,
    private readonly router: Router
  ) {}

  logout(): void {
    this.authFacade.logout().subscribe({
      next: () => {
        this.message.success('Đăng xuất thành công');
        void this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.sessionService.clear();
        void this.router.navigate(['/auth/login']);
      }
    });
  }
}
