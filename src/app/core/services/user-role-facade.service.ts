import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AssignPermissionsRequestDto,
  ChangePasswordCommand,
  Client,
  CreateRoleCommand,
  CreateUserCommand,
  UpdateUserCommand
} from './app.service';
import { API_BASE_URL } from './app.service';
import { ZenvoyceApiEnvelope } from '../http/api-envelope';

export interface PagedUsersDto {
  items?: UserApiDto[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface UserApiDto {
  id: string;
  madonvi?: string | null;
  tendangnhap?: string;
  hoten?: string | null;
  email?: string | null;
  dienthoai?: string | null;
  trangthai?: number;
}

export interface RoleApiDto {
  id: string;
  tenquyen: string;
  mota?: string | null;
}

export interface MenuApiDto {
  id: string;
  tenmenu: string;
  duongdan?: string | null;
  menuchaId?: string | null;
  quyenId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserRoleFacadeService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    private readonly client: Client,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.base = baseUrl ?? '';
  }

  getUsers(pageNumber = 1, pageSize = 50): Observable<PagedUsersDto> {
    const params: Record<string, string> = {
      pageNumber: String(pageNumber),
      pageSize: String(pageSize)
    };
    return this.http
      .get<ZenvoyceApiEnvelope<PagedUsersDto>>(`${this.base}/api/users`, {
        params,
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? { items: [], pageNumber, pageSize, totalCount: 0 }));
  }

  createUser(payload: CreateUserCommand): Observable<void> {
    return this.client.usersPOST(payload).pipe(map(() => void 0));
  }

  updateUser(id: string, payload: UpdateUserCommand): Observable<void> {
    return this.client.usersPUT(id, payload).pipe(map(() => void 0));
  }

  deleteUser(id: string): Observable<void> {
    return this.client.usersDELETE(id).pipe(map(() => void 0));
  }

  changePassword(id: string, oldPassword: string, newPassword: string): Observable<void> {
    return this.client
      .changePassword(id, new ChangePasswordCommand({ id, oldPassword, newPassword }))
      .pipe(map(() => void 0));
  }

  getRoles(): Observable<RoleApiDto[]> {
    return this.http
      .get<ZenvoyceApiEnvelope<RoleApiDto[]>>(`${this.base}/api/roles`, { withCredentials: true })
      .pipe(map((e) => e.data ?? []));
  }

  createRole(tenquyen: string, mota: string): Observable<void> {
    return this.client.rolesPOST(new CreateRoleCommand({ tenquyen, mota })).pipe(map(() => void 0));
  }

  getMenusForRole(roleId: string): Observable<MenuApiDto[]> {
    return this.http
      .get<ZenvoyceApiEnvelope<MenuApiDto[]>>(`${this.base}/api/menus/for-role/${roleId}`, {
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? []));
  }

  getAssignedMenuIds(roleId: string, userId: string): Observable<string[]> {
    return this.http
      .get<ZenvoyceApiEnvelope<string[]>>(`${this.base}/api/roles/${roleId}/users/${userId}/assigned-menu-ids`, {
        withCredentials: true
      })
      .pipe(map((e) => (e.data ?? []).map((id) => String(id))));
  }

  assignPermissions(roleId: string, userId: string, menuIds: string[]): Observable<void> {
    const body = new AssignPermissionsRequestDto({ roleId, userId, menuIds });
    return this.http
      .put<ZenvoyceApiEnvelope<null>>(`${this.base}/api/roles/${roleId}/assign-permissions`, body, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      })
      .pipe(map(() => void 0));
  }
}
