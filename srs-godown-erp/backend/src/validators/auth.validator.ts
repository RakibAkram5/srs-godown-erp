import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, 'Refresh token is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is too short'),
    email: z.string().email('Enter a valid email address'),
    phone: z
      .string()
      .max(20, 'Phone number is too long')
      .optional()
      .or(z.literal('')),
    // Data-URL (base64) image or a URL. Optional.
    profileImage: z.string().optional().or(z.literal('')).nullable(),
  }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
      confirmPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
      message: 'New password must be different from the current password',
      path: ['newPassword'],
    }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
