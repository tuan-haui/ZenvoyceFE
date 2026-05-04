import { Injectable, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { Client, MenuDto } from './app.service';

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
