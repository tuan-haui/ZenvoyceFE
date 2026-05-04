import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { VietQrBankDto, VietQrBanksApiResponse } from '../models/vietqr-bank.models';

const VIETQR_BANKS_URL = 'https://api.vietqr.io/v2/banks';

@Injectable({ providedIn: 'root' })
export class VietQrBankService {
  private readonly http = inject(HttpClient);

  /** Danh sách ngân hàng (BIN làm định danh lưu trữ). */
  getBanks(): Observable<VietQrBankDto[]> {
    return this.http.get<VietQrBanksApiResponse>(VIETQR_BANKS_URL).pipe(
      map((res) => {
        if (res.code !== '00' || !Array.isArray(res.data)) {
          return [];
        }
        return [...res.data].sort((a, b) =>
          this.sortKey(a).localeCompare(this.sortKey(b), 'vi')
        );
      })
    );
  }

  private sortKey(b: VietQrBankDto): string {
    return (b.shortName || b.short_name || b.code || '').trim();
  }
}
