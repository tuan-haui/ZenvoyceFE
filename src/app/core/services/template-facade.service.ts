import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApplyTemplateCommand, Client } from './app.service';

export interface BaseTemplateVm {
  id: string;
  tenmau: string;
  loaihoadon: string;
  kyhieu: string;
  thumbnail: 'classic' | 'modern' | 'compact';
}

export interface CompanyTemplateVm {
  id: string;
  maugocid: string;
  tenmaugoc: string;
  kyhieu: string;
  loaihoadon: string;
  trangthaiPhatHanh: number;
  lamaumacdinh: boolean;
  ngaykichhoat: string;
}

// Hardcoded base templates — backend has no GET /api/templates/base
const BASE_TEMPLATES: BaseTemplateVm[] = [
  { id: 'base-1', tenmau: 'Classic Professional', loaihoadon: 'GTGT', kyhieu: '1C26TAA', thumbnail: 'classic' },
  { id: 'base-2', tenmau: 'Modern Minimal', loaihoadon: 'GTGT', kyhieu: '1C26TAB', thumbnail: 'modern' },
  { id: 'base-3', tenmau: 'Compact Standard', loaihoadon: 'Bán hàng', kyhieu: '2C26TAA', thumbnail: 'compact' }
];

@Injectable({ providedIn: 'root' })
export class TemplateFacadeService {
  constructor(private readonly client: Client) {}

  /** Hardcoded — no GET /api/templates/base endpoint in generated Client */
  getBaseTemplates(): Observable<BaseTemplateVm[]> {
    return of(BASE_TEMPLATES);
  }

  /** UC12 — GET /api/templates/company */
  getCompanyTemplates(
    donviId: string,
    kyhieuMau?: string,
    loaiHoadon?: string,
    trangthaiPhatHanh?: number
  ): Observable<void> {
    return this.client.company(donviId, kyhieuMau, loaiHoadon, trangthaiPhatHanh);
  }

  /** UC11 — POST /api/templates/company/apply */
  applyTemplate(payload: ApplyTemplateCommand): Observable<void> {
    return this.client.apply(payload);
  }

  /** UC13 — POST /api/templates/company/{id}/notify-tax */
  notifyTax(id: string): Observable<void> {
    return this.client.notifyTax(id);
  }
}
