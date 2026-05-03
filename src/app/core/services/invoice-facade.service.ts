import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from './app.service';
import { ZenvoyceApiEnvelope } from '../http/api-envelope';

export interface InvoiceListItemDto {
  id: string;
  donviId: string;
  khachhangId: string;
  mauctyId: string;
  kyhieu?: string;
  sohoadon?: string;
  ngaylap: string;
  tongtien: number;
  tienthue: number;
  tongthanhtoan: number;
  trangthai: string;
}

export interface CreateInvoiceResultDto {
  id: string;
  trangthai: string;
  tongtien: number;
  tienthue: number;
  tongthanhtoan: number;
}

export interface InvoiceHistoryItemDto {
  id: string;
  hoadonId: string;
  hanhdong: string;
  trangthaicu?: string;
  trangthaimoi?: string;
  thoigian: string;
  nguoidungId?: string;
}

export interface InvoiceLineRequestDto {
  hanghoaId: string;
  soluong: number;
  dongia: number;
  thueSuat: number;
}

export interface CreateInvoicePayload {
  donviId: string;
  khachhangId: string;
  mauctyId: string;
  kyhieu?: string;
  ngaylap: string;
  hanghoas: InvoiceLineRequestDto[];
  thamChieuHoadonId?: string;
}

export interface CompanyDto {
  id: string;
  tendonvi?: string;
  masothue?: string;
  trangthai?: number;
}

export interface CustomerDto {
  id: string;
  donviid?: string;
  tenkhachhang?: string;
  masothue?: string;
  email?: string;
  dienthoai?: string;
}

export interface ProductDto {
  id: string;
  donviid?: string;
  tenhanghoa?: string;
  mahang?: string;
  donvitinh?: string;
  dongia: number;
  thuesuat?: number;
}

export interface TemplateDto {
  id: string;
  donviId?: string;
  kyhieuMau?: string;
  loaiHoadon?: string;
  trangthaiPhatHanh?: number;
}

export interface InvoiceFilters {
  khachhangId?: string;
  trangthai?: string;
  tuNgay?: Date;
  denNgay?: Date;
}

export interface SalesReportRowDto {
  khachhangId: string;
  tenKhachHang: string;
  soHoaDon: number;
  tongTienHang: number;
  tienThue: number;
  tongThanhToan: number;
}

