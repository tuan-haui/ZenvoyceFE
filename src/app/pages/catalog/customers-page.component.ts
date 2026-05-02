import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CreateCustomerCommand, UpdateCustomerCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CatalogFacadeService } from '../../core/services/catalog-facade.service';

interface CustomerVm {
  id: string;
  tenkhachhang: string;
  masothue: string;
  email: string;
  dienthoai: string;
  diachi?: string;
}

const MOCK_CUSTOMERS: CustomerVm[] = [
  { id: 'kh-1', tenkhachhang: 'Công ty Cổ phần Acme', masothue: '0101234567', email: 'billing@acme.vn', dienthoai: '02438251111', diachi: '123 Nguyễn Huệ, Quận 1, TP.HCM' },
  { id: 'kh-2', tenkhachhang: 'Công ty TNHH Globex', masothue: '0109876543', email: 'finance@globex.vn', dienthoai: '02438222222', diachi: '456 Lê Lợi, Quận 1, TP.HCM' },
  { id: 'kh-3', tenkhachhang: 'Công ty CP Initech Solutions', masothue: '0105554444', email: 'accounts@initech.vn', dienthoai: '02363813333', diachi: '789 Trần Phú, Đà Nẵng' },
  { id: 'kh-4', tenkhachhang: 'Tập đoàn Massive Dynamic', masothue: '0102223333', email: 'ap@massivedynamic.vn', dienthoai: '02439344444', diachi: '101 Hoàng Diệu, Hà Nội' },
  { id: 'kh-5', tenkhachhang: 'Công ty TNHH Umbrella Corp', masothue: '0106665555', email: 'info@umbrella.vn', dienthoai: '02435556666', diachi: '202 Đinh Tiên Hoàng, Hà Nội' }
];

