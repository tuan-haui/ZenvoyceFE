import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './app.service';

// --- Response DTOs ---
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

// --- Request DTOs ---
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

// --- Lookup DTOs ---
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

@Injectable({ providedIn: 'root' })
export class InvoiceFacadeService {
  private readonly base: string;

  constructor(
    private readonly http: HttpClient,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.base = baseUrl ?? '';
  }

  // ---- Invoice CRUD & actions ----

  getInvoices(filters?: InvoiceFilters): Observable<InvoiceListItemDto[]> {
    let params = new HttpParams();
    if (filters?.khachhangId) params = params.set('khachhangId', filters.khachhangId);
    if (filters?.trangthai) params = params.set('trangthai', filters.trangthai);
    if (filters?.tuNgay) params = params.set('tuNgay', filters.tuNgay.toISOString());
    if (filters?.denNgay) params = params.set('denNgay', filters.denNgay.toISOString());

    return this.http.get<InvoiceListItemDto[]>(`${this.base}/api/invoices`, {
      params,
      withCredentials: true
    });
  }

  createInvoice(payload: CreateInvoicePayload): Observable<CreateInvoiceResultDto> {
    return this.http.post<CreateInvoiceResultDto>(`${this.base}/api/invoices`, payload, {
      withCredentials: true
    });
  }

  forwardInvoice(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/api/invoices/${id}/forward`, {}, {
      withCredentials: true
    });
  }

  signInvoice(id: string): Observable<{ id: string; trangthai: string; xmlDaKy: string }> {
    return this.http.post<{ id: string; trangthai: string; xmlDaKy: string }>(
      `${this.base}/api/invoices/${id}/sign`, {}, { withCredentials: true }
    );
  }

  publishInvoice(id: string): Observable<{ id: string; trangthai: string; soHoadon: string }> {
    return this.http.post<{ id: string; trangthai: string; soHoadon: string }>(
      `${this.base}/api/invoices/${id}/publish`, {}, { withCredentials: true }
    );
  }

  cancelInvoice(id: string, lyDo: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/api/invoices/${id}/cancel`, { lyDo }, { withCredentials: true }
    );
  }

  getInvoiceHistory(id: string): Observable<InvoiceHistoryItemDto[]> {
    return this.http.get<InvoiceHistoryItemDto[]>(`${this.base}/api/invoices/${id}/history`, {
      withCredentials: true
    });
  }

  sendInvoiceEmail(id: string): Observable<{ sent: boolean; message: string }> {
    return this.http.post<{ sent: boolean; message: string }>(
      `${this.base}/api/invoices/${id}/send-email`,
      {},
      { withCredentials: true }
    );
  }

  createAdjustmentInvoice(sourceId: string, payload: CreateInvoicePayload): Observable<CreateInvoiceResultDto> {
    const body = {
      ...payload,
      ngaylap: payload.ngaylap
    };
    return this.http.post<CreateInvoiceResultDto>(
      `${this.base}/api/invoices/${sourceId}/adjust`,
      body,
      { withCredentials: true }
    );
  }

  getSalesReport(filters?: { donviId?: string; khachhangId?: string; tuNgay?: Date; denNgay?: Date }): Observable<SalesReportRowDto[]> {
    let params = new HttpParams();
    if (filters?.donviId) params = params.set('donviId', filters.donviId);
    if (filters?.khachhangId) params = params.set('khachhangId', filters.khachhangId);
    if (filters?.tuNgay) params = params.set('tuNgay', filters.tuNgay.toISOString());
    if (filters?.denNgay) params = params.set('denNgay', filters.denNgay.toISOString());
    return this.http.get<SalesReportRowDto[]>(`${this.base}/api/invoices/reports/sales`, {
      params,
      withCredentials: true
    });
  }

  // ---- Lookup data for create form ----

  getCompanies(): Observable<CompanyDto[]> {
    return this.http.get<CompanyDto[]>(`${this.base}/api/companies`, { withCredentials: true });
  }

  getCustomers(donviId: string, keyword = ''): Observable<CustomerDto[]> {
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<CustomerDto[]>(`${this.base}/api/companies/${donviId}/customers`, {
      params,
      withCredentials: true
    });
  }

  getProducts(donviId: string): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>(`${this.base}/api/companies/${donviId}/products`, {
      withCredentials: true
    });
  }

  getTemplates(donviId: string): Observable<TemplateDto[]> {
    const params = new HttpParams().set('donviId', donviId);
    return this.http.get<TemplateDto[]>(`${this.base}/api/templates/company`, {
      params,
      withCredentials: true
    });
  }
}
