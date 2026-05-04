/**
 * Bảng ánh xạ icon cho menu sidebar.
 *
 * Lý do tồn tại: DB không lưu cột icon, API menu vì vậy không trả về icon.
 * Toàn bộ việc gán icon được xử lý ở FE thông qua bảng tra cứu này.
 *
 * Quy tắc resolve (theo thứ tự ưu tiên):
 *   1. Khớp chính xác `duongdan` (path) trong PATH_ICON_MAP.
 *   2. Khớp prefix dài nhất trong PATH_ICON_MAP (vd. "/admin/templates/setup" sẽ
 *      lấy icon của "/admin/templates" nếu không có entry chính xác).
 *   3. Khớp `tenmenu` (đã lowercase + bỏ dấu) trong NAME_ICON_MAP — dùng cho
 *      menu cha không có duongdan.
 *   4. Mặc định DEFAULT_ICON.
 *
 * Khi thêm icon mới: nhớ import thêm vào `icons-provider.ts` để ng-zorro biết.
 */

const DEFAULT_ICON = 'appstore';

const PATH_ICON_MAP: Record<string, string> = {
  '/admin/dashboard': 'dashboard',

  '/admin/users': 'user',
  '/admin/roles': 'safety-certificate',
  '/admin/system': 'setting',
  '/admin/system/logs': 'file-search',

  '/admin/companies': 'bank',
  '/admin/customers': 'team',
  '/admin/products': 'shopping',

  '/admin/templates': 'folder',
  '/admin/templates/setup': 'file-protect',
  '/admin/templates/warehouse': 'database',

  '/admin/invoices': 'file-done',

  '/admin/reports': 'line-chart',
  '/admin/reports/sales': 'bar-chart'
};

const NAME_ICON_MAP: Record<string, string> = {
  'dashboard': 'dashboard',
  'trang chu': 'dashboard',
  'he thong': 'setting',
  'nguoi dung': 'user',
  'tai khoan': 'user',
  'vai tro': 'safety-certificate',
  'phan quyen': 'safety-certificate',
  'nhat ky': 'file-search',
  'log': 'file-search',
  'danh muc': 'appstore',
  'cong ty': 'bank',
  'doanh nghiep': 'bank',
  'khach hang': 'team',
  'san pham': 'shopping',
  'hang hoa': 'shopping',
  'mau': 'folder',
  'mau hoa don': 'folder',
  'thiet lap mau': 'file-protect',
  'kho mau': 'database',
  'hoa don': 'file-done',
  'bao cao': 'line-chart',
  'bao cao ban hang': 'bar-chart'
};

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const normalizeName = (name: string): string => {
  return removeVietnameseTones(name).toLowerCase().trim().replace(/\s+/g, ' ');
};

export const resolveMenuIcon = (path?: string | null, name?: string | null): string => {
  const p = (path ?? '').trim().toLowerCase();
  if (p && PATH_ICON_MAP[p]) {
    return PATH_ICON_MAP[p];
  }

  if (p) {
    const candidates = Object.keys(PATH_ICON_MAP)
      .filter((key) => p === key || p.startsWith(key + '/'))
      .sort((a, b) => b.length - a.length);
    if (candidates.length > 0) {
      return PATH_ICON_MAP[candidates[0]];
    }
  }

  const n = normalizeName(name ?? '');
  if (n && NAME_ICON_MAP[n]) {
    return NAME_ICON_MAP[n];
  }

  return DEFAULT_ICON;
};

export const MENU_ICONS_USED = Array.from(
  new Set([DEFAULT_ICON, ...Object.values(PATH_ICON_MAP), ...Object.values(NAME_ICON_MAP)])
);
