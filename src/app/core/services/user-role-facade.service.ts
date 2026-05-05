import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AssignPermissionsRequestDto,
  ChangePasswordCommand,
  Client,
  CreateRoleCommand,
  CreateUserCommand,
  MenuDto,
  RoleDto,
  UpdateUserCommand,
  UserDto
} from './app.service';

export type UserApiDto = UserDto;
export type RoleApiDto = RoleDto;
export type MenuApiDto = MenuDto;

export interface PagedUsersDto {
  items?: UserDto[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
}

@Injectable({ providedIn: 'root' })
export class UserRoleFacadeService {
  constructor(private readonly client: Client) { }

  getUsers(pageNumber = 1, pageSize = 50): Observable<PagedUsersDto> {
    return this.client.usersGET(pageNumber, pageSize).pipe(
      map((env) => env.data ?? { items: [], pageNumber, pageSize, totalCount: 0 })
    );
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
      .changePassword(id, new ChangePasswordCommand({ id, newPassword }))
      .pipe(map(() => void 0));
  }

  getRoles(): Observable<RoleDto[]> {
    return this.client.rolesGET().pipe(map((env) => env.data ?? []));
  }

  createRole(tenquyen: string, mota: string): Observable<RoleDto | undefined> {
    const normalizedName = (tenquyen ?? '').trim();
    const normalizedDescription = (mota ?? '').trim();
    return this.client
      .rolesPOST(new CreateRoleCommand({ tenquyen: normalizedName, mota: normalizedDescription }))
      .pipe(map((env) => env.data));
  }

  getMenusForRole(roleId: string): Observable<MenuDto[]> {
    return this.client.forRole(roleId).pipe(map((env) => env.data ?? []));
  }

  getAssignedMenuIds(roleId: string, userId: string): Observable<string[]> {
    return this.client
      .assignedMenuIds(roleId, userId)
      .pipe(map((env) => (env.data ?? []).map((id) => String(id))));
  }

  assignPermissions(roleId: string, userId: string, menuIds: string[]): Observable<void> {
    return this.client
      .assignPermissions(roleId, new AssignPermissionsRequestDto({ roleId, userId, menuIds }))
      .pipe(map(() => void 0));
  }
}
