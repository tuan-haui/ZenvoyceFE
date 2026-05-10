import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApplyTemplateCommand, BaseTemplateDto, Client, CompanyTemplateDto, CreateBaseTemplateCommand, UpdateBaseTemplateCommand } from './app.service';

export interface BaseTemplateVm {
  id: string;
  tenmau: string;
  loaihoadon: string;
  kyhieu: string;
  htmlContent: string;
  cssContent: string;
  version?: string;
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

@Injectable({ providedIn: 'root' })
export class TemplateFacadeService {
  constructor(private readonly client: Client) {}

  getBaseTemplates(): Observable<BaseTemplateVm[]> {
    return this.client.baseGET().pipe(map((res) => (res.data ?? []).map((d) => this.mapBaseTemplate(d))));
  }

  getBaseTemplateById(id: string): Observable<BaseTemplateVm> {
    return this.client.baseGET2(id).pipe(map((res) => this.mapBaseTemplate(res.data!)));
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

  createBaseTemplate(payload: CreateBaseTemplateCommand): Observable<BaseTemplateVm> {
    return this.client.basePOST(payload).pipe(map((res) => this.mapBaseTemplate(res.data!)));
  }

  updateBaseTemplate(id: string, payload: UpdateBaseTemplateCommand): Observable<BaseTemplateVm> {
    return this.client.basePUT(id, payload).pipe(map((res) => this.mapBaseTemplate(res.data!)));
  }

  deleteBaseTemplate(id: string): Observable<void> {
    return this.client.baseDELETE(id).pipe(map(() => void 0));
  }

  notifyTax(id: string): Observable<void> {
    return this.client.notifyTax(id).pipe(map(() => void 0));
  }

  cancel(id: string): Observable<void> {
    return this.client.cancel2(id).pipe(map(() => void 0));
  }

  private mapBaseTemplate(d: BaseTemplateDto): BaseTemplateVm {
    return {
      id: d.id ?? '',
      tenmau: d.tenmau ?? '',
      loaihoadon: d.loaihoadon ?? '',
      kyhieu: d.kyhieu ?? '',
      htmlContent: d.htmlContent ?? '',
      cssContent: d.cssContent ?? '',
      version: d.version ?? undefined
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
