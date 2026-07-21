import { api, unwrap } from './api';
import type { Payment, PaymentMethod, PaymentType } from '@/types';

export interface PaymentPayload {
  type: PaymentType;
  vendorId?: string | null;
  dealerId?: string | null;
  amount: number;
  method?: PaymentMethod;
  paymentDate?: string;
  notes?: string | null;
}

export interface PaymentQuery {
  type?: string;
  vendorId?: string;
  dealerId?: string;
  page?: number;
  limit?: number;
}

function cleanParams(query: object) {
  return Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'));
}

export const paymentsApi = {
  list(query: PaymentQuery): Promise<{ items: Payment[]; total: number; page: number; pageCount: number }> {
    return unwrap(api.get('/payments', { params: cleanParams(query) }));
  },
  create(payload: PaymentPayload): Promise<Payment> {
    return unwrap<Payment>(api.post('/payments', payload));
  },
  update(id: string, payload: { amount: number; method?: string; paymentDate?: string; notes?: string | null }): Promise<Payment> {
    return unwrap<Payment>(api.put(`/payments/${id}`, payload));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/payments/${id}`));
  },
};
