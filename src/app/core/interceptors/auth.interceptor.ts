import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../services/app.service';
import { SessionService } from '../services/session.service';

const ANONYMOUS_PATHS = ['/api/auth/login', '/api/auth/initialize-system'];

/** So khớp URL với base API (cùng nguồn với Client / InvoiceFacade). */
function requestTargetsApi(reqUrl: string, apiBase: string): boolean {
  const base = apiBase.replace(/\/$/, '');
  if (!base) return false;
  return reqUrl.startsWith(base);
}

function isAnonymousEndpoint(reqUrl: string): boolean {
  try {
    const path = new URL(reqUrl, window.location.origin).pathname.toLowerCase();
    return ANONYMOUS_PATHS.some((p) => path.endsWith(p));
  } catch {
    const lowered = reqUrl.toLowerCase();
    return ANONYMOUS_PATHS.some((p) => lowered.includes(p));
  }
}

let isHandling401 = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const apiBaseRaw = inject(API_BASE_URL, { optional: true });
  const apiBase = typeof apiBaseRaw === 'string' ? apiBaseRaw : '';
  const router = inject(Router);
  const modal = inject(NzModalService);

  const raw = sessionService.getAccessToken()?.trim() ?? '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();

  if (!token || !requestTargetsApi(req.url, apiBase) || isAnonymousEndpoint(req.url)) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq).pipe(
    catchError((error) => {
      if (error?.status === 401 && !isHandling401) {
        isHandling401 = true;
        sessionService.clear();
        modal.confirm({
          nzTitle: 'Phiên làm việc hết hạn',
          nzContent: 'Bạn đã hết phiên làm việc, Vui lòng đăng nhập lại',
          nzOkText: 'OK',
          nzCancelText: null,
          nzOnOk: () => {
            isHandling401 = false;
            router.navigate(['/auth/login']);
          },
          nzOnCancel: () => {
            isHandling401 = false;
          }
        });
      }
      return throwError(() => error);
    })
  );
};
