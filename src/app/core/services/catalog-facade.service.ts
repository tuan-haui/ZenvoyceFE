import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
    return this.client.companiesGET();
  }

  createCompany(payload: CreateCompanyCommand): Observable<void> {
    return this.client.companiesPOST(payload);
  }

  updateCompany(id: string, payload: UpdateCompanyCommand): Observable<void> {
    return this.client.companiesPUT(id, payload);
  }

  changeCompanyStatus(id: string, status: number): Observable<void> {
    return this.client.status(id, new ChangeCompanyStatusRequest({ trangthai: status }));
  }

  getCustomers(companyId: string, keyword = ''): Observable<void> {
    return this.client.customersGET(companyId, keyword);
  }

  createCustomer(payload: CreateCustomerCommand): Observable<void> {
    return this.client.customersPOST(payload);
  }

  updateCustomer(id: string, payload: UpdateCustomerCommand): Observable<void> {
    return this.client.customersPUT(id, payload);
  }

  deleteCustomer(id: string): Observable<void> {
    return this.client.customersDELETE(id);
  }

  getProducts(companyId: string, keyword = ''): Observable<void> {
    return this.client.productsGET(companyId, keyword);
  }

  createProduct(payload: CreateProductCommand): Observable<void> {
    return this.client.productsPOST(payload);
  }

  updateProduct(id: string, payload: UpdateProductCommand): Observable<void> {
    return this.client.productsPUT(id, payload);
  }

  deleteProduct(id: string): Observable<void> {
    return this.client.productsDELETE(id);
  }
}
