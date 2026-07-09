import { LoginPayload, LoginResponse } from "@/types";

// 1. Troque pelo link gerado pelo Ngrok que está no seu terminal
const BASE_URL = "https://confutable-marybeth-throatily.ngrok-free.dev";

/**
 * Faz login enviando email + senha como form-data (padrão OAuth2 do FastAPI)
 * e retorna o access_token JWT.
 */
export async function loginRequest(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const form = new URLSearchParams();
  form.append("username", payload.email);
  form.append("password", payload.senha);

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/x-www-form-urlencoded",
      // 2. Adicione esta linha para pular o aviso do Ngrok nas chamadas POST
      "ngrok-skip-browser-warning": "true" 
    },
    body: form.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao autenticar. Tente novamente.");
  }

  return data as LoginResponse;
}

/**
 * Busca o perfil do usuário autenticado.
 * O backend deve retornar { role, ...fields } para distinguir Agente de UBS.
 */
export async function fetchMe(token: string) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 
      Authorization: `Bearer ${token}`,
      // 3. Adicione esta linha aqui também para as chamadas GET
      "ngrok-skip-browser-warning": "true"
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Sessão inválida.");
  }

  return data;
}