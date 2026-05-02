import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { API_BASE_URL } from './app.service';

export interface MenuItemDto {
  id: string;
  tenmenu: string;
  duongdan?: string;
  menuchaId?: string;
  quyenId?: string;
}

export interface MenuTreeNode {
  key: string;
  title: string;
  link?: string;
  children?: MenuTreeNode[];
}

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly base: string;
  private readonly _loaded = signal(false);
  private readonly _menus = signal<MenuItemDto[]>([]);
  private readonly _tree = signal<MenuTreeNode[]>([]);

  readonly loaded = this._loaded.asReadonly();
  readonly tree = this._tree.asReadonly();

  constructor(
    private readonly http: HttpClient,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.base = baseUrl ?? '';
  }

  refresh(): Observable<MenuItemDto[]> {
    return this.http.get<MenuItemDto[]>(`${this.base}/api/menus/sidebar`, { withCredentials: true }).pipe(
      tap((rows) => {
        this._menus.set(rows);
        this._tree.set(this.buildTree(rows));
        this._loaded.set(true);
      }),
      catchError(() => {
        const fb = fallbackSidebarMenu();
        this._menus.set(fb);
        this._tree.set(this.buildTree(fb));
        this._loaded.set(true);
        return of(fb);
      })
    );
  }

  canAccessPath(urlPath: string): boolean {
    const path = (urlPath.split('?')[0] || '').toLowerCase();
    if (path === '/admin' || path === '/admin/') {
      return true;
    }
    if (path.startsWith('/admin/dashboard')) {
      return true;
    }
    const rows = this._menus();
    if (rows.length === 0) {
      return true;
    }
    const allowed = rows
      .map((m) => (m.duongdan || '').trim().toLowerCase())
      .filter((d) => d.length > 0);
    if (allowed.length === 0) {
      return true;
    }
    return allowed.some((d) => path === d || path.startsWith(d + '/'));
  }

  private buildTree(flat: MenuItemDto[]): MenuTreeNode[] {
    if (flat.length === 0) {
      return [this.fallbackNode()];
    }
    const byId = new Map(flat.map((m) => [m.id, m] as const));
    const childrenOf = (parentId: string | null | undefined): MenuTreeNode[] => {
      return flat
        .filter((m) => (m.menuchaId ?? null) === (parentId ?? null))
        .map((m) => {
          const sub = childrenOf(m.id);
          const node: MenuTreeNode = {
            key: m.id,
            title: m.tenmenu,
            link: m.duongdan || undefined,
            children: sub.length > 0 ? sub : undefined
          };
          return node;
        });
    };
    const roots = childrenOf(null);
    if (roots.length > 0) {
      return roots;
    }
    return flat.map((m) => ({
      key: m.id,
      title: m.tenmenu,
      link: m.duongdan || undefined
    }));
  }

  private fallbackNode(): MenuTreeNode {
    return {
      key: 'dashboard',
      title: 'Dashboard',
      link: '/admin/dashboard'
    };
  }
}

function fallbackSidebarMenu(): MenuItemDto[] {
  return [
    { id: 'fb-1', tenmenu: 'Dashboard', duongdan: '/admin/dashboard' },
    { id: 'fb-2', tenmenu: 'Người dùng', duongdan: '/admin/users' },
    { id: 'fb-3', tenmenu: 'Phân quyền', duongdan: '/admin/roles' },
    { id: 'fb-4', tenmenu: 'Nhật ký', duongdan: '/admin/system/logs' },
    { id: 'fb-5', tenmenu: 'Công ty', duongdan: '/admin/companies' },
    { id: 'fb-6', tenmenu: 'Khách hàng', duongdan: '/admin/customers' },
    { id: 'fb-7', tenmenu: 'Hàng hóa', duongdan: '/admin/products' },
    { id: 'fb-8', tenmenu: 'Thiết lập mẫu', duongdan: '/admin/templates/setup' },
    { id: 'fb-9', tenmenu: 'Kho mẫu', duongdan: '/admin/templates/warehouse' },
    { id: 'fb-a', tenmenu: 'Hóa đơn', duongdan: '/admin/invoices' },
    { id: 'fb-b', tenmenu: 'Báo cáo bán', duongdan: '/admin/reports/sales' }
  ];
}
