import { api, unwrap, TOKEN_KEY } from './api';
import type { AuthResponse, User } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await unwrap<AuthResponse>(api.post('/auth/login', { email, password }));
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  me(): Promise<User> {
    return unwrap<User>(api.get('/auth/me'));
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
};
