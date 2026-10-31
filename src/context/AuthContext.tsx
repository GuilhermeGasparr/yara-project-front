import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { AuthUser, LoginPayload } from "@/types";
import { loginRequest, buildUserFromToken } from "@/services/authService";

import { deleteItem, getItem, saveItem } from "@/utils/storage";

const TOKEN_KEY = "sentinela_token";
const USER_KEY = "sentinela_user";

// Área (pasta em src/app) de cada perfil. Cada área tem URL própria (/agente, /ubs...).
const AREA_BY_ROLE = {
  agente: "agente",
  ubs: "ubs",
  cm: "cm",
  vr: "regional",
  ve: "estadual",
} as const satisfies Record<AuthUser["role"], string>;

export const PROTECTED_AREAS: readonly string[] = Object.values(AREA_BY_ROLE);

export function getHomeArea(role: AuthUser["role"]) {
  return AREA_BY_ROLE[role];
}

export function getHomeRoute(role: AuthUser["role"]) {
  return `/${AREA_BY_ROLE[role]}` as const;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (
    payload: LoginPayload,
    superintendencia?: string,
  ) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getItem(TOKEN_KEY);
        const storedUser = await getItem(USER_KEY);

        if (storedToken) {
          // Verifica se o token ainda é válido
          buildUserFromToken(storedToken);

          setToken(storedToken);

          // Se temos o usuário salvo, recupera os dados completos
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser) as AuthUser;
            setUser(parsedUser);
          } else {
            // Caso antigo onde só existia o token
            const me = buildUserFromToken(storedToken);
            setUser(me);
          }
        }
      } catch (error) {
        // Token inválido/expirado ou usuário corrompido
        console.log("Sessão inválida:", error);

        await deleteItem(TOKEN_KEY);
        await deleteItem(USER_KEY);

        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(
    async (payload: LoginPayload, superintendencia?: string) => {
      const { access_token, usuario } = await loginRequest(payload);

      const me = buildUserFromToken(access_token);

      let fullUser: AuthUser;

      
if (me.role === "agente") {
  fullUser = {
    ...me,
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    cargo: usuario.cargo ?? "",
    ubs_atuante: usuario.ubs_atuante ?? 0,
    microarea: usuario.microarea ?? null,
  };
} else if (me.role === "ubs") {
        fullUser = {
          ...me,
          id: usuario.id,
          nome: usuario.nome,
          cpf: usuario.cpf,
          ubs: usuario.ubs ?? 0,
          municipio: usuario.municipio ?? "",
        };
      } else if (me.role === "cm") {
        fullUser = {
          ...me,
          id: usuario.id,
          nome: usuario.nome,
          cpf: usuario.cpf,
          cargo: "Vigilante Municipal",
          municipio: usuario.municipio ?? "",
        };
      } else if (me.role === "vr") {
        fullUser = {
          ...me,
          id: usuario.id,
          nome: usuario.nome,
          cpf: usuario.cpf,
          superintendencia: usuario.superintendencia ?? 0,
        };
      } else if (me.role === "ve") {
        fullUser = {
          ...me,
          id: usuario.id,
          nome: usuario.nome,
          cpf: usuario.cpf,
        };
      } else {
        throw new Error("Papel de usuário desconhecido.");
      }

      await saveItem(TOKEN_KEY, access_token);
      await saveItem(USER_KEY, JSON.stringify(fullUser));

      setToken(access_token);
      setUser(fullUser);

      return fullUser;
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await deleteItem(TOKEN_KEY);
      await deleteItem(USER_KEY);
    } catch (error) {
      console.error("Erro ao limpar sessão:", error);
    } finally {
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }

  return ctx;
}
