import { api, unwrap } from './api';
import type { Purchase, PurchaseListResult, PurchaseReturn, StockMovement } from '@/types';

export interface PurchaseItemPayload {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  discount?: number;
}

export interface PurchasePayload {
  vendorId: string;
  purchaseDate?: string;
  warehouse?: string | null;
  rack?: string | null;
  shelf?: string | null;
  discount?: number;
  paidAmount?: number;
  notes?: string | null;
  status: 'DRAFT' | 'COMPLETED';
  items: PurchaseItemPayload[];
}

export interface PurchaseQuery {
  search?: string;
  vendorId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ReturnPayload {
  purchaseId: string;
  returnDate?: string;
  notes?: string | null;
  items: { productId: string; productName: string; quantity: number; price: number }[];
}

function cleanParams(query: object) {
  return Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'),
  );
}

export const purchasesApi = {
  list(query: PurchaseQuery): Promise<PurchaseListResult> {
    return unwrap<PurchaseListResult>(api.get('/purchases', { params: cleanParams(query) }));
  },
  get(id: string): Promise<Purchase> {
    return unwrap<Purchase>(api.get(`/purchases/${id}`));
  },
  create(payload: PurchasePayload): Promise<Purchase> {
    return unwrap<Purchase>(api.post('/purchases', payload));
  },
  update(id: string, payload: PurchasePayload): Promise<Purchase> {
    return unwrap<Purchase>(api.put(`/purchases/${id}`, payload));
  },
  complete(id: string): Promise<Purchase> {
    return unwrap<Purchase>(api.post(`/purchases/${id}/complete`, {}));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/purchases/${id}`));
  },
  createReturn(payload: ReturnPayload): Promise<PurchaseReturn> {
    return unwrap<PurchaseReturn>(api.post('/purchases/returns', payload));
  },
  listReturns(query: PurchaseQuery): Promise<{ items: PurchaseReturn[]; total: number; page: number; pageCount: number }> {
    return unwrap(api.get('/purchases/returns', { params: cleanParams(query) }));
  },
  stockMovements(query: { productId?: string; type?: string; page?: number; limit?: number }): Promise<{
    items: StockMovement[];
    total: number;
    page: number;
    pageCount: number;
  }> {
    return unwrap(api.get('/purchases/stock-movements', { params: cleanParams(query) }));
  },
};
