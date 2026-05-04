import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ApiException } from './app.service';

interface EnvelopeErrorBody {
  message?: string | null;
  title?: string | null;
  errors?: Record<string, string[] | null> | null;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  constructor(private readonly message: NzMessageService) {}

  show(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.'): void {
    this.message.error(this.extract(error, fallback));
  }

  extract(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.'): string {
    if (error instanceof ApiException) {
      try {
        const body = JSON.parse(error.response) as EnvelopeErrorBody;
        const firstError = this.firstFieldError(body?.errors);
        return body?.message || firstError || body?.title || fallback;
      } catch {
        return error.message || fallback;
      }
    }
    if (error instanceof Error) {
      return error.message || fallback;
    }
    return fallback;
  }

  private firstFieldError(errors: Record<string, string[] | null> | null | undefined): string | null {
    if (!errors) return null;
    for (const key of Object.keys(errors)) {
      const list = errors[key];
      if (Array.isArray(list) && list.length > 0 && list[0]) {
        return list[0];
      }
    }
    return null;
  }
}
