import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { NavigationService } from '../services/navigation.service';

/** Nạp sidebar nếu cần, rồi so khớp route với quyền menu. */
export const permissionGuard: CanActivateFn = (_route, state) => {
  const nav = inject(NavigationService);
  const router = inject(Router);
  // Dùng `state.url` (URL ĐÍCH) thay vì `router.url` (URL HIỆN TẠI - chưa commit khi guard chạy).
  const targetUrl = state.url;
  const allow = () =>
    nav.canAccessPath(targetUrl) ? true : router.createUrlTree(['/admin/dashboard']);

  if (nav.loaded()) {
    return allow();
  }

  return nav.refresh().pipe(map(() => allow()));
};
