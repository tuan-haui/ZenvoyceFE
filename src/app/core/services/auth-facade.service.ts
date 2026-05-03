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
  ) {}

  login(username: string, password: string, remember = true): Observable<void> {
    return this.client.login(new LoginCommand({ username, password })).pipe(
      map((env) => env.data),
      tap((res) => {
        if (!res) return;
        this.sessionService.saveLogin(
          username,
          res.token,
          res.userInfo ?? undefined,
          res.expiredAt,
          remember
        );
      }),
      switchMap(() => this.navigation.refresh().pipe(catchError(() => of(null)))),
      map(() => void 0)
    );
  }

  logout(): Observable<void> {
    return this.client.logout().pipe(
      tap(() => this.sessionService.clear()),
      map(() => void 0)
    );
  }
}
