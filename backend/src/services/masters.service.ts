import { ApiError } from '@/utils/apiError';

/** The minimal record shape every master shares. */
export interface MasterRecord {
  id: string;
  name: string;
  isActive: boolean;
}

/** Repository contract that each master repo satisfies. */
export interface MasterRepository<T extends MasterRecord, C, U> {
  list: () => Promise<T[]>;
  findById: (id: string) => Promise<T | null>;
  findByName: (name: string) => Promise<T | null>;
  create: (data: C) => Promise<T>;
  update: (id: string, data: U) => Promise<T>;
  remove: (id: string) => Promise<T>;
}

/**
 * Builds a CRUD service for a master entity.
 * `label` is used in friendly error messages (e.g. "Category").
 */
export function createMasterService<T extends MasterRecord, C extends { name: string }, U extends { name?: string }>(
  repo: MasterRepository<T, C, U>,
  label: string,
) {
  return {
    list() {
      return repo.list();
    },

    async create(data: C) {
      const clash = await repo.findByName(data.name);
      if (clash) throw ApiError.conflict(`A ${label.toLowerCase()} with this name already exists`);
      return repo.create(data);
    },

    async update(id: string, data: U) {
      const existing = await repo.findById(id);
      if (!existing) throw ApiError.notFound(`${label} not found`);

      if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
        const clash = await repo.findByName(data.name);
        if (clash && clash.id !== id) {
          throw ApiError.conflict(`A ${label.toLowerCase()} with this name already exists`);
        }
      }
      return repo.update(id, data);
    },

    async setStatus(id: string, isActive: boolean) {
      const existing = await repo.findById(id);
      if (!existing) throw ApiError.notFound(`${label} not found`);
      return repo.update(id, { isActive } as unknown as U);
    },

    async remove(id: string) {
      const existing = await repo.findById(id);
      if (!existing) throw ApiError.notFound(`${label} not found`);
      await repo.remove(id);
    },
  };
}
