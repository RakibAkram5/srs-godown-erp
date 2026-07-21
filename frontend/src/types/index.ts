export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'STAFF';
export type Theme = 'light' | 'dark' | 'system';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  role: Role;
  permissions: string[];
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
  paidAmount: number;
  previousBalance: number;
  remaining?: number;
  totalQuantity?: number;
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
  pendingQuantity?: number;
  salePrice: number;
  discount: number;
  lineTotal?: number;
}

export interface Sale {
  id: string;
  saleNo: string | null;
  saleDate: string;
  dealerId: string | null;
  dealer?: { id: string; name: string; city?: string | null; phone?: string | null };
  customerName: string | null;
  customerPhone: string | null;
  subTotal: number;
  discount: number;
  taxType: TaxType;
  taxValue: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  previousBalance: number;
  remaining?: number;
  totalQuantity?: number;
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

export interface Dealer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  openingBalance: number;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealerLedgerEntry {
  date: string;
  type: 'SALE' | 'RETURN' | 'RECEIPT' | 'ADJUSTMENT';
  reference: string | null;
  amount: number;
  balance: number;
}

export interface DealerLedger {
  dealer: Dealer;
  openingBalance: number;
  entries: DealerLedgerEntry[];
}

export type PaymentType = 'VENDOR_PAYMENT' | 'DEALER_RECEIPT';
export type PaymentMethod = 'CASH' | 'BANK' | 'CARD' | 'CHEQUE' | 'OTHER';

export interface Payment {
  id: string;
  voucherNo: string | null;
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  notes: string | null;
  vendorId: string | null;
  dealerId: string | null;
  vendor?: { id: string; name: string };
  dealer?: { id: string; name: string; city?: string | null; phone?: string | null };
  createdAt: string;
}

export interface VendorLedgerEntry {
  date: string;
  type: 'PURCHASE' | 'RETURN' | 'PAYMENT' | 'ADJUSTMENT';
  reference: string | null;
  amount: number;
  balance: number;
}

export interface VendorLedger {
  vendor: Vendor;
  openingBalance: number;
  entries: VendorLedgerEntry[];
}

export interface PendingItem {
  id: string;
  saleId: string;
  saleNo: string | null;
  saleDate: string;
  customer: string;
  productId: string;
  productName: string;
  quantity: number;
  pendingQuantity: number;
  availableStock: number;
}

export interface Dispatch {
  id: string;
  dispatchNo: string | null;
  saleId: string;
  sale?: { saleNo: string | null; customerName: string | null; dealer?: { name: string } };
  biltyNumber: string;
  transporterName: string;
  city: string;
  dispatchDate: string;
  notes: string | null;
  createdAt: string;
}

export type PayMethod = 'CASH' | 'BANK' | 'CARD' | 'CHEQUE' | 'OTHER';

export interface Expense {
  id: string;
  expenseNo: string | null;
  category: string;
  amount: number;
  expenseDate: string;
  method: PayMethod;
  description: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Salary {
  id: string;
  salaryNo: string | null;
  employeeName: string;
  userId: string | null;
  month: string;
  amount: number;
  paidAmount: number;
  paymentDate: string | null;
  method: PayMethod;
  notes: string | null;
  createdAt: string;
}

export interface FinancialReport {
  period: { from: string; to: string };
  sales: { count: number; total: number; received: number };
  purchases: { count: number; total: number; paid: number };
  expenses: { count: number; total: number; byCategory: { category: string; amount: number }[] };
  salaries: { count: number; total: number; paid: number };
  outstanding: { receivable: number; payable: number };
  pending: { count: number; value: number };
  netProfit: number;
}

export interface PendingLedgerRow {
  id: string;
  no: string | null;
  date: string;
  party: string;
  total: number;
  paid: number;
  remaining: number;
}

export interface PendingLedgerResult {
  type: 'sales' | 'purchases';
  items: PendingLedgerRow[];
  total: number;
  page: number;
  pageCount: number;
  totalRemaining: number;
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
