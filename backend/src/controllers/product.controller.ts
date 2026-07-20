import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { productService, ListQuery } from '@/services/product.service';

export const productController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as Record<string, string | undefined>;
    const query: ListQuery = {
      search: q.search,
      categoryId: q.categoryId,
      brandId: q.brandId,
      bike: q.bike,
      status: (q.status as ListQuery['status']) ?? 'all',
      sortBy: q.sortBy,
      sortOrder: (q.sortOrder as 'asc' | 'desc') ?? 'desc',
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 10,
    };
    const result = await productService.list(query);
    return sendSuccess(res, result);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.get(req.params.id);
    return sendSuccess(res, product);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.create(req.body);
    return sendSuccess(res, product, 'Product created', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.update(req.params.id, req.body);
    return sendSuccess(res, product, 'Product updated');
  }),

  setStatus: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.setStatus(req.params.id, req.body.isActive);
    return sendSuccess(res, product, 'Status updated');
  }),

  duplicate: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.duplicate(req.params.id);
    return sendSuccess(res, product, 'Product duplicated', 201);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await productService.remove(req.params.id);
    return sendSuccess(res, null, 'Product deleted');
  }),

  importMany: asyncHandler(async (req: Request, res: Response) => {
    const summary = await productService.importMany(req.body.products);
    return sendSuccess(res, summary, 'Import finished');
  }),
};