@Component({
  selector: 'app-customers-page',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzCheckboxModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzDrawerModule,
    NzPopconfirmModule,
    NzTagModule,
    NzIconModule,
    NzPaginationModule,
    NzSpaceModule,
    NzToolTipModule
  ],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Quản lý Khách hàng</h2>
        <p class="page-subtitle">Quản lý thông tin khách hàng, mã số thuế và hóa đơn.</p>
      </div>
      <div class="page-header-actions">
        <input #csvIn type="file" accept=".csv,.txt,text/csv" hidden (change)="onImportCsv($event)" />
        <button nz-button nzType="default" (click)="csvIn.click()" nz-tooltip nzTooltipTitle="CSV: tenkhachhang,masothue,email,dienthoai (dòng đầu tiêu đề)">
          <nz-icon nzType="upload" nzTheme="outline"></nz-icon>
          Import CSV
        </button>
        <button nz-button nzType="primary" (click)="openCreate()">
          <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
          Thêm khách hàng
        </button>
      </div>
    </div>

    <!-- Filter Bar + Table Card -->
    <div class="table-card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <nz-input-group [nzPrefix]="searchPrefix" class="search-input">
            <input
              nz-input
              placeholder="Tìm theo tên, MST hoặc email..."
              [value]="searchKeyword"
              (input)="onSearch($event)"
            />
          </nz-input-group>
          <ng-template #searchPrefix>
            <nz-icon nzType="search" nzTheme="outline"></nz-icon>
          </ng-template>
        </div>
        <div class="toolbar-right">
          <button nz-button nzType="text" nz-tooltip nzTooltipTitle="Lọc dữ liệu">
            <nz-icon nzType="filter" nzTheme="outline"></nz-icon>
          </button>
          <button nz-button nzType="text" nz-tooltip nzTooltipTitle="Sắp xếp">
            <nz-icon nzType="sort-ascending" nzTheme="outline"></nz-icon>
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <nz-table
        #table
        [nzData]="displayedCustomers"
        [nzFrontPagination]="false"
        [nzShowPagination]="false"
        [nzLoading]="loading"
        nzSize="middle"
        class="customers-table"
      >
        <thead>
          <tr>
            <th nzWidth="48px">
              <label nz-checkbox [nzChecked]="allChecked" (nzCheckedChange)="onAllChecked($event)"></label>
            </th>
            <th>Tên khách hàng</th>
            <th nzWidth="140px">Mã số thuế</th>
            <th>Email</th>
            <th nzWidth="140px">Số điện thoại</th>
            <th nzWidth="120px" nzAlign="right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of table.data" class="data-row" [class.selected-row]="checked.has(c.id)">
            <td>
              <label nz-checkbox [nzChecked]="checked.has(c.id)" (nzCheckedChange)="onItemChecked(c.id, $event)"></label>
            </td>
            <td>
              <div class="customer-name">{{ c.tenkhachhang }}</div>
              <div class="customer-address" *ngIf="c.diachi">{{ c.diachi }}</div>
            </td>
            <td class="mono-text">{{ c.masothue || '—' }}</td>
            <td>
              <a class="email-link" [href]="'mailto:' + c.email">{{ c.email }}</a>
            </td>
            <td>{{ c.dienthoai || '—' }}</td>
            <td nzAlign="right">
              <div class="row-actions">
                <button
                  nz-button
                  nzType="text"
                  nz-tooltip
                  nzTooltipTitle="Sửa"
                  (click)="openEdit(c)"
                  class="action-btn"
                >
                  <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                </button>
                <button
                  nz-button
                  nzType="text"
                  nz-popconfirm
                  nzPopconfirmTitle="Bạn có chắc muốn xóa khách hàng này?"
                  nzPopconfirmPlacement="left"
                  (nzOnConfirm)="delete(c)"
                  class="action-btn action-btn-danger"
                  nz-tooltip
                  nzTooltipTitle="Xóa"
                >
                  <nz-icon nzType="delete" nzTheme="outline"></nz-icon>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="displayedCustomers.length === 0 && !loading">
            <td colspan="6" class="empty-cell">
              <div class="empty-state">
                <nz-icon nzType="inbox" nzTheme="outline" class="empty-icon"></nz-icon>
                <p>Chưa có khách hàng nào</p>
              </div>
            </td>
          </tr>
        </tbody>
      </nz-table>

      <!-- Pagination -->
      <div class="pagination-bar">
        <span class="pagination-info">
          Hiển thị {{ pageIndex === 1 ? 1 : (pageIndex - 1) * pageSize + 1 }}
          - {{ Math.min(pageIndex * pageSize, filteredCustomers.length) }}
          / {{ filteredCustomers.length }} khách hàng
        </span>
        <nz-pagination
          [nzPageIndex]="pageIndex"
          [nzTotal]="filteredCustomers.length"
          [nzPageSize]="pageSize"
          [nzShowSizeChanger]="true"
          [nzPageSizeOptions]="[10, 20, 50]"
          (nzPageIndexChange)="onPageChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
        ></nz-pagination>
      </div>
    </div>

    <!-- Drawer: Thêm/Sửa khách hàng -->
    <nz-drawer
      [nzVisible]="drawerVisible"
      [nzTitle]="editing ? 'Sửa khách hàng' : 'Thêm khách hàng mới'"
      nzWidth="480px"
      [nzClosable]="true"
      (nzOnClose)="closeDrawer()"
      [nzFooter]="drawerFooter"
    >
      <ng-container *nzDrawerContent>
        <form nz-form [formGroup]="form" nzLayout="vertical" class="drawer-form">
          <nz-form-item>
            <nz-form-label nzRequired>Tên khách hàng / Đơn vị</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng nhập tên khách hàng">
              <input nz-input formControlName="tenkhachhang" placeholder="VD: Công ty Cổ phần ABC" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Mã số thuế</nz-form-label>
            <nz-form-control [nzErrorTip]="mstErrorTpl">
              <input nz-input formControlName="masothue" placeholder="VD: 0101234567" />
              <ng-template #mstErrorTpl let-control>
                <ng-container *ngIf="control.hasError('minlength') || control.hasError('maxlength')">MST phải có 10-14 ký tự</ng-container>
                <ng-container *ngIf="control.hasError('pattern')">MST chỉ chứa số hoặc dấu gạch ngang</ng-container>
              </ng-template>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label nzRequired>Email nhận hóa đơn</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng nhập email hợp lệ">
              <input nz-input formControlName="email" type="email" placeholder="VD: billing@company.vn" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Số điện thoại</nz-form-label>
            <nz-form-control>
              <input nz-input formControlName="dienthoai" placeholder="VD: 0901234567" />
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label>Địa chỉ</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                formControlName="diachi"
                placeholder="Địa chỉ khách hàng"
                [nzAutosize]="{ minRows: 2, maxRows: 4 }"
              ></textarea>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>

      <ng-template #drawerFooter>
        <div class="drawer-footer">
          <button nz-button nzType="default" (click)="closeDrawer()">Hủy</button>
          <button nz-button nzType="primary" (click)="save()" [nzLoading]="saving">
            {{ editing ? 'Cập nhật' : 'Thêm mới' }}
          </button>
        </div>
      </ng-template>
    </nz-drawer>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .page-title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #262626;
    }
    .page-subtitle {
      margin: 4px 0 0;
      color: #8c8c8c;
      font-size: 14px;
    }
    .page-header-actions {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
    }
    .table-card {
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      background: #fafafa;
      border-radius: 8px 8px 0 0;
    }
    .toolbar-left {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .search-input {
      width: 320px;
    }
    .toolbar-right {
      display: flex;
      gap: 4px;
    }
    .customers-table {
      border-radius: 0;
    }
    :host ::ng-deep .customers-table .ant-table {
      border-radius: 0;
    }
    .customer-name {
      font-weight: 500;
      color: #262626;
      font-size: 14px;
    }
    .customer-address {
      font-size: 12px;
      color: #8c8c8c;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }
    .mono-text {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 13px;
    }
    .email-link {
      color: #1677ff;
      text-decoration: none;
    }
    .email-link:hover {
      text-decoration: underline;
    }
    .row-actions {
      display: flex;
      justify-content: flex-end;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .data-row:hover .row-actions {
      opacity: 1;
    }
    .selected-row {
      background: #e6f4ff;
    }
    .action-btn {
      color: #8c8c8c;
      padding: 4px;
      width: 30px;
      height: 30px;
    }
    .action-btn:hover {
      color: #1677ff;
    }
    .action-btn-danger:hover {
      color: #ff4d4f !important;
    }
    .empty-cell {
      text-align: center;
      padding: 40px !important;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #bfbfbf;
    }
    .empty-icon {
      font-size: 40px;
      margin-bottom: 8px;
    }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-top: 1px solid #f0f0f0;
      background: #fff;
    }
    .pagination-info {
      font-size: 13px;
      color: #8c8c8c;
    }
    .drawer-form {
      padding: 4px 0;
    }
    .drawer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class CustomersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly Math = Math;

  companyId = 'c-1';
  customers: CustomerVm[] = [];
  filteredCustomers: CustomerVm[] = [];
  displayedCustomers: CustomerVm[] = [];
  loading = false;
  drawerVisible = false;
  editing: CustomerVm | null = null;
  saving = false;
  searchKeyword = '';
  pageIndex = 1;
  pageSize = 10;
  allChecked = false;
  checked = new Set<string>();
  private search$ = new Subject<string>();

  form = this.fb.nonNullable.group({
    tenkhachhang: ['', Validators.required],
    masothue: ['', [Validators.minLength(10), Validators.maxLength(14), Validators.pattern(/^[\d-]*$/)]],
    email: ['', [Validators.required, Validators.email]],
    dienthoai: [''],
    diachi: ['']
  });

  constructor(
    private readonly facade: CatalogFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((kw) => {
      this.applyFilter(kw);
    });

    this.loading = true;
    this.facade.getCustomers(this.companyId).subscribe({
      next: () => {
        this.customers = [...MOCK_CUSTOMERS];
        this.applyFilter(this.searchKeyword);
        this.loading = false;
      },
      error: (e) => {
        this.apiError.show(e);
        this.loading = false;
      }
    });
  }

  onSearch(event: Event): void {
    const kw = (event.target as HTMLInputElement).value;
    this.searchKeyword = kw;
    this.search$.next(kw);
  }

  applyFilter(keyword: string): void {
    const kw = keyword.trim().toLowerCase();
    this.filteredCustomers = kw
      ? this.customers.filter(
          (c) =>
            c.tenkhachhang.toLowerCase().includes(kw) ||
            c.masothue.includes(kw) ||
            c.email.toLowerCase().includes(kw)
        )
      : [...this.customers];
    this.pageIndex = 1;
    this.updateDisplayed();
    this.refreshCheckState();
  }

  updateDisplayed(): void {
    const start = (this.pageIndex - 1) * this.pageSize;
    this.displayedCustomers = this.filteredCustomers.slice(start, start + this.pageSize);
  }

  onPageChange(idx: number): void {
    this.pageIndex = idx;
    this.updateDisplayed();
    this.refreshCheckState();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.pageIndex = 1;
    this.updateDisplayed();
    this.refreshCheckState();
  }

  onItemChecked(id: string, checked: boolean): void {
    if (checked) this.checked.add(id);
    else this.checked.delete(id);
    this.refreshCheckState();
  }

  onAllChecked(checked: boolean): void {
    this.displayedCustomers.forEach((c) => {
      if (checked) this.checked.add(c.id);
      else this.checked.delete(c.id);
    });
    this.allChecked = checked;
  }

  refreshCheckState(): void {
    const ids = this.displayedCustomers.map((c) => c.id);
    this.allChecked = ids.length > 0 && ids.every((id) => this.checked.has(id));
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({ tenkhachhang: '', masothue: '', email: '', dienthoai: '', diachi: '' });
    this.drawerVisible = true;
  }

  openEdit(c: CustomerVm): void {
    this.editing = c;
    this.form.patchValue({ tenkhachhang: c.tenkhachhang, masothue: c.masothue, email: c.email, dienthoai: c.dienthoai, diachi: c.diachi ?? '' });
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
    this.editing = null;
  }

  save(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }
    this.saving = true;
    const raw = this.form.getRawValue();

    if (this.editing) {
      this.facade.updateCustomer(this.editing.id, new UpdateCustomerCommand({ id: this.editing.id, tenkhachhang: raw.tenkhachhang, masothue: raw.masothue, email: raw.email, dienthoai: raw.dienthoai })).subscribe({
        next: () => {
          Object.assign(this.editing!, raw);
          this.applyFilter(this.searchKeyword);
          this.saving = false;
          this.closeDrawer();
          this.message.success('Cập nhật khách hàng thành công');
        },
        error: (e) => {
          this.saving = false;
          this.apiError.show(e);
        }
      });
      return;
    }

    this.facade.createCustomer(new CreateCustomerCommand({ donviid: this.companyId, tenkhachhang: raw.tenkhachhang, masothue: raw.masothue, email: raw.email, dienthoai: raw.dienthoai })).subscribe({
      next: () => {
        const newCustomer: CustomerVm = { id: `kh-${Date.now()}`, ...raw };
        this.customers = [newCustomer, ...this.customers];
        this.applyFilter(this.searchKeyword);
        this.saving = false;
        this.closeDrawer();
        this.message.success('Thêm khách hàng thành công');
      },
      error: (e) => {
        this.saving = false;
        this.apiError.show(e);
      }
    });
  }

  delete(c: CustomerVm): void {
    this.facade.deleteCustomer(c.id).subscribe({
      next: () => {
        this.customers = this.customers.filter((x) => x.id !== c.id);
        this.checked.delete(c.id);
        this.applyFilter(this.searchKeyword);
        this.message.success('Xóa khách hàng thành công');
      },
      error: (e) => this.apiError.show(e)
    });
  }

  onImportCsv(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.companyId) {
      this.message.warning('Chọn công ty trước khi import.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length < 2) {
        this.message.error('File CSV không hợp lệ.');
        return;
      }
      const header = lines[0].toLowerCase();
      const hasHeader = /ten|name|email|mst|thue/.test(header);
      const dataLines = hasHeader ? lines.slice(1) : lines;
      let ok = 0;
      const run = (i: number) => {
        if (i >= dataLines.length) {
          this.message.success(`Import xong: ${ok} dòng.`);
          return;
        }
        const parts = dataLines[i].split(/[,;]/).map((p) => p.trim().replace(/^"|"$/g, ''));
        const [tenkhachhang, masothue, email, dienthoai] = [parts[0] ?? '', parts[1] ?? '', parts[2] ?? '', parts[3] ?? ''];
        if (!tenkhachhang) {
          run(i + 1);
          return;
        }
        this.facade
          .createCustomer(
            new CreateCustomerCommand({
              donviid: this.companyId,
              tenkhachhang,
              masothue: masothue || undefined,
              email: email || undefined,
              dienthoai: dienthoai || undefined
            })
          )
          .subscribe({
            next: () => {
              ok++;
              this.customers.unshift({
                id: `csv-${Date.now()}-${i}`,
                tenkhachhang,
                masothue,
                email: email ?? '',
                dienthoai: dienthoai ?? ''
              });
              this.applyFilter(this.searchKeyword);
              run(i + 1);
            },
            error: () => run(i + 1)
          });
      };
      run(0);
    };
    reader.readAsText(file, 'UTF-8');
  }
}
