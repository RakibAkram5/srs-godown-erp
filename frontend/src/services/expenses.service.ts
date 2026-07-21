import { api, unwrap } from './api';
import type { Expense, PayMethod } from '@/types';

export interface ExpensePayload {
  category: string;
  amount: number;
  expenseDate?: string;
  method?: PayMethod;
  description?: string | null;
  notes?: string | null;
}

export interface ExpenseQuery {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function clean(q: object) {
  return Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'));
}

export interface ExpenseListResult {
  items: Expense[];
  total: number;
  page: number;
  pageCount: number;
  totalAmount: number;
}

export const expensesApi = {
  list(query: ExpenseQuery): Promise<ExpenseListResult> {
    return unwrap(api.get('/expenses', { params: clean(query) }));
  },
  create(payload: ExpensePayload): Promise<Expense> {
    return unwrap<Expense>(api.post('/expenses', payload));
  },
  update(id: string, payload: ExpensePayload): Promise<Expense> {
    return unwrap<Expense>(api.put(`/expenses/${id}`, payload));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/expenses/${id}`));
  },
};
