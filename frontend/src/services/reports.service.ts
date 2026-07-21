import { api, unwrap } from './api';
import type { FinancialReport, PendingLedgerResult } from '@/types';

export const reportsApi = {
  financial(from: string, to: string): Promise<FinancialReport> {
    return unwrap<FinancialReport>(api.get('/reports/financial', { params: { from, to } }));
  },
  pendingLedger(params: { type: 'sales' | 'purchases'; search?: string; from?: string; to?: string; status?: string; page?: number; limit?: number }): Promise<PendingLedgerResult> {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'));
    return unwrap<PendingLedgerResult>(api.get('/reports/pending-ledger', { params: clean }));
  },
};
