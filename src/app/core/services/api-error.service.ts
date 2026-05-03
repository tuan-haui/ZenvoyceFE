import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiException } from './app.service';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  constructor(private readonly message: NzMessageService) {}

  show(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.'): void {
    this.message.error(this.extract(error, fallback));
  }

  extract(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.'): string {
    if (error instanceof ApiException) {
      try {
        const body = JSON.parse(error.response) as { message?: string; title?: string };
        return body?.message ?? body?.title ?? fallback;
      } catch {
        return error.message || fallback;
      }
    }
    if (error instanceof Error) {
      return error.message || fallback;
    }
    return fallback;
  }
}
