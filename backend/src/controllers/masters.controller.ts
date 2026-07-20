import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { createMasterService, type MasterRecord } from '@/services/masters.service';
import { categoryRepository, brandRepository, unitRepository } from '@/repositories/masters.repository';

// Common write shape accepted by every master (superset of all fields).
interface MasterWriteInput {
  name: string;
  description?: string | null;
  shortName?: string | null;
  isActive?: boolean;
}

// A uniform surface so one controller factory serves all masters.
interface MasterService {
  list(): Promise<MasterRecord[]>;
  create(data: MasterWriteInput): Promise<MasterRecord>;
  update(id: string, data: MasterWriteInput): Promise<MasterRecord>;
  setStatus(id: string, isActive: boolean): Promise<MasterRecord>;
  remove(id: string): Promise<void>;
}

const categoryService: MasterService = createMasterService(categoryRepository, 'Category');
const brandService: MasterService = createMasterService(brandRepository, 'Brand');
const unitService: MasterService = createMasterService(unitRepository, 'Unit');

function makeController(service: MasterService, label: string) {
  return {
    list: asyncHandler(async (_req: Request, res: Response) => {
      const items = await service.list();
      return sendSuccess(res, items);
    }),
    create: asyncHandler(async (req: Request, res: Response) => {
      const created = await service.create(req.body);
      return sendSuccess(res, created, `${label} created`, 201);
    }),
    update: asyncHandler(async (req: Request, res: Response) => {
      const updated = await service.update(req.params.id, req.body);
      return sendSuccess(res, updated, `${label} updated`);
    }),
    setStatus: asyncHandler(async (req: Request, res: Response) => {
      const updated = await service.setStatus(req.params.id, req.body.isActive);
      return sendSuccess(res, updated, 'Status updated');
    }),
    remove: asyncHandler(async (req: Request, res: Response) => {
      await service.remove(req.params.id);
      return sendSuccess(res, null, `${label} deleted`);
    }),
  };
}

export const categoryController = makeController(categoryService, 'Category');
export const brandController = makeController(brandService, 'Brand');
export const unitController = makeController(unitService, 'Unit');
