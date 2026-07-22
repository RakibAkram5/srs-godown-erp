import { api, unwrap } from './api';
import type { PendingItem, Sale, SaleListResult, SaleReturn } from '@/types';

export interface SaleItemPayload {
  productId: string;
  productName: string;
  quantity: number;
  salePrice: number;
  discount?: number;
}

export interface SalePayload {
  dealerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  saleDate?: string;
  discount?: number;
  paidAmount?: number;
  notes?: string | null;
  status: 'DRAFT' | 'COMPLETED';
  items: SaleItemPayload[];
}

export interface SaleQuery {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SaleReturnPayload {
  saleId: string;
  returnDate?: string;
  notes?: string | null;
  items: { productId: string; productName: string; quantity: number; price: number }[];
}

function cleanParams(query: object) {
  return Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'),
  );
}

export const salesApi = {
  list(query: SaleQuery): Promise<SaleListResult> {
    return unwrap<SaleListResult>(api.get('/sales', { params: cleanParams(query) }));
  },
  get(id: string): Promise<Sale> {
    return unwrap<Sale>(api.get(`/sales/${id}`));
  },
  create(payload: SalePayload): Promise<Sale> {
    return unwrap<Sale>(api.post('/sales', payload));
  },
  update(id: string, payload: SalePayload): Promise<Sale> {
    return unwrap<Sale>(api.put(`/sales/${id}`, payload));
  },
  complete(id: string): Promise<Sale> {
    return unwrap<Sale>(api.post(`/sales/${id}/complete`, {}));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/sales/${id}`));
  },
  createReturn(payload: SaleReturnPayload): Promise<SaleReturn> {
    return unwrap<SaleReturn>(api.post('/sales/returns', payload));
  },
  listReturns(query: SaleQuery): Promise<{ items: SaleReturn[]; total: number; page: number; pageCount: number }> {
    return unwrap(api.get('/sales/returns', { params: cleanParams(query) }));
  },
  listPending(): Promise<PendingItem[]> {
    return unwrap<PendingItem[]>(api.get('/sales/pending'));
  },
  fulfillItem(itemId: string, quantity?: number): Promise<{ fulfilled: number; remaining: number }> {
    return unwrap(api.post(`/sales/items/${itemId}/fulfill`, quantity ? { quantity } : {}));
  },
};
