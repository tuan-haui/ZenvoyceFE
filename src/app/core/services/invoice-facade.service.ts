import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  API_BASE_URL,
  CancelInvoiceRequest,
  Client,
  CompanyDto as ApiCompanyDto,
  CreateInvoiceCommand,
  CreateInvoiceResultDto as ApiCreateInvoiceResultDto,
  CustomerDto as ApiCustomerDto,
  InvoiceHistoryItemDto as ApiInvoiceHistoryItemDto,
  InvoiceListItemDto as ApiInvoiceListItemDto,
  ProductDto as ApiProductDto
} from './app.service';

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
  tenKhachhang?: string;
  maSoThueKhachhang?: string;
  emailKhachhang?: string;
  tenDonvi?: string;
  tenMau?: string;
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
  private readonly apiBaseUrl: string;

  constructor(
    private readonly client: Client,
    private readonly http: HttpClient,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.apiBaseUrl = baseUrl ?? '';
  }

  getInvoices(filters?: InvoiceFilters): Observable<InvoiceListItemDto[]> {
    return this.client
      .invoicesGET(filters?.khachhangId, filters?.trangthai, filters?.tuNgay, filters?.denNgay)
      .pipe(map((res) => (res.data ?? []).map((x) => this.mapInvoiceListItem(x))));
  }

  createInvoice(payload: CreateInvoicePayload): Observable<CreateInvoiceResultDto> {
    return this.client
      .invoicesPOST(this.toCreateCommand(payload))
      .pipe(map((res) => this.mapCreateResult(res.data)));
  }

  forwardInvoice(id: string): Observable<StringMessageDto> {
    return this.client.forward(id).pipe(map((res) => ({ message: res.data?.message })));
  }

  signInvoice(id: string): Observable<{ id: string; trangthai: string; xmlDaKy: string }> {
    return this.client.sign(id).pipe(
      map((res) => ({
        id: res.data?.id ?? '',
        trangthai: res.data?.trangthai ?? '',
        xmlDaKy: res.data?.xmlDaKy ?? ''
      }))
    );
  }

  publishInvoice(id: string): Observable<{ id: string; trangthai: string; soHoadon: string }> {
    return this.client.publish(id).pipe(
      map((res) => ({
        id: res.data?.id ?? '',
        trangthai: res.data?.trangthai ?? '',
        soHoadon: res.data?.soHoadon ?? ''
      }))
    );
  }

  cancelInvoice(id: string, lyDo: string): Observable<StringMessageDto> {
    return this.client
      .cancel(id, new CancelInvoiceRequest({ lyDo }))
      .pipe(map((res) => ({ message: res.data?.message })));
  }

  getInvoiceHistory(id: string): Observable<InvoiceHistoryItemDto[]> {
    return this.client.history(id).pipe(map((res) => (res.data ?? []).map((x) => this.mapHistoryItem(x))));
  }

  previewInvoicePdf(id: string): Observable<Blob> {
    const url = `${this.apiBaseUrl}/api/Invoices/${encodeURIComponent(id)}/preview-pdf`;
    return this.http.get(url, {
      responseType: 'blob',
      withCredentials: true
    });
  }

  previewInvoicePdfFromData(payload: CreateInvoicePayload): Observable<Blob> {
    const url = `${this.apiBaseUrl}/api/Invoices/preview-pdf-from-data`;
    return this.http.post(url, this.toCreateCommand(payload), {
      responseType: 'blob',
      withCredentials: true
    });
  }

  sendInvoiceEmail(id: string): Observable<{ sent: boolean; message: string }> {
    return this.client.sendEmail(id).pipe(
      map((res) => ({
        sent: res.data?.sent ?? false,
        message: res.data?.message ?? ''
      }))
    );
  }

  createAdjustmentInvoice(sourceId: string, payload: CreateInvoicePayload): Observable<CreateInvoiceResultDto> {
    return this.client.adjust(sourceId, this.toCreateCommand(payload)).pipe(map((res) => this.mapCreateResult(res.data)));
  }

  getSalesReport(filters?: {
    donviId?: string;
    khachhangId?: string;
    tuNgay?: Date;
    denNgay?: Date;
  }): Observable<SalesReportRowDto[]> {
    return this.client
      .sales(filters?.donviId, filters?.khachhangId, filters?.tuNgay, filters?.denNgay)
      .pipe(
        map((res) =>
          (res.data ?? []).map((r) => ({
            khachhangId: r.khachhangId ?? '',
            tenKhachHang: r.tenKhachHang ?? '',
            soHoaDon: r.soHoaDon ?? 0,
            tongTienHang: r.tongTienHang ?? 0,
            tienThue: r.tienThue ?? 0,
            tongThanhToan: r.tongThanhToan ?? 0
          }))
        )
      );
  }

  getCompanies(): Observable<CompanyDto[]> {
    return this.client.companiesGET().pipe(map((res) => (res.data ?? []).map((x) => this.mapCompany(x))));
  }

  getCustomers(donviId: string, keyword = ''): Observable<CustomerDto[]> {
    return this.client
      .getCustomerByCompany(donviId, keyword || undefined)
      .pipe(map((res) => (res.data ?? []).map((x) => this.mapCustomer(x))));
  }

  getProducts(donviId: string): Observable<ProductDto[]> {
    return this.client.products(donviId, undefined).pipe(map((res) => (res.data ?? []).map((x) => this.mapProduct(x))));
  }

  getTemplates(donviId: string): Observable<TemplateDto[]> {
    return this.client.company(donviId, undefined, undefined, undefined).pipe(
      map((e) =>
        (e.data ?? []).map((row) => ({
          id: row.id ?? '',
          donviId,
          kyhieuMau: row.kyhieu,
          loaiHoadon: row.loaihoadon,
          trangthaiPhatHanh: row.trangthaiphathanh
        }))
      )
    );
  }

  private toCreateCommand(payload: CreateInvoicePayload): CreateInvoiceCommand {
    return CreateInvoiceCommand.fromJS({
      donviId: payload.donviId,
      khachhangId: payload.khachhangId,
      mauctyId: payload.mauctyId,
      ngaylap: payload.ngaylap,
      hanghoas: payload.hanghoas,
      thamChieuHoadonId: payload.thamChieuHoadonId
    });
  }

  private mapCreateResult(d: ApiCreateInvoiceResultDto | undefined): CreateInvoiceResultDto {
    return {
      id: d?.id ?? '',
      trangthai: d?.trangthai ?? '',
      tongtien: d?.tongtien ?? 0,
      tienthue: d?.tienthue ?? 0,
      tongthanhtoan: d?.tongthanhtoan ?? 0
    };
  }

  private mapInvoiceListItem(x: ApiInvoiceListItemDto): InvoiceListItemDto {
    return {
      id: x.id ?? '',
      donviId: x.donviId ?? '',
      khachhangId: x.khachhangId ?? '',
      mauctyId: x.mauctyId ?? '',
      kyhieu: x.kyhieu,
      sohoadon: x.sohoadon,
      ngaylap: x.ngaylap ? x.ngaylap.toISOString() : '',
      tongtien: x.tongtien ?? 0,
      tienthue: x.tienthue ?? 0,
      tongthanhtoan: x.tongthanhtoan ?? 0,
      trangthai: x.trangthai ?? '',
      tenKhachhang: x.tenKhachhang,
      maSoThueKhachhang: x.maSoThueKhachhang,
      emailKhachhang: x.emailKhachhang,
      tenDonvi: x.tenDonvi,
      tenMau: x.tenMau
    };
  }

  private mapHistoryItem(x: ApiInvoiceHistoryItemDto): InvoiceHistoryItemDto {
    return {
      id: x.id ?? '',
      hoadonId: x.hoadonId ?? '',
      hanhdong: x.hanhdong ?? '',
      trangthaicu: x.trangthaiCu,
      trangthaimoi: x.trangthaiMoi,
      thoigian: x.thoigian ? x.thoigian.toISOString() : '',
      nguoidungId: x.nguoidungId
    };
  }

  private mapCompany(x: ApiCompanyDto): CompanyDto {
    return {
      id: x.id ?? '',
      tendonvi: x.tendonvi,
      masothue: x.masothue,
      trangthai: x.trangthai
    };
  }

  private mapCustomer(x: ApiCustomerDto): CustomerDto {
    return {
      id: x.id ?? '',
      donviid: x.donviid,
      tenkhachhang: x.tenkhachhang,
      masothue: x.masothue,
      email: x.email,
      dienthoai: x.dienthoai
    };
  }

  private mapProduct(x: ApiProductDto): ProductDto {
    return {
      id: x.id ?? '',
      donviid: x.donviid,
      tenhanghoa: x.tenhanghoa,
      mahang: undefined,
      donvitinh: x.donvitinh,
      dongia: x.dongia ?? 0,
      thuesuat: undefined
    };
  }
}
