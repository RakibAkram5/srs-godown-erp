import { z } from 'zod';

/* Reusable Zod field schemas + a helper to read the first error. */
export const email = z.string().min(1, 'Email is required').email('Enter a valid email');

// Mirrors the backend policy (backend/src/validators/shared.ts): min 8 chars,
// at least one uppercase, one lowercase and one digit.
export const PASSWORD_POLICY_HINT = 'At least 8 characters, with an uppercase letter, a lowercase letter and a number.';
export function isStrongPassword(value: string): boolean {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);
}
export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number');

export const requiredText = (label: string) => z.string().min(1, `${label} is required`);
export const optionalText = z.string().optional().or(z.literal(''));

export function firstError(errors: Record<string, { message?: string }>): string | undefined {
  const key = Object.keys(errors)[0];
  return key ? errors[key]?.message : undefined;
}
