import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { Client, LoginCommand } from './app.service';
import { NavigationService } from './navigation.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  constructor(
    private readonly client: Client,
    private readonly sessionService: SessionService,
    private readonly navigation: NavigationService
  ) { }

  login(username: string, password: string, remember = true): Observable<void> {
    return this.client.login(new LoginCommand({ username, password })).pipe(
      tap((res) =>
        this.sessionService.saveLogin(
          username,
          res?.token,
          res?.userInfo ?? undefined,
          res?.expiredAt,
          remember
        )
      ),
      // Đợi nạp menu xong rồi mới complete để guard navigate sau đó không bị race.
      // Nếu refresh lỗi, vẫn cho login thành công (NavigationService đã có fallback).
      switchMap(() => this.navigation.refresh().pipe(catchError(() => of(null)))),
      map(() => void 0)
    );
  }

  logout(): Observable<void> {
    return this.client.logout().pipe(tap(() => this.sessionService.clear()));
  }
}
