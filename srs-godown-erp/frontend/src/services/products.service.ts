import { api, unwrap } from './api';
import type { ImportSummary, Product, ProductListResult } from '@/types';

export interface ProductPayload {
  name: string;
  description?: string | null;
  image?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  warehouse?: string | null;
  rack?: string | null;
  shelf?: string | null;
  bikes?: string[];
  purchasePrice?: number;
  salePrice?: number;
  openingStock?: number;
  minimumStock?: number;
  currentStock?: number;
  isActive?: boolean;
}

export interface ProductQuery {
  search?: string;
  categoryId?: string;
  brandId?: string;
  bike?: string;
  status?: 'all' | 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const productsApi = {
  list(query: ProductQuery): Promise<ProductListResult> {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'),
    );
    return unwrap<ProductListResult>(api.get('/products', { params }));
  },
  get(id: string): Promise<Product> {
    return unwrap<Product>(api.get(`/products/${id}`));
  },
  create(payload: ProductPayload): Promise<Product> {
    return unwrap<Product>(api.post('/products', payload));
  },
  update(id: string, payload: ProductPayload): Promise<Product> {
    return unwrap<Product>(api.put(`/products/${id}`, payload));
  },
  setStatus(id: string, isActive: boolean): Promise<Product> {
    return unwrap<Product>(api.patch(`/products/${id}/status`, { isActive }));
  },
  duplicate(id: string): Promise<Product> {
    return unwrap<Product>(api.post(`/products/${id}/duplicate`, {}));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/products/${id}`));
  },
  import(products: ProductPayload[]): Promise<ImportSummary> {
    return unwrap<ImportSummary>(api.post('/products/import', { products }));
  },
};
