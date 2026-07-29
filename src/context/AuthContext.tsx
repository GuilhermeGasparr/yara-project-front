import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AuthUser, LoginPayload } from '@/types';
import {loginRequest } from '@/services/authService';
import { deleteItem, getItem, saveItem } from '@/utils/storage';

const TOKEN_KEY = 'sentinela_token';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão ao abrir o app
  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem(TOKEN_KEY);
      } catch {
        await deleteItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const { access_token } = await loginRequest(payload);
    await saveItem(TOKEN_KEY, access_token);
    setToken(access_token);
  }, []);

  const signOut = useCallback(async () => {
    await deleteItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}