export interface StringMessageDto {
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class InvoiceFacadeService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.base = baseUrl ?? '';
  }

  getInvoices(filters?: InvoiceFilters): Observable<InvoiceListItemDto[]> {
    let params = new HttpParams();
    if (filters?.khachhangId) params = params.set('khachhangId', filters.khachhangId);
    if (filters?.trangthai) params = params.set('trangthai', filters.trangthai);
    if (filters?.tuNgay) params = params.set('tuNgay', filters.tuNgay.toISOString());
    if (filters?.denNgay) params = params.set('denNgay', filters.denNgay.toISOString());

    return this.http
      .get<ZenvoyceApiEnvelope<InvoiceListItemDto[]>>(`${this.base}/api/invoices`, {
        params,
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? []));
  }

  createInvoice(payload: CreateInvoicePayload): Observable<CreateInvoiceResultDto> {
    return this.http
      .post<ZenvoyceApiEnvelope<CreateInvoiceResultDto>>(`${this.base}/api/invoices`, payload, {
        withCredentials: true
      })
      .pipe(map((e) => e.data!));
  }

  forwardInvoice(id: string): Observable<StringMessageDto> {
    return this.http
      .post<ZenvoyceApiEnvelope<StringMessageDto>>(`${this.base}/api/invoices/${id}/forward`, {}, {
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? {}));
  }

  signInvoice(id: string): Observable<{ id: string; trangthai: string; xmlDaKy: string }> {
    return this.http
      .post<
        ZenvoyceApiEnvelope<{ id: string; trangthai: string; xmlDaKy: string }>
      >(`${this.base}/api/invoices/${id}/sign`, {}, { withCredentials: true })
      .pipe(map((e) => e.data!));
  }

  publishInvoice(id: string): Observable<{ id: string; trangthai: string; soHoadon: string }> {
    return this.http
      .post<
        ZenvoyceApiEnvelope<{ id: string; trangthai: string; soHoadon: string }>
      >(`${this.base}/api/invoices/${id}/publish`, {}, { withCredentials: true })
      .pipe(map((e) => e.data!));
  }

  cancelInvoice(id: string, lyDo: string): Observable<StringMessageDto> {
    return this.http
      .post<ZenvoyceApiEnvelope<StringMessageDto>>(
        `${this.base}/api/invoices/${id}/cancel`,
        { lyDo },
        { withCredentials: true }
      )
      .pipe(map((e) => e.data ?? {}));
  }

  getInvoiceHistory(id: string): Observable<InvoiceHistoryItemDto[]> {
    return this.http
      .get<ZenvoyceApiEnvelope<InvoiceHistoryItemDto[]>>(`${this.base}/api/invoices/${id}/history`, {
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? []));
  }

  sendInvoiceEmail(id: string): Observable<{ sent: boolean; message: string }> {
    return this.http
      .post<ZenvoyceApiEnvelope<{ sent: boolean; message: string }>>(
        `${this.base}/api/invoices/${id}/send-email`,
        {},
        { withCredentials: true }
      )
      .pipe(map((e) => e.data!));
  }

  createAdjustmentInvoice(sourceId: string, payload: CreateInvoicePayload): Observable<CreateInvoiceResultDto> {
    const body = {
      ...payload,
      ngaylap: payload.ngaylap
    };
    return this.http
      .post<ZenvoyceApiEnvelope<CreateInvoiceResultDto>>(
        `${this.base}/api/invoices/${sourceId}/adjust`,
        body,
        { withCredentials: true }
      )
      .pipe(map((e) => e.data!));
  }

  getSalesReport(filters?: {
    donviId?: string;
    khachhangId?: string;
    tuNgay?: Date;
    denNgay?: Date;
  }): Observable<SalesReportRowDto[]> {
    let params = new HttpParams();
    if (filters?.donviId) params = params.set('donviId', filters.donviId);
    if (filters?.khachhangId) params = params.set('khachhangId', filters.khachhangId);
    if (filters?.tuNgay) params = params.set('tuNgay', filters.tuNgay.toISOString());
    if (filters?.denNgay) params = params.set('denNgay', filters.denNgay.toISOString());
    return this.http
      .get<ZenvoyceApiEnvelope<SalesReportRowDto[]>>(`${this.base}/api/invoices/reports/sales`, {
        params,
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? []));
  }

  getCompanies(): Observable<CompanyDto[]> {
    return this.http
      .get<ZenvoyceApiEnvelope<CompanyDto[]>>(`${this.base}/api/companies`, { withCredentials: true })
      .pipe(map((e) => e.data ?? []));
  }

  getCustomers(donviId: string, keyword = ''): Observable<CustomerDto[]> {
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    return this.http
      .get<ZenvoyceApiEnvelope<CustomerDto[]>>(`${this.base}/api/companies/${donviId}/customers`, {
        params,
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? []));
  }

  getProducts(donviId: string): Observable<ProductDto[]> {
    return this.http
      .get<ZenvoyceApiEnvelope<ProductDto[]>>(`${this.base}/api/companies/${donviId}/products`, {
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? []));
  }

  getTemplates(donviId: string): Observable<TemplateDto[]> {
    const params = new HttpParams().set('donviId', donviId);
    return this.http
      .get<ZenvoyceApiEnvelope<TemplateDto[]>>(`${this.base}/api/templates/company`, {
        params,
        withCredentials: true
      })
      .pipe(map((e) => e.data ?? []));
  }
}
