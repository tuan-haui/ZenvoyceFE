import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AssignPermissionsRequestDto,
  ChangePasswordCommand,
  Client,
  CreateRoleCommand,
  CreateUserCommand,
  UpdateUserCommand
} from './app.service';

@Injectable({ providedIn: 'root' })
export class UserRoleFacadeService {
  constructor(private readonly client: Client) {}

  getUsers(pageNumber = 1, pageSize = 20): Observable<void> {
    return this.client.usersGET(pageNumber, pageSize);
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

  getRoles(): Observable<void> {
    return this.client.rolesGET();
  }

  createRole(tenquyen: string, mota: string): Observable<void> {
    return this.client.rolesPOST(new CreateRoleCommand({ tenquyen, mota }));
  }

  assignPermissions(roleId: string, menuIds: string[]): Observable<void> {
    return this.client.assignPermissions(roleId, new AssignPermissionsRequestDto({ roleId, menuIds }));
  }
}
