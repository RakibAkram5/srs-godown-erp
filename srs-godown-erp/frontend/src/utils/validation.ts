import { z } from 'zod';

/* Reusable Zod field schemas + a helper to read the first error. */
export const email = z.string().min(1, 'Email is required').email('Enter a valid email');
export const password = z.string().min(6, 'Password must be at least 6 characters');
export const requiredText = (label: string) => z.string().min(1, `${label} is required`);
export const optionalText = z.string().optional().or(z.literal(''));

export function firstError(errors: Record<string, { message?: string }>): string | undefined {
  const key = Object.keys(errors)[0];
  return key ? errors[key]?.message : undefined;
}
