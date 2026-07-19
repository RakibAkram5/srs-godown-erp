import { userRepository } from '@/repositories/user.repository';
import { comparePassword, hashPassword } from '@/utils/password';
import { signToken } from '@/utils/jwt';
import { ApiError } from '@/utils/apiError';
import type { LoginInput, RegisterInput } from '@/validators/auth.validator';

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
  };
}

export const authService = {
  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    const ok = await comparePassword(input.password, user.password);
    if (!ok) throw ApiError.unauthorized('Invalid email or password');

    await userRepository.updateLastLogin(user.id);
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { token, user: toPublicUser(user) };
  },

  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw ApiError.conflict('A user with this email already exists');

    const password = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password,
      role: input.role ?? 'STAFF',
    });
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { token, user: toPublicUser(user) };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return toPublicUser(user);
  },
};
