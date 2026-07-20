import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const settingsRepository = {
  getFirst() {
    return prisma.settings.findFirst();
  },
  create(data: Prisma.SettingsCreateInput) {
    return prisma.settings.create({ data });
  },
  update(id: string, data: Prisma.SettingsUpdateInput) {
    return prisma.settings.update({ where: { id }, data });
  },
};
