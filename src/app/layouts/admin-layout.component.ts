import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthFacadeService } from '../core/services/auth-facade.service';
import { MenuTreeNode, NavigationService } from '../core/services/navigation.service';
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
        <ul nz-menu nzTheme="light" nzMode="inline" [nzInlineCollapsed]="isCollapsed">
          @for (n of menuItems(); track n.key) {
            @if (n.children && n.children.length > 0) {
              <li nz-submenu [nzTitle]="n.title" [nzIcon]="n.icon || 'appstore'" nzOpen>
                <ul>
                  @for (c of n.children; track c.key) {
                    <li
                      nz-menu-item
                      [routerLink]="c.link || '/admin/dashboard'"
                      routerLinkActive="ant-menu-item-selected"
                    >
                      <nz-icon [nzType]="c.icon || 'appstore'" />
                      <span>{{ c.title }}</span>
                    </li>
                  }
                </ul>
              </li>
            } @else {
              <li
                nz-menu-item
                [routerLink]="n.link || '/admin/dashboard'"
                routerLinkActive="ant-menu-item-selected"
              >
                <nz-icon [nzType]="n.icon || 'appstore'" />
                <span>{{ n.title }}</span>
              </li>
            }
          }
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
  styles: [
    `
      .admin-layout {
        min-height: 100vh;
      }
      .menu-sidebar {
        background: #ffffff;
        box-shadow: 2px 0 8px rgba(15, 23, 42, 0.08);
      }
      :host ::ng-deep .menu-sidebar.ant-layout-sider {
        background: #ffffff;
      }
      :host ::ng-deep .menu-sidebar .ant-layout-sider-children {
        background: #ffffff;
      }
      :host ::ng-deep .menu-sidebar .ant-menu-light {
        background: #ffffff;
        border-inline-end: none !important;
      }
      .sidebar-logo {
        height: 64px;
        padding: 0 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #ffffff;
        color: #0f172a;
        border-bottom: 1px solid #f0f0f0;
      }
      .logo-dot {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #52c41a;
        display: inline-block;
      }
      .sidebar-logo h1 {
        color: #0f172a;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      .header {
        background: #fff;
        padding: 0 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
      }
      .user-area {
        cursor: pointer;
        font-weight: 500;
      }
      .content {
        margin: 20px;
      }
    `
  ]
})
export class AdminLayoutComponent implements OnInit {
  private readonly navigation = inject(NavigationService);
  private readonly sessionService = inject(SessionService);
  isCollapsed = false;

  /** Luôn có ít nhất 1 mục Dashboard kể cả khi tree đang trống/đang load. */
  readonly menuItems = computed<MenuTreeNode[]>(() => {
    const tree = this.navigation.tree();
    if (tree && tree.length > 0) {
      return tree;
    }
    return [{ key: 'dashboard', title: 'Dashboard', link: '/admin/dashboard', icon: 'dashboard' }];
  });

  get username(): string {
    return this.sessionService.getUsername();
  }

  constructor(
    private readonly authFacade: AuthFacadeService,
    private readonly message: NzMessageService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.navigation.loaded()) {
      this.navigation.refresh().subscribe({ error: () => void 0 });
    }
  }

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
