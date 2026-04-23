import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  constructor(private readonly message: NzMessageService) {}

  show(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.'): void {
    const text = error instanceof Error ? error.message : fallback;
    this.message.error(text);
  }
}
