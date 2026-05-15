/** Tên claim JWT — đồng bộ với Zenvoyce.Domain.Constants.JwtClaimTypes */
export const JWT_CLAIMS = {
  companyId: 'company_id',
  roleId: 'role_id',
  roleName: 'role_name',
  username: 'username',
  sub: 'sub',
  name: 'name',
  email: 'email',
  uniqueName: 'unique_name',
} as const;

export interface JwtPayloadClaims {
  sub?: string;
  company_id?: string;
  role_id?: string;
  role_name?: string;
  username?: string;
  unique_name?: string;
  name?: string;
  email?: string;
  exp?: number;
}

export function decodeJwtPayload(token: string | null | undefined): JwtPayloadClaims | null {
  if (!token?.trim()) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayloadClaims;
  } catch {
    return null;
  }
}
