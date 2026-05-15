import { Injectable } from '@angular/core';
import { decodeJwtPayload, JWT_CLAIMS } from '../utils/jwt-claims.util';
import { LoginUserInfoDto } from './app.service';

const AUTH_KEY = 'zenvoyce.authenticated';
const USER_KEY = 'zenvoyce.username';
const TOKEN_KEY = 'zenvoyce.access_token';
const USER_INFO_KEY = 'zenvoyce.user_info';
const EXPIRED_AT_KEY = 'zenvoyce.expired_at';

@Injectable({ providedIn: 'root' })
export class SessionService {
  isAuthenticated(): boolean {
    return this.getItem(AUTH_KEY) === '1';
  }

  saveLogin(
    username: string,
    token?: string,
    userInfo?: LoginUserInfoDto,
    expiredAt?: Date,
    remember = true
  ): void {
    this.clear();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(AUTH_KEY, '1');
    storage.setItem(USER_KEY, username);
    if (token) storage.setItem(TOKEN_KEY, token);
    if (userInfo) storage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    if (expiredAt) storage.setItem(EXPIRED_AT_KEY, expiredAt.toISOString());
  }

  clear(): void {
    [AUTH_KEY, USER_KEY, TOKEN_KEY, USER_INFO_KEY, EXPIRED_AT_KEY].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  }

  getUsername(): string {
    return this.getItem(USER_KEY) ?? 'Admin';
  }

  getAccessToken(): string | null {
    return this.getItem(TOKEN_KEY);
  }

  getUserInfo(): LoginUserInfoDto | null {
    const raw = this.getItem(USER_INFO_KEY);
    try {
      return raw ? (JSON.parse(raw) as LoginUserInfoDto) : null;
    } catch {
      return null;
    }
  }

  /** Đọc claim từ JWT (ưu tiên token, fallback userInfo đã lưu khi đăng nhập). */
  getTokenClaims() {
    return decodeJwtPayload(this.getAccessToken());
  }

  getCompanyId(): string | null {
    const claims = this.getTokenClaims();
    if (claims?.[JWT_CLAIMS.companyId]) return claims[JWT_CLAIMS.companyId]!;
    return this.getUserInfo()?.madonvi ?? null;
  }

  getRoleId(): string | null {
    const claims = this.getTokenClaims();
    if (claims?.[JWT_CLAIMS.roleId]) return claims[JWT_CLAIMS.roleId]!;
    return this.getUserInfo()?.quyenid ?? null;
  }

  getRoleName(): string | null {
    const claims = this.getTokenClaims();
    if (claims?.[JWT_CLAIMS.roleName]) return claims[JWT_CLAIMS.roleName]!;
    return this.getUserInfo()?.tenquyen ?? null;
  }

  getDisplayName(): string {
    const claims = this.getTokenClaims();
    return (
      claims?.[JWT_CLAIMS.name] ??
      this.getUserInfo()?.hoten ??
      claims?.[JWT_CLAIMS.username] ??
      claims?.[JWT_CLAIMS.uniqueName] ??
      this.getUsername()
    );
  }

  isTokenExpired(): boolean {
    const raw = this.getItem(EXPIRED_AT_KEY);
    if (!raw) return false;
    return new Date(raw) < new Date();
  }

  private getItem(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }
}
