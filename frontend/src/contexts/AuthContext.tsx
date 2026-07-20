import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/auth.service';
import { tokenStore } from '@/services/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on first load if a token is present.
  useEffect(() => {
    let active = true;
    const token = tokenStore.getAccess() ?? tokenStore.getRefresh();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authService
      .getProfile()
      .then((u) => active && setUserState(u))
      .catch(() => {
        tokenStore.clear();
        if (active) setUserState(null);
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (username: string, password: string, rememberMe: boolean) => {
      const { user: loggedIn } = await authService.login(username, password, rememberMe);
      setUserState(loggedIn);
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUserState(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const fresh = await authService.getProfile();
    setUserState(fresh);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      setUser: setUserState,
      refreshProfile,
    }),
    [user, isLoading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
