import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../services/app.service';
import { SessionService } from '../services/session.service';

/** So khớp URL với base API (cùng nguồn với Client / InvoiceFacade). */
function requestTargetsApi(reqUrl: string, apiBase: string): boolean {
  const base = apiBase.replace(/\/$/, '');
  if (!base) return false;
  return reqUrl.startsWith(base);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const apiBaseRaw = inject(API_BASE_URL, { optional: true });
  const apiBase = typeof apiBaseRaw === 'string' ? apiBaseRaw : '';

  const raw = sessionService.getAccessToken()?.trim() ?? '';
  const token = raw.replace(/^Bearer\s+/i, '').trim();

  if (!token || !requestTargetsApi(req.url, apiBase)) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
