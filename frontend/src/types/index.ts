export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';
export type Theme = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLogin: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

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
