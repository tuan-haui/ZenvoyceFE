import { Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Client, LoginCommand } from './app.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  constructor(
    private readonly client: Client,
    private readonly sessionService: SessionService
  ) {}

  login(username: string, password: string): Observable<void> {
    return this.client.login(new LoginCommand({ username, password })).pipe(
      tap((res) => this.sessionService.saveLogin(username, res?.token)),
      map(() => void 0)
    );
  }

  logout(): Observable<void> {
    return this.client.logout().pipe(tap(() => this.sessionService.clear()));
  }
}
