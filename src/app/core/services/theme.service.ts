import { Injectable, signal } from '@angular/core';

export type ThemeColor = 'green' | 'blue' | 'purple' | 'orange' | 'cyan';
export type ThemeMode  = 'light' | 'dark';

export interface ColorOption {
  id:      ThemeColor;
  label:   string;
  /** Màu chính */
  primary: string;
  /** Màu hover (nhạt hơn) */
  hover:   string;
  /** Màu active/pressed (đậm hơn) */
  active:  string;
  /** Nền rất nhạt (row selection, menu selected bg ...) */
  lightBg: string;
  /** Shadow cho focus ring */
  shadow:  string;
}

/**
 * Bảng màu tuân theo Ant Design palette (step 1–7).
 * Mỗi màu được định nghĩa thủ công để đảm bảo đúng sắc độ.
 */
export const COLOR_OPTIONS: ColorOption[] = [
  {
    id: 'green', label: 'Xanh lá',
    primary: '#52c41a', hover: '#73d13d', active: '#389e0d',
    lightBg: '#f6ffed', shadow: 'rgba(82,196,26,0.2)',
  },
  {
    id: 'blue', label: 'Xanh dương',
    primary: '#1677ff', hover: '#4096ff', active: '#0958d9',
    lightBg: '#e6f4ff', shadow: 'rgba(22,119,255,0.2)',
  },
  {
    id: 'purple', label: 'Tím',
    primary: '#722ed1', hover: '#9254de', active: '#531dab',
    lightBg: '#f9f0ff', shadow: 'rgba(114,46,209,0.2)',
  },
  {
    id: 'orange', label: 'Cam',
    primary: '#fa8c16', hover: '#ffa940', active: '#d46b08',
    lightBg: '#fff7e6', shadow: 'rgba(250,140,22,0.2)',
  },
  {
    id: 'cyan', label: 'Ngọc lam',
    primary: '#13c2c2', hover: '#36cfc9', active: '#08979c',
    lightBg: '#e6fffb', shadow: 'rgba(19,194,194,0.2)',
  },
];

