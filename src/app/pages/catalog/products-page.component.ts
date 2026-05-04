import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CreateProductCommand, ProductDto, UpdateProductCommand } from '../../core/services/app.service';
import { ApiErrorService } from '../../core/services/api-error.service';
import { CatalogFacadeService } from '../../core/services/catalog-facade.service';
import { InvoiceFacadeService } from '../../core/services/invoice-facade.service';

type ProductStatus = 'active' | 'disabled';

interface ProductVm {
  id: string;
  mahang: string;
  tenhanghoa: string;
  donvitinh: string;
  dongia: number;
  thuesuat: string;
  trangthai: ProductStatus;
}

const TAX_RATES = [
  { label: '0%', value: '0' },
  { label: '5%', value: '5' },
  { label: '8%', value: '8' },
  { label: '10%', value: '10' },
  { label: 'KCT (Không chịu thuế)', value: 'KCT' }
];

const UNITS = ['Cái', 'Chiếc', 'Bộ', 'Gói', 'Hộp', 'Kg', 'Tấn', 'Lít', 'Thùng', 'Giờ', 'Ngày', 'Tháng', 'Năm', 'Dịch vụ'];

function mapProductDto(p: ProductDto): ProductVm {
  const id = p.id ?? '';
  return {
    id,
    mahang: id ? id.slice(0, 8) : '—',
    tenhanghoa: p.tenhanghoa ?? '',
    donvitinh: p.donvitinh ?? '',
    dongia: p.dongia ?? 0,
    thuesuat: '10',
    trangthai: 'active'
  };
}

