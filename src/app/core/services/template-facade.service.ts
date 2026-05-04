import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApplyTemplateCommand, BaseTemplateDto, Client, CompanyTemplateDto } from './app.service';

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

const THUMBS: BaseTemplateVm['thumbnail'][] = ['classic', 'modern', 'compact'];

@Injectable({ providedIn: 'root' })
export class TemplateFacadeService {
  constructor(private readonly client: Client) {}

  getBaseTemplates(): Observable<BaseTemplateVm[]> {
    return this.client.baseGET().pipe(map((res) => (res.data ?? []).map((d) => this.mapBaseTemplate(d))));
  }

  getCompanyTemplates(
    donviId: string,
    kyhieuMau?: string,
    loaiHoadon?: string,
    trangthaiPhatHanh?: number
  ): Observable<CompanyTemplateVm[]> {
    return this.client
      .company(donviId, kyhieuMau, loaiHoadon, trangthaiPhatHanh)
      .pipe(map((res) => (res.data ?? []).map((x) => this.mapCompanyTemplate(x))));
  }

  applyTemplate(payload: ApplyTemplateCommand): Observable<void> {
    return this.client.apply(payload).pipe(map(() => void 0));
  }

  notifyTax(id: string): Observable<void> {
    return this.client.notifyTax(id).pipe(map(() => void 0));
  }

  private mapBaseTemplate(d: BaseTemplateDto): BaseTemplateVm {
    const id = d.id ?? '';
    let h = 0;
    for (let i = 0; i < id.length; i++) h += id.charCodeAt(i);
    return {
      id,
      tenmau: d.tenmau ?? '',
      loaihoadon: d.loaihoadon ?? '',
      kyhieu: d.kyhieu ?? '',
      thumbnail: THUMBS[h % THUMBS.length]!
    };
  }

  private mapCompanyTemplate(x: CompanyTemplateDto): CompanyTemplateVm {
    const ngay = x.ngaykichhoat;
    return {
      id: x.id ?? '',
      maugocid: x.maugocid ?? '',
      tenmaugoc: x.tenmaugoc ?? '',
      kyhieu: x.kyhieu ?? '',
      loaihoadon: x.loaihoadon ?? '',
      trangthaiPhatHanh: x.trangthaiphathanh ?? 0,
      lamaumacdinh: x.lamaumacdinh ?? false,
      ngaykichhoat: ngay ? ngay.toISOString().slice(0, 10) : ''
    };
  }
}
