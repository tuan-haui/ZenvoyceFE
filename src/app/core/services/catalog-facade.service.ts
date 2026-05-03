import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  ChangeCompanyStatusRequest,
  Client,
  CreateCompanyCommand,
  CreateCustomerCommand,
  CreateProductCommand,
  UpdateCompanyCommand,
  UpdateCustomerCommand,
  UpdateProductCommand
} from './app.service';

@Injectable({ providedIn: 'root' })
export class CatalogFacadeService {
  constructor(private readonly client: Client) {}

  getCompanies(): Observable<void> {
    return this.client.companiesGET().pipe(map(() => void 0));
  }

  createCompany(payload: CreateCompanyCommand): Observable<void> {
    return this.client.companiesPOST(payload).pipe(map(() => void 0));
  }

  updateCompany(id: string, payload: UpdateCompanyCommand): Observable<void> {
    return this.client.companiesPUT(id, payload).pipe(map(() => void 0));
  }

  changeCompanyStatus(id: string, status: number): Observable<void> {
    return this.client.status(id, new ChangeCompanyStatusRequest({ trangthai: status })).pipe(map(() => void 0));
  }

  getCustomers(companyId: string, keyword = ''): Observable<void> {
    return this.client.customersGET(companyId, keyword).pipe(map(() => void 0));
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

  getProducts(companyId: string, keyword = ''): Observable<void> {
    return this.client.productsGET(companyId, keyword).pipe(map(() => void 0));
  }

  createProduct(payload: CreateProductCommand): Observable<void> {
    return this.client.productsPOST(payload).pipe(map(() => void 0));
  }

  updateProduct(id: string, payload: UpdateProductCommand): Observable<void> {
    return this.client.productsPUT(id, payload).pipe(map(() => void 0));
  }

  deleteProduct(id: string): Observable<void> {
    return this.client.productsDELETE(id).pipe(map(() => void 0));
  }
}
