export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';
export type Theme = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  role: Role;
  profileImage: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface LoginHistoryEntry {
  id: string;
  ipAddress: string | null;
  browser: string | null;
  device: string | null;
  os: string | null;
  status: string;
  loginAt: string;
  logoutAt: string | null;
}

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PROFILE_UPDATE';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  detail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface MasterRecord {
  id: string;
  name: string;
  description?: string | null;
  shortName?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Category = MasterRecord;
export type Brand = MasterRecord;
export type Unit = MasterRecord;

export interface Settings {
  id: string;
  companyName: string;
  companyLogo: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  language: string;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  details?: unknown;
}
