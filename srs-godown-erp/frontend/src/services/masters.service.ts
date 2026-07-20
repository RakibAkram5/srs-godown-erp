import { api, unwrap } from './api';
import type { MasterRecord } from '@/types';

export interface MasterPayload {
  name: string;
  description?: string;
  shortName?: string;
  isActive?: boolean;
}

function makeMasterApi(base: string) {
  return {
    list: () => unwrap<MasterRecord[]>(api.get(base)),
    create: (data: MasterPayload) => unwrap<MasterRecord>(api.post(base, data)),
    update: (id: string, data: MasterPayload) => unwrap<MasterRecord>(api.put(`${base}/${id}`, data)),
    setStatus: (id: string, isActive: boolean) =>
      unwrap<MasterRecord>(api.patch(`${base}/${id}/status`, { isActive })),
    remove: (id: string) => unwrap<null>(api.delete(`${base}/${id}`)),
  };
}

export type MasterApi = ReturnType<typeof makeMasterApi>;

export const categoriesApi = makeMasterApi('/masters/categories');
export const brandsApi = makeMasterApi('/masters/brands');
export const unitsApi = makeMasterApi('/masters/units');
