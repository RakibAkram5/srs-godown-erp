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

export const BIKES = ['Honda', 'Sohrab', 'MCR', 'Deluxe', 'Leader', 'Qingqi'] as const;
export type Bike = (typeof BIKES)[number];

export interface Product {
  id: string;
  codeNo: number;
  name: string;
  productCode: string | null;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  description: string | null;
  categoryId: string | null;
  brandId: string | null;
  unitId: string | null;
  categoryName: string | null;
  brandName: string | null;
  unitName: string | null;
  warehouse: string | null;
  rack: string | null;
  shelf: string | null;
  bikes: string[];
  purchasePrice: number;
  salePrice: number;
  openingStock: number;
  minimumStock: number;
  currentStock: number;
  isLowStock: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResult {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface ImportSummary {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
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
