import { prisma } from '@/config/prisma';
import { userRepository } from '@/repositories/user.repository';
import { hashPassword } from '@/utils/password';
import { ApiError } from '@/utils/apiError';
import type { CreateUserInput, UpdateUserInput } from '@/validators/user.validator';

function toPublic(u: {
  id: string; name: string; username: string; email: string; phone: string | null;
  role: string; permissions: string[]; isActive: boolean; lastLogin: Date | null; createdAt: Date;
}) {
  return {
    id: u.id, name: u.name, username: u.username, email: u.email, phone: u.phone,
    role: u.role, permissions: u.permissions, isActive: u.isActive, lastLogin: u.lastLogin, createdAt: u.createdAt,
  };
}

function clean(v?: string | null) {
  const t = (v ?? '').toString().trim();
  return t.length ? t : null;
}

export const userService = {
  async list() {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map(toPublic);
  },

  async create(input: CreateUserInput) {
    const existingUsername = await userRepository.findByUsername(input.username);
    if (existingUsername) throw ApiError.conflict('That username is already taken');
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) throw ApiError.conflict('That email address is already in use');

    const password = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        username: input.username.trim(),
        email: input.email.trim(),
        phone: clean(input.phone),
        password,
        role: input.role,
        permissions: input.role === 'ADMIN' ? [] : input.permissions,
      },
    });
    return toPublic(user);
  },

  async update(id: string, input: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');

    // Guard: don't allow removing the last active admin.
    if (user.role === 'ADMIN' && input.role !== 'ADMIN') {
      const admins = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (admins <= 1) throw ApiError.badRequest('At least one active admin is required');
    }

    if (input.email !== user.email) {
      const clash = await userRepository.findByEmail(input.email);
      if (clash && clash.id !== id) throw ApiError.conflict('That email address is already in use');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: input.name.trim(),
        email: input.email.trim(),
        phone: clean(input.phone),
        role: input.role,
        permissions: input.role === 'ADMIN' ? [] : input.permissions,
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    return toPublic(updated);
  },

  async resetPassword(id: string, password: string) {
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    await userRepository.updatePassword(id, await hashPassword(password));
  },

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) throw ApiError.badRequest('You cannot delete your own account');
    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    if (user.role === 'ADMIN') {
      const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (admins <= 1) throw ApiError.badRequest('At least one admin is required');
    }
    // Clean up dependent rows, then delete.
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      prisma.loginHistory.deleteMany({ where: { userId: id } }),
      prisma.auditLog.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);
  },
};
