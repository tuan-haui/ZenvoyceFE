import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AssignPermissionsRequestDto,
  ChangePasswordCommand,
  Client,
  CreateRoleCommand,
  CreateUserCommand,
  UpdateUserCommand
} from './app.service';
import { API_BASE_URL } from './app.service';

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
    return this.http.get<PagedUsersDto>(`${this.base}/api/users`, {
      params,
      withCredentials: true
    });
  }

  createUser(payload: CreateUserCommand): Observable<void> {
    return this.client.usersPOST(payload);
  }

  updateUser(id: string, payload: UpdateUserCommand): Observable<void> {
    return this.client.usersPUT(id, payload);
  }

  deleteUser(id: string): Observable<void> {
    return this.client.usersDELETE(id);
  }

  changePassword(id: string, oldPassword: string, newPassword: string): Observable<void> {
    return this.client.changePassword(id, new ChangePasswordCommand({ id, oldPassword, newPassword }));
  }

  getRoles(): Observable<RoleApiDto[]> {
    return this.http.get<RoleApiDto[]>(`${this.base}/api/roles`, { withCredentials: true });
  }

  createRole(tenquyen: string, mota: string): Observable<void> {
    return this.client.rolesPOST(new CreateRoleCommand({ tenquyen, mota }));
  }

  getMenusForRole(roleId: string): Observable<MenuApiDto[]> {
    return this.http.get<MenuApiDto[]>(`${this.base}/api/menus/for-role/${roleId}`, {
      withCredentials: true
    });
  }

  getAssignedMenuIds(roleId: string, userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/api/roles/${roleId}/users/${userId}/assigned-menu-ids`, {
      withCredentials: true
    });
  }

  assignPermissions(roleId: string, userId: string, menuIds: string[]): Observable<void> {
    const body = new AssignPermissionsRequestDto({ roleId, userId, menuIds });
    return this.http.put<void>(`${this.base}/api/roles/${roleId}/assign-permissions`, body, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
