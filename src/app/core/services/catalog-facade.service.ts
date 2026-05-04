import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  ChangeCompanyStatusRequest,
  Client,
  CompanyDto,
  CreateCompanyCommand,
  CreateCustomerCommand,
  CreateProductCommand,
  CustomerDto,
  ProductDto,
  UpdateCompanyCommand,
  UpdateCustomerCommand,
  UpdateProductCommand
} from './app.service';

@Injectable({ providedIn: 'root' })
export class CatalogFacadeService {
  constructor(private readonly client: Client) { }

  getCompanies(): Observable<CompanyDto[]> {
    return this.client.companiesGET().pipe(map((r) => r.data ?? []));
  }

  createCompany(payload: CreateCompanyCommand): Observable<CompanyDto> {
    return this.client.companiesPOST(payload).pipe(map((r) => r.data!));
  }

  updateCompany(id: string, payload: UpdateCompanyCommand): Observable<CompanyDto> {
    return this.client.companiesPUT(id, payload).pipe(map((r) => r.data!));
  }

  changeCompanyStatus(id: string, status: number): Observable<CompanyDto> {
    return this.client.status(id, new ChangeCompanyStatusRequest({ trangthai: status })).pipe(map((r) => r.data!));
  }

  getCustomers(companyId: string, keyword = ''): Observable<CustomerDto[]> {
    return this.client.getCustomerByCompany(companyId, keyword || undefined).pipe(map((r) => r.data ?? []));
  }

  createCustomer(payload: CreateCustomerCommand): Observable<void> {
    return this.client.customersPOST(payload).pipe(map(() => void 0));
  }

  updateCustomer(id: string, payload: UpdateCustomerCommand): Observable<void> {
    return this.client.customersPUT(id, payload).pipe(map(() => void 0));
  }

  deleteCustomer(id: string): Observable<void> {
    return this.client.customersDELETE(id).pipe(map(() => void 0));
  }

  getProducts(companyId: string, keyword = ''): Observable<ProductDto[]> {
    return this.client.products(companyId, keyword || undefined).pipe(map((r) => r.data ?? []));
  }

  createProduct(payload: CreateProductCommand): Observable<ProductDto> {
    return this.client.productsPOST(payload).pipe(map((r) => r.data!));
  }

  updateProduct(id: string, payload: UpdateProductCommand): Observable<ProductDto> {
    return this.client.productsPUT(id, payload).pipe(map((r) => r.data!));
  }

  deleteProduct(id: string): Observable<void> {
    return this.client.productsDELETE(id).pipe(map(() => void 0));
  }
}
