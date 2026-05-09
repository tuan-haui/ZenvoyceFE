import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTreeModule, NzFormatEmitEvent, NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import {
  NzTransferModule,
  TransferChange,
  TransferDirection,
  TransferItem,
  TransferCanMove
} from 'ng-zorro-antd/transfer';
import { ApiErrorService } from '../../core/services/api-error.service';
import { MenuApiDto, RoleApiDto, UserRoleFacadeService } from '../../core/services/user-role-facade.service';

interface MenuTransferItem extends TransferItem {
  key: string;
  title: string;
  parentKey: string | null;
  sortOrder: number;
}

@Component({
  selector: 'app-roles-page',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzTransferModule,
    NzTreeModule
  ],
  template: `
    <h2>Quản lý phân quyền</h2>
    <form nz-form [formGroup]="roleForm" class="role-create">
      <input nz-input formControlName="name" placeholder="Tên vai trò" />
      <input nz-input formControlName="description" placeholder="Mô tả" />
      <button nz-button nzType="primary" type="button" (click)="createRole()">+ Thêm vai trò</button>
    </form>

    <div class="matrix-toolbar">
      <nz-select
        [(ngModel)]="selectedRoleId"
        [ngModelOptions]="{ standalone: true }"
        nzPlaceHolder="Chọn vai trò (nhóm quyền)"
        (ngModelChange)="onRoleChange()"
        style="min-width: 200px"
      >
        <nz-option *ngFor="let r of roles" [nzValue]="r.id ?? ''" [nzLabel]="r.tenquyen ?? ''"></nz-option>
      </nz-select>
      <button nz-button nzType="primary" type="button" [nzLoading]="saving" (click)="savePermissions()">Lưu cấu hình quyền</button>
    </div>

    <nz-transfer
      [nzDataSource]="transferDataSource"
      [nzShowSelectAll]="false"
      [nzTitles]="['Menu chưa phân', 'Menu đã phân']"
      [nzRenderList]="[leftTree, rightTree]"
      [nzDisabled]="loadingMatrix"
      (nzChange)="onTransferChange($event)"
    >
    </nz-transfer>

    <ng-template #leftTree let-items let-onItemSelect="onItemSelect">
      <nz-tree
        class="menu-tree"
        nzBlockNode
        [nzData]="leftTreeNodes"
        nzCheckable
        nzCheckStrictly
        (nzCheckboxChange)="onTreeCheck($any($event), onItemSelect, 'left')"
      ></nz-tree>
    </ng-template>

    <ng-template #rightTree let-items let-onItemSelect="onItemSelect">
      <nz-tree
        class="menu-tree"
        nzBlockNode
        [nzData]="rightTreeNodes"
        nzCheckable
        nzCheckStrictly
        (nzCheckboxChange)="onTreeCheck($any($event), onItemSelect, 'right')"
      ></nz-tree>
    </ng-template>

    <p class="hint">
      Cột trái hiển thị menu chưa phân, cột phải hiển thị menu đã phân. Chọn menu cha sẽ tự động áp dụng cho toàn bộ menu con.
    </p>
  `,
  styles: [
    `
      .role-create {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 12px;
        margin-bottom: 16px;
      }
      .matrix-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 12px;
        align-items: center;
      }
      .hint {
        font-size: 12px;
        color: #64748b;
        margin-top: 8px;
      }
      .menu-tree {
        max-height: 420px;
        overflow: auto;
      }
    `
  ]
})
export class RolesPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  roles: RoleApiDto[] = [];
  selectedRoleId = '';
  transferDataSource: MenuTransferItem[] = [];
  targetKeys: string[] = [];
  leftTreeNodes: NzTreeNodeOptions[] = [];
  rightTreeNodes: NzTreeNodeOptions[] = [];
  loadingMatrix = false;
  saving = false;
  private menuById = new Map<string, MenuTransferItem>();
  private childrenByParent = new Map<string, string[]>();

  roleForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['']
  });

  constructor(
    private readonly facade: UserRoleFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) { }

  ngOnInit(): void {
    this.facade.getRoles().subscribe({
      next: (r) => {
        this.roles = r;
        this.selectedRoleId = r[0]?.id ?? '';
        this.onRoleChange();
      },
      error: (e) => this.apiError.show(e)
    });
  }

  createRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      this.message.warning('Nhập tên vai trò trước khi thêm mới');
      return;
    }
    const { name, description } = this.roleForm.getRawValue();
    const normalizedName = name.trim();
    if (!normalizedName) {
      this.message.warning('Tên vai trò không được để trống');
      return;
    }
    const normalizedDescription = description?.trim() ?? '';
    this.facade.createRole(normalizedName, normalizedDescription).pipe(
      switchMap((createdRole) => {
        this.roleForm.reset({ name: '', description: '' });
        this.message.success('Thêm vai trò thành công');

        // Chuyển sang gọi getRoles()
        return this.facade.getRoles().pipe(
          map(roles => ({ roles, createdRole })) // Pass data xuống dưới
        );
      })
    ).subscribe({
      next: ({ roles, createdRole }) => {
        this.roles = roles;
        const createdRoleId = createdRole?.id ?? '';
        this.selectedRoleId = (createdRoleId && roles.find((x) => x.id === createdRoleId)?.id) || roles[roles.length - 1]?.id || '';
        this.onRoleChange();
      },
      error: (e) => this.apiError.show(e)
    });
  }

  onRoleChange(): void {
    if (!this.selectedRoleId) {
      this.transferDataSource = [];
      this.targetKeys = [];
      this.rebuildTrees();
      return;
    }
    this.loadingMatrix = true;
    forkJoin({
      menus: this.facade.getMenusForRole(this.selectedRoleId).pipe(catchError(() => of([] as MenuApiDto[]))),
      assigned: this.facade.getAssignedMenuIds(this.selectedRoleId).pipe(catchError(() => of([] as string[])))
    }).subscribe({
      next: ({ menus, assigned }) => {
        this.setupTransferData(menus, assigned);
        this.loadingMatrix = false;
      },
      error: (e) => {
        this.loadingMatrix = false;
        this.apiError.show(e);
      }
    });
  }

  savePermissions(): void {
    if (!this.selectedRoleId) {
      this.message.warning('Chọn vai trò');
      return;
    }
    const menuIds = this.targetKeys;
    this.saving = true;
    this.facade
      .assignPermissions(this.selectedRoleId, menuIds)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => this.message.success('Lưu phân quyền thành công'),
        error: (e) => this.apiError.show(e)
      });
  }

  /**
   * Khi user click nút chuyển (→ hoặc ←) của Transfer.
   * Cập nhật targetKeys rồi rebuild cả 2 tree.
   */
  onTransferChange(event: TransferChange): void {
    const movedKeys = event.list.map(item => String(item['key']));
    if (event.to === 'right') {
      const targetSet = new Set(this.targetKeys);
      movedKeys.forEach(key => targetSet.add(key));
      this.targetKeys = [...targetSet];
    } else {
      const removeSet = new Set(movedKeys);
      this.targetKeys = this.targetKeys.filter(key => !removeSet.has(key));
    }
    this.rebuildTrees();
  }

  /**
   * Khi user check/uncheck node trong tree.
   * Gọi onItemSelect để thông báo cho Transfer biết item nào được chọn.
   * Cũng cascade xuống toàn bộ node con.
   */
  onTreeCheck(event: NzFormatEmitEvent, onItemSelect: (item: TransferItem) => void, direction: TransferDirection): void {
    const node = event.node;
    if (!node || !node.key) return;

    // Lấy node hiện tại + toàn bộ node con
    const affectedKeys = [node.key, ...this.collectDescendantKeys(node.key)];

    // Lọc chỉ giữ các key thuộc đúng cột đang thao tác
    const targetSet = new Set(this.targetKeys);
    const validKeys = affectedKeys.filter(key => {
      const inLeft = !targetSet.has(key);
      return direction === 'left' ? inLeft : !inLeft;
    });

    // Gọi onItemSelect cho từng item → Transfer sẽ toggle item.checked
    // và cập nhật nút chuyển (→/←)
    validKeys.forEach(key => {
      const item = this.menuById.get(key);
      if (item) {
        onItemSelect(item);
      }
    });
  }

  private setupTransferData(menus: MenuApiDto[], assigned: string[]): void {
    const normalizedAssigned = new Set(assigned.map((id) => String(id)));
    const items = menus
      .filter((menu) => !!menu.id)
      .map((menu) => {
        const key = String(menu.id);
        const title = (menu.tenmenu ?? '').trim();
        const path = (menu.duongdan ?? '').trim();
        return {
          key,
          title: path ? `${title} (${path})` : title || key,
          parentKey: menu.menuchaId ? String(menu.menuchaId) : null,
          sortOrder: menu.stt ?? 0,
          direction: normalizedAssigned.has(key) ? 'right' : 'left'
        } as MenuTransferItem;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

    this.transferDataSource = items;
    this.targetKeys = items.filter((x) => normalizedAssigned.has(x.key)).map((x) => x.key);

    this.menuById = new Map(items.map((item) => [item.key, item]));
    this.childrenByParent = new Map<string, string[]>();
    for (const item of items) {
      const parent = item.parentKey;
      if (!parent) {
        continue;
      }
      const list = this.childrenByParent.get(parent) ?? [];
      list.push(item.key);
      this.childrenByParent.set(parent, list);
    }
    this.rebuildTrees();
  }

  /**
   * Chỉ rebuild tree nodes khi data thực sự thay đổi
   * (load data, hoặc di chuyển item giữa 2 cột).
   * KHÔNG gọi khi user đang check/uncheck node.
   */
  private rebuildTrees(): void {
    const targetSet = new Set(this.targetKeys);
    const leftSet = new Set(this.transferDataSource.filter((item) => !targetSet.has(item.key)).map((item) => item.key));
    const rightSet = new Set(this.transferDataSource.filter((item) => targetSet.has(item.key)).map((item) => item.key));

    this.leftTreeNodes = this.buildTreeNodes(leftSet);
    this.rightTreeNodes = this.buildTreeNodes(rightSet);
  }

  private buildTreeNodes(allowedKeys: Set<string>): NzTreeNodeOptions[] {
    const nodeMap = new Map<string, NzTreeNodeOptions>();
    for (const item of this.transferDataSource) {
      if (!allowedKeys.has(item.key)) {
        continue;
      }
      nodeMap.set(item.key, {
        key: item.key,
        title: item.title,
        children: [],
        isLeaf: true
      });
    }

    const roots: NzTreeNodeOptions[] = [];
    for (const item of this.transferDataSource) {
      if (!allowedKeys.has(item.key)) {
        continue;
      }
      const node = nodeMap.get(item.key);
      if (!node) {
        continue;
      }
      const parent = item.parentKey ? nodeMap.get(item.parentKey) : null;
      if (parent) {
        const children = parent.children as NzTreeNodeOptions[];
        children.push(node);
        parent['isLeaf'] = false;
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  private collectDescendantKeys(rootKey: string): string[] {
    const result: string[] = [];
    const queue = [...(this.childrenByParent.get(rootKey) ?? [])];
    while (queue.length > 0) {
      const key = queue.shift();
      if (!key) {
        continue;
      }
      result.push(key);
      const children = this.childrenByParent.get(key) ?? [];
      queue.push(...children);
    }
    return result;
  }
}
