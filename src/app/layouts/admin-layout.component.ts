import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
    CommonModule,
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
          <ng-container *ngTemplateOutlet="menuTpl; context: { $implicit: menuTree() }"></ng-container>
        </ul>
        <ng-template #menuTpl let-nodes>
          <ng-container *ngFor="let n of nodes">
            <ng-container *ngIf="n.children && n.children.length > 0">
              <li nz-submenu [nzTitle]="n.title">
                <ul>
                  <ng-container *ngTemplateOutlet="menuTpl; context: { $implicit: n.children }"></ng-container>
                </ul>
              </li>
            </ng-container>
            <ng-container *ngIf="!n.children || n.children.length === 0">
              <li
                nz-menu-item
                [routerLink]="n.link || '/admin/dashboard'"
                routerLinkActive="ant-menu-item-selected"
              >
                {{ n.title }}
              </li>
            </ng-container>
          </ng-container>
        </ng-template>
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
        box-shadow: 2px 0 8px rgba(15, 23, 42, 0.14);
      }
      .sidebar-logo {
        height: 64px;
        padding: 0 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #001529;
        color: #fff;
      }
      .logo-dot {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #52c41a;
        display: inline-block;
      }
      .sidebar-logo h1 {
        color: #fff;
        margin: 0;
        font-size: 18px;
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

  readonly menuTree = (): MenuTreeNode[] => this.navigation.tree();

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
