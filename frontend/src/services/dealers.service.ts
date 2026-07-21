import { api, unwrap } from './api';
import type { Dealer, DealerLedger } from '@/types';

export interface DealerPayload {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  openingBalance?: number;
  isActive?: boolean;
}

export const dealersApi = {
  list(search?: string, status?: string): Promise<Dealer[]> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status && status !== 'all') params.status = status;
    return unwrap<Dealer[]>(api.get('/dealers', { params }));
  },
  get(id: string): Promise<Dealer> {
    return unwrap<Dealer>(api.get(`/dealers/${id}`));
  },
  ledger(id: string): Promise<DealerLedger> {
    return unwrap<DealerLedger>(api.get(`/dealers/${id}/ledger`));
  },
  adjust(id: string, amount: number, reason: string): Promise<unknown> {
    return unwrap(api.post(`/dealers/${id}/adjust`, { amount, reason }));
  },
  create(payload: DealerPayload): Promise<Dealer> {
    return unwrap<Dealer>(api.post('/dealers', payload));
  },
  update(id: string, payload: DealerPayload): Promise<Dealer> {
    return unwrap<Dealer>(api.put(`/dealers/${id}`, payload));
  },
  setStatus(id: string, isActive: boolean): Promise<Dealer> {
    return unwrap<Dealer>(api.patch(`/dealers/${id}/status`, { isActive }));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/dealers/${id}`));
  },
};
