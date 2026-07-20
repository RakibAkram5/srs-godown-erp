import { api, unwrap } from './api';
import type { Purchase, Vendor } from '@/types';

export interface VendorPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  openingBalance?: number;
  isActive?: boolean;
}

export const vendorsApi = {
  list(search?: string, status?: string): Promise<Vendor[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    return unwrap<Vendor[]>(api.get('/vendors', { params }));
  },
  get(id: string): Promise<Vendor> {
    return unwrap<Vendor>(api.get(`/vendors/${id}`));
  },
  history(id: string): Promise<{ vendor: Vendor; purchases: Purchase[] }> {
    return unwrap(api.get(`/vendors/${id}/history`));
  },
  create(payload: VendorPayload): Promise<Vendor> {
    return unwrap<Vendor>(api.post('/vendors', payload));
  },
  update(id: string, payload: VendorPayload): Promise<Vendor> {
    return unwrap<Vendor>(api.put(`/vendors/${id}`, payload));
  },
  setStatus(id: string, isActive: boolean): Promise<Vendor> {
    return unwrap<Vendor>(api.patch(`/vendors/${id}/status`, { isActive }));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/vendors/${id}`));
  },
};
