import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { NavigationService } from '../services/navigation.service';

/** Nạp sidebar nếu cần, rồi so khớp route với quyền menu. */
export const permissionGuard: CanActivateFn = () => {
  const nav = inject(NavigationService);
  const router = inject(Router);
  const allow = (url: string) => (nav.canAccessPath(url) ? true : router.createUrlTree(['/admin/dashboard']));

  if (nav.loaded()) {
    return allow(router.url);
  }

  return nav.refresh().pipe(map(() => allow(router.url)));
};
