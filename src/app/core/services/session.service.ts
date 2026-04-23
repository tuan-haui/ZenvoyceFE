import { Injectable } from '@angular/core';

const AUTH_KEY = 'zenvoyce.authenticated';
const USER_KEY = 'zenvoyce.username';
const TOKEN_KEY = 'zenvoyce.access_token';

@Injectable({ providedIn: 'root' })
export class SessionService {
  isAuthenticated(): boolean {
    return localStorage.getItem(AUTH_KEY) === '1';
  }

  saveLogin(username: string, token?: string): void {
    localStorage.setItem(AUTH_KEY, '1');
    localStorage.setItem(USER_KEY, username);
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  clear(): void {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  getUsername(): string {
    return localStorage.getItem(USER_KEY) ?? 'Admin';
  }

  getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
