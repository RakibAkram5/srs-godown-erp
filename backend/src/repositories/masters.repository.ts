import { prisma } from '@/config/prisma';

/**
 * Each master (category / brand / unit) exposes the same small CRUD surface.
 * Kept as separate typed repos so Prisma's generated types stay intact.
 */
export const categoryRepository = {
  list: () => prisma.category.findMany({ orderBy: { name: 'asc' } }),
  findById: (id: string) => prisma.category.findUnique({ where: { id } }),
  findByName: (name: string) => prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } }),
  create: (data: { name: string; description?: string | null; isActive?: boolean }) =>
    prisma.category.create({ data }),
  update: (id: string, data: { name?: string; description?: string | null; isActive?: boolean }) =>
    prisma.category.update({ where: { id }, data }),
  remove: (id: string) => prisma.category.delete({ where: { id } }),
};

export const brandRepository = {
  list: () => prisma.brand.findMany({ orderBy: { name: 'asc' } }),
  findById: (id: string) => prisma.brand.findUnique({ where: { id } }),
  findByName: (name: string) => prisma.brand.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } }),
  create: (data: { name: string; description?: string | null; isActive?: boolean }) =>
    prisma.brand.create({ data }),
  update: (id: string, data: { name?: string; description?: string | null; isActive?: boolean }) =>
    prisma.brand.update({ where: { id }, data }),
  remove: (id: string) => prisma.brand.delete({ where: { id } }),
};

export const unitRepository = {
  list: () => prisma.unit.findMany({ orderBy: { name: 'asc' } }),
  findById: (id: string) => prisma.unit.findUnique({ where: { id } }),
  findByName: (name: string) => prisma.unit.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } }),
  create: (data: { name: string; shortName?: string | null; isActive?: boolean }) =>
    prisma.unit.create({ data }),
  update: (id: string, data: { name?: string; shortName?: string | null; isActive?: boolean }) =>
    prisma.unit.update({ where: { id }, data }),
  remove: (id: string) => prisma.unit.delete({ where: { id } }),
};
