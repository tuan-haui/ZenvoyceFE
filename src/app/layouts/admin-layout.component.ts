import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { AuthFacadeService } from '../core/services/auth-facade.service';
import { COLOR_OPTIONS, ThemeColor, ThemeService } from '../core/services/theme.service';
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
    NzButtonModule,
    NzPopoverModule,
  ],
  template: `
    <nz-layout class="admin-layout">
      <!-- ===================== SIDEBAR ===================== -->
      <nz-sider
        class="menu-sidebar"
        nzCollapsible
        nzWidth="260px"
        [(nzCollapsed)]="isCollapsed"
        [nzTrigger]="null"
      >
        <!-- Logo -->
        <div class="sidebar-logo">
          <span class="logo-dot"></span>
          @if (!isCollapsed) {
            <h1>Zenvoyce</h1>
          }
        </div>

        <!-- Menu items (scrollable) -->
        <div class="sidebar-menu-wrapper">
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
        </div>

        <!-- ======= User Profile Footer ======= -->
        <div class="sidebar-footer">
          <div
            class="user-profile-card"
            nz-popover
            [nzPopoverContent]="profileTpl"
            nzPopoverPlacement="rightTop"
            nzPopoverTrigger="click"
            nzPopoverOverlayClassName="user-profile-overlay"
            [(nzPopoverVisible)]="profileVisible"
          >
            <div class="avatar-circle">{{ userInitial }}</div>
            @if (!isCollapsed) {
              <div class="profile-info">
                <span class="profile-name">{{ username }}</span>
                <span class="profile-role">Quản trị viên</span>
              </div>
              <nz-icon nzType="ellipsis" class="profile-more-icon" />
            }
          </div>
        </div>
      </nz-sider>

      <!-- ===================== MAIN LAYOUT ===================== -->
      <nz-layout>
        <nz-header class="header">
          <button nz-button nzType="text" (click)="isCollapsed = !isCollapsed">
            <nz-icon [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" />
          </button>
        </nz-header>

        <nz-content class="content">
          <router-outlet />
        </nz-content>
      </nz-layout>
    </nz-layout>

    <!-- =================== Profile Popup Template =================== -->
    <ng-template #profileTpl>
      <div class="popup-inner">
        <!-- User info row -->
        <div class="popup-user-row">
          <div class="popup-avatar-lg">{{ userInitial }}</div>
          <div class="popup-user-meta">
            <span class="popup-username">{{ username }}</span>
            <span class="popup-role-badge">Quản trị viên</span>
          </div>
        </div>

        <div class="popup-sep"></div>

        <!-- Color theme -->
        <p class="popup-section-label">Màu chủ đề</p>
        <div class="popup-color-row">
          @for (c of colorOptions; track c.id) {
            <button
              class="color-swatch"
              [class.active]="activeColor() === c.id"
              [style.background]="c.primary"
              [title]="c.label"
              (click)="setThemeColor(c.id)"
            >
              @if (activeColor() === c.id) {
                <nz-icon nzType="check" class="swatch-check" />
              }
            </button>
          }
        </div>

        <div class="popup-sep"></div>

        <!-- Dark / Light toggle -->
        <button class="popup-action-btn" (click)="toggleThemeMode()">
          <nz-icon [nzType]="isDark() ? 'sun' : 'moon'" />
          <span>{{ isDark() ? 'Chế độ sáng' : 'Chế độ tối' }}</span>
        </button>

        <div class="popup-sep"></div>

        <!-- Logout -->
        <button class="popup-action-btn danger" (click)="logout()">
          <nz-icon nzType="logout" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </ng-template>
  `,
  styles: [
    `
      /* ── Layout ── */
      .admin-layout {
        min-height: 100vh;
      }

      /* ── Sidebar ── */
      .menu-sidebar {
        background: #ffffff;
        box-shadow: 2px 0 8px rgba(15, 23, 42, 0.08);
      }
      :host ::ng-deep .menu-sidebar.ant-layout-sider {
        background: #ffffff;
      }
      :host ::ng-deep .menu-sidebar .ant-layout-sider-children {
        background: #ffffff;
        display: flex;
        flex-direction: column;
      }
      :host ::ng-deep .menu-sidebar .ant-menu-light {
        background: #ffffff;
        border-inline-end: none !important;
      }

      /* Logo */
      .sidebar-logo {
        height: 64px;
        padding: 0 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #ffffff;
        border-bottom: 1px solid #f0f0f0;
        flex-shrink: 0;
      }
      .logo-dot {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: var(--app-primary, #52c41a);
        display: inline-block;
        flex-shrink: 0;
        transition: background 0.3s;
      }
      .sidebar-logo h1 {
        color: #0f172a;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
      }

      /* Scrollable menu area */
      .sidebar-menu-wrapper {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }
      .sidebar-menu-wrapper::-webkit-scrollbar {
        width: 4px;
      }
      .sidebar-menu-wrapper::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.12);
        border-radius: 2px;
      }

      /* ── User Profile Footer ── */
      .sidebar-footer {
        flex-shrink: 0;
        padding: 10px 12px;
        border-top: 1px solid #f0f0f0;
        background: #ffffff;
      }
      .user-profile-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.2s;
        min-width: 0;
      }
      .user-profile-card:hover {
        background: #f5f5f5;
      }
      .avatar-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--app-primary, #52c41a);
        color: #fff;
        font-weight: 700;
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.3s;
      }
      .profile-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .profile-name {
        font-size: 13px;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .profile-role {
        font-size: 11px;
        color: #8c8c8c;
        white-space: nowrap;
      }
      .profile-more-icon {
        color: #8c8c8c;
        flex-shrink: 0;
      }

      /* ── Header ── */
      .header {
        background: #fff;
        padding: 0 16px;
        display: flex;
        align-items: center;
        box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
      }

      /* ── Content ── */
      .content {
        margin: 20px;
      }

      /* ──────────── Dark mode: Sidebar shell ──────────── */
      :host-context(html.dark-mode) .menu-sidebar {
        background: #1f1f1f !important;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.4);
      }
      :host-context(html.dark-mode) ::ng-deep .menu-sidebar.ant-layout-sider,
      :host-context(html.dark-mode) ::ng-deep .menu-sidebar .ant-layout-sider-children {
        background: #1f1f1f !important;
      }

      /* Sidebar menu shell in dark mode — màu text/bg chi tiết được xử lý
         bởi global dark-mode CSS trong styles.scss */
      :host-context(html.dark-mode) ::ng-deep .menu-sidebar .ant-menu-light {
        background: #1f1f1f !important;
        border-inline-end: none !important;
      }
      :host-context(html.dark-mode) ::ng-deep .menu-sidebar .ant-menu-sub.ant-menu-inline {
        background: #1a1a1a !important;
      }

      /* Logo */
      :host-context(html.dark-mode) .sidebar-logo {
        background: #1f1f1f;
        border-bottom-color: rgba(255, 255, 255, 0.1);
      }
      :host-context(html.dark-mode) .sidebar-logo h1 {
        color: rgba(255, 255, 255, 0.85);
      }

      /* Footer / profile card */
      :host-context(html.dark-mode) .sidebar-footer {
        background: #1f1f1f;
        border-top-color: rgba(255, 255, 255, 0.1);
      }
      :host-context(html.dark-mode) .user-profile-card:hover {
        background: rgba(255, 255, 255, 0.08);
      }
      :host-context(html.dark-mode) .profile-name {
        color: rgba(255, 255, 255, 0.85);
      }
      :host-context(html.dark-mode) .profile-role,
      :host-context(html.dark-mode) .profile-more-icon {
        color: rgba(255, 255, 255, 0.38);
      }

      /* Header */
      :host-context(html.dark-mode) .header {
        background: #1f1f1f;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      }

      /* Scrollbar in dark */
      :host-context(html.dark-mode) .sidebar-menu-wrapper::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
      }
    `
  ]
})
export class AdminLayoutComponent implements OnInit {
  private readonly navigation    = inject(NavigationService);
  private readonly sessionService = inject(SessionService);
  private readonly themeService  = inject(ThemeService);

  isCollapsed  = false;
  profileVisible = false;

  readonly colorOptions = COLOR_OPTIONS;
  readonly activeColor  = this.themeService.activeColor;
  readonly isDark       = () => this.themeService.mode() === 'dark';

  readonly menuItems = computed<MenuTreeNode[]>(() => {
    const tree = this.navigation.tree();
    if (tree && tree.length > 0) return tree;
    return [{ key: 'dashboard', title: 'Dashboard', link: '/admin/dashboard', icon: 'dashboard' }];
  });

  get username(): string {
    return this.sessionService.getUsername();
  }

  get userInitial(): string {
    return this.username.charAt(0).toUpperCase();
  }

  constructor(
    private readonly authFacade: AuthFacadeService,
    private readonly message: NzMessageService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.themeService.init();
    if (!this.navigation.loaded()) {
      this.navigation.refresh().subscribe({ error: () => void 0 });
    }
  }

  setThemeColor(color: ThemeColor): void {
    this.themeService.setColor(color);
  }

  toggleThemeMode(): void {
    this.themeService.toggleMode();
  }

  logout(): void {
    this.profileVisible = false;
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