const THEME_COLOR_KEY = 'zenvoyce.theme_color';
const THEME_MODE_KEY  = 'zenvoyce.theme_mode';
const STYLE_TAG_ID    = 'zenvoyce-theme-style';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly activeColor = signal<ThemeColor>('green');
  readonly mode        = signal<ThemeMode>('light');

  /** Gọi một lần khi app khởi động để restore setting đã lưu. */
  init(): void {
    const savedColor = (localStorage.getItem(THEME_COLOR_KEY) as ThemeColor) ?? 'green';
    const savedMode  = (localStorage.getItem(THEME_MODE_KEY)  as ThemeMode)  ?? 'light';
    this.applyColor(savedColor);
    this.applyMode(savedMode);
  }

  setColor(color: ThemeColor): void {
    localStorage.setItem(THEME_COLOR_KEY, color);
    this.applyColor(color);
  }

  toggleMode(): void {
    const next = this.mode() === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_MODE_KEY, next);
    this.applyMode(next);
  }

  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────

  private applyColor(color: ThemeColor): void {
    this.activeColor.set(color);
    const opt = COLOR_OPTIONS.find((c) => c.id === color) ?? COLOR_OPTIONS[0];
    this.injectColorCSS(opt);
  }

  private applyMode(mode: ThemeMode): void {
    this.mode.set(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }

  /**
   * Inject (hoặc replace) một <style> tag với toàn bộ CSS override màu
   * cho ng-zorro compiled styles (vốn dùng hex hardcoded từ Less).
   */
  private injectColorCSS(o: ColorOption): void {
    let el = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_TAG_ID;
      document.head.appendChild(el);
    }
    el.textContent = this.buildCSS(o);
  }

  private buildCSS(o: ColorOption): string {
    const p  = o.primary;
    const hv = o.hover;
    const ac = o.active;
    const bg = o.lightBg;
    const sh = o.shadow;

    return `
/* ═══════════════════════════════════════════════════════════
   Zenvoyce Runtime Color Theme Override
   Primary: ${p}
   ═══════════════════════════════════════════════════════════ */

/* CSS Custom Properties — dùng được trong component styles */
:root {
  --app-primary: ${p};
  --app-primary-hover: ${hv};
  --app-lightbg: ${bg};
  --app-shadow: ${sh};
}

/* ── Buttons ── */
.ant-btn:not(.ant-btn-primary):not(.ant-btn-dangerous):not([disabled]):hover,
.ant-btn:not(.ant-btn-primary):not(.ant-btn-dangerous):not([disabled]):focus {
  color: ${p};
  border-color: ${hv};
}
.ant-btn-primary {
  background: ${p} !important;
  border-color: ${p} !important;
  color: #fff !important;
}
.ant-btn-primary:hover,
.ant-btn-primary:focus {
  background: ${hv} !important;
  border-color: ${hv} !important;
}
.ant-btn-primary:active {
  background: ${ac} !important;
  border-color: ${ac} !important;
}
.ant-btn-primary[disabled],
.ant-btn-primary[disabled]:hover,
.ant-btn-primary[disabled]:focus {
  background: #f5f5f5 !important;
  border-color: #d9d9d9 !important;
  color: rgba(0,0,0,.25) !important;
}
.ant-btn-link { color: ${p} !important; }
.ant-btn-link:hover,
.ant-btn-link:focus { color: ${hv} !important; }
.ant-btn-background-ghost.ant-btn-primary {
  color: ${p} !important;
  border-color: ${p} !important;
}
.ant-btn-background-ghost.ant-btn-primary:hover {
  color: ${hv} !important;
  border-color: ${hv} !important;
}

/* ── Links ── */
a { color: ${p}; }
a:hover { color: ${hv}; }
a:active { color: ${ac}; }

/* ── Menu ── */
.ant-menu-light .ant-menu-item:hover,
.ant-menu-light .ant-menu-item-active {
  color: ${p} !important;
}
.ant-menu-light .ant-menu-submenu-title:hover {
  color: ${p} !important;
}
.ant-menu-light .ant-menu-item-selected {
  color: ${p} !important;
  background-color: ${bg} !important;
}
.ant-menu-light .ant-menu-item-selected > a,
.ant-menu-light .ant-menu-item-selected > a:hover {
  color: ${p} !important;
}
.ant-menu-inline .ant-menu-item::after,
.ant-menu-vertical .ant-menu-item::after,
.ant-menu-vertical-left .ant-menu-item::after,
.ant-menu-vertical-right .ant-menu-item::after {
  border-right-color: ${p} !important;
}
.ant-menu-light .ant-menu-submenu-selected > .ant-menu-submenu-title {
  color: ${p} !important;
}
.ant-menu-light .ant-menu-submenu-open > .ant-menu-submenu-title {
  color: ${p} !important;
}
.ant-menu-light .ant-menu-submenu-open > .ant-menu-submenu-title > .ant-menu-submenu-arrow {
  color: ${p} !important;
}

/* ── Checkbox ── */
.ant-checkbox-checked .ant-checkbox-inner {
  background-color: ${p} !important;
  border-color: ${p} !important;
}
.ant-checkbox-checked::after { border-color: ${p} !important; }
.ant-checkbox-indeterminate .ant-checkbox-inner::after {
  background-color: ${p} !important;
}
.ant-checkbox:hover .ant-checkbox-inner,
.ant-checkbox-input:focus + .ant-checkbox-inner,
.ant-checkbox-wrapper:hover .ant-checkbox-inner {
  border-color: ${p} !important;
}

/* ── Radio ── */
.ant-radio-checked .ant-radio-inner { border-color: ${p} !important; }
.ant-radio-inner::after { background-color: ${p} !important; }
.ant-radio-wrapper:hover .ant-radio .ant-radio-inner,
.ant-radio:hover .ant-radio-inner,
.ant-radio-input:focus + .ant-radio-inner {
  border-color: ${p} !important;
}
.ant-radio-button-wrapper:hover { color: ${p} !important; }
.ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
  color: ${p} !important;
  border-color: ${p} !important;
}
.ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before {
  background-color: ${p} !important;
}

/* ── Switch ── */
.ant-switch-checked { background-color: ${p} !important; }

/* ── Input / Textarea ── */
.ant-input:hover { border-color: ${hv} !important; }
.ant-input:focus,
.ant-input-focused {
  border-color: ${hv} !important;
  box-shadow: 0 0 0 2px ${sh} !important;
}
.ant-input-affix-wrapper:hover { border-color: ${hv} !important; }
.ant-input-affix-wrapper:focus,
.ant-input-affix-wrapper-focused {
  border-color: ${hv} !important;
  box-shadow: 0 0 0 2px ${sh} !important;
}
.ant-input-number:hover { border-color: ${hv} !important; }
.ant-input-number-focused {
  border-color: ${hv} !important;
  box-shadow: 0 0 0 2px ${sh} !important;
}

/* ── Select ── */
.ant-select:not(.ant-select-disabled):hover .ant-select-selector {
  border-color: ${hv} !important;
}
.ant-select-focused:not(.ant-select-disabled).ant-select-single .ant-select-selector,
.ant-select-focused:not(.ant-select-disabled).ant-select-multiple .ant-select-selector {
  border-color: ${hv} !important;
  box-shadow: 0 0 0 2px ${sh} !important;
}
.ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
  background-color: ${bg} !important;
  color: ${p} !important;
  font-weight: 600;
}

/* ── Date Picker ── */
.ant-picker:hover { border-color: ${hv} !important; }
.ant-picker-focused {
  border-color: ${hv} !important;
  box-shadow: 0 0 0 2px ${sh} !important;
}
.ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
  border-color: ${p} !important;
}
.ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner,
.ant-picker-cell-in-view.ant-picker-cell-range-start .ant-picker-cell-inner,
.ant-picker-cell-in-view.ant-picker-cell-range-end .ant-picker-cell-inner {
  background: ${p} !important;
}
.ant-picker-today-btn { color: ${p} !important; }
.ant-picker-header-view button:hover { color: ${p} !important; }

/* ── Tabs ── */
.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: ${p} !important; }
.ant-tabs-ink-bar { background: ${p} !important; }
.ant-tabs-tab:hover { color: ${hv} !important; }

/* ── Pagination ── */
.ant-pagination-item-active {
  border-color: ${p} !important;
}
.ant-pagination-item-active a { color: ${p} !important; }
.ant-pagination-item:hover { border-color: ${p} !important; }
.ant-pagination-item:hover a { color: ${p} !important; }
.ant-pagination-prev:hover .ant-pagination-item-link,
.ant-pagination-next:hover .ant-pagination-item-link {
  color: ${p} !important;
  border-color: ${p} !important;
}
.ant-pagination-options-quick-jumper input:hover,
.ant-pagination-options-quick-jumper input:focus {
  border-color: ${hv} !important;
}

/* ── Table ── */
.ant-table-column-sorter-up.active svg,
.ant-table-column-sorter-down.active svg { color: ${p} !important; }
.ant-table-filter-trigger.active { color: ${p} !important; }
.ant-table-tbody > tr.ant-table-row-selected > td {
  background: ${bg} !important;
}
.ant-table-tbody > tr.ant-table-row-selected:hover > td {
  background: ${bg} !important;
  filter: brightness(0.97);
}

/* ── Tree ── */
.ant-tree .ant-tree-node-content-wrapper.ant-tree-node-selected {
  background-color: ${bg} !important;
}

/* ── Spin / Loading ── */
.ant-spin { color: ${p} !important; }
.ant-spin-dot-item { background-color: ${p} !important; }

/* ── Progress ── */
.ant-progress-bg { background-color: ${p} !important; }

/* ── Badge ── */
.ant-badge-status-processing::after { border-color: ${p} !important; }

/* ── Breadcrumb ── */
.ant-breadcrumb a { color: ${p} !important; }
.ant-breadcrumb a:hover { color: ${hv} !important; }

/* ── Anchor ── */
.ant-anchor-ink-ball.ant-anchor-ink-ball-visible { border-color: ${p} !important; }
.ant-anchor-link-active > .ant-anchor-link-title { color: ${p} !important; }

/* ── Steps ── */
.ant-steps-item-process .ant-steps-item-icon {
  background: ${p} !important;
  border-color: ${p} !important;
}
.ant-steps-item-finish .ant-steps-item-icon { border-color: ${p} !important; }
.ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon { color: ${p} !important; }
.ant-steps-item-finish > .ant-steps-item-container > .ant-steps-item-tail::after {
  background-color: ${p} !important;
}

/* ── Transfer ── */
.ant-transfer-list-search:focus { border-color: ${hv} !important; }

/* ── Slider ── */
.ant-slider-track { background-color: ${hv} !important; }
.ant-slider-handle { border-color: ${hv} !important; }
.ant-slider-handle:focus { border-color: ${hv} !important; box-shadow: 0 0 0 5px ${sh} !important; }
.ant-slider:hover .ant-slider-track { background-color: ${p} !important; }
.ant-slider:hover .ant-slider-handle:not(.ant-tooltip-open) { border-color: ${p} !important; }
`;
  }
}