@Component({
  selector: 'app-products-page',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTableModule,
    NzCheckboxModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
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
        <h2 class="page-title">Danh mục Hàng hóa / Dịch vụ</h2>
        <p class="page-subtitle">Quản lý sản phẩm, dịch vụ, giá và thuế suất để lập hóa đơn.</p>
      </div>
      <div class="page-header-actions">
        <button nz-button nzType="default">
          <nz-icon nzType="upload" nzTheme="outline"></nz-icon>
          Import hàng loạt
        </button>
        <button nz-button nzType="primary" (click)="openCreate()">
          <nz-icon nzType="plus" nzTheme="outline"></nz-icon>
          Thêm hàng hóa
        </button>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <nz-input-group [nzPrefix]="searchPrefix" class="search-input">
            <input
              nz-input
              placeholder="Tìm theo mã hoặc tên hàng hóa..."
              [value]="searchKeyword"
              (input)="onSearch($event)"
            />
          </nz-input-group>
          <ng-template #searchPrefix>
            <nz-icon nzType="search" nzTheme="outline"></nz-icon>
          </ng-template>

          <nz-select
            [(ngModel)]="filterStatus"
            (ngModelChange)="applyFilter(searchKeyword)"
            nzPlaceHolder="Tất cả trạng thái"
            nzAllowClear
            class="filter-select"
          >
            <nz-option nzValue="active" nzLabel="Đang dùng"></nz-option>
            <nz-option nzValue="disabled" nzLabel="Ngưng sử dụng"></nz-option>
          </nz-select>
        </div>
        <div class="toolbar-right">
          <button nz-button nzType="text" nz-tooltip nzTooltipTitle="Xuất danh sách">
            <nz-icon nzType="download" nzTheme="outline"></nz-icon>
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <nz-table
        #table
        [nzData]="displayedProducts"
        [nzFrontPagination]="false"
        [nzShowPagination]="false"
        [nzLoading]="loading"
        nzSize="middle"
        class="products-table"
      >
        <thead>
          <tr>
            <th nzWidth="48px">
              <label nz-checkbox [nzChecked]="allChecked" (nzCheckedChange)="onAllChecked($event)"></label>
            </th>
            <th nzWidth="120px">Mã hàng</th>
            <th>Tên hàng hóa / Dịch vụ</th>
            <th nzWidth="110px">Đơn vị tính</th>
            <th nzWidth="140px" nzAlign="right">Đơn giá</th>
            <th nzWidth="110px" nzAlign="right">Thuế suất</th>
            <th nzWidth="130px" nzAlign="center">Trạng thái</th>
            <th nzWidth="110px" nzAlign="right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of table.data" class="data-row" [class.selected-row]="checked.has(p.id)" [class.row-disabled]="p.trangthai === 'disabled'">
            <td>
              <label nz-checkbox [nzChecked]="checked.has(p.id)" (nzCheckedChange)="onItemChecked(p.id, $event)"></label>
            </td>
            <td class="mono-text">{{ p.mahang }}</td>
            <td>
              <span class="product-name" [class.disabled-text]="p.trangthai === 'disabled'">{{ p.tenhanghoa }}</span>
            </td>
            <td class="secondary-text">{{ p.donvitinh }}</td>
            <td nzAlign="right" class="price-text">{{ p.dongia | number:'1.0-0' }}&nbsp;₫</td>
            <td nzAlign="right" class="secondary-text">{{ formatTax(p.thuesuat) }}</td>
            <td nzAlign="center">
              <nz-tag [nzColor]="p.trangthai === 'active' ? 'success' : 'default'">
                {{ p.trangthai === 'active' ? 'Đang dùng' : 'Ngưng sử dụng' }}
              </nz-tag>
            </td>
            <td nzAlign="right">
              <div class="row-actions">
                <button
                  nz-button
                  nzType="text"
                  nz-tooltip
                  nzTooltipTitle="Sửa"
                  (click)="openEdit(p)"
                  class="action-btn"
                >
                  <nz-icon nzType="edit" nzTheme="outline"></nz-icon>
                </button>
                <button
                  *ngIf="p.trangthai === 'active'"
                  nz-button
                  nzType="text"
                  nz-popconfirm
                  nzPopconfirmTitle="Ngưng sử dụng hàng hóa này?"
                  nzPopconfirmPlacement="left"
                  (nzOnConfirm)="toggleStatus(p)"
                  class="action-btn action-btn-warning"
                  nz-tooltip
                  nzTooltipTitle="Ngưng sử dụng"
                >
                  <nz-icon nzType="stop" nzTheme="outline"></nz-icon>
                </button>
                <button
                  *ngIf="p.trangthai === 'disabled'"
                  nz-button
                  nzType="text"
                  nz-popconfirm
                  nzPopconfirmTitle="Kích hoạt lại hàng hóa này?"
                  nzPopconfirmPlacement="left"
                  (nzOnConfirm)="toggleStatus(p)"
                  class="action-btn action-btn-success"
                  nz-tooltip
                  nzTooltipTitle="Kích hoạt lại"
                >
                  <nz-icon nzType="check-circle" nzTheme="outline"></nz-icon>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="displayedProducts.length === 0 && !loading">
            <td colspan="8" class="empty-cell">
              <div class="empty-state">
                <nz-icon nzType="inbox" nzTheme="outline" class="empty-icon"></nz-icon>
                <p>Chưa có hàng hóa / dịch vụ nào</p>
              </div>
            </td>
          </tr>
        </tbody>
      </nz-table>

      <!-- Pagination -->
      <div class="pagination-bar">
        <span class="pagination-info">
          Hiển thị {{ pageIndex === 1 ? 1 : (pageIndex - 1) * pageSize + 1 }}
          - {{ Math.min(pageIndex * pageSize, filteredProducts.length) }}
          / {{ filteredProducts.length }} mục
        </span>
        <nz-pagination
          [nzPageIndex]="pageIndex"
          [nzTotal]="filteredProducts.length"
          [nzPageSize]="pageSize"
          [nzShowSizeChanger]="true"
          [nzPageSizeOptions]="[10, 20, 50]"
          (nzPageIndexChange)="onPageChange($event)"
          (nzPageSizeChange)="onPageSizeChange($event)"
        ></nz-pagination>
      </div>
    </div>

    <!-- Drawer: Thêm/Sửa hàng hóa -->
    <nz-drawer
      [nzVisible]="drawerVisible"
      [nzTitle]="editing ? 'Sửa hàng hóa / Dịch vụ' : 'Thêm hàng hóa / Dịch vụ mới'"
      nzWidth="520px"
      [nzClosable]="true"
      (nzOnClose)="closeDrawer()"
      [nzFooter]="drawerFooter"
    >
      <ng-container *nzDrawerContent>
        <form nz-form [formGroup]="form" nzLayout="vertical" class="drawer-form">
          <div class="form-grid-2col">
            <nz-form-item>
              <nz-form-label nzRequired>Mã hàng</nz-form-label>
              <nz-form-control nzErrorTip="Vui lòng nhập mã hàng">
                <input nz-input formControlName="mahang" placeholder="VD: ITM-001" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Đơn vị tính</nz-form-label>
              <nz-form-control nzErrorTip="Vui lòng chọn đơn vị tính">
                <nz-select formControlName="donvitinh" nzShowSearch nzAllowClear nzPlaceHolder="Chọn hoặc nhập ĐVT">
                  <nz-option *ngFor="let u of units" [nzValue]="u" [nzLabel]="u"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>

          <nz-form-item>
            <nz-form-label nzRequired>Tên hàng hóa / Dịch vụ</nz-form-label>
            <nz-form-control nzErrorTip="Vui lòng nhập tên hàng hóa">
              <input nz-input formControlName="tenhanghoa" placeholder="VD: Dịch vụ Phát triển Phần mềm" />
            </nz-form-control>
          </nz-form-item>

          <div class="form-grid-2col">
            <nz-form-item>
              <nz-form-label nzRequired>Đơn giá (VNĐ)</nz-form-label>
              <nz-form-control nzErrorTip="Đơn giá phải lớn hơn hoặc bằng 0">
                <nz-input-number
                  formControlName="dongia"
                  [nzMin]="0"
                  [nzStep]="100000"
                  [nzFormatter]="priceFormatter"
                  [nzParser]="priceParser"
                  class="full-width"
                ></nz-input-number>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Thuế suất</nz-form-label>
              <nz-form-control nzErrorTip="Vui lòng chọn thuế suất">
                <nz-select formControlName="thuesuat" nzPlaceHolder="Chọn thuế suất">
                  <nz-option *ngFor="let t of taxRates" [nzValue]="t.value" [nzLabel]="t.label"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>
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
      width: 280px;
    }
    .filter-select {
      width: 170px;
    }
    .toolbar-right {
      display: flex;
      gap: 4px;
    }
    .products-table {
      border-radius: 0;
    }
    :host ::ng-deep .products-table .ant-table {
      border-radius: 0;
    }
    .mono-text {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 13px;
      color: #595959;
    }
    .product-name {
      font-weight: 500;
      color: #262626;
    }
    .product-name.disabled-text {
      color: #8c8c8c;
    }
    .secondary-text {
      color: #8c8c8c;
    }
    .price-text {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-weight: 500;
      color: #262626;
    }
    .row-disabled {
      opacity: 0.75;
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
      background: var(--app-lightbg, #e6f4ff);
    }
    .action-btn {
      color: #8c8c8c;
      padding: 4px;
      width: 30px;
      height: 30px;
    }
    .action-btn:hover {
      color: var(--app-primary, #1677ff);
    }
    .action-btn-warning:hover {
      color: #faad14 !important;
    }
    .action-btn-success:hover {
      color: #52c41a !important;
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
    .form-grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
    }
    .full-width {
      width: 100%;
    }
    .drawer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    /* ── Dark mode ── */
    :host-context(html.dark-mode) .page-title { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .table-card {
      background: #1f1f1f;
      border-color: rgba(255,255,255,0.1);
    }
    :host-context(html.dark-mode) .toolbar {
      background: #262626;
      border-bottom-color: rgba(255,255,255,0.08);
    }
    :host-context(html.dark-mode) .pagination-bar {
      background: #1f1f1f;
      border-top-color: rgba(255,255,255,0.08);
    }
    :host-context(html.dark-mode) .pagination-info { color: rgba(255,255,255,0.45); }
    :host-context(html.dark-mode) .selected-row {
      background: rgba(255,255,255,0.08) !important;
    }
    :host-context(html.dark-mode) .product-name { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .product-name.disabled-text { color: rgba(255,255,255,0.35); }
    :host-context(html.dark-mode) .mono-text { color: rgba(255,255,255,0.65); }
    :host-context(html.dark-mode) .price-text { color: rgba(255,255,255,0.85); }
    :host-context(html.dark-mode) .secondary-text { color: rgba(255,255,255,0.45); }
    :host-context(html.dark-mode) .action-btn { color: rgba(255,255,255,0.35); }
    :host-context(html.dark-mode) .empty-state { color: rgba(255,255,255,0.25); }
  `]
})
export class ProductsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly Math = Math;
  readonly taxRates = TAX_RATES;
  readonly units = UNITS;

  companyId: string | undefined;
  products: ProductVm[] = [];
  filteredProducts: ProductVm[] = [];
  displayedProducts: ProductVm[] = [];
  loading = false;
  drawerVisible = false;
  editing: ProductVm | null = null;
  saving = false;
  searchKeyword = '';
  filterStatus: ProductStatus | null = null;
  pageIndex = 1;
  pageSize = 10;
  allChecked = false;
  checked = new Set<string>();
  private search$ = new Subject<string>();

  form = this.fb.nonNullable.group({
    mahang: ['', Validators.required],
    tenhanghoa: ['', Validators.required],
    donvitinh: ['', Validators.required],
    dongia: [0, [Validators.required, Validators.min(0)]],
    thuesuat: ['10', Validators.required]
  });

  priceFormatter = (value: number): string => (value != null ? `${value.toLocaleString('vi-VN')}` : '');
  priceParser = (value: string): number => Number(value.replace(/\./g, '').replace(/,/g, '')) || 0;

  constructor(
    private readonly facade: CatalogFacadeService,
    private readonly invoiceFacade: InvoiceFacadeService,
    private readonly apiError: ApiErrorService,
    private readonly message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe((kw) => {
      this.applyFilter(kw);
    });

    this.invoiceFacade.getCompanies().subscribe({
      next: (list) => {
        this.companyId = list[0]?.id;
        this.reloadProducts();
      },
      error: (e) => {
        this.apiError.show(e);
        this.loading = false;
      }
    });
  }

  private reloadProducts(): void {
    if (!this.companyId) {
      this.products = [];
      this.applyFilter(this.searchKeyword);
      this.loading = false;
      return;
    }
    this.loading = true;
    this.facade.getProducts(this.companyId).subscribe({
      next: (rows) => {
        this.products = rows.map(mapProductDto);
        this.applyFilter(this.searchKeyword);
        this.loading = false;
      },
      error: (e) => {
        this.apiError.show(e);
        this.loading = false;
      }
    });
  }

  formatTax(value: string): string {
    return value === 'KCT' ? 'KCT' : `${value}%`;
  }

  onSearch(event: Event): void {
    const kw = (event.target as HTMLInputElement).value;
    this.searchKeyword = kw;
    this.search$.next(kw);
  }

  applyFilter(keyword: string): void {
    const kw = keyword.trim().toLowerCase();
    let result = this.products;
    if (kw) {
      result = result.filter(
        (p) => p.mahang.toLowerCase().includes(kw) || p.tenhanghoa.toLowerCase().includes(kw)
      );
    }
    if (this.filterStatus) {
      result = result.filter((p) => p.trangthai === this.filterStatus);
    }
    this.filteredProducts = result;
    this.pageIndex = 1;
    this.updateDisplayed();
    this.refreshCheckState();
  }

  updateDisplayed(): void {
    const start = (this.pageIndex - 1) * this.pageSize;
    this.displayedProducts = this.filteredProducts.slice(start, start + this.pageSize);
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
    this.displayedProducts.forEach((p) => {
      if (checked) this.checked.add(p.id);
      else this.checked.delete(p.id);
    });
    this.allChecked = checked;
  }

  refreshCheckState(): void {
    const ids = this.displayedProducts.map((p) => p.id);
    this.allChecked = ids.length > 0 && ids.every((id) => this.checked.has(id));
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({ mahang: '', tenhanghoa: '', donvitinh: '', dongia: 0, thuesuat: '10' });
    this.drawerVisible = true;
  }

  openEdit(p: ProductVm): void {
    this.editing = p;
    this.form.patchValue({ mahang: p.mahang, tenhanghoa: p.tenhanghoa, donvitinh: p.donvitinh, dongia: p.dongia, thuesuat: p.thuesuat });
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
    if (!this.companyId) {
      this.message.warning('Chưa có công ty để gán hàng hóa.');
      return;
    }
    this.saving = true;
    const raw = this.form.getRawValue();

    if (this.editing) {
      this.facade
        .updateProduct(this.editing.id, new UpdateProductCommand({ id: this.editing.id, tenhanghoa: raw.tenhanghoa, donvitinh: raw.donvitinh, dongia: raw.dongia }))
        .subscribe({
          next: (updated) => {
            Object.assign(this.editing!, mapProductDto(updated));
            this.applyFilter(this.searchKeyword);
            this.saving = false;
            this.closeDrawer();
            this.message.success('Cập nhật hàng hóa thành công');
          },
          error: (e) => {
            this.saving = false;
            this.apiError.show(e);
          }
        });
      return;
    }

    this.facade
      .createProduct(new CreateProductCommand({ donviid: this.companyId, tenhanghoa: raw.tenhanghoa, donvitinh: raw.donvitinh, dongia: raw.dongia }))
      .subscribe({
        next: (created) => {
          this.products = [mapProductDto(created), ...this.products];
          this.applyFilter(this.searchKeyword);
          this.saving = false;
          this.closeDrawer();
          this.message.success('Thêm hàng hóa thành công');
        },
        error: (e) => {
          this.saving = false;
          this.apiError.show(e);
        }
      });
  }

  toggleStatus(p: ProductVm): void {
    const newStatus: ProductStatus = p.trangthai === 'active' ? 'disabled' : 'active';
    const label = newStatus === 'disabled' ? 'Đã ngưng sử dụng hàng hóa' : 'Đã kích hoạt lại hàng hóa';
    p.trangthai = newStatus;
    this.applyFilter(this.searchKeyword);
    this.message.success(label);
  }
}
