import { Prisma } from '@prisma/client';
import { prisma } from '@/config/prisma';

export const userRepository = {
  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },
  count() {
    return prisma.user.count();
  },
  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
  updateLastLogin(id: string) {
    return prisma.user.update({ where: { id }, data: { lastLogin: new Date() } });
  },
  updateProfile(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
  updatePassword(id: string, password: string) {
    return prisma.user.update({ where: { id }, data: { password } });
  },
};
