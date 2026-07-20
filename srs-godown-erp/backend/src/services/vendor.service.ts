import { Prisma } from '@prisma/client';
import { vendorRepository } from '@/repositories/vendor.repository';
import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/apiError';
import type { VendorInput } from '@/validators/vendor.validator';

function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

export const vendorService = {
  async list(search?: string, status?: string) {
    const where: Prisma.VendorWhereInput = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    return vendorRepository.list(where);
  },

  async get(id: string) {
    const vendor = await vendorRepository.findById(id);
    if (!vendor || vendor.isDeleted) throw ApiError.notFound('Vendor not found');
    return vendor;
  },

  async create(input: VendorInput) {
    const opening = input.openingBalance ?? 0;
    return vendorRepository.create({
      name: input.name.trim(),
      phone: clean(input.phone),
      email: clean(input.email),
      address: clean(input.address),
      openingBalance: opening,
      balance: opening,
      isActive: input.isActive ?? true,
    });
  },

  async update(id: string, input: VendorInput) {
    const vendor = await this.get(id);
    // Adjust outstanding balance by the change in opening balance.
    const newOpening = input.openingBalance ?? 0;
    const delta = newOpening - vendor.openingBalance;
    return vendorRepository.update(id, {
      name: input.name.trim(),
      phone: clean(input.phone),
      email: clean(input.email),
      address: clean(input.address),
      openingBalance: newOpening,
      balance: vendor.balance + delta,
      isActive: input.isActive ?? true,
    });
  },

  async setStatus(id: string, isActive: boolean) {
    await this.get(id);
    return vendorRepository.update(id, { isActive });
  },

  async remove(id: string) {
    await this.get(id);
    const purchaseCount = await prisma.purchase.count({ where: { vendorId: id } });
    if (purchaseCount > 0) {
      throw ApiError.badRequest('Cannot delete a vendor that has purchases. Mark it inactive instead.');
    }
    await vendorRepository.update(id, { isDeleted: true, isActive: false });
  },

  // Vendor purchase history + outstanding.
  async history(id: string) {
    const vendor = await this.get(id);
    const purchases = await prisma.purchase.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { vendor, purchases };
  },
};
