import { api, unwrap } from './api';
import type { Salary, PayMethod } from '@/types';

export interface SalaryPayload {
  employeeName: string;
  userId?: string | null;
  month: string;
  amount: number;
  paidAmount?: number;
  paymentDate?: string | null;
  method?: PayMethod;
  notes?: string | null;
}

export interface SalaryQuery {
  search?: string;
  month?: string;
  page?: number;
  limit?: number;
}

function clean(q: object) {
  return Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'));
}

export interface SalaryListResult {
  items: Salary[];
  total: number;
  page: number;
  pageCount: number;
  totalAmount: number;
  totalPaid: number;
}

export const salariesApi = {
  list(query: SalaryQuery): Promise<SalaryListResult> {
    return unwrap(api.get('/salaries', { params: clean(query) }));
  },
  create(payload: SalaryPayload): Promise<Salary> {
    return unwrap<Salary>(api.post('/salaries', payload));
  },
  update(id: string, payload: SalaryPayload): Promise<Salary> {
    return unwrap<Salary>(api.put(`/salaries/${id}`, payload));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/salaries/${id}`));
  },
};
