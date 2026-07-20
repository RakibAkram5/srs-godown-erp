import { api, unwrap, tokenStore } from './api';
import type {
  AuditLogEntry,
  LoginHistoryEntry,
  LoginResponse,
  User,
} from '@/types';

export interface UpdateProfilePayload {
  name: string;
  email: string;
  phone?: string;
  profileImage?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authService = {
  async login(username: string, password: string, rememberMe: boolean): Promise<LoginResponse> {
    const data = await unwrap<LoginResponse>(
      api.post('/auth/login', { username, password, rememberMe }),
    );
    tokenStore.set(data.accessToken, data.refreshToken, rememberMe);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefresh();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore network/permission errors — clear locally regardless.
    }
    tokenStore.clear();
  },

  getProfile(): Promise<User> {
    return unwrap<User>(api.get('/auth/profile'));
  },

  updateProfile(payload: UpdateProfilePayload): Promise<User> {
    return unwrap<User>(api.put('/auth/profile', payload));
  },

  changePassword(payload: ChangePasswordPayload): Promise<null> {
    return unwrap<null>(api.put('/auth/change-password', payload));
  },

  getLoginHistory(): Promise<LoginHistoryEntry[]> {
    return unwrap<LoginHistoryEntry[]>(api.get('/auth/login-history'));
  },

  getAuditLog(): Promise<AuditLogEntry[]> {
    return unwrap<AuditLogEntry[]>(api.get('/auth/audit-log'));
  },

  getToken(): string | null {
    return tokenStore.getAccess();
  },
};
