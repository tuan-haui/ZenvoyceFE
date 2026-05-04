import { Injectable, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { Client, MenuDto } from './app.service';
import { resolveMenuIcon } from './menu-icons';

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
  icon?: string;
  children?: MenuTreeNode[];
}

/**
 * Thứ tự hiển thị sidebar (số nhỏ hơn = lên trên).
 * Dùng để sắp xếp lại menu nhận từ API bất kể thứ tự backend trả về.
 */
const PATH_SORT_ORDER: Record<string, number> = {
  '/admin/dashboard': 0,
  // Hoá đơn
  '/admin/invoices': 10,
  '/admin/reports/sales': 11,
  // Mẫu in
  '/admin/templates/setup': 20,
  '/admin/templates/warehouse': 21,
  // Danh mục
  '/admin/companies': 30,
  '/admin/customers': 31,
  '/admin/products': 32,
  // Hệ thống
  '/admin/users': 40,
  '/admin/roles': 41,
  '/admin/system/logs': 42
};

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly _loaded = signal(false);
  private readonly _menus = signal<MenuItemDto[]>([]);
  private readonly _tree = signal<MenuTreeNode[]>([]);

  readonly loaded = this._loaded.asReadonly();
  readonly tree = this._tree.asReadonly();

  constructor(private readonly client: Client) {}

  refresh(): Observable<MenuItemDto[]> {
    return this.client.sidebar().pipe(
      map((env) => (env.data ?? []).map((m) => this.mapMenu(m))),
      tap((rows) => {
        this._menus.set(rows);
        this._tree.set(this.buildTree(rows));
        this._loaded.set(true);
      }),
      catchError(() => {
        this._menus.set([]);
        this._tree.set(this.buildTree([]));
        this._loaded.set(true);
        return of([] as MenuItemDto[]);
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

  private mapMenu(m: MenuDto): MenuItemDto {
    return {
      id: m.id ?? '',
      tenmenu: m.tenmenu ?? '',
      duongdan: m.duongdan ?? undefined,
      menuchaId: m.menuchaId ?? undefined,
      quyenId: m.quyenId ?? undefined
    };
  }

  private buildTree(flat: MenuItemDto[]): MenuTreeNode[] {
    if (flat.length === 0) {
      return [this.fallbackNode()];
    }
    const childrenOf = (parentId: string | null | undefined): MenuTreeNode[] => {
      return flat
        .filter((m) => (m.menuchaId ?? null) === (parentId ?? null))
        .sort((a, b) => this.sortKeyForItem(a, flat) - this.sortKeyForItem(b, flat))
        .map((m) => {
          const sub = childrenOf(m.id);
          const node: MenuTreeNode = {
            key: m.id,
            title: m.tenmenu,
            link: m.duongdan || undefined,
            icon: resolveMenuIcon(m.duongdan, m.tenmenu),
            children: sub.length > 0 ? sub : undefined
          };
          return node;
        });
    };
    const roots = childrenOf(null);
    if (roots.length > 0) {
      return roots;
    }
    return flat
      .sort((a, b) => this.sortKeyForItem(a, flat) - this.sortKeyForItem(b, flat))
      .map((m) => ({
        key: m.id,
        title: m.tenmenu,
        link: m.duongdan || undefined,
        icon: resolveMenuIcon(m.duongdan, m.tenmenu)
      }));
  }

  /** Trả về sort key theo path đã khai báo trong PATH_SORT_ORDER. */
  private sortKeyForPath(path: string | undefined): number {
    const p = (path ?? '').trim().toLowerCase();
    if (p && PATH_SORT_ORDER[p] !== undefined) {
      return PATH_SORT_ORDER[p];
    }
    // Khớp prefix (vd. '/admin/reports' → min order của children)
    const candidates = Object.keys(PATH_SORT_ORDER)
      .filter((key) => p && (key.startsWith(p + '/') || p.startsWith(key + '/')))
      .sort((a, b) => b.length - a.length);
    if (candidates.length > 0) {
      return PATH_SORT_ORDER[candidates[0]];
    }
    return 999;
  }

  /**
   * Sort key cho một menu item.
   * - Nếu có đường dẫn → dùng path order.
   * - Nếu là menu cha (không có đường dẫn) → dùng min sort key của con trực tiếp.
   */
  private sortKeyForItem(item: MenuItemDto, flat: MenuItemDto[]): number {
    if (item.duongdan) {
      return this.sortKeyForPath(item.duongdan);
    }
    const children = flat.filter((m) => m.menuchaId === item.id);
    if (children.length === 0) return 999;
    return Math.min(...children.map((c) => this.sortKeyForPath(c.duongdan)));
  }

  private fallbackNode(): MenuTreeNode {
    return {
      key: 'dashboard',
      title: 'Dashboard',
      link: '/admin/dashboard',
      icon: resolveMenuIcon('/admin/dashboard', 'Dashboard')
    };
  }
}
