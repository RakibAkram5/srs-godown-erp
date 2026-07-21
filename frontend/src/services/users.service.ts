import { api, unwrap } from './api';
import type { User } from '@/types';

export interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  permissions: string[];
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  permissions: string[];
  isActive?: boolean;
}

export const usersApi = {
  list(): Promise<User[]> {
    return unwrap<User[]>(api.get('/users'));
  },
  create(payload: CreateUserPayload): Promise<User> {
    return unwrap<User>(api.post('/users', payload));
  },
  update(id: string, payload: UpdateUserPayload): Promise<User> {
    return unwrap<User>(api.put(`/users/${id}`, payload));
  },
  resetPassword(id: string, password: string): Promise<null> {
    return unwrap<null>(api.post(`/users/${id}/reset-password`, { password }));
  },
  remove(id: string): Promise<null> {
    return unwrap<null>(api.delete(`/users/${id}`));
  },
};
