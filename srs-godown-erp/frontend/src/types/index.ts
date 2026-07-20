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

export type TaxType = 'NONE' | 'PERCENT' | 'FIXED';
export type PurchaseStatus = 'DRAFT' | 'COMPLETED';
export type StockMovementType =
  | 'PURCHASE_IN'
  | 'PURCHASE_RETURN_OUT'
  | 'SALE_OUT'
  | 'SALE_RETURN_IN'
  | 'ADJUSTMENT';

export interface Vendor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  openingBalance: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  discount: number;
  lineTotal?: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string | null;
  purchaseDate: string;
  vendorId: string;
  vendor?: { id: string; name: string };
  warehouse: string | null;
  rack: string | null;
  shelf: string | null;
  subTotal: number;
  discount: number;
  taxType: TaxType;
  taxValue: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  status: PurchaseStatus;
  items?: PurchaseItem[];
  _count?: { items: number };
  createdAt: string;
}

export interface PurchaseListResult {
  items: Purchase[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface PurchaseReturn {
  id: string;
  returnNo: string | null;
  returnDate: string;
  purchaseId: string;
  vendorId: string;
  vendor?: { id: string; name: string };
  purchase?: { purchaseNo: string | null };
  totalAmount: number;
  notes: string | null;
  items?: { productId: string; productName: string; quantity: number; price: number; lineTotal: number }[];
  _count?: { items: number };
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceNo: string | null;
  note: string | null;
  createdAt: string;
}

export type SaleStatus = 'DRAFT' | 'COMPLETED';

export interface SaleItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  discount: number;
  lineTotal?: number;
}

export interface Sale {
  id: string;
  saleNo: string | null;
  saleDate: string;
  customerName: string | null;
  customerPhone: string | null;
  subTotal: number;
  discount: number;
  taxType: TaxType;
  taxValue: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  status: SaleStatus;
  items?: SaleItem[];
  _count?: { items: number };
  createdAt: string;
}

export interface SaleListResult {
  items: Sale[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface SaleReturn {
  id: string;
  returnNo: string | null;
  returnDate: string;
  saleId: string;
  sale?: { saleNo: string | null; customerName: string | null };
  totalAmount: number;
  notes: string | null;
  items?: { productId: string; productName: string; quantity: number; price: number; lineTotal: number }[];
  _count?: { items: number };
  createdAt: string;
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
