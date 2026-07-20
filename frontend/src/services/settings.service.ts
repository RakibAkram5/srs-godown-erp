import { api, unwrap } from './api';
import type { Settings } from '@/types';

export interface Branding {
  companyName: string;
  companyLogo: string | null;
}

export const settingsService = {
  get(): Promise<Settings> {
    return unwrap<Settings>(api.get('/settings'));
  },
  update(payload: Partial<Settings>): Promise<Settings> {
    return unwrap<Settings>(api.put('/settings', payload));
  },
  getBranding(): Promise<Branding> {
    return unwrap<Branding>(api.get('/settings/branding'));
  },
};
