import { api, unwrap } from './api';
import type { Settings } from '@/types';

export const settingsService = {
  get(): Promise<Settings> {
    return unwrap<Settings>(api.get('/settings'));
  },
  update(payload: Partial<Settings>): Promise<Settings> {
    return unwrap<Settings>(api.put('/settings', payload));
  },
};
