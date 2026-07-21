import { api, unwrap } from './api';
import type { Dispatch } from '@/types';

export interface DispatchPayload {
  saleId: string;
  biltyNumber: string;
  transporterName: string;
  city: string;
  dispatchDate?: string;
  notes?: string | null;
}

export interface DispatchQuery {
  search?: string;
  page?: number;
  limit?: number;
}

function cleanParams(query: object) {
  return Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ''));
}

export const dispatchesApi = {
  list(query: DispatchQuery): Promise<{ items: Dispatch[]; total: number; page: number; pageCount: number }> {
    return unwrap(api.get('/dispatches', { params: cleanParams(query) }));
  },
  create(payload: DispatchPayload): Promise<Dispatch> {
    return unwrap<Dispatch>(api.post('/dispatches', payload));
  },
  update(id: string, payload: DispatchPayload): Promise<Dispatch> {
    return unwrap<Dispatch>(api.put(`/dispatches/${id}`, payload));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/dispatches/${id}`));
  },
};
