import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  PRIMARY_OUTLET,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { MarkdownModule } from 'ngx-markdown';
import { filter, finalize } from 'rxjs';
import { AiAssistantFacadeService } from '../core/services/ai-assistant-facade.service';
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
    NzBreadCrumbModule,
    NzMenuModule,
    NzIconModule,
    NzButtonModule,
    NzPopoverModule,
    NzModalModule,
    NzInputModule,
    NzEmptyModule,
    MarkdownModule,
    FormsModule
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
          <div class="header-left">
            <button class="header-toggle-btn" nz-button nzType="text" (click)="isCollapsed = !isCollapsed">
              <nz-icon [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" />
            </button>
            <nz-breadcrumb class="header-breadcrumb">
              @for (item of breadcrumbs(); track item.path) {
                <nz-breadcrumb-item>
                  @if (item.linkable) {
                    <a [routerLink]="item.path">{{ item.label }}</a>
                  } @else {
                    <span>{{ item.label }}</span>
                  }
                </nz-breadcrumb-item>
              }
            </nz-breadcrumb>
          </div>
          <div class="header-right">
            <button nz-button nzType="default" (click)="openAiAssistant()">
              <nz-icon nzType="robot" />
              <span>Trợ lý AI</span>
            </button>
          </div>
        </nz-header>

        <nz-content class="content">
          <router-outlet />
        </nz-content>
      </nz-layout>
    </nz-layout>

    <nz-modal
      [(nzVisible)]="aiModalVisible"
      nzTitle="Trợ lý AI"
      [nzFooter]="null"
      [nzWidth]="700"
      [nzCentered]="true"
      (nzOnCancel)="closeAiAssistant()"
    >
      <ng-container *nzModalContent>
        <div class="ai-chat-modal">
          <div class="ai-chat-list-wrapper">
            @if (chatMessages.length === 0 && !isAiLoading) {
              <nz-empty nzNotFoundContent="Chưa có cuộc hội thoại nào. Hãy bắt đầu bằng một câu hỏi." />
            } @else {
              <div class="chat-list">
                @for (item of chatMessages; track $index) {
                  <div class="chat-row" [class.user]="item.role === 'user'" [class.assistant]="item.role === 'assistant'">
                    <div class="chat-bubble">
                      <div class="chat-role">{{ item.role === 'user' ? 'Bạn' : 'Trợ lý AI' }}</div>
                      @if (item.role === 'assistant') {
                        <markdown class="chat-content chat-markdown" [data]="item.content"></markdown>
                      } @else {
                        <div class="chat-content chat-text">{{ item.content }}</div>
                      }
                    </div>
                  </div>
                }
                @if (isAiLoading) {
                  <div class="chat-row assistant typing">
                    <div class="chat-bubble typing">
                      <div class="chat-role">Trợ lý AI</div>
                      <div class="chat-typing" aria-label="Trợ lý AI đang trả lời">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <form class="ai-composer" (ngSubmit)="sendAiMessage()">
            <textarea
              nz-input
              [(ngModel)]="aiInput"
              name="aiInput"
              rows="3"
              placeholder="Nhập nội dung bạn muốn hỏi..."
              [disabled]="isAiLoading"
              (keydown)="onAiComposerKeydown($event)"
            ></textarea>
            <div class="ai-composer-actions">
              <button nz-button nzType="default" type="button" [disabled]="isAiLoading" (click)="clearAiInput()">
                Xóa
              </button>
              <button
                nz-button
                nzType="primary"
                type="submit"
                [disabled]="!canSendAiMessage()"
                [nzLoading]="isAiLoading"
              >
                Gửi
              </button>
            </div>
          </form>
        </div>
      </ng-container>
    </nz-modal>

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
        position: sticky;
        top: 0;
        height: 100vh;
        align-self: flex-start;
        overflow: hidden;
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
        justify-content: space-between;
        box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
      }
      .header-left {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .header-toggle-btn {
        flex-shrink: 0;
      }
      .header-breadcrumb {
        min-width: 0;
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 16px;
      }
      :host ::ng-deep .header-breadcrumb .ant-breadcrumb {
        line-height: 1;
      }
      :host ::ng-deep .header-breadcrumb a {
        color: #595959;
      }
      :host ::ng-deep .header-breadcrumb li:last-child {
        color: #262626;
        font-weight: 500;
      }

      /* ── Content ── */
      .content {
        margin: 20px;
      }

      .ai-chat-modal {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .ai-chat-list-wrapper {
        max-height: 420px;
        overflow-y: auto;
        border: 1px solid #f0f0f0;
        border-radius: 8px;
        padding: 12px;
        background: #f7f8fa;
      }
      .chat-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .chat-row {
        display: flex;
        width: 100%;
      }
      .chat-row.user {
        justify-content: flex-end;
      }
      .chat-row.assistant {
        justify-content: flex-start;
      }
      .chat-row.typing .chat-bubble {
        max-width: 220px;
      }
      .chat-bubble {
        max-width: 78%;
        padding: 10px 14px;
        border-radius: 12px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .chat-row.user .chat-bubble {
        background: #e6f4ff;
        border-color: #bae0ff;
        box-shadow: 0 2px 10px rgba(2, 132, 199, 0.15);
      }
      .chat-row.user .chat-role {
        text-align: right;
      }
      .chat-role {
        font-size: 11px;
        font-weight: 600;
        color: #595959;
        text-transform: uppercase;
        letter-spacing: 0.4px;
      }
      .chat-content {
        font-size: 14px;
        line-height: 1.5;
        word-break: break-word;
      }
      .chat-text {
        white-space: pre-wrap;
      }
      .chat-markdown {
        display: block;
      }
      .chat-typing {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 14px;
      }
      .chat-typing span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #8c8c8c;
        opacity: 0.3;
        animation: chat-typing 1.1s infinite ease-in-out;
      }
      .chat-typing span:nth-child(2) {
        animation-delay: 0.2s;
      }
      .chat-typing span:nth-child(3) {
        animation-delay: 0.4s;
      }
      @keyframes chat-typing {
        0%,
        80%,
        100% {
          transform: translateY(0);
          opacity: 0.3;
        }
        40% {
          transform: translateY(-4px);
          opacity: 1;
        }
      }

      :host ::ng-deep .chat-markdown > :first-child {
        margin-top: 0;
      }
      :host ::ng-deep .chat-markdown > :last-child {
        margin-bottom: 0;
      }
      :host ::ng-deep .chat-markdown p {
        margin: 0 0 8px;
      }
      :host ::ng-deep .chat-markdown h1 {
        font-size: 18px;
        margin: 10px 0 6px;
      }
      :host ::ng-deep .chat-markdown h2 {
        font-size: 16px;
        margin: 10px 0 6px;
      }
      :host ::ng-deep .chat-markdown h3 {
        font-size: 14px;
        margin: 10px 0 6px;
      }
      :host ::ng-deep .chat-markdown ul,
      :host ::ng-deep .chat-markdown ol {
        margin: 6px 0;
        padding-left: 18px;
      }
      :host ::ng-deep .chat-markdown li {
        margin: 4px 0;
      }
      :host ::ng-deep .chat-markdown blockquote {
        margin: 6px 0;
        padding-left: 10px;
        border-left: 3px solid #d9d9d9;
        color: #595959;
      }
      :host ::ng-deep .chat-markdown a {
        color: #1677ff;
        text-decoration: underline;
      }
      :host ::ng-deep .chat-markdown code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        background: #f1f5f9;
        padding: 1px 4px;
        border-radius: 4px;
      }
      :host ::ng-deep .chat-markdown pre {
        background: #0f172a;
        color: #e2e8f0;
        padding: 10px 12px;
        border-radius: 8px;
        overflow: auto;
        margin: 8px 0;
      }
      :host ::ng-deep .chat-markdown pre code {
        background: transparent;
        padding: 0;
        color: inherit;
      }
      :host ::ng-deep .chat-markdown table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        font-size: 13px;
      }
      :host ::ng-deep .chat-markdown th,
      :host ::ng-deep .chat-markdown td {
        border: 1px solid #e5e7eb;
        padding: 6px 8px;
        text-align: left;
      }
      .ai-composer {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .ai-composer-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
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
      :host-context(html.dark-mode) ::ng-deep .header-breadcrumb a {
        color: rgba(255, 255, 255, 0.65);
      }
      :host-context(html.dark-mode) ::ng-deep .header-breadcrumb li:last-child {
        color: rgba(255, 255, 255, 0.88);
      }
      :host-context(html.dark-mode) ::ng-deep .header-breadcrumb .ant-breadcrumb-separator {
        color: rgba(255, 255, 255, 0.38);
      }
      :host-context(html.dark-mode) .ai-chat-list-wrapper {
        background: #141414;
        border-color: rgba(255, 255, 255, 0.12);
      }
      :host-context(html.dark-mode) .chat-bubble {
        background: #1f1f1f;
        border-color: rgba(255, 255, 255, 0.12);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
      }
      :host-context(html.dark-mode) .chat-row.user .chat-bubble {
        background: #111b26;
        border-color: #2f4f73;
        box-shadow: 0 2px 10px rgba(47, 79, 115, 0.4);
      }
      :host-context(html.dark-mode) .chat-role,
      :host-context(html.dark-mode) .chat-text {
        color: rgba(255, 255, 255, 0.88);
      }
      :host-context(html.dark-mode) .chat-typing span {
        background: rgba(255, 255, 255, 0.7);
      }
      :host-context(html.dark-mode) ::ng-deep .chat-markdown {
        color: rgba(255, 255, 255, 0.88);
      }
      :host-context(html.dark-mode) ::ng-deep .chat-markdown blockquote {
        color: rgba(255, 255, 255, 0.7);
        border-left-color: rgba(255, 255, 255, 0.2);
      }
      :host-context(html.dark-mode) ::ng-deep .chat-markdown a {
        color: #69b1ff;
      }
      :host-context(html.dark-mode) ::ng-deep .chat-markdown code {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.92);
      }
      :host-context(html.dark-mode) ::ng-deep .chat-markdown pre {
        background: #0b1220;
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      :host-context(html.dark-mode) ::ng-deep .chat-markdown th,
      :host-context(html.dark-mode) ::ng-deep .chat-markdown td {
        border-color: rgba(255, 255, 255, 0.12);
      }

      /* Scrollbar in dark */
      :host-context(html.dark-mode) .sidebar-menu-wrapper::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.12);
      }
    `
  ]
})
export class AdminLayoutComponent implements OnInit {
  private readonly navigation = inject(NavigationService);
  private readonly sessionService = inject(SessionService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  constructor(
    private readonly authFacade: AuthFacadeService,
    private readonly aiAssistantFacade: AiAssistantFacadeService,
    private readonly message: NzMessageService
  ) { }

  isCollapsed = false;
  profileVisible = false;
  aiModalVisible = false;
  isAiLoading = false;
  aiInput = '';
  chatMessages: { role: 'user' | 'assistant'; content: string }[] = [];

  readonly colorOptions = COLOR_OPTIONS;
  readonly activeColor = this.themeService.activeColor;
  readonly isDark = () => this.themeService.mode() === 'dark';

  readonly menuItems = computed<MenuTreeNode[]>(() => {
    const tree = this.navigation.tree();
    if (tree && tree.length > 0) return tree;
    return [{ key: 'dashboard', title: 'Dashboard', link: '/admin/dashboard', icon: 'dashboard' }];
  });
  private readonly currentPath = signal(this.normalizePath(this.router.url));
  readonly breadcrumbs = computed(() => this.buildBreadcrumbs(this.currentPath()));

  get username(): string {
    return this.sessionService.getUsername();
  }

  get userInitial(): string {
    return this.username.charAt(0).toUpperCase();
  }

  ngOnInit(): void {
    this.themeService.init();
    if (!this.navigation.loaded()) {
      this.navigation.refresh().subscribe({
        next: () => this.currentPath.set(this.normalizePath(this.router.url)),
        error: () => void 0
      });
    }
    this.currentPath.set(this.normalizePath(this.router.url));
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentPath.set(this.normalizePath(event.urlAfterRedirects));
      });
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

  openAiAssistant(): void {
    this.aiModalVisible = true;
  }

  closeAiAssistant(): void {
    this.aiModalVisible = false;
  }

  clearAiInput(): void {
    this.aiInput = '';
  }

  canSendAiMessage(): boolean {
    return !this.isAiLoading && this.aiInput.trim().length > 0;
  }

  onAiComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSendAiMessage()) {
        this.sendAiMessage();
      }
    }
  }

  sendAiMessage(): void {
    const message = this.aiInput.trim();
    if (!message || this.isAiLoading) {
      return;
    }

    this.chatMessages = [...this.chatMessages, { role: 'user', content: message }];
    this.aiInput = '';
    this.isAiLoading = true;

    this.aiAssistantFacade
      .chat(message)
      .pipe(finalize(() => (this.isAiLoading = false)))
      .subscribe({
        next: (response) => {
          const aiText = this.extractAiText(response);
          this.chatMessages = [
            ...this.chatMessages,
            {
              role: 'assistant',
              content: aiText ?? 'Mình chưa nhận được nội dung trả lời từ AI.'
            }
          ];
        },
        error: () => {
          this.chatMessages = [
            ...this.chatMessages,
            {
              role: 'assistant',
              content: 'Hiện chưa thể phản hồi. Vui lòng thử lại sau.'
            }
          ];
          this.message.error('Gọi Trợ lý AI thất bại.');
        }
      });
  }

  private buildBreadcrumbs(currentPath: string): Array<{ path: string; label: string; linkable: boolean }> {
    if (!currentPath.startsWith('/admin')) {
      return [];
    }
    const menuPath = this.findBestMenuPath(this.menuItems(), currentPath);
    if (menuPath.length > 0) {
      return menuPath.map((node, idx) => ({
        path: node.link ? this.normalizePath(node.link) : `group-${node.key}-${idx}`,
        label: node.title,
        linkable: Boolean(node.link) && idx < menuPath.length - 1
      }));
    }
    return this.buildFallbackBreadcrumbs(currentPath);
  }

  private collectRouteDataLabels(): Map<string, string> {
    const labels = new Map<string, string>();
    let node: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    const segments: string[] = [];

    while (node) {
      if (node.url.length > 0) {
        segments.push(...node.url.map((u) => u.path));
        const breadcrumb = node.data?.['breadcrumb'];
        if (typeof breadcrumb === 'string' && breadcrumb.trim().length > 0) {
          labels.set('/' + segments.join('/'), breadcrumb.trim());
        }
      }
      node = node.children.find((child) => child.outlet === PRIMARY_OUTLET) ?? null;
    }

    return labels;
  }

  private findBestMenuPath(nodes: MenuTreeNode[], currentPath: string): MenuTreeNode[] {
    const normalizedCurrentPath = this.normalizePath(currentPath);
    const candidates: { chain: MenuTreeNode[]; score: number }[] = [];
    const visit = (items: MenuTreeNode[], chain: MenuTreeNode[]) => {
      for (const item of items) {
        const nextChain = [...chain, item];
        if (item.link) {
          const normalizedLink = this.normalizePath(item.link);
          if (
            normalizedCurrentPath === normalizedLink ||
            normalizedCurrentPath.startsWith(normalizedLink + '/')
          ) {
            const score = normalizedCurrentPath === normalizedLink ? 10_000 + normalizedLink.length : normalizedLink.length;
            candidates.push({ chain: nextChain, score });
          }
        }
        if (item.children?.length) {
          visit(item.children, nextChain);
        }
      }
    };
    visit(nodes, []);
    if (candidates.length === 0) {
      return [];
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].chain;
  }

  private buildFallbackBreadcrumbs(currentPath: string): Array<{ path: string; label: string; linkable: boolean }> {
    const segments = currentPath.split('/').filter(Boolean);
    const routeLabels = this.collectRouteDataLabels();
    const fallbackSegments = segments.filter((segment, idx) => !(idx === 0 && segment === 'admin'));
    const paths = fallbackSegments.map((_, idx) => '/admin/' + fallbackSegments.slice(0, idx + 1).join('/'));
    return paths.map((path, idx) => {
      const segment = fallbackSegments[idx];
      const label = routeLabels.get(path) ?? this.segmentToTitle(segment);
      return {
        path,
        label,
        linkable: idx < paths.length - 1
      };
    });
  }

  private extractAiText(response: unknown): string | null {
    const rawText =
      (response as { text?: unknown })?.text ?? (response as { data?: { text?: unknown } })?.data?.text;
    if (typeof rawText !== 'string') {
      return null;
    }
    const trimmed = rawText.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizePath(url: string): string {
    const raw = (url || '').split('?')[0].split('#')[0] || '/';
    if (raw.length > 1 && raw.endsWith('/')) {
      return raw.slice(0, -1);
    }
    return raw;
  }

  private segmentToTitle(segment: string): string {
    const normalized = segment.replace(/[-_]+/g, ' ').trim();
    if (!normalized) return segment;
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
