import { z } from 'zod';

const optionalString = z.string().trim().optional().or(z.literal('')).nullable();

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const;

const baseUser = {
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  phone: optionalString,
  role: z.enum(ROLES),
  permissions: z.array(z.string()).default([]),
};

export const createUserSchema = z.object({
  body: z.object({
    ...baseUser,
    username: z.string().trim().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    ...baseUser,
    isActive: z.boolean().optional(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({ password: z.string().min(6, 'Password must be at least 6 characters') }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
