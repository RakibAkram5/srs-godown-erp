import { Prisma, Product } from '@prisma/client';
import { productRepository } from '@/repositories/product.repository';
import { categoryRepository, brandRepository, unitRepository } from '@/repositories/masters.repository';
import { ApiError } from '@/utils/apiError';
import type { ProductInput } from '@/validators/product.validator';

/* ── Code / SKU / barcode helpers ─────────────────────── */

function pad(n: number, len = 5): string {
  return String(n).padStart(len, '0');
}

function prefixFrom(value: string | null | undefined, fallback: string): string {
  const cleaned = (value ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return (cleaned || fallback).slice(0, 3).padEnd(3, 'X');
}

function buildSku(categoryName: string | null, brandName: string | null, codeNo: number): string {
  return `${prefixFrom(categoryName, 'GEN')}${prefixFrom(brandName, 'STD')}-${pad(codeNo)}`;
}

/* ── Name enrichment (masters are referenced by id) ───── */

async function nameMaps() {
  const [categories, brands, units] = await Promise.all([
    categoryRepository.list(),
    brandRepository.list(),
    unitRepository.list(),
  ]);
  const toMap = (rows: { id: string; name: string }[]) =>
    new Map(rows.map((r) => [r.id, r.name]));
  return { categories: toMap(categories), brands: toMap(brands), units: toMap(units) };
}

type Maps = Awaited<ReturnType<typeof nameMaps>>;

function toPublic(p: Product, maps: Maps) {
  return {
    ...p,
    categoryName: p.categoryId ? maps.categories.get(p.categoryId) ?? null : null,
    brandName: p.brandId ? maps.brands.get(p.brandId) ?? null : null,
    unitName: p.unitId ? maps.units.get(p.unitId) ?? null : null,
    isLowStock: p.currentStock <= p.minimumStock,
  };
}

/* ── Query building ───────────────────────────────────── */

export interface ListQuery {
  search?: string;
  categoryId?: string;
  brandId?: string;
  bike?: string;
  status?: 'all' | 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const SORTABLE = new Set(['name', 'salePrice', 'purchasePrice', 'currentStock', 'createdAt']);

function normalizeInput(input: ProductInput) {
  const clean = (v?: string | null) => {
    const t = (v ?? '').toString().trim();
    return t.length ? t : null;
  };
  return {
    name: input.name.trim(),
    description: clean(input.description),
    image: clean(input.image),
    categoryId: clean(input.categoryId),
    brandId: clean(input.brandId),
    unitId: clean(input.unitId),
    warehouse: clean(input.warehouse),
    rack: clean(input.rack),
    shelf: clean(input.shelf),
    bikes: input.bikes ?? [],
    purchasePrice: input.purchasePrice ?? 0,
    salePrice: input.salePrice ?? 0,
    openingStock: input.openingStock ?? 0,
    minimumStock: input.minimumStock ?? 0,
    isActive: input.isActive ?? true,
  };
}

export const productService = {
  async list(query: ListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(1000, Math.max(1, Number(query.limit) || 10));

    const where: Prisma.ProductWhereInput = { isDeleted: false };

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { productCode: { contains: s, mode: 'insensitive' } },
        { sku: { contains: s, mode: 'insensitive' } },
        { barcode: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.bike) where.bikes = { has: query.bike };
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;

    const sortBy = SORTABLE.has(query.sortBy ?? '') ? (query.sortBy as string) : 'createdAt';
    const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder } as Prisma.ProductOrderByWithRelationInput;

    const [rows, total, maps] = await Promise.all([
      productRepository.findMany(where, orderBy, (page - 1) * limit, limit),
      productRepository.count(where),
      nameMaps(),
    ]);

    return {
      items: rows.map((r) => toPublic(r, maps)),
      total,
      page,
      limit,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async get(id: string) {
    const product = await productRepository.findById(id);
    if (!product || product.isDeleted) throw ApiError.notFound('Product not found');
    return toPublic(product, await nameMaps());
  },

  async create(input: ProductInput) {
    const data = normalizeInput(input);
    const created = await productRepository.create({
      ...data,
      currentStock: data.openingStock,
    });
    return this.finalizeCodes(created);
  },

  // Assign productCode / sku / barcode from the auto-increment codeNo.
  async finalizeCodes(created: Product) {
    const maps = await nameMaps();
    const categoryName = created.categoryId ? maps.categories.get(created.categoryId) ?? null : null;
    const brandName = created.brandId ? maps.brands.get(created.brandId) ?? null : null;

    const productCode = `PRD-${pad(created.codeNo)}`;
    const sku = buildSku(categoryName, brandName, created.codeNo);
    const updated = await productRepository.update(created.id, { productCode, sku, barcode: productCode });
    return toPublic(updated, maps);
  },

  async update(id: string, input: ProductInput) {
    const existing = await productRepository.findById(id);
    if (!existing || existing.isDeleted) throw ApiError.notFound('Product not found');

    const data = normalizeInput(input);
    const updated = await productRepository.update(id, {
      ...data,
      currentStock: input.currentStock ?? existing.currentStock,
    });
    return toPublic(updated, await nameMaps());
  },

  async setStatus(id: string, isActive: boolean) {
    const existing = await productRepository.findById(id);
    if (!existing || existing.isDeleted) throw ApiError.notFound('Product not found');
    const updated = await productRepository.update(id, { isActive });
    return toPublic(updated, await nameMaps());
  },

  async duplicate(id: string) {
    const source = await productRepository.findById(id);
    if (!source || source.isDeleted) throw ApiError.notFound('Product not found');

    const created = await productRepository.create({
      name: `${source.name} (Copy)`,
      description: source.description,
      image: source.image,
      categoryId: source.categoryId,
      brandId: source.brandId,
      unitId: source.unitId,
      warehouse: source.warehouse,
      rack: source.rack,
      shelf: source.shelf,
      bikes: source.bikes,
      purchasePrice: source.purchasePrice,
      salePrice: source.salePrice,
      openingStock: source.openingStock,
      minimumStock: source.minimumStock,
      currentStock: source.openingStock,
      isActive: source.isActive,
    });
    return this.finalizeCodes(created);
  },

  async remove(id: string) {
    const existing = await productRepository.findById(id);
    if (!existing || existing.isDeleted) throw ApiError.notFound('Product not found');
    await productRepository.update(id, { isDeleted: true, deletedAt: new Date(), isActive: false });
  },

  // Bulk create from an Excel import. Returns a per-row summary.
  async importMany(rows: ProductInput[]) {
    let created = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        await this.create(rows[i]);
        created += 1;
      } catch (err) {
        errors.push({ row: i + 1, message: err instanceof Error ? err.message : 'Failed' });
      }
    }
    return { created, failed: errors.length, errors };
  },
};